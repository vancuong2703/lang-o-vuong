import { BufferGeometry, Color, Euler, Float32BufferAttribute, Matrix4, Quaternion, SphereGeometry, Vector3 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// Build one merged geometry with vertex colors from many simple shapes.
// One merged geometry + InstancedMesh = many objects in a single draw call (ROADMAP 4.4).

export type Vec3 = [number, number, number]

const tmpQ = new Quaternion()

/** Transform matrix from position, rotation (radians) and scale. */
export function m(position: Vec3, rotation: Vec3 = [0, 0, 0], scale: Vec3 = [1, 1, 1]): Matrix4 {
  return new Matrix4().compose(new Vector3(...position), tmpQ.setFromEuler(new Euler(...rotation)), new Vector3(...scale))
}

export function rotY(angle: number): Matrix4 {
  return new Matrix4().makeRotationY(angle)
}

export function radial(count: number, fn: (angle: number, i: number) => void) {
  for (let i = 0; i < count; i++) fn((i / count) * Math.PI * 2, i)
}

export class ShapeBuilder {
  parts: BufferGeometry[] = []

  add(geometry: BufferGeometry, color: string, matrix: Matrix4) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry
    g.deleteAttribute('uv')
    g.applyMatrix4(matrix)
    const c = new Color(color)
    const colors = new Float32Array(g.attributes.position.count * 3)
    for (let i = 0; i < colors.length; i += 3) colors.set([c.r, c.g, c.b], i)
    g.setAttribute('color', new Float32BufferAttribute(colors, 3))
    this.parts.push(g)
  }

  /** A flattened ellipsoid leaf pointing outwards at `angle`. */
  leaf(color: string, angle: number, length = 0.28, tilt = 0.5, y = 0.05, parent = new Matrix4()) {
    const local = m([0, y + length * 0.25, length * 0.45], [tilt, 0, 0], [0.12, 0.04, length])
    this.add(new SphereGeometry(1, 10, 8), color, parent.clone().multiply(rotY(angle)).multiply(local))
  }

  build(): BufferGeometry {
    // Keep each part's own normals (applyMatrix4 transformed them): spheres stay smooth and round.
    const merged = mergeGeometries(this.parts)
    merged.computeBoundingSphere()
    return merged
  }
}
