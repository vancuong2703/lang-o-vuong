import { BoxGeometry, ConeGeometry, CylinderGeometry, SphereGeometry, type BufferGeometry } from 'three'
import { m, rotY, ShapeBuilder } from '../shapes'
import { roofPrism } from './houseGeometry'

// Pens and processors (GDD 3.3, 3.4) in old-Vietnamese-village style. Each type is ONE merged geometry,
// built in quadrant-local coordinates (0..2 x 0..2), so all structures of a type are one InstancedMesh.

const WOOD = '#8A6440'
const WOOD_LIGHT = '#B98A5E'
const THATCH = '#D9B45A'
const TILE = '#B5543C'

/** Low wooden fence around the 2x2 quadrant (rails at the given heights). */
function fence(b: ShapeBuilder, heights: number[], gapFront = false) {
  const edge = 0.08
  const len = 1.84
  for (const h of heights) {
    b.add(new BoxGeometry(len, 0.04, 0.04), WOOD, m([1, h, edge]))
    b.add(new BoxGeometry(0.04, 0.04, len), WOOD, m([edge, h, 1]))
    b.add(new BoxGeometry(0.04, 0.04, len), WOOD, m([2 - edge, h, 1]))
    if (gapFront) {
      b.add(new BoxGeometry(0.6, 0.04, 0.04), WOOD, m([0.38, h, 2 - edge]))
      b.add(new BoxGeometry(0.6, 0.04, 0.04), WOOD, m([1.62, h, 2 - edge]))
    } else {
      b.add(new BoxGeometry(len, 0.04, 0.04), WOOD, m([1, h, 2 - edge]))
    }
  }
  const top = Math.max(...heights) + 0.06
  for (const [x, z] of [
    [edge, edge],
    [2 - edge, edge],
    [edge, 2 - edge],
    [2 - edge, 2 - edge],
    [1, edge],
    [edge, 1],
    [2 - edge, 1],
  ]) {
    b.add(new CylinderGeometry(0.035, 0.04, top, 6), WOOD, m([x, top / 2, z]))
  }
}

function chickenPen(): BufferGeometry {
  const b = new ShapeBuilder()
  b.add(new BoxGeometry(1.9, 0.04, 1.9), '#C9A66B', m([1, 0.02, 1]))
  fence(b, [0.1, 0.2], true)
  // coop on short stilts with a thatched roof and a ramp
  for (const [x, z] of [
    [0.22, 0.22],
    [0.88, 0.22],
    [0.22, 0.7],
    [0.88, 0.7],
  ]) {
    b.add(new CylinderGeometry(0.03, 0.03, 0.22, 6), WOOD, m([x, 0.11, z]))
  }
  b.add(new BoxGeometry(0.78, 0.42, 0.58), WOOD_LIGHT, m([0.55, 0.43, 0.46]))
  b.add(new BoxGeometry(0.16, 0.2, 0.02), '#5A3E2B', m([0.55, 0.36, 0.76]))
  b.add(roofPrism(0.78, 0.34, 0.98), THATCH, m([0.55, 0.64, 0.46]).multiply(rotY(Math.PI / 2)))
  b.add(new BoxGeometry(0.16, 0.02, 0.42), WOOD, m([0.55, 0.13, 0.95], [-0.5, 0, 0]))
  // feeding trough with grain
  b.add(new BoxGeometry(0.5, 0.1, 0.18), WOOD, m([1.45, 0.07, 0.4]))
  b.add(new BoxGeometry(0.44, 0.02, 0.12), '#E3C66B', m([1.45, 0.12, 0.4]))
  return b.build()
}

function cowPen(): BufferGeometry {
  const b = new ShapeBuilder()
  b.add(new BoxGeometry(1.9, 0.04, 1.9), '#A8C46E', m([1, 0.02, 1]))
  fence(b, [0.18, 0.36], true)
  // open shelter at the back
  for (const [x, z] of [
    [0.35, 0.18],
    [1.65, 0.18],
    [0.35, 0.62],
    [1.65, 0.62],
  ]) {
    b.add(new CylinderGeometry(0.035, 0.035, 0.62, 6), WOOD, m([x, 0.31, z]))
  }
  b.add(roofPrism(0.75, 0.3, 1.55), THATCH, m([1, 0.62, 0.4]).multiply(rotY(Math.PI / 2)))
  // water trough and hay
  b.add(new BoxGeometry(0.42, 0.14, 0.2), WOOD, m([1.62, 0.09, 1.72]))
  b.add(new BoxGeometry(0.36, 0.02, 0.14), '#7FCDE3', m([1.62, 0.16, 1.72]))
  b.add(new SphereGeometry(1, 12, 10), '#DDB95E', m([0.34, 0.12, 1.62], [0, 0, 0], [0.22, 0.16, 0.2]))
  return b.build()
}

function feedMill(): BufferGeometry {
  const b = new ShapeBuilder()
  b.add(new BoxGeometry(1.8, 0.04, 1.8), '#D9C08E', m([1, 0.02, 1]))
  b.add(new BoxGeometry(1.1, 0.62, 0.8), WOOD_LIGHT, m([0.95, 0.35, 0.75]))
  b.add(new BoxGeometry(0.26, 0.36, 0.02), '#5A3E2B', m([0.95, 0.22, 1.16]))
  b.add(roofPrism(0.96, 0.36, 1.3), THATCH, m([0.95, 0.66, 0.75]).multiply(rotY(Math.PI / 2)))
  // hopper (upside-down funnel) and chute
  b.add(new ConeGeometry(0.22, 0.32, 8), WOOD, m([1.55, 0.62, 0.62], [Math.PI, 0, 0]))
  b.add(new CylinderGeometry(0.04, 0.04, 0.4, 6), WOOD, m([1.55, 0.3, 0.62]))
  // grain sacks
  for (const [x, z] of [
    [1.45, 1.45],
    [1.7, 1.55],
    [1.55, 1.75],
  ]) {
    b.add(new SphereGeometry(1, 10, 8), '#E8D7A8', m([x, 0.12, z], [0, 0, 0], [0.13, 0.14, 0.11]))
  }
  return b.build()
}

