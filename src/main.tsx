import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ConfigErrorScreen } from './ui/screens/ConfigErrorScreen.tsx'

const root = createRoot(document.getElementById('root')!)

// Vite bakes VITE_* variables into the bundle at BUILD time. If they are missing (e.g. not set on Vercel),
// show a clear message instead of a blank screen, and do not load the Supabase client at all.
const configured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)

if (!configured) {
  root.render(<ConfigErrorScreen />)
} else {
  void import('./App.tsx').then(({ default: App }) =>
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  )
}
