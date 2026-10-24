// Jednoduché ikony ako inline SVG (bez knižnice).

import type { ReactNode } from 'react'

interface IkonaProps {
  velkost?: number
}

function Ikona({ velkost = 24, children }: IkonaProps & { children: ReactNode }) {
  return (
    <svg
      width={velkost}
      height={velkost}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

export function IkonaList(p: IkonaProps) {
  return (
    <Ikona {...p}>
      <path d="M4 4h13a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2V4z" />
      <path d="M19 9h2v9a2 2 0 0 1-2 2" />
      <path d="M8 8h7M8 12h7M8 16h4" />
    </Ikona>
  )
}

export function IkonaKalendar(p: IkonaProps) {
  return (
    <Ikona {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4M12 13v5M10 15h4" />
    </Ikona>
  )
}

export function IkonaPastoracia(p: IkonaProps) {
  return (
    <Ikona {...p}>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
    </Ikona>
  )
}

export function IkonaLudia(p: IkonaProps) {
  return (
    <Ikona {...p}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M16 4.7a3.5 3.5 0 0 1 0 6.6" />
      <path d="M18 14.3c2.2.7 3.5 2.6 3.5 5.7" />
    </Ikona>
  )
}

export function IkonaKniha(p: IkonaProps) {
  return (
    <Ikona {...p}>
      <path d="M12 6.5C10.5 5 8 4.5 3 4.5v13c5 0 7.5.5 9 2 1.5-1.5 4-2 9-2v-13c-5 0-7.5.5-9 2z" />
      <path d="M12 6.5v13" />
    </Ikona>
  )
}

export function IkonaNastavenia(p: IkonaProps) {
  return (
    <Ikona {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" />
    </Ikona>
  )
}

export function IkonaSpat(p: IkonaProps) {
  return (
    <Ikona {...p}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </Ikona>
  )
}

export function IkonaPlus(p: IkonaProps) {
  return (
    <Ikona {...p}>
      <path d="M12 5v14M5 12h14" />
    </Ikona>
  )
}
