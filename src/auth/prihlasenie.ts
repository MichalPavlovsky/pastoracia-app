// Prihlásenie cez Microsoft účet (MSAL). Jedno prihlásenie dá aj prístup k OneDrive.
//
// Používame presmerovanie (nie vyskakovacie okno) – na iPhone v aplikácii z plochy
// vyskakovacie okná nefungujú spoľahlivo. Tokeny sú v localStorage, aby prihlásenie
// prežilo zatvorenie aplikácie.

import {
  AuthError,
  BrowserCacheLocation,
  InteractionRequiredAuthError,
  PublicClientApplication,
  type AccountInfo,
} from '@azure/msal-browser'
import { config } from '../config'
import { ChybaPrihlasenia, ChybaSiete } from '../storage/types'

export const SCOPES = ['Files.ReadWrite', 'offline_access']
// kalendár si pýtame zvlášť, aby OneDrive fungoval aj bez neho
export const SCOPES_KALENDAR = ['Calendars.ReadWrite']

export interface Ucet {
  meno: string
  email: string
  /** "osobny" | "pracovny" */
  typ: 'osobny' | 'pracovny'
}

// Osobné Microsoft účty majú vždy tento tenant
const TENANT_OSOBNE = '9188040d-6c67-4c5b-b112-36a304b66dad'

export class Prihlasenie {
  private pca = new PublicClientApplication({
    auth: {
      clientId: config.clientId,
      authority: 'https://login.microsoftonline.com/common',
      redirectUri: config.adresaAplikacie,
      postLogoutRedirectUri: config.adresaAplikacie,
      // odpoveď v ?query, lebo #hash používa smerovanie aplikácie
      OIDCOptions: { responseMode: 'query' },
    },
    cache: { cacheLocation: BrowserCacheLocation.LocalStorage },
    // tiché obnovenie cez skrytý rámec na iPhone väčšinou nejde – nech to nečaká dlho
    system: { iframeBridgeTimeout: 6000 },
  })

  private spustenie: Promise<AccountInfo | null> | null = null
  /** chyba z návratu z Microsoftu pri už prihlásenom účte (napr. súhlas s kalendárom), inak "" */
  chybaPresmerovania = ''

  /** Spracuje návrat z prihlasovacej stránky. Vráti prihlásený účet alebo null. */
  spusti(): Promise<AccountInfo | null> {
    this.spustenie ??= this.spustiRaz()
    return this.spustenie
  }

  private async spustiRaz(): Promise<AccountInfo | null> {
    await this.pca.initialize()
    let vysledok = null
    try {
      vysledok = await this.pca.handleRedirectPromise()
    } catch (e) {
      // napr. zamietnutý súhlas s kalendárom – prihlásenie samo ostáva platné
      if (this.pca.getAllAccounts().length === 0) throw e
      this.chybaPresmerovania = (e as Error).message
    }
    const ucet = vysledok?.account ?? this.pca.getActiveAccount() ?? this.pca.getAllAccounts()[0] ?? null
    if (ucet) this.pca.setActiveAccount(ucet)
    if (ucet && !vysledok && (await this.trebaObnovit())) {
      await this.obnovPrihlasenie()
      return new Promise(() => {}) // stránka odchádza na Microsoft
    }
    return ucet
  }

  /**
   * Obnovovací token jednostránkovej aplikácie platí 24 h a tiché obnovenie na iPhone
   * nefunguje. Pri spustení preto radšej hneď presmerujeme (Microsoft si účet pamätá,
   * zvyčajne netreba nič zadávať). Najviac raz za 5 minút, aby nevznikol kruh.
   */
  private async trebaObnovit(): Promise<boolean> {
    if (!navigator.onLine) return false
    try {
      await this.token(SCOPES, false, '')
      return false
    } catch (e) {
      if (!(e instanceof ChybaPrihlasenia)) return false
      const KLUC = 'pastoracia.obnovaPrihlasenia'
      const posledne = Number(sessionStorage.getItem(KLUC) ?? 0)
      if (Date.now() - posledne < 5 * 60_000) return false
      sessionStorage.setItem(KLUC, String(Date.now()))
      return true
    }
  }

  /** Znova získa token presmerovaním bez výberu účtu. */
  obnovPrihlasenie(): Promise<void> {
    const account = this.pca.getActiveAccount()
    if (!account) return this.prihlas()
    return this.pca.acquireTokenRedirect({ scopes: SCOPES, account, loginHint: account.username })
  }

  prihlas(): Promise<void> {
    return this.pca.loginRedirect({ scopes: SCOPES, prompt: 'select_account' })
  }

  odhlas(): Promise<void> {
    return this.pca.logoutRedirect({ account: this.pca.getActiveAccount() })
  }

  ucet(): Ucet | null {
    const a = this.pca.getActiveAccount()
    if (!a) return null
    return {
      meno: a.name ?? '',
      email: a.username,
      typ: a.tenantId === TENANT_OSOBNE ? 'osobny' : 'pracovny',
    }
  }

  /** Súhlas s prístupom ku kalendáru (presmerovanie na Microsoft). */
  pripojKalendar(): Promise<void> {
    return this.pca.acquireTokenRedirect({ scopes: SCOPES_KALENDAR, account: this.pca.getActiveAccount() ?? undefined })
  }

  /** Pre storage: token pre Microsoft Graph. Nikdy nepresmeruje – to urobí až používateľ. */
  ziskajToken = (obnov = false): Promise<string> => this.token(SCOPES, obnov, 'Treba sa znova prihlásiť')

  ziskajTokenKalendara = (obnov = false): Promise<string> => this.token(SCOPES_KALENDAR, obnov, 'Kalendár treba znova pripojiť')

  private async token(scopes: string[], obnov: boolean, sprava: string): Promise<string> {
    const account = this.pca.getActiveAccount()
    if (!account) throw new ChybaPrihlasenia()
    try {
      const r = await this.pca.acquireTokenSilent({ scopes, account, forceRefresh: obnov })
      return r.accessToken
    } catch (e) {
      if (!navigator.onLine) throw new ChybaSiete()
      if (e instanceof InteractionRequiredAuthError || jeVyprsanieRamca(e)) throw new ChybaPrihlasenia(sprava)
      throw e
    }
  }
}

/** Tiché obnovenie cez skrytý rámec vypršalo (iPhone blokuje cookies tretích strán). */
function jeVyprsanieRamca(e: unknown): boolean {
  return e instanceof AuthError && (e.errorCode === 'timed_out' || e.errorCode === 'monitor_window_timeout')
}
