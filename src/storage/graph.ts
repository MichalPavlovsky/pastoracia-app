// OneDrive cez Microsoft Graph. Súbory sú v /Pastoracia-app/data/ prihláseného účtu.

import { ChybaPrihlasenia, ChybaSiete, KonfliktZapisu, type VzdialenySubor, type VzdialeneUloziste } from './types'

export const GRAPH = 'https://graph.microsoft.com/v1.0'
export const PRIECINOK = 'Pastoracia-app/data'
export const PRIECINOK_PRILOHY = 'Pastoracia-app/prilohy'
const LIMIT_MS = 20_000

/** Vráti prístupový token; `obnov` = vynútiť nový (po 401). */
export type ZiskajToken = (obnov?: boolean) => Promise<string>

export interface InfoPriecinka {
  /** napr. "/Pastoracia-app/data" */
  cesta: string
  /** odkaz na priečinok v OneDrive na webe, alebo "" ak ešte neexistuje */
  webUrl: string
  /** meno majiteľa OneDrive */
  majitel: string
  /** "personal" | "business" */
  typDisku: string
}

export class GraphOneDrive implements VzdialeneUloziste {
  constructor(
    private ziskajToken: ZiskajToken,
    private fetchFn: typeof fetch = (...a) => fetch(...a),
  ) {}

  private url(nazov: string, pripona = ''): string {
    return `${GRAPH}/me/drive/root:/${PRIECINOK}/${encodeURIComponent(nazov)}${pripona}`
  }

