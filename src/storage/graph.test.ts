import { describe, expect, it, vi } from 'vitest'
import { GraphOneDrive, GRAPH } from './graph'
import { ChybaPrihlasenia, ChybaSiete, KonfliktZapisu } from './types'

const SUBOR = `${GRAPH}/me/drive/root:/Pastoracia-app/data/sopkovce-intencie.json`

function odpoved(status: number, telo?: unknown): Response {
  const text = telo === undefined ? null : typeof telo === 'string' ? telo : JSON.stringify(telo)
  return new Response(text, { status })
}

function graph(...odpovede: (Response | Error)[]) {
  const fetchFn = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => {
    const o = odpovede.shift()
    if (!o) throw new Error('neočakávaná požiadavka')
    if (o instanceof Error) throw o
    return o
  })
  const token = vi.fn(async (obnov?: boolean) => (obnov ? 'novy-token' : 'token'))
  return { g: new GraphOneDrive(token, fetchFn as unknown as typeof fetch), fetchFn, token }
}

const volanie = (f: ReturnType<typeof graph>['fetchFn'], i: number) => {
  const [url, init] = f.mock.calls[i]!
  return { url: String(url), init: init ?? {}, hlavicky: (init?.headers ?? {}) as Record<string, string> }
}

describe('GraphOneDrive', () => {
  it('načíta súbor: metadáta s eTagom, potom obsah z downloadUrl', async () => {
    const { g, fetchFn } = graph(
      odpoved(200, { eTag: '"abc,1"', '@microsoft.graph.downloadUrl': 'https://stiahni/x' }),
      odpoved(200, '{"verzia":1,"dni":[]}'),
    )
    expect(await g.nacitaj('sopkovce-intencie.json')).toEqual({ obsah: '{"verzia":1,"dni":[]}', etag: '"abc,1"' })
    expect(volanie(fetchFn, 0).url).toBe(SUBOR)
    expect(volanie(fetchFn, 0).hlavicky.Authorization).toBe('Bearer token')
    expect(volanie(fetchFn, 1).url).toBe('https://stiahni/x')
    expect(volanie(fetchFn, 1).hlavicky.Authorization).toBeUndefined()
  })

  it('neexistujúci súbor vráti null', async () => {
    const { g } = graph(odpoved(404, { error: { code: 'itemNotFound' } }))
    expect(await g.nacitaj('sopkovce-intencie.json')).toBeNull()
  })

  it('zápis existujúceho súboru posiela If-Match', async () => {
    const { g, fetchFn } = graph(odpoved(200, { eTag: '"abc,2"' }))
    expect(await g.zapis('sopkovce-intencie.json', 'obsah', '"abc,1"')).toBe('"abc,2"')
    const v = volanie(fetchFn, 0)
    expect(v.url).toBe(`${SUBOR}:/content`)
    expect(v.init.method).toBe('PUT')
    expect(v.hlavicky['If-Match']).toBe('"abc,1"')
    expect(v.init.body).toBe('obsah')
  })

  it('zápis nového súboru nesmie prepísať existujúci', async () => {
    const { g, fetchFn } = graph(odpoved(201, { eTag: '"n,1"' }))
    await g.zapis('sopkovce-intencie.json', 'obsah', null)
    const v = volanie(fetchFn, 0)
    expect(v.url).toBe(`${SUBOR}:/content?@microsoft.graph.conflictBehavior=fail`)
    expect(v.hlavicky['If-Match']).toBeUndefined()
  })

  it('412 a 409 = konflikt', async () => {
    await expect(graph(odpoved(412)).g.zapis('a.json', 'x', '"1"')).rejects.toBeInstanceOf(KonfliktZapisu)
    await expect(graph(odpoved(409)).g.zapis('a.json', 'x', null)).rejects.toBeInstanceOf(KonfliktZapisu)
  })

  it('401 → raz skúsi nový token, potom ChybaPrihlasenia', async () => {
    const ok = graph(odpoved(401), odpoved(200, { eTag: '"2"' }))
    expect(await ok.g.zapis('a.json', 'x', '"1"')).toBe('"2"')
    expect(volanie(ok.fetchFn, 1).hlavicky.Authorization).toBe('Bearer novy-token')
    await expect(graph(odpoved(401), odpoved(401)).g.etag('a.json')).rejects.toBeInstanceOf(ChybaPrihlasenia)
  })

  it('výpadok siete, 429 a 5xx = ChybaSiete (skúsi sa neskôr)', async () => {
    await expect(graph(new TypeError('Failed to fetch')).g.etag('a.json')).rejects.toBeInstanceOf(ChybaSiete)
    await expect(graph(odpoved(503)).g.etag('a.json')).rejects.toBeInstanceOf(ChybaSiete)
    await expect(graph(odpoved(429)).g.etag('a.json')).rejects.toBeInstanceOf(ChybaSiete)
  })

  it('iná chyba ukáže správu z Graphu', async () => {
    await expect(graph(odpoved(403, { error: { message: 'Access denied' } })).g.etag('a.json')).rejects.toThrow(
      'OneDrive vrátil chybu 403: Access denied',
    )
  })
})
