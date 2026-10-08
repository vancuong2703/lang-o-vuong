import { describe, expect, it } from 'vitest'
import { nextLoginDay, previousDate, vnDate } from './vnDate'

describe('vnDate', () => {
  it('switches day at 00:00 Vietnam time = 17:00 UTC', () => {
    expect(vnDate(Date.parse('2026-10-08T16:59:59Z'))).toBe('2026-10-08')
    expect(vnDate(Date.parse('2026-10-08T17:00:00Z'))).toBe('2026-10-09')
  })

  it('finds the previous date across months and years', () => {
    expect(previousDate('2026-10-01')).toBe('2026-09-30')
    expect(previousDate('2027-01-01')).toBe('2026-12-31')
  })
})

describe('nextLoginDay (GDD 8.4)', () => {
  it('continues the streak when the last claim was yesterday', () => {
    expect(nextLoginDay('2026-10-07', 3, '2026-10-08')).toBe(4)
  })

  it('wraps from day 7 back to day 1', () => {
    expect(nextLoginDay('2026-10-07', 7, '2026-10-08')).toBe(1)
  })

  it('restarts at day 1 after a missed day or for a new player', () => {
    expect(nextLoginDay('2026-10-05', 5, '2026-10-08')).toBe(1)
    expect(nextLoginDay(null, 0, '2026-10-08')).toBe(1)
  })
})
