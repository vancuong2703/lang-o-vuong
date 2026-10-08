import { useLayoutEffect, useRef } from 'react'
import { Color, Matrix4, Quaternion, Vector3, type InstancedMesh } from 'three'
import { instanceColorMaterial, unitBox } from '../materials'

export interface BoxInstance {
  position: [number, number, number]
  scale: [number, number, number]
  color: string
}

const tmpMatrix = new Matrix4()
const tmpColor = new Color()
const noRotation = new Quaternion()

/** Many colored boxes in ONE draw call. */
export function InstancedBoxes({ boxes }: { boxes: BoxInstance[] }) {
  const ref = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    boxes.forEach((b, i) => {
      tmpMatrix.compose(new Vector3(...b.position), noRotation, new Vector3(...b.scale))
      mesh.setMatrixAt(i, tmpMatrix)
      mesh.setColorAt(i, tmpColor.set(b.color))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [boxes])

  if (boxes.length === 0) return null
  // `key` forces a new mesh when the count changes (an InstancedMesh cannot grow).
  return <instancedMesh key={boxes.length} ref={ref} args={[unitBox, instanceColorMaterial, boxes.length]} />
}
