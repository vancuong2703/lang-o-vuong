// Daily resets happen at 00:00 Vietnam time (UTC+7, no daylight saving). Pure helpers for the UI.

const VN_OFFSET_MS = 7 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

/** "YYYY-MM-DD" of the given instant in Vietnam. */
export function vnDate(nowMs: number): string {
  return new Date(nowMs + VN_OFFSET_MS).toISOString().slice(0, 10)
}

/** "YYYY-MM-DD" of the day before `date`. */
export function previousDate(date: string): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) - DAY_MS).toISOString().slice(0, 10)
}

/** Streak day (1..7) the player will get if they claim today (GDD 8.4, same rule as the server). */
export function nextLoginDay(lastLoginDate: string | null, streak: number, today: string): number {
  return lastLoginDate === previousDate(today) ? (streak % 7) + 1 : 1
}
