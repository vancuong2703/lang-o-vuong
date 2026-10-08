import { BoxGeometry, ConeGeometry, CylinderGeometry, ExtrudeGeometry, Shape, SphereGeometry, type BufferGeometry } from 'three'
import { m, rotY, ShapeBuilder } from '../shapes'

// Old Vietnamese village buildings, each merged into ONE geometry (one draw call per building).

/** Triangular gable roof (prism) of a given width (across) and length (along X). */
export function roofPrism(width: number, height: number, length: number): BufferGeometry {
  const shape = new Shape()
  shape.moveTo(-width / 2, 0)
  shape.lineTo(width / 2, 0)
  shape.lineTo(0, height)
  shape.closePath()
  const g = new ExtrudeGeometry(shape, { depth: length, bevelEnabled: false })
  g.translate(0, 0, -length / 2)
  return g
}

/**
 * Tiled-roof farmhouse (nhà ngói) with brick yard and haystack (đụn rơm), sized for quadrant Q0
 * of a home parcel (local 0..2 x 0..2), facing +Z.
 */
export function farmhouseGeometry(roofColor: string): BufferGeometry {
  const b = new ShapeBuilder()
  // brick yard and stone foundation
  b.add(new BoxGeometry(1.9, 0.04, 0.8), '#C9785A', m([1.0, 0.02, 1.55]))
  b.add(new BoxGeometry(1.6, 0.12, 0.95), '#BCAE92', m([1.0, 0.06, 0.62]))
  // walls, door, windows
  b.add(new BoxGeometry(1.4, 0.52, 0.72), '#EEDDBA', m([1.0, 0.38, 0.6]))
  b.add(new BoxGeometry(0.3, 0.36, 0.02), '#6B4A33', m([1.0, 0.3, 0.97]))
  b.add(new BoxGeometry(0.22, 0.16, 0.02), '#6B4A33', m([0.55, 0.4, 0.97]))
  b.add(new BoxGeometry(0.22, 0.16, 0.02), '#6B4A33', m([1.45, 0.4, 0.97]))
  // porch columns
  for (const x of [0.35, 1.65]) b.add(new CylinderGeometry(0.035, 0.035, 0.52, 6), '#8A6440', m([x, 0.38, 1.08]))
  // tiled roof with ridge and curled ridge ends (đầu đao)
  b.add(roofPrism(1.35, 0.5, 1.85), roofColor, m([1.0, 0.64, 0.62]).multiply(rotY(Math.PI / 2)))
  b.add(new BoxGeometry(1.95, 0.06, 0.08), '#7E3A28', m([1.0, 1.15, 0.62]))
  for (const [x, tilt] of [
    [0.02, 0.6],
    [1.98, -0.6],
  ] as const) {
    b.add(new ConeGeometry(0.05, 0.22, 6), '#7E3A28', m([x, 1.22, 0.62], [0, 0, tilt]))
  }
  // haystack and water jar
  b.add(new SphereGeometry(1, 12, 10), '#DDB95E', m([0.28, 0.26, 1.72], [0, 0, 0], [0.24, 0.3, 0.24]))
  b.add(new ConeGeometry(0.07, 0.16, 6), '#B8913E', m([0.28, 0.6, 1.72]))
  b.add(new SphereGeometry(0.1, 10, 8), '#7A5A44', m([1.82, 0.1, 1.25]))
  return b.build()
}

/** Village communal house (đình làng): wide body, big roof, upturned corners. */
export function communalHouseGeometry(): BufferGeometry {
  const b = new ShapeBuilder()
  b.add(new BoxGeometry(8, 0.35, 5.5), '#C9BFAE', m([0, 0.17, 0]))
  b.add(new BoxGeometry(6.6, 1.5, 3.6), '#E7CC99', m([0, 1.1, 0]))
  for (const x of [-3, -1, 1, 3]) b.add(new CylinderGeometry(0.12, 0.12, 1.5, 8), '#8A4B2F', m([x, 1.1, 2.0]))
  b.add(roofPrism(5.2, 1.8, 7.6), '#A9503A', m([0, 1.85, 0]).multiply(rotY(Math.PI / 2)))
  b.add(new BoxGeometry(7.9, 0.18, 0.25), '#7A3424', m([0, 3.65, 0]))
  for (const [x, z] of [
    [-3.8, 2.6],
    [3.8, 2.6],
    [-3.8, -2.6],
    [3.8, -2.6],
  ]) {
    b.add(new ConeGeometry(0.12, 0.6, 6), '#7A3424', m([x, 2.0, z], [z > 0 ? -0.5 : 0.5, 0, x > 0 ? -0.5 : 0.5]))
  }
  return b.build()
}

/** Market stalls with thatched roofs (chợ làng). */
export function marketGeometry(): BufferGeometry {
  const b = new ShapeBuilder()
  for (const [x, z] of [
    [-1.6, -1],
    [1.6, -1],
    [-1.6, 1.4],
    [1.6, 1.4],
  ]) {
    b.add(new BoxGeometry(2.2, 0.5, 1.1), '#B9895A', m([x, 0.25, z]))
    for (const dx of [-1, 1]) b.add(new CylinderGeometry(0.05, 0.05, 1.2, 6), '#8A6440', m([x + dx, 0.6, z]))
    b.add(roofPrism(1.6, 0.55, 2.5), '#D9B45A', m([x, 1.2, z]).multiply(rotY(Math.PI / 2)))
  }
  return b.build()
}

/** Banyan tree (cây đa) with a well (giếng làng) next to it. */
export function banyanAndWellGeometry(): BufferGeometry {
  const b = new ShapeBuilder()
  b.add(new CylinderGeometry(0.45, 0.7, 2.4, 10), '#7A5A40', m([0, 1.2, 0]))
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    b.add(new CylinderGeometry(0.04, 0.05, 2.0, 5), '#8A6A4C', m([Math.cos(a) * 1.4, 1.0, Math.sin(a) * 1.4]))
  }
  const canopy: [number, number, number, number][] = [
    [0, 3.2, 0, 1.9],
    [1.4, 2.9, 0.5, 1.4],
    [-1.3, 2.8, -0.4, 1.5],
    [0.3, 2.7, -1.4, 1.3],
    [-0.4, 3.0, 1.4, 1.3],
  ]
  canopy.forEach(([x, y, z, r], i) => b.add(new SphereGeometry(r, 14, 10), i % 2 ? '#5E9A44' : '#6BA84F', m([x, y, z])))
  // well
  b.add(new CylinderGeometry(0.7, 0.75, 0.6, 14), '#B7AFA0', m([3.4, 0.3, 1.2]))
  b.add(new CylinderGeometry(0.55, 0.55, 0.05, 14), '#5BB3D0', m([3.4, 0.55, 1.2]))
  return b.build()
}
