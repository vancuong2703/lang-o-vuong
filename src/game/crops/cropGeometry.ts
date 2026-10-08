import {
  BoxGeometry,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Euler,
  Float32BufferAttribute,
  IcosahedronGeometry,
  Matrix4,
  Quaternion,
  SphereGeometry,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { CropDef } from '../../state/catalogStore'
import type { GrowthStage } from '../../logic/growth'

// Each (crop, stage) becomes ONE merged geometry with vertex colors, so a whole chunk of
// the same crop at the same stage is drawn with one InstancedMesh = one draw call (ROADMAP 4.4).

type Vec3 = [number, number, number]

const tmpQ = new Quaternion()

function m(position: Vec3, rotation: Vec3 = [0, 0, 0], scale: Vec3 = [1, 1, 1]): Matrix4 {
  return new Matrix4().compose(new Vector3(...position), tmpQ.setFromEuler(new Euler(...rotation)), new Vector3(...scale))
}

function rotY(angle: number): Matrix4 {
  return new Matrix4().makeRotationY(angle)
}

class Builder {
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

  leaf(color: string, angle: number, length = 0.28, tilt = 0.5, y = 0.05, parent = new Matrix4()) {
    const local = m([0, y + length * 0.25, length * 0.45], [tilt, 0, 0], [0.12, 0.04, length])
    this.add(new SphereGeometry(1, 6, 4), color, parent.clone().multiply(rotY(angle)).multiply(local))
  }

  build(): BufferGeometry {
    const merged = mergeGeometries(this.parts)
    merged.computeVertexNormals()
    merged.computeBoundingSphere()
    return merged
  }
}

function radial(count: number, fn: (angle: number, i: number) => void) {
  for (let i = 0; i < count; i++) fn((i / count) * Math.PI * 2, i)
}

function seed(b: Builder) {
  b.add(new SphereGeometry(1, 6, 4), '#7A5232', m([0, 0.02, 0], [0, 0, 0], [0.22, 0.06, 0.22]))
  b.add(new SphereGeometry(0.035, 5, 4), '#9BD46A', m([0, 0.07, 0]))
}

function sprout(b: Builder, color: string) {
  b.add(new CylinderGeometry(0.015, 0.015, 0.12, 4), color, m([0, 0.06, 0]))
  b.leaf(color, 0, 0.12, -0.4, 0.1)
  b.leaf(color, Math.PI, 0.12, -0.4, 0.1)
}

function grown(b: Builder, crop: CropDef, ripe: boolean) {
  const { leafColor: leaf, produceColor: produce } = crop
  switch (crop.shape) {
    case 'leafy': {
      const s = ripe ? 1.3 : 1
      const parent = new Matrix4().makeScale(s, s, s)
      radial(6, (a) => b.leaf(leaf, a, 0.26, -0.7, 0.05, parent))
      if (ripe) b.add(new SphereGeometry(1, 6, 4), produce, parent.clone().multiply(m([0, 0.12, 0], [0, 0, 0], [0.12, 0.14, 0.12])))
      break
    }
    case 'root':
      radial(4, (a) => b.leaf(leaf, a, ripe ? 0.32 : 0.24, -1.1, ripe ? 0.12 : 0.04))
      if (ripe) b.add(new ConeGeometry(0.13, 0.22, 6), produce, m([0, 0.06, 0], [Math.PI, 0, 0]))
      break
    case 'stalk': {
      const h = ripe ? 0.75 : 0.5
      const offsets: [number, number][] = [[-0.15, -0.1], [0.15, -0.05], [0, 0.15]]
      offsets.forEach(([x, z], i) => {
        const at = new Matrix4().makeTranslation(x, 0, z)
        b.add(new CylinderGeometry(0.025, 0.035, h, 5), leaf, at.clone().multiply(m([0, h / 2, 0])))
        b.leaf(leaf, i * 2.1, 0.22, -0.6, h * 0.4, at)
        if (ripe) b.add(new SphereGeometry(1, 6, 4), produce, at.clone().multiply(m([0.05, h * 0.75, 0], [0, 0, -0.3], [0.06, 0.14, 0.06])))
      })
      break
    }
    case 'bush': {
      const r = ripe ? 0.28 : 0.22
      b.add(new IcosahedronGeometry(r, 0), leaf, m([0, r, 0]))
      if (ripe) {
        const fruits: Vec3[] = [[0.2, 0.25, 0.1], [-0.15, 0.32, 0.18], [0.05, 0.4, -0.2], [-0.2, 0.2, -0.1]]
        fruits.forEach((p) => b.add(new IcosahedronGeometry(0.07, 0), produce, m(p)))
      }
      break
    }
    case 'vine':
      radial(5, (a) => b.leaf(leaf, a, 0.3, -0.15, 0.02))
      if (ripe) {
        const scale: Vec3 = crop.id === 'pumpkin' ? [0.24, 0.17, 0.24] : [0.22, 0.17, 0.28]
        b.add(new IcosahedronGeometry(1, 1), produce, m([0.05, 0.17, 0.05], [0, 0, 0], scale))
      }
      break
    case 'cactus': {
      const h = ripe ? 0.7 : 0.5
      b.add(new BoxGeometry(0.12, h, 0.12), leaf, m([0, h / 2, 0]))
      b.add(new BoxGeometry(0.08, 0.3, 0.08), leaf, m([0.14, h * 0.6, 0], [0, 0, -0.9]))
      b.add(new BoxGeometry(0.08, 0.3, 0.08), leaf, m([-0.14, h * 0.45, 0], [0, 0, 0.9]))
      if (ripe) {
        const fruits: Vec3[] = [[0, h + 0.06, 0], [0.26, h * 0.6 + 0.12, 0], [-0.26, h * 0.45 + 0.12, 0]]
        fruits.forEach((p) => b.add(new IcosahedronGeometry(0.08, 0), produce, m(p)))
      }
      break
    }
  }
}

const cache = new Map<string, BufferGeometry>()

/** Cached merged geometry for a crop at a growth stage. */
export function cropGeometry(crop: CropDef, stage: GrowthStage): BufferGeometry {
  const cacheKey = `${crop.id}:${stage}`
  let geometry = cache.get(cacheKey)
  if (!geometry) {
    const b = new Builder()
    if (stage === 0) seed(b)
    else if (stage === 1) sprout(b, crop.leafColor)
    else grown(b, crop, stage === 3)
    geometry = b.build()
    cache.set(cacheKey, geometry)
  }
  return geometry
}
