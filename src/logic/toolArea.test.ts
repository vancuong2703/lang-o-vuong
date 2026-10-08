import { describe, expect, it } from 'vitest'
import { plotsInArea, type AreaPlot } from './toolArea'

// Two full parcels (16 plots each), ids 1..32.
const plots: AreaPlot[] = []
for (const parcel_id of [100, 200]) {
  for (let ly = 0; ly < 4; ly++) for (let lx = 0; lx < 4; lx++) plots.push({ id: plots.length + 1, parcel_id, lx, ly })
}
const at = (parcel_id: number, lx: number, ly: number) => plots.find((p) => p.parcel_id === parcel_id && p.lx === lx && p.ly === ly)!

describe('plotsInArea (GDD 5.3)', () => {
  const tapped = at(100, 3, 1) // top-right quadrant of parcel 100

  it('level 1: only the tapped plot', () => {
    expect(plotsInArea(1, tapped, plots).map((p) => p.id)).toEqual([tapped.id])
  })

  it('level 2: the 2x2 quadrant', () => {
    const area = plotsInArea(2, tapped, plots)
    expect(area).toHaveLength(4)
    expect(area.every((p) => p.parcel_id === 100 && p.lx >= 2 && p.ly < 2)).toBe(true)
    expect(area[0].id).toBe(tapped.id)
  })

  it('level 3: the top or bottom half (2x4)', () => {
    const area = plotsInArea(3, tapped, plots)
    expect(area).toHaveLength(8)
    expect(area.every((p) => p.parcel_id === 100 && p.ly < 2)).toBe(true)
  })

  it('level 4: the whole parcel', () => {
    expect(plotsInArea(4, tapped, plots)).toHaveLength(16)
  })

  it('level 5: every parcel', () => {
    expect(plotsInArea(5, tapped, plots)).toHaveLength(32)
  })
})
