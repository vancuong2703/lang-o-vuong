// Growth timing, shared by crops (and later animals and processors). See docs/ROADMAP.md 2.9.

/** 0 = seed, 1 = sprout, 2 = growing, 3 = ready. */
export type GrowthStage = 0 | 1 | 2 | 3

/** Progress from 0 to 1, computed only from two timestamps and the current time (ms). */
export function growthProgress(plantedAt: number, readyAt: number, now: number): number {
  const total = readyAt - plantedAt
  if (total <= 0) return 1
  return Math.min(1, Math.max(0, (now - plantedAt) / total))
}

/** Stage thresholds from GDD 3.2: 0-25% seed, 25-60% sprout, 60-100% growing, 100% ready. */
export function growthStage(progress: number): GrowthStage {
  if (progress >= 1) return 3
  if (progress >= 0.6) return 2
  if (progress >= 0.25) return 1
  return 0
}

/** Time (ms) when the next stage starts, or null when already ready. */
export function nextStageAt(plantedAt: number, readyAt: number, now: number): number | null {
  const total = readyAt - plantedAt
  for (const threshold of [0.25, 0.6, 1]) {
    const at = plantedAt + total * threshold
    if (at > now) return at
  }
  return null
}

/** Formats a duration for the UI: "45 giây", "2 phút 05 giây", "1 giờ 30 phút". */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`
  if (minutes > 0) return `${minutes} phút ${String(seconds).padStart(2, '0')} giây`
  return `${seconds} giây`
}
