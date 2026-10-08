import { describe, expect, it } from 'vitest'
import { landPrice, levelFromXp, totalXpForLevel, xpToNextLevel } from './progression'

describe('XP formulas (GDD 2.5)', () => {
  it('matches the XP table', () => {
    expect(xpToNextLevel(1)).toBe(40)
    expect(xpToNextLevel(5)).toBe(1000)
    expect(totalXpForLevel(1)).toBe(0)
    expect(totalXpForLevel(4)).toBe(560)
    expect(totalXpForLevel(10)).toBe(11_400)
    expect(totalXpForLevel(30)).toBe(342_200)
  })

  it('computes the level from total XP', () => {
    expect(levelFromXp(0)).toEqual({ level: 1, xpInLevel: 0, xpNeeded: 40 })
    expect(levelFromXp(39).level).toBe(1)
    expect(levelFromXp(40)).toEqual({ level: 2, xpInLevel: 0, xpNeeded: 160 })
    expect(levelFromXp(600)).toEqual({ level: 4, xpInLevel: 40, xpNeeded: 640 })
    expect(levelFromXp(10_000_000).level).toBe(30)
  })
})

describe('landPrice (GDD 4.4)', () => {
  it('matches the land price table', () => {
    expect(landPrice(1)).toBe(500)
    expect(landPrice(2)).toBe(750)
    expect(landPrice(3)).toBe(1130)
    expect(landPrice(4)).toBe(1690)
    expect(landPrice(10)).toBe(19_220)
    expect(landPrice(15)).toBe(145_960)
    expect(landPrice(24)).toBe(5_611_370)
  })
})
