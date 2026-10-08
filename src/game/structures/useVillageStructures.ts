import { useMemo } from 'react'
import { quadrantOrigin } from '../../logic/grid'
import { useGame } from '../../state/gameStore'
import { useWorld } from '../../state/worldStore'

export interface PlacedStructure {
  id: number
  typeId: string
  level: number
  /** World position of the quadrant's corner (the structure's local origin). */
  x: number
  z: number
  animalCount: number
  mine: boolean
}

/** Every structure in the village: mine from gameStore (always fresh), others from worldStore. */
export function useVillageStructures(): PlacedStructure[] {
  const parcels = useWorld((s) => s.parcels)
  const others = useWorld((s) => s.structuresByParcel)
  const mine = useGame((s) => s.structures)
  const myId = useGame((s) => s.profile?.id)

  return useMemo(() => {
    const list: PlacedStructure[] = []
    for (const s of mine) {
      const p = parcels[s.parcel_id]
      if (!p) continue
      const [x, z] = quadrantOrigin(p.x, p.y, s.quadrant)
      list.push({ id: s.id, typeId: s.type_id, level: s.level, x, z, animalCount: s.animals.length, mine: true })
    }
    for (const [parcelId, structures] of Object.entries(others)) {
      const p = parcels[Number(parcelId)]
      if (!p || p.ownerId === myId) continue
      for (const s of structures) {
        const [x, z] = quadrantOrigin(p.x, p.y, s.quadrant)
        list.push({ id: s.id, typeId: s.type_id, level: s.level, x, z, animalCount: s.animal_count, mine: false })
      }
    }
    return list
  }, [parcels, others, mine, myId])
}
