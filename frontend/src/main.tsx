import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { init, backButton, viewport, miniApp, themeParams } from '@telegram-apps/sdk-react'
import './index.css'
import App from './App.tsx'

init()

miniApp.mount()
themeParams.mount()
viewport.mount().then(() => {
  viewport.expand()
})
backButton.mount()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