function mill(): BufferGeometry {
  const b = new ShapeBuilder()
  b.add(new BoxGeometry(1.8, 0.04, 1.8), '#D9C08E', m([1, 0.02, 1]))
  // thatched open hut
  for (const [x, z] of [
    [0.2, 0.2],
    [1.0, 0.2],
    [0.2, 0.9],
    [1.0, 0.9],
  ]) {
    b.add(new CylinderGeometry(0.035, 0.035, 0.6, 6), WOOD, m([x, 0.3, z]))
  }
  b.add(roofPrism(0.95, 0.38, 1.05), THATCH, m([0.6, 0.6, 0.55]).multiply(rotY(Math.PI / 2)))
  // big millstone with a wooden lever
  b.add(new CylinderGeometry(0.34, 0.36, 0.14, 16), '#A7A39A', m([1.3, 0.08, 1.3]))
  b.add(new CylinderGeometry(0.3, 0.3, 0.12, 16), '#B8B4AA', m([1.3, 0.21, 1.3]))
  b.add(new BoxGeometry(0.7, 0.04, 0.04), WOOD, m([1.3, 0.3, 1.3], [0, 0.6, 0]))
  // bamboo baskets of grain
  for (const [x, z] of [
    [0.45, 1.45],
    [0.75, 1.65],
  ]) {
    b.add(new CylinderGeometry(0.13, 0.1, 0.16, 10), '#C9A24A', m([x, 0.1, z]))
    b.add(new SphereGeometry(1, 10, 6), '#F2D27A', m([x, 0.18, z], [0, 0, 0], [0.11, 0.04, 0.11]))
  }
  return b.build()
}

function bakery(): BufferGeometry {
  const b = new ShapeBuilder()
  b.add(new BoxGeometry(1.8, 0.04, 1.8), '#CDB28A', m([1, 0.02, 1]))
  b.add(new BoxGeometry(1.1, 0.6, 0.75), '#D9A07A', m([0.75, 0.34, 0.65]))
  b.add(new BoxGeometry(0.26, 0.36, 0.02), '#5A3E2B', m([0.75, 0.22, 1.03]))
  b.add(roofPrism(0.92, 0.36, 1.3), TILE, m([0.75, 0.64, 0.65]).multiply(rotY(Math.PI / 2)))
  // dome oven with chimney
  b.add(new SphereGeometry(0.34, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), '#B5654A', m([1.45, 0.04, 1.35]))
  b.add(new BoxGeometry(0.16, 0.12, 0.04), '#3B2A22', m([1.45, 0.1, 1.68]))
  b.add(new CylinderGeometry(0.06, 0.07, 0.36, 8), '#8E4A35', m([1.55, 0.42, 1.25]))
  // firewood
  for (let i = 0; i < 3; i++) {
    b.add(new CylinderGeometry(0.04, 0.04, 0.4, 6), '#7A5232', m([0.35, 0.06 + i * 0.07, 1.55 + (i % 2) * 0.05], [0, 0, Math.PI / 2]))
  }
  return b.build()
}

function dairy(): BufferGeometry {
  const b = new ShapeBuilder()
  b.add(new BoxGeometry(1.8, 0.04, 1.8), '#CDB28A', m([1, 0.02, 1]))
  b.add(new BoxGeometry(1.3, 0.64, 0.8), '#F2EFE6', m([0.95, 0.36, 0.7]))
  b.add(new BoxGeometry(0.28, 0.38, 0.02), '#6B4A33', m([0.95, 0.23, 1.11]))
  b.add(roofPrism(0.98, 0.36, 1.5), TILE, m([0.95, 0.68, 0.7]).multiply(rotY(Math.PI / 2)))
  // milk cans and a cheese wheel
  for (const [x, z] of [
    [1.5, 1.45],
    [1.7, 1.55],
    [1.58, 1.72],
  ]) {
    b.add(new CylinderGeometry(0.07, 0.08, 0.24, 10), '#D6D6D2', m([x, 0.14, z]))
    b.add(new CylinderGeometry(0.04, 0.05, 0.05, 8), '#BDBDB8', m([x, 0.28, z]))
  }
  b.add(new CylinderGeometry(0.16, 0.16, 0.1, 14), '#F2C14E', m([0.4, 0.07, 1.6]))
  return b.build()
}

const BUILDERS: Record<string, () => BufferGeometry> = {
  chicken_pen: chickenPen,
  cow_pen: cowPen,
  feed_mill: feedMill,
  mill,
  bakery,
  dairy,
}

const cache = new Map<string, BufferGeometry>()

/** Cached merged geometry of a structure type, or null for an unknown type. */
export function structureGeometry(typeId: string): BufferGeometry | null {
  if (!BUILDERS[typeId]) return null
  let g = cache.get(typeId)
  if (!g) {
    g = BUILDERS[typeId]()
    cache.set(typeId, g)
  }
  return g
}

/** Where animals of a pen wander, in quadrant-local coordinates. */
export const PEN_YARD: Record<string, { cx: number; cz: number; rx: number; rz: number }> = {
  chicken_pen: { cx: 1.05, cz: 1.3, rx: 0.6, rz: 0.4 },
  cow_pen: { cx: 1.0, cz: 1.25, rx: 0.5, rz: 0.35 },
}
