// Lokálna kópia dát v IndexedDB – aplikácia funguje aj bez pripojenia.

import type { LokalnaCache, ZaznamSuboru } from './types'

const STORE = 'subory'

export class IndexedDbCache implements LokalnaCache {
  private db: Promise<IDBDatabase> | null = null

  constructor(
    private nazovDb = 'pastoracia',
    private idb: IDBFactory = indexedDB,
  ) {}

  private otvor(): Promise<IDBDatabase> {
    this.db ??= new Promise((resolve, reject) => {
      const r = this.idb.open(this.nazovDb, 1)
      r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'nazov' })
      r.onsuccess = () => resolve(r.result)
      r.onerror = () => reject(r.error)
    })
    return this.db
  }

  private async transakcia<T>(rezim: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.otvor()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, rezim)
      const req = fn(tx.objectStore(STORE))
      tx.oncomplete = () => resolve(req.result)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  }

  nacitaj(nazov: string): Promise<ZaznamSuboru | undefined> {
    return this.transakcia('readonly', (s) => s.get(nazov) as IDBRequest<ZaznamSuboru | undefined>)
  }

  async uloz(z: ZaznamSuboru): Promise<void> {
    await this.transakcia('readwrite', (s) => s.put(z))
  }

  async vymazVsetko(): Promise<void> {
    await this.transakcia('readwrite', (s) => s.clear())
  }
}

/** Cache v pamäti – pre testy. */
export class PamatovaCache implements LokalnaCache {
  private m = new Map<string, ZaznamSuboru>()

  async nacitaj(nazov: string) {
    const z = this.m.get(nazov)
    return z && structuredClone(z)
  }

  async uloz(z: ZaznamSuboru) {
    this.m.set(z.nazov, structuredClone(z))
  }

  async vymazVsetko() {
    this.m.clear()
  }
}