  private async poziadavka(url: string, init: RequestInit = {}, opakovanie = false, limit = LIMIT_MS): Promise<Response> {
    const token = await this.ziskajToken(opakovanie)
    let res: Response
    try {
      res = await this.fetchFn(url, {
        ...init,
        cache: 'no-store',
        signal: AbortSignal.timeout(limit),
        headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${token}` },
      })
    } catch {
      throw new ChybaSiete()
    }
    if (res.status === 401) {
      if (!opakovanie) return this.poziadavka(url, init, true, limit)
      throw new ChybaPrihlasenia()
    }
    if (res.status === 429 || res.status >= 500) throw new ChybaSiete(`OneDrive dočasne neodpovedá (${res.status})`)
    return res
  }

  private async metadata(nazov: string): Promise<{ eTag: string; downloadUrl: string } | null> {
    const res = await this.poziadavka(this.url(nazov))
    if (res.status === 404) return null
    await overOk(res)
    const j = (await res.json()) as { eTag: string; '@microsoft.graph.downloadUrl': string }
    return { eTag: j.eTag, downloadUrl: j['@microsoft.graph.downloadUrl'] }
  }

  async etag(nazov: string): Promise<string | null> {
    return (await this.metadata(nazov))?.eTag ?? null
  }

  async nacitaj(nazov: string): Promise<VzdialenySubor | null> {
    const m = await this.metadata(nazov)
    if (!m) return null
    // downloadUrl je krátkodobo platný odkaz bez prihlásenia
    let res: Response
    try {
      res = await this.fetchFn(m.downloadUrl, { cache: 'no-store', signal: AbortSignal.timeout(LIMIT_MS) })
    } catch {
      throw new ChybaSiete()
    }
    await overOk(res)
    return { obsah: await res.text(), etag: m.eTag }
  }

  async zapis(nazov: string, obsah: string, etag: string | null): Promise<string> {
    // nový súbor: ak medzitým vznikol inde, OneDrive vráti 409
    const url = this.url(nazov, etag ? ':/content' : ':/content?@microsoft.graph.conflictBehavior=fail')
    const headers: Record<string, string> = { 'Content-Type': 'application/json; charset=utf-8' }
    if (etag) headers['If-Match'] = etag
    const res = await this.poziadavka(url, { method: 'PUT', headers, body: obsah })
    if (res.status === 412 || res.status === 409) throw new KonfliktZapisu(nazov)
    await overOk(res)
    return ((await res.json()) as { eTag: string }).eTag
  }

  /**
   * Nahrá PDF do /Pastoracia-app/prilohy/<priecinok>/. Rovnaký názov OneDrive premenuje („a 1.pdf“).
   * Jednoduché nahranie zvládne do 250 MB.
   */
  async nahrajPrilohu(priecinok: string, subor: File): Promise<{ nazov: string; cesta: string; webUrl: string }> {
    const nazov = subor.name.replace(/[\\/:*?"<>|#%]/g, '_') || 'priloha.pdf'
    const cesta = `${PRIECINOK_PRILOHY}/${priecinok}/${nazov}`
    const url = `${GRAPH}/me/drive/root:/${cesta.split('/').map(encodeURIComponent).join('/')}:/content?@microsoft.graph.conflictBehavior=rename`
    const res = await this.poziadavka(url, {
      method: 'PUT',
      headers: { 'Content-Type': subor.type || 'application/pdf' },
      body: subor,
    }, false, 120_000)
    await overOk(res)
    const j = (await res.json()) as { name: string; webUrl: string }
    return { nazov: subor.name, cesta: `${PRIECINOK_PRILOHY}/${priecinok}/${j.name}`, webUrl: j.webUrl }
  }

  /**
   * Nahrá súbor do data/<cesta> (napr. poriadky/2026-11-02/a.doc). Nič neprepíše:
   * ak tam už súbor s takým názvom je, vráti `false`.
   */
  async nahrajDoDat(cesta: string, subor: File): Promise<boolean> {
    const url = `${GRAPH}/me/drive/root:/${cestaUrl(`${PRIECINOK}/${cesta}`)}:/content?@microsoft.graph.conflictBehavior=fail`
    const res = await this.poziadavka(url, {
      method: 'PUT',
      headers: { 'Content-Type': subor.type || 'application/octet-stream' },
      body: subor,
    }, false, 120_000)
    if (res.status === 409) return false
    await overOk(res)
    return true
  }

  /** Odkaz na otvorenie súboru z data/<cesta> v OneDrive na webe, alebo "" ak neexistuje. */
  async odkazVDatach(cesta: string): Promise<string> {
    const res = await this.poziadavka(`${GRAPH}/me/drive/root:/${cestaUrl(`${PRIECINOK}/${cesta}`)}?$select=webUrl`)
    if (res.status === 404) return ''
    await overOk(res)
    return ((await res.json()) as { webUrl: string }).webUrl
  }

  /** Zmaže prílohu (v OneDrive ide do koša). Neexistujúca nevadí. */
  async zmazPrilohu(cesta: string): Promise<void> {
    const res = await this.poziadavka(`${GRAPH}/me/drive/root:/${cesta.split('/').map(encodeURIComponent).join('/')}`, { method: 'DELETE' })
    if (res.status === 404) return
    await overOk(res)
  }

  /** Pre Nastavenia: kam je aplikácia pripojená. */
  async infoPriecinka(): Promise<InfoPriecinka> {
    const disk = await this.poziadavka(`${GRAPH}/me/drive?$select=driveType,owner`)
    await overOk(disk)
    const d = (await disk.json()) as { driveType: string; owner?: { user?: { displayName?: string } } }
    const p = await this.poziadavka(`${GRAPH}/me/drive/root:/${PRIECINOK}?$select=webUrl`)
    const webUrl = p.ok ? ((await p.json()) as { webUrl: string }).webUrl : ''
    return { cesta: `/${PRIECINOK}`, webUrl, majitel: d.owner?.user?.displayName ?? '', typDisku: d.driveType }
  }
}

function cestaUrl(cesta: string): string {
  return cesta.split('/').map(encodeURIComponent).join('/')
}

async function overOk(res: Response): Promise<void> {
  if (res.ok) return
  let detail = ''
  try {
    detail = ((await res.json()) as { error?: { message?: string } }).error?.message ?? ''
  } catch {
    /* telo nie je JSON */
  }
  throw new Error(`OneDrive vrátil chybu ${res.status}${detail ? `: ${detail}` : ''}`)
}
