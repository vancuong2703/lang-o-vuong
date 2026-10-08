import { useLayoutEffect, useMemo, useRef } from 'react'
import { CylinderGeometry, SphereGeometry, type InstancedMesh, type Matrix4 } from 'three'
import { m, ShapeBuilder } from '../shapes'
import { vertexColorMaterial } from '../materials'
import { useWorld } from '../../state/worldStore'

// Lotus pond decoration (ao sen) on lake parcels.

const LOTUS = (() => {
  const b = new ShapeBuilder()
  b.add(new CylinderGeometry(0.32, 0.32, 0.02, 12), '#5FA34A', m([0, 0.06, 0]))
  b.add(new CylinderGeometry(0.22, 0.22, 0.02, 10), '#6DB257', m([0.4, 0.06, 0.25]))
  b.add(new SphereGeometry(0.09, 10, 8), '#F29BBE', m([0.05, 0.14, 0.02], [0, 0, 0], [1, 0.8, 1]))
  return b.build()
})()

function hash(a: number, b: number): number {
  const s = Math.sin(a * 91.3 + b * 47.7) * 12543.17
  return s - Math.floor(s)
}

export function Lotus() {
  const parcels = useWorld((s) => s.parcels)
  const ref = useRef<InstancedMesh>(null)

  const matrices = useMemo(() => {
    const list: Matrix4[] = []
    for (const p of Object.values(parcels)) {
      if (p.zone !== 'lake') continue
      for (let t = 0; t < 5; t++) {
        const x = p.x * 5 + 0.5 + hash(p.x + t, p.y) * 4
        const z = p.y * 5 + 0.5 + hash(p.y, p.x - t) * 4
        list.push(m([x, 0, z], [0, hash(t, p.x) * 6.28, 0]))
      }
    }
    return list
  }, [parcels])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    matrices.forEach((mat, i) => mesh.setMatrixAt(i, mat))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [matrices])

  if (matrices.length === 0) return null
  return <instancedMesh key={matrices.length} ref={ref} args={[LOTUS, vertexColorMaterial, matrices.length]} />
}
