import { create } from 'zustand'

// One shared clock for the whole app, so every countdown and crop updates together.
// `now` is the SERVER time estimate: device time + offset (ROADMAP 1.3 D).
// Changing the device clock only changes what this player sees, never the real result.
interface ClockState {
  now: number
  offsetMs: number
}

export const useClock = create<ClockState>(() => ({ now: Date.now(), offsetMs: 0 }))

/** Call with the server time and the moments the request was sent and received (device ms). */
export function syncServerTime(serverIso: string, sentAt: number, receivedAt: number) {
  const offsetMs = Date.parse(serverIso) - (sentAt + receivedAt) / 2
  useClock.setState({ offsetMs, now: Date.now() + offsetMs })
}

let timer: ReturnType<typeof setInterval> | null = null

export function startClock(intervalMs = 500): () => void {
  if (timer) clearInterval(timer)
  timer = setInterval(() => useClock.setState((s) => ({ now: Date.now() + s.offsetMs })), intervalMs)
  return () => {
    if (timer) clearInterval(timer)
    timer = null
  }
}
