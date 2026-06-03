import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './styles/global.css'
import App from './App'
import { initTheme } from './hooks/useTheme'

// Apply the persisted theme before the first render (dark by default).
initTheme()

// Register service worker (vite-plugin-pwa auto-generates this)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // vite-plugin-pwa handles registration via virtual:pwa-register
    // This is the fallback manual registration path
  })
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
