import { useLayoutEffect, useMemo, useRef } from 'react'
import { ConeGeometry, CylinderGeometry, Matrix4, MeshStandardMaterial, type InstancedMesh } from 'three'
import { MAP_SIZE } from './mapConstants'
import { useWorld } from '../../state/worldStore'

// Trees on forest parcels and a ring of trees around the map. 3 draw calls for all trees.

const trunkGeo = new CylinderGeometry(0.08, 0.12, 0.6, 5)
const lowerGeo = new ConeGeometry(0.55, 1.0, 6)
const upperGeo = new ConeGeometry(0.4, 0.7, 6)
const trunkMat = new MeshStandardMaterial({ color: '#8A5A3B', flatShading: true })
const lowerMat = new MeshStandardMaterial({ color: '#4E9F3D', flatShading: true })
const upperMat = new MeshStandardMaterial({ color: '#5DB34A', flatShading: true })

/** Deterministic pseudo-random number in [0, 1) so trees stay in place between reloads. */
function hash(a: number, b: number): number {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return s - Math.floor(s)
}

function Layer({ geometry, material, matrices, y }: { geometry: ConeGeometry | CylinderGeometry; material: MeshStandardMaterial; matrices: Matrix4[]; y: number }) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const lift = new Matrix4().makeTranslation(0, y, 0)
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m.clone().multiply(lift)))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [matrices, y])
  return <instancedMesh key={matrices.length} ref={ref} args={[geometry, material, matrices.length]} />
}

export function Forest() {
  const parcels = useWorld((s) => s.parcels)

  const matrices = useMemo(() => {
    const spots: [number, number][] = []
    for (const p of Object.values(parcels)) {
      if (p.zone === 'forest') spots.push([p.x, p.y])
    }
    for (let i = -1; i <= MAP_SIZE; i++) spots.push([i, -1], [i, MAP_SIZE], [-1, i], [MAP_SIZE, i])

    const list: Matrix4[] = []
    for (const [px, py] of spots) {
      for (let t = 0; t < 3; t++) {
        const x = px * 5 + 0.5 + hash(px, py + t * 7) * 4
        const z = py * 5 + 0.5 + hash(py + t * 13, px) * 4
        const s = 0.8 + hash(px + t, py - t) * 0.6
        list.push(new Matrix4().makeTranslation(x, 0, z).multiply(new Matrix4().makeScale(s, s, s)))
      }
    }
    return list
  }, [parcels])

  return (
    <group>
      <Layer geometry={trunkGeo} material={trunkMat} matrices={matrices} y={0.3} />
      <Layer geometry={lowerGeo} material={lowerMat} matrices={matrices} y={0.95} />
      <Layer geometry={upperGeo} material={upperMat} matrices={matrices} y={1.35} />
    </group>
  )
}
