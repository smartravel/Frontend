import '@fontsource/manrope/400.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/unbounded/600.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import { USE_MOCKS } from './shared/config/env'

async function enableMocks() {
  if (!import.meta.env.DEV || !USE_MOCKS) return
  const { worker } = await import('./app/mocks/browser')
  await worker.start()
}

enableMocks().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})