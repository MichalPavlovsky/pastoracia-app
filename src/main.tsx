import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { nacitajTemu, pouziTemu } from './ui/tema'
import './ui/zaklad.css'

pouziTemu(nacitajTemu())

// nová verzia sa nainštaluje a stránka sa sama obnoví; na iPhone aplikácia z plochy
// dlho beží na pozadí, preto kontrolujeme aj pri každom návrate do nej
registerSW({
  immediate: true,
  onRegisteredSW(_url, r) {
    if (!r) return
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) void r.update()
    })
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
