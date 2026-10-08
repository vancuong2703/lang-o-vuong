import { useLayoutEffect, useMemo, useRef } from 'react'
import { Matrix4, type InstancedMesh } from 'three'
import { vertexColorMaterial } from '../materials'
import { structureGeometry } from './structureGeometry'
import { useVillageStructures, type PlacedStructure } from './useVillageStructures'

const tmp = new Matrix4()

function StructureInstances({ typeId, items }: { typeId: string; items: PlacedStructure[] }) {
  const ref = useRef<InstancedMesh>(null)
  const geometry = structureGeometry(typeId)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    items.forEach((s, i) => mesh.setMatrixAt(i, tmp.makeTranslation(s.x, 0, s.z)))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [items])

  if (!geometry || items.length === 0) return null
  return <instancedMesh key={items.length} ref={ref} args={[geometry, vertexColorMaterial, items.length]} castShadow receiveShadow />
}

/** All pens and processors in the village: one InstancedMesh (one draw call) per structure type. */
export function Structures() {
  const structures = useVillageStructures()
  const byType = useMemo(() => {
    const groups: Record<string, PlacedStructure[]> = {}
    for (const s of structures) (groups[s.typeId] ??= []).push(s)
    return Object.entries(groups)
  }, [structures])

  return (
    <group>
      {byType.map(([typeId, items]) => (
        <StructureInstances key={typeId} typeId={typeId} items={items} />
      ))}
    </group>
  )
}
