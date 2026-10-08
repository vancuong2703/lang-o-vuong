import { BoxGeometry, ConeGeometry, CylinderGeometry, SphereGeometry, type BufferGeometry } from 'three'
import { m, ShapeBuilder } from '../shapes'

// Low-poly animals as merged vertex-color geometries, facing +Z, standing on y = 0.

function chicken(): BufferGeometry {
  const b = new ShapeBuilder()
  const white = '#F7F3EA'
  b.add(new SphereGeometry(1, 12, 10), white, m([0, 0.15, 0], [0, 0, 0], [0.11, 0.1, 0.14]))
  b.add(new ConeGeometry(0.06, 0.12, 8), '#EDE6D6', m([0, 0.2, -0.13], [-0.9, 0, 0]))
  b.add(new SphereGeometry(0.065, 10, 8), white, m([0, 0.27, 0.1]))
  b.add(new SphereGeometry(1, 8, 6), '#D9433A', m([0, 0.34, 0.1], [0, 0, 0], [0.018, 0.035, 0.045]))
  b.add(new ConeGeometry(0.02, 0.05, 6), '#F2A541', m([0, 0.26, 0.18], [Math.PI / 2, 0, 0]))
  for (const x of [-0.035, 0.035]) {
    b.add(new SphereGeometry(0.01, 6, 4), '#2B2B2B', m([x, 0.29, 0.155]))
    b.add(new CylinderGeometry(0.008, 0.008, 0.07, 4), '#E8A33D', m([x, 0.04, 0.01]))
  }
  return b.build()
}

function cow(): BufferGeometry {
  const b = new ShapeBuilder()
  const hide = '#F4F1EA'
  const spot = '#3B3B3B'
  b.add(new SphereGeometry(1, 14, 10), hide, m([0, 0.34, 0], [0, 0, 0], [0.19, 0.17, 0.31]))
  b.add(new SphereGeometry(1, 10, 8), spot, m([0.16, 0.38, 0.05], [0, 0, 0], [0.05, 0.09, 0.11]))
  b.add(new SphereGeometry(1, 10, 8), spot, m([-0.15, 0.32, -0.12], [0, 0, 0], [0.06, 0.08, 0.09]))
  b.add(new SphereGeometry(1, 10, 8), spot, m([0.02, 0.5, -0.05], [0, 0, 0], [0.09, 0.03, 0.1]))
  b.add(new BoxGeometry(0.17, 0.16, 0.18), hide, m([0, 0.44, 0.33]))
  b.add(new BoxGeometry(0.15, 0.08, 0.06), '#E8A9A0', m([0, 0.4, 0.43]))
  for (const x of [-0.06, 0.06]) {
    b.add(new ConeGeometry(0.02, 0.07, 6), '#E8DCC0', m([x, 0.55, 0.32], [0, 0, x > 0 ? -0.5 : 0.5]))
    b.add(new BoxGeometry(0.06, 0.03, 0.04), hide, m([x * 1.9, 0.48, 0.31]))
    b.add(new SphereGeometry(0.015, 6, 4), '#2B2B2B', m([x * 0.9, 0.48, 0.42]))
  }
  for (const [x, z] of [
    [-0.11, 0.18],
    [0.11, 0.18],
    [-0.11, -0.18],
    [0.11, -0.18],
  ]) {
    b.add(new CylinderGeometry(0.035, 0.03, 0.22, 6), hide, m([x, 0.12, z]))
    b.add(new CylinderGeometry(0.033, 0.033, 0.03, 6), '#4A3B30', m([x, 0.015, z]))
  }
  b.add(new CylinderGeometry(0.012, 0.012, 0.22, 4), hide, m([0, 0.3, -0.31], [0.3, 0, 0]))
  return b.build()
}

export const ANIMAL_GEOMETRY: Record<string, BufferGeometry> = {
  chicken: chicken(),
  cow: cow(),
}

/** Wander speed (radians per second along the walking ellipse) and size of each animal type. */
export const ANIMAL_MOTION: Record<string, { speed: number; scale: number; hop: number }> = {
  chicken: { speed: 0.55, scale: 1, hop: 0.03 },
  cow: { speed: 0.12, scale: 0.85, hop: 0 },
}
