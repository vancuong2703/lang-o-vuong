import { useLayoutEffect, useRef } from 'react'
import { Matrix4, type InstancedMesh } from 'three'
import type { CropDef } from '../../state/catalogStore'
import type { GrowthStage } from '../../logic/growth'
import { vertexColorMaterial } from '../materials'
import { cropGeometry } from './cropGeometry'

const SOIL_TOP = 0.12
const tmp = new Matrix4()

/** All plots of one crop at one stage inside a chunk: one InstancedMesh, one draw call. */
export function CropInstances({ crop, stage, positions }: { crop: CropDef; stage: GrowthStage; positions: [number, number][] }) {
  const ref = useRef<InstancedMesh>(null)
  const geometry = cropGeometry(crop, stage)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    positions.forEach(([x, z], i) => mesh.setMatrixAt(i, tmp.makeTranslation(x, SOIL_TOP, z)))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [positions])

  return <instancedMesh key={positions.length} ref={ref} args={[geometry, vertexColorMaterial, positions.length]} />
}
