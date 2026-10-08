// Level, XP and land price formulas from docs/GDD.md (2.5 and 4.4).
// In phase 2+ the server is the source of truth; these are used for display only.

export const XP_FACTOR = 40
export const MAX_LEVEL = 30
export const LAND_BASE_PRICE = 500
export const LAND_GROWTH = 1.5

/** XP needed to go from `level` to `level + 1` = 40 x level^2. */
export function xpToNextLevel(level: number): number {
  return XP_FACTOR * level * level
}

/** Total XP needed to reach `level` from level 1. */
export function totalXpForLevel(level: number): number {
  const n = level - 1
  return (XP_FACTOR * n * (n + 1) * (2 * n + 1)) / 6
}

/** Level and progress inside the current level for a total XP amount. */
export function levelFromXp(xp: number): { level: number; xpInLevel: number; xpNeeded: number } {
  let level = 1
  while (level < MAX_LEVEL && xp >= totalXpForLevel(level + 1)) level++
  const xpInLevel = xp - totalXpForLevel(level)
  return { level, xpInLevel, xpNeeded: level < MAX_LEVEL ? xpToNextLevel(level) : 0 }
}

/** Price of the next parcel when the player already owns `owned` parcels, rounded to 10. */
export function landPrice(owned: number): number {
  return Math.round((LAND_BASE_PRICE * LAND_GROWTH ** (owned - 1)) / 10) * 10
}
