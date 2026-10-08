import { create } from 'zustand'

// One shared clock for the whole app, so every countdown and crop updates together.
// Phase 2 will add the server time offset here (ROADMAP 1.3 D).
interface ClockState {
  now: number
}

export const useClock = create<ClockState>(() => ({ now: Date.now() }))

let timer: ReturnType<typeof setInterval> | null = null

export function startClock(intervalMs = 500): () => void {
  if (timer) clearInterval(timer)
  timer = setInterval(() => useClock.setState({ now: Date.now() }), intervalMs)
  return () => {
    if (timer) clearInterval(timer)
    timer = null
  }
}
