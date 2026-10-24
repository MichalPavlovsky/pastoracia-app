// Prihlásenie cez Microsoft účet (MSAL). Jedno prihlásenie dá aj prístup k OneDrive.
//
// Používame presmerovanie (nie vyskakovacie okno) – na iPhone v aplikácii z plochy
// vyskakovacie okná nefungujú spoľahlivo. Tokeny sú v localStorage, aby prihlásenie
// prežilo zatvorenie aplikácie.

import {
  BrowserCacheLocation,
  InteractionRequiredAuthError,
  PublicClientApplication,
  type AccountInfo,
} from '@azure/msal-browser'
import { config } from '../config'
import { ChybaPrihlasenia, ChybaSiete } from '../storage/types'

export const SCOPES = ['Files.ReadWrite', 'offline_access']

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
  })

  private spustenie: Promise<AccountInfo | null> | null = null

  /** Spracuje návrat z prihlasovacej stránky. Vráti prihlásený účet alebo null. */
  spusti(): Promise<AccountInfo | null> {
    this.spustenie ??= this.spustiRaz()
    return this.spustenie
  }

  private async spustiRaz(): Promise<AccountInfo | null> {
    await this.pca.initialize()
    const vysledok = await this.pca.handleRedirectPromise()
    const ucet = vysledok?.account ?? this.pca.getActiveAccount() ?? this.pca.getAllAccounts()[0] ?? null
    if (ucet) this.pca.setActiveAccount(ucet)
    return ucet
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

  /** Pre storage: token pre Microsoft Graph. Nikdy nepresmeruje – to urobí až používateľ. */
  ziskajToken = async (obnov = false): Promise<string> => {
    const account = this.pca.getActiveAccount()
    if (!account) throw new ChybaPrihlasenia()
    try {
      const r = await this.pca.acquireTokenSilent({ scopes: SCOPES, account, forceRefresh: obnov })
      return r.accessToken
    } catch (e) {
      if (e instanceof InteractionRequiredAuthError) throw new ChybaPrihlasenia()
      if (!navigator.onLine) throw new ChybaSiete()
      throw e
    }
  }
}
