// Kalendár Outlook cez Microsoft Graph (predvolený kalendár prihláseného účtu).
// Naše udalosti poznáme podľa skrytých vlastností (single-value extended properties).

import { casNaMinuty, pridajDni } from '../lib/datum'
import { ChybaPrihlasenia, ChybaSiete } from '../storage/types'
import type { ZiskajToken } from '../storage/graph'
import { GRAPH } from '../storage/graph'
import { podpisUdalosti, type PoskytovatelKalendara, type UdalostKalendara, type UlozenaUdalost } from './types'

const SADA = '{5d0c9f4e-2b7a-4c3e-8f61-a94b2e7d1c38}'
const ZDROJ = `String ${SADA} Name PastoraciaZdroj`
const PRIPOMIENKA = `String ${SADA} Name PastoraciaPripomienka`
const PODPIS = `String ${SADA} Name PastoraciaPodpis`
const ZDROJ_LUDIA = 'ludia'
const ZONA = 'Europe/Bratislava'
const LIMIT_MS = 20_000
/** celodenná pripomienka sa ozve o 18:00 deň predtým */
const PRIPOMENUT_CELODENNU = 6 * 60
const PRIPOMENUT_S_CASOM = 15
const DLZKA_MIN = 15

interface GraphUdalost {
  id: string
  start: { dateTime: string }
  singleValueExtendedProperties?: { id: string; value: string }[]
}

/** Telo udalosti pre Graph (vytvorenie aj úprava). */
export function teloUdalosti(u: UdalostKalendara): Record<string, unknown> {
  const spolocne = {
    subject: u.nazov,
    body: { contentType: 'text', content: u.text },
    isReminderOn: true,
    singleValueExtendedProperties: [
      { id: ZDROJ, value: ZDROJ_LUDIA },
      { id: PRIPOMIENKA, value: u.idPripomienky },
      { id: PODPIS, value: podpisUdalosti(u) },
    ],
  }
  if (u.cas === '') {
    return {
      ...spolocne,
      isAllDay: true,
      showAs: 'free',
      reminderMinutesBeforeStart: PRIPOMENUT_CELODENNU,
      start: { dateTime: `${u.datum}T00:00:00`, timeZone: ZONA },
      end: { dateTime: `${pridajDni(u.datum, 1)}T00:00:00`, timeZone: ZONA },
    }
  }
  // koniec najneskôr o polnoci
  const koniec = Math.min(casNaMinuty(u.cas) + DLZKA_MIN, 24 * 60)
  const koniecText =
    koniec === 24 * 60
      ? `${pridajDni(u.datum, 1)}T00:00:00`
      : `${u.datum}T${String(Math.floor(koniec / 60)).padStart(2, '0')}:${String(koniec % 60).padStart(2, '0')}:00`
  return {
    ...spolocne,
    isAllDay: false,
    reminderMinutesBeforeStart: PRIPOMENUT_S_CASOM,
    start: { dateTime: `${u.datum}T${u.cas}:00`, timeZone: ZONA },
    end: { dateTime: koniecText, timeZone: ZONA },
  }
}

export class KalendarOutlook implements PoskytovatelKalendara {
  constructor(
    private ziskajToken: ZiskajToken,
    private fetchFn: typeof fetch = (...a) => fetch(...a),
  ) {}

  private async poziadavka(url: string, init: RequestInit = {}, opakovanie = false): Promise<Response> {
    const token = await this.ziskajToken(opakovanie)
    let res: Response
    try {
      res = await this.fetchFn(url, {
        ...init,
        cache: 'no-store',
        signal: AbortSignal.timeout(LIMIT_MS),
        headers: {
          ...(init.headers as Record<string, string>),
          Authorization: `Bearer ${token}`,
          Prefer: `outlook.timezone="${ZONA}"`,
        },
      })
    } catch {
      throw new ChybaSiete()
    }
    if (res.status === 401) {
      if (!opakovanie) return this.poziadavka(url, init, true)
      throw new ChybaPrihlasenia('Kalendár treba znova pripojiť')
    }
    if (res.status === 429 || res.status >= 500) throw new ChybaSiete(`Outlook dočasne neodpovedá (${res.status})`)
    return res
  }

  async nacitaj(odDatumu: string): Promise<UlozenaUdalost[]> {
    const filter = `singleValueExtendedProperties/Any(ep: ep/id eq '${ZDROJ}' and ep/value eq '${ZDROJ_LUDIA}')`
    const rozsir = `singleValueExtendedProperties($filter=id eq '${PRIPOMIENKA}' or id eq '${PODPIS}')`
    let url: string | undefined =
      `${GRAPH}/me/events?$select=id,start&$top=100` +
      `&$filter=${encodeURIComponent(filter)}&$expand=${encodeURIComponent(rozsir)}`
    const vysledok: UlozenaUdalost[] = []
    while (url) {
      const res = await this.poziadavka(url)
      await overOk(res)
      const j = (await res.json()) as { value: GraphUdalost[]; '@odata.nextLink'?: string }
      for (const u of j.value) {
        if (u.start.dateTime.slice(0, 10) < odDatumu) continue
        const vlastnost = (id: string) => u.singleValueExtendedProperties?.find((p) => p.id.toLowerCase() === id.toLowerCase())?.value ?? ''
        vysledok.push({ id: u.id, idPripomienky: vlastnost(PRIPOMIENKA), podpis: vlastnost(PODPIS) })
      }
      url = j['@odata.nextLink']
    }
    return vysledok
  }

  async vytvor(u: UdalostKalendara): Promise<void> {
    const res = await this.poziadavka(`${GRAPH}/me/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teloUdalosti(u)),
    })
    await overOk(res)
  }

  async uprav(id: string, u: UdalostKalendara): Promise<void> {
    const res = await this.poziadavka(`${GRAPH}/me/events/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teloUdalosti(u)),
    })
    await overOk(res)
  }

  async zmaz(id: string): Promise<void> {
    const res = await this.poziadavka(`${GRAPH}/me/events/${encodeURIComponent(id)}`, { method: 'DELETE' })
    // už zmazaná ručne v Outlooku
    if (res.status === 404) return
    await overOk(res)
  }
}

async function overOk(res: Response): Promise<void> {
  if (res.ok) return
  let detail = ''
  try {
    detail = ((await res.json()) as { error?: { message?: string } }).error?.message ?? ''
  } catch {
    /* telo nie je JSON */
  }
  if (res.status === 403) throw new ChybaPrihlasenia('Kalendár nemá povolenie – treba ho znova pripojiť')
  throw new Error(`Outlook vrátil chybu ${res.status}${detail ? `: ${detail}` : ''}`)
}
