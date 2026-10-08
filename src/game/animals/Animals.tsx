import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Euler, Matrix4, Quaternion, Vector3, type InstancedMesh } from 'three'
import { useCatalog } from '../../state/catalogStore'
import { vertexColorMaterial } from '../materials'
import { PEN_YARD } from '../structures/structureGeometry'
import { useVillageStructures } from '../structures/useVillageStructures'
import { ANIMAL_GEOMETRY, ANIMAL_MOTION } from './animalGeometry'

interface Walker {
  cx: number
  cz: number
  rx: number
  rz: number
  phase: number
}

const matrix = new Matrix4()
const position = new Vector3()
const rotation = new Quaternion()
const euler = new Euler()
const scale = new Vector3()

/** Every animal of one type in the village, walking slow loops in its pen. One draw call per type. */
function AnimalInstances({ animalId, walkers }: { animalId: string; walkers: Walker[] }) {
  const ref = useRef<InstancedMesh>(null)
  const motion = ANIMAL_MOTION[animalId] ?? { speed: 0.3, scale: 1, hop: 0 }

  useFrame(({ clock }) => {
    const mesh = ref.current
    if (!mesh) return
    const t = clock.elapsedTime
    walkers.forEach((w, i) => {
      // Each animal walks its own ellipse; it faces the walking direction (tangent of the ellipse).
      const a = t * motion.speed * (0.8 + (i % 3) * 0.15) + w.phase
      const x = w.cx + Math.cos(a) * w.rx
      const z = w.cz + Math.sin(a) * w.rz
      const yaw = Math.atan2(-Math.sin(a) * w.rx, Math.cos(a) * w.rz)
      const hop = motion.hop * Math.abs(Math.sin(t * 9 + w.phase * 3))
      position.set(x, hop, z)
      rotation.setFromEuler(euler.set(0, yaw, 0))
      scale.setScalar(motion.scale)
      mesh.setMatrixAt(i, matrix.compose(position, rotation, scale))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (!mesh.boundingSphere) mesh.computeBoundingSphere()
  })

  const geometry = ANIMAL_GEOMETRY[animalId]
  if (!geometry || walkers.length === 0) return null
  return (
    <instancedMesh key={walkers.length} ref={ref} args={[geometry, vertexColorMaterial, walkers.length]} castShadow frustumCulled={false} />
  )
}

export function Animals() {
  const structures = useVillageStructures()
  const animalByPen = useCatalog((s) => s.animalByPen)

  const byAnimal = useMemo(() => {
    const groups: Record<string, Walker[]> = {}
    for (const s of structures) {
      const animal = animalByPen[s.typeId]
      const yard = PEN_YARD[s.typeId]
      if (!animal || !yard) continue
      for (let i = 0; i < s.animalCount; i++) {
        // Spread animals over different loop sizes so they do not walk on top of each other.
        const size = 0.35 + ((i * 0.37 + s.id * 0.13) % 1) * 0.65
        // Each animal also gets its own loop center, so the flock spreads over the yard.
        const offsetX = (((i * 0.618 + s.id * 0.31) % 1) - 0.5) * yard.rx
        const offsetZ = (((i * 0.382 + s.id * 0.17) % 1) - 0.5) * yard.rz
        ;(groups[animal.id] ??= []).push({
          cx: s.x + yard.cx + offsetX,
          cz: s.z + yard.cz + offsetZ,
          rx: yard.rx * size,
          rz: yard.rz * size,
          phase: i * 2.399 + s.id,
        })
      }
    }
    return Object.entries(groups)
  }, [structures, animalByPen])

  return (
    <group>
      {byAnimal.map(([animalId, walkers]) => (
        <AnimalInstances key={animalId} animalId={animalId} walkers={walkers} />
      ))}
    </group>
  )
}
