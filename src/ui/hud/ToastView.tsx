import { useEffect } from 'react'
import { useGame } from '../../state/gameStore'

const COLORS = {
  info: 'bg-white text-[#3B2F2A]',
  error: 'bg-[#E06D5A] text-white',
  success: 'bg-[#4E9F3D] text-white',
}

export function ToastView() {
  const toast = useGame((s) => s.toast)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => useGame.setState({ toast: null }), 2500)
    return () => clearTimeout(t)
  }, [toast])

  if (!toast) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 top-36 flex justify-center px-3">
      <div key={toast.id} className={`rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${COLORS[toast.kind]}`}>
        {toast.text}
      </div>
    </div>
  )
}
