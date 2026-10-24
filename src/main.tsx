import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { nacitajTemu, pouziTemu } from './ui/tema'
import './ui/zaklad.css'

pouziTemu(nacitajTemu())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
