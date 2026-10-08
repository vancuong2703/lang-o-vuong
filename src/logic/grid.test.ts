import { describe, expect, it } from 'vitest'
import { chunkOf, plotFromIndex, plotIndex, plotToWorld, quadrantOf, quadrantOrigin, worldToPlot } from './grid'

describe('worldToPlot', () => {
  it('finds the plot at the center of parcel (0,0) plot (0,0)', () => {
    expect(worldToPlot(0.5, 0.5)).toEqual({ parcelX: 0, parcelY: 0, plotX: 0, plotY: 0 })
  })

  it('finds the last plot of a parcel', () => {
    expect(worldToPlot(3.9, 3.1)).toEqual({ parcelX: 0, parcelY: 0, plotX: 3, plotY: 3 })
  })

  it('returns null on the path between parcels', () => {
    expect(worldToPlot(4.5, 1)).toBeNull()
    expect(worldToPlot(1, 4.2)).toBeNull()
  })

  it('finds plots in parcel (1,0)', () => {
    expect(worldToPlot(5.2, 0.5)).toEqual({ parcelX: 1, parcelY: 0, plotX: 0, plotY: 0 })
  })

  it('handles negative coordinates', () => {
    // -0.5 is in parcel -1, local 4.5 -> path
    expect(worldToPlot(-0.5, 0.5)).toBeNull()
    // -1.5 is in parcel -1, local 3.5 -> plot 3
    expect(worldToPlot(-1.5, 0.5)).toEqual({ parcelX: -1, parcelY: 0, plotX: 3, plotY: 0 })
  })
})

describe('plotToWorld', () => {
  it('is the inverse of worldToPlot for plot centers', () => {
    const coord = { parcelX: 2, parcelY: 3, plotX: 1, plotY: 2 }
    const [x, z] = plotToWorld(coord)
    expect([x, z]).toEqual([11.5, 17.5])
    expect(worldToPlot(x, z)).toEqual(coord)
  })
})

describe('plot index and quadrant', () => {
  it('round-trips plot index', () => {
    for (let i = 0; i < 16; i++) {
      const { plotX, plotY } = plotFromIndex(i)
      expect(plotIndex(plotX, plotY)).toBe(i)
    }
  })

  it('maps plots to quadrants', () => {
    expect(quadrantOf(0, 0)).toBe(0)
    expect(quadrantOf(3, 1)).toBe(1)
    expect(quadrantOf(1, 2)).toBe(2)
    expect(quadrantOf(2, 3)).toBe(3)
  })

  it('places quadrant corners inside the parcel, matching quadrantOf', () => {
    expect(quadrantOrigin(2, 3, 0)).toEqual([10, 15])
    expect(quadrantOrigin(2, 3, 3)).toEqual([12, 17])
    // the plot at the corner of each quadrant maps back to that quadrant
    for (let q = 0; q < 4; q++) {
      const [x, z] = quadrantOrigin(0, 0, q)
      const plot = worldToPlot(x + 0.5, z + 0.5)!
      expect(quadrantOf(plot.plotX, plot.plotY)).toBe(q)
    }
  })

  it('maps parcels to chunks', () => {
    expect(chunkOf(0, 7)).toEqual({ chunkX: 0, chunkY: 0 })
    expect(chunkOf(8, 31)).toEqual({ chunkX: 1, chunkY: 3 })
  })
})
