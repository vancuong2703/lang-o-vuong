import { useMemo } from 'react'
import { PARCEL_PITCH } from '../../logic/grid'
import { InstancedBoxes, type BoxInstance } from './InstancedBoxes'
import { MAP_WORLD } from './mapConstants'

// Fixed village roads (GDD 6.7). Purely visual: they run in the 1-unit gaps between parcels.
// - Main dirt roads every 4 parcels, so every estate block (around a home slot) is bordered by roads.
// - A ring road around the town square.
// Small gaps between other parcels stay as grassy field dykes (bờ ruộng).

const ROAD = '#CDB28A'
const ROAD_EDGE = '#B99B70'
const MAIN_LINES = [4, 8, 12, 16, 20, 24, 28]
const TOWN_RING = [13, 19]
const TOWN_FROM = 13 * PARCEL_PITCH - 1
const TOWN_TO = 19 * PARCEL_PITCH

/** World coordinate of the center of the gap just before parcel `p`. */
const gapCenter = (p: number) => p * PARCEL_PITCH - 0.5

function road(axis: 'x' | 'z', at: number, from: number, to: number, width: number, color: string, y: number): BoxInstance {
  const length = to - from
  const mid = (from + to) / 2
  return axis === 'x'
    ? { position: [at, y, mid], scale: [width, 0.04, length], color }
    : { position: [mid, y, at], scale: [length, 0.04, width], color }
}

export function Roads() {
  const boxes = useMemo(() => {
    const list: BoxInstance[] = []
    for (const p of MAIN_LINES) {
      const c = gapCenter(p)
      // darker edge underneath, lighter road on top: a soft two-tone dirt road
      list.push(road('x', c, -6, MAP_WORLD + 6, 1.35, ROAD_EDGE, 0.025), road('x', c, -6, MAP_WORLD + 6, 1.05, ROAD, 0.03))
      list.push(road('z', c, -6, MAP_WORLD + 6, 1.35, ROAD_EDGE, 0.025), road('z', c, -6, MAP_WORLD + 6, 1.05, ROAD, 0.03))
    }
    for (const p of TOWN_RING) {
      const c = gapCenter(p)
      list.push(road('x', c, TOWN_FROM, TOWN_TO, 1.35, ROAD_EDGE, 0.025), road('x', c, TOWN_FROM, TOWN_TO, 1.05, ROAD, 0.03))
      list.push(road('z', c, TOWN_FROM, TOWN_TO, 1.35, ROAD_EDGE, 0.025), road('z', c, TOWN_FROM, TOWN_TO, 1.05, ROAD, 0.03))
    }
    return list
  }, [])

  return <InstancedBoxes boxes={boxes} receiveShadow />
}
