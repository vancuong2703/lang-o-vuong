import { useLayoutEffect, useMemo, useRef } from 'react'
import { ConeGeometry, CylinderGeometry, IcosahedronGeometry, Matrix4, SphereGeometry, type BufferGeometry, type InstancedMesh } from 'three'
import { m, radial, ShapeBuilder } from '../shapes'
import { vertexColorMaterial } from '../materials'
import { MAP_SIZE } from './mapConstants'
import { useWorld } from '../../state/worldStore'

// Old Vietnamese village vegetation (GDD 10.1):
// - a bamboo hedge (lũy tre làng) around the whole village,
// - round leafy trees on forest parcels.
// Each tree type is one merged geometry drawn with one InstancedMesh.

function bambooClump(): BufferGeometry {
  const b = new ShapeBuilder()
  radial(7, (a, i) => {
    const r = 0.25 + (i % 3) * 0.08
    const h = 2.2 + (i % 4) * 0.35
    const lean = 0.12 + (i % 2) * 0.08
    const base = m([Math.cos(a) * r, 0, Math.sin(a) * r], [Math.sin(a) * lean, 0, -Math.cos(a) * lean])
    b.add(new CylinderGeometry(0.035, 0.05, h, 6), '#A3BE5C', base.clone().multiply(m([0, h / 2, 0])))
    b.add(new SphereGeometry(1, 8, 6), i % 2 ? '#7FAE4A' : '#8DBB55', base.clone().multiply(m([0, h, 0], [0, a, 0], [0.45, 0.28, 0.3])))
  })
  b.add(new SphereGeometry(1, 10, 8), '#88B552', m([0, 0.55, 0], [0, 0, 0], [0.75, 0.55, 0.75]))
  return b.build()
}

function roundTree(): BufferGeometry {
  const b = new ShapeBuilder()
  b.add(new CylinderGeometry(0.1, 0.16, 0.9, 7), '#8A6446', m([0, 0.45, 0]))
  b.add(new IcosahedronGeometry(0.75, 2), '#6FAA4C', m([0, 1.25, 0]))
  b.add(new IcosahedronGeometry(0.55, 2), '#7FBA58', m([0.35, 1.6, 0.15]))
  b.add(new IcosahedronGeometry(0.5, 2), '#65A045', m([-0.35, 1.45, -0.2]))
  return b.build()
}

function arecaPalm(): BufferGeometry {
  const b = new ShapeBuilder()
  b.add(new CylinderGeometry(0.05, 0.07, 2.6, 6), '#B7A27E', m([0, 1.3, 0]))
  radial(7, (a) => b.leaf('#6FA84A', a, 0.75, -0.25, 2.45))
  b.add(new ConeGeometry(0.09, 0.2, 6), '#5E8F3A', m([0, 2.62, 0]))
  return b.build()
}

const GEOMETRIES = { bamboo: bambooClump(), round: roundTree(), palm: arecaPalm() }
type TreeKind = keyof typeof GEOMETRIES

/** Deterministic pseudo-random number in [0, 1) so trees stay in place between reloads. */
function hash(a: number, b: number): number {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return s - Math.floor(s)
}

function TreeInstances({ kind, matrices }: { kind: TreeKind; matrices: Matrix4[] }) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    matrices.forEach((mat, i) => mesh.setMatrixAt(i, mat))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [matrices])
  if (matrices.length === 0) return null
  return <instancedMesh key={matrices.length} ref={ref} args={[GEOMETRIES[kind], vertexColorMaterial, matrices.length]} castShadow />
}

export function Trees() {
  const parcels = useWorld((s) => s.parcels)

  const byKind = useMemo(() => {
    const out: Record<TreeKind, Matrix4[]> = { bamboo: [], round: [], palm: [] }
    const place = (kind: TreeKind, x: number, z: number, seed: number, baseScale = 1) => {
      const s = baseScale * (0.8 + hash(seed, x) * 0.5)
      out[kind].push(m([x, 0, z], [0, hash(z, seed) * Math.PI * 2, 0], [s, s, s]))
    }

    // Bamboo hedge ring just outside the map.
    for (let i = -1; i <= MAP_SIZE; i++) {
      for (const [px, py] of [[i, -1], [i, MAP_SIZE], [-1, i], [MAP_SIZE, i]] as const) {
        for (let t = 0; t < 2; t++) {
          place('bamboo', px * 5 + 1 + t * 2.5 + hash(px, py + t) * 0.8, py * 5 + 1 + t * 2 + hash(py, px - t) * 0.8, px * 31 + py + t, 1.1)
        }
      }
    }

    // Forest parcels: mostly round trees, some areca palms.
    for (const p of Object.values(parcels)) {
      if (p.zone !== 'forest') continue
      for (let t = 0; t < 3; t++) {
        const x = p.x * 5 + 0.6 + hash(p.x, p.y + t * 7) * 3.2
        const z = p.y * 5 + 0.6 + hash(p.y + t * 13, p.x) * 3.2
        place(hash(p.x + t, p.y) > 0.75 ? 'palm' : 'round', x, z, p.x * 7 + p.y * 3 + t)
      }
    }
    return out
  }, [parcels])

  return (
    <group>
      <TreeInstances kind="bamboo" matrices={byKind.bamboo} />
      <TreeInstances kind="round" matrices={byKind.round} />
      <TreeInstances kind="palm" matrices={byKind.palm} />
    </group>
  )
}
