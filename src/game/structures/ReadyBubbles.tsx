import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { useCatalog } from '../../state/catalogStore'
import { useClock } from '../../state/clock'
import { useGame } from '../../state/gameStore'
import { useWorld } from '../../state/worldStore'
import { quadrantOrigin } from '../../logic/grid'

// A floating bubble above MY pens/processors that have something ready to collect (GDD 10.1).

/** Height of the bubble: above every roof so it is never hidden. */
const BUBBLE_Y = 1.75

function Bubble({ x, z, color, seed }: { x: number; z: number; color: string; seed: number }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = BUBBLE_Y + Math.sin(clock.elapsedTime * 2.5 + seed) * 0.08
  })
  return (
    <group ref={ref} position={[x, BUBBLE_Y, z]}>
      <mesh>
        <sphereGeometry args={[0.24, 16, 12]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.14]}>
        <sphereGeometry args={[0.15, 14, 10]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.27, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.06, 0.12, 8]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.6} />
      </mesh>
    </group>
  )
}

export function ReadyBubbles() {
  const structures = useGame((s) => s.structures)
  const parcels = useWorld((s) => s.parcels)
  const animalByPen = useCatalog((s) => s.animalByPen)
  const recipesById = useCatalog((s) => s.recipesById)
  const itemsById = useCatalog((s) => s.itemsById)

  // "id:item" for every structure with something ready; recomputed with the clock, re-renders only on change.
  const readyKey = useClock((s) =>
    structures
      .map((st) => {
        const animal = st.animals.find((a) => a.ready_at && Date.parse(a.ready_at) <= s.now)
        if (animal) return `${st.id}:${animalByPen[st.type_id]?.product_item_id ?? ''}`
        const job = st.jobs.find((j) => Date.parse(j.ready_at) <= s.now)
        if (job) return `${st.id}:${recipesById[job.recipe_id]?.output_item_id ?? ''}`
        return ''
      })
      .filter(Boolean)
      .join('|'),
  )

  if (!readyKey) return null
  return (
    <group>
      {readyKey.split('|').map((entry) => {
        const [id, itemId] = entry.split(':')
        const st = structures.find((s) => s.id === Number(id))
        const p = st ? parcels[st.parcel_id] : undefined
        if (!st || !p) return null
        const [x, z] = quadrantOrigin(p.x, p.y, st.quadrant)
        return <Bubble key={entry} x={x + 1} z={z + 1} color={itemsById[itemId]?.color ?? '#F1E3C8'} seed={st.id} />
      })}
    </group>
  )
}
