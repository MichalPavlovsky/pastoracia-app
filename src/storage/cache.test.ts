import { IDBFactory } from 'fake-indexeddb'
import { describe, expect, it } from 'vitest'
import { IndexedDbCache } from './cache'
import type { ZaznamSuboru } from './types'

const zaznam: ZaznamSuboru = {
  nazov: 'sopkovce-intencie.json',
  server: { obsah: '{"verzia":1,"dni":[]}\n', etag: '"1"' },
  lokalne: '{ "verzia": 1, "dni": [] }\n',
  konflikt: null,
}

describe('IndexedDbCache', () => {
  it('uloží, načíta a prepíše záznam', async () => {
    const c = new IndexedDbCache('test', new IDBFactory())
    expect(await c.nacitaj(zaznam.nazov)).toBeUndefined()
    await c.uloz(zaznam)
    expect(await c.nacitaj(zaznam.nazov)).toEqual(zaznam)
    await c.uloz({ ...zaznam, lokalne: null })
    expect((await c.nacitaj(zaznam.nazov))?.lokalne).toBeNull()
  })

  it('dáta prežijú nové otvorenie (zatvorenie aplikácie)', async () => {
    const idb = new IDBFactory()
    await new IndexedDbCache('test', idb).uloz(zaznam)
    expect(await new IndexedDbCache('test', idb).nacitaj(zaznam.nazov)).toEqual(zaznam)
  })

  it('vymaže všetko', async () => {
    const c = new IndexedDbCache('test', new IDBFactory())
    await c.uloz(zaznam)
    await c.vymazVsetko()
    expect(await c.nacitaj(zaznam.nazov)).toBeUndefined()
  })
})
