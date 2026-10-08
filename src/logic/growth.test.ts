import { describe, expect, it } from 'vitest'
import { formatDuration, growthProgress, growthStage, nextStageAt } from './growth'

describe('growthProgress', () => {
  it('goes from 0 to 1 between plantedAt and readyAt', () => {
    expect(growthProgress(1000, 2000, 1000)).toBe(0)
    expect(growthProgress(1000, 2000, 1500)).toBe(0.5)
    expect(growthProgress(1000, 2000, 2000)).toBe(1)
  })

  it('is clamped when the clock is outside the range', () => {
    expect(growthProgress(1000, 2000, 500)).toBe(0)
    expect(growthProgress(1000, 2000, 9999)).toBe(1)
  })
})

describe('growthStage', () => {
  it('uses the GDD thresholds', () => {
    expect(growthStage(0)).toBe(0)
    expect(growthStage(0.24)).toBe(0)
    expect(growthStage(0.25)).toBe(1)
    expect(growthStage(0.59)).toBe(1)
    expect(growthStage(0.6)).toBe(2)
    expect(growthStage(0.99)).toBe(2)
    expect(growthStage(1)).toBe(3)
  })
})

describe('nextStageAt', () => {
  it('returns the next threshold time', () => {
    expect(nextStageAt(0, 1000, 0)).toBe(250)
    expect(nextStageAt(0, 1000, 300)).toBe(600)
    expect(nextStageAt(0, 1000, 700)).toBe(1000)
    expect(nextStageAt(0, 1000, 1000)).toBeNull()
  })
})

describe('formatDuration', () => {
  it('formats seconds, minutes and hours', () => {
    expect(formatDuration(30_000)).toBe('30 giây')
    expect(formatDuration(125_000)).toBe('2 phút 05 giây')
    expect(formatDuration(5_400_000)).toBe('1 giờ 30 phút')
    expect(formatDuration(3_600_000)).toBe('1 giờ')
  })
})
