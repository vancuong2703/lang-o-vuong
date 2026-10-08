import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { MapControls as MapControlsImpl } from 'three-stdlib'
import { CHUNK_PARCELS, PARCEL_PITCH } from '../../logic/grid'
import { useWorld } from '../../state/worldStore'
import { CHUNKS_PER_SIDE } from './mapConstants'

const CHUNK_WORLD = CHUNK_PARCELS * PARCEL_PITCH

/** Twice a second, report the 3x3 chunks around the camera target (realtime listens only to these). */
export function ChunkWatcher() {
  const controls = useThree((s) => s.controls) as MapControlsImpl | null
  const elapsed = useRef(0)
  const lastKey = useRef('')

  useFrame((_, dt) => {
    elapsed.current += dt
    if (elapsed.current < 0.5) return
    elapsed.current = 0
    const t = controls?.target
    if (!t) return
    const cx = Math.floor(t.x / CHUNK_WORLD)
    const cz = Math.floor(t.z / CHUNK_WORLD)
    const keys: string[] = []
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = cx + dx
        const z = cz + dz
        if (x >= 0 && z >= 0 && x < CHUNKS_PER_SIDE && z < CHUNKS_PER_SIDE) keys.push(`${x}:${z}`)
      }
    }
    const signature = keys.join('|')
    if (signature !== lastKey.current) {
      lastKey.current = signature
      useWorld.getState().setVisibleChunks(keys)
    }
  })

  return null
}
