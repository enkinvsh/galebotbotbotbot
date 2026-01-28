import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

async function initTelegram() {
  try {
    const { init, backButton, viewport, miniApp, themeParams } = await import('@telegram-apps/sdk-react')
    init()
    miniApp.mount()
    themeParams.mount()
    viewport.mount().then(() => {
      viewport.expand()
    }).catch(() => {})
    backButton.mount()
  } catch (e) {
    console.log('Running outside Telegram, skipping SDK init')
  }
}

initTelegram().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
