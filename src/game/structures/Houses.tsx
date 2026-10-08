import { Html } from '@react-three/drei'
import { parcelOrigin } from '../../logic/grid'
import { landTitle } from '../../logic/titles'
import { useGame } from '../../state/gameStore'
import { useWorld } from '../../state/worldStore'
import { vertexColorMaterial } from '../materials'
import { farmhouseGeometry } from './houseGeometry'

const MY_HOUSE = farmhouseGeometry('#B5543C')
const OTHER_HOUSE = farmhouseGeometry('#9C5A46')

/** Every family's farmhouse with a floating name tag (estate name + land title). */
export function Houses() {
  const players = useWorld((s) => s.players)
  const parcels = useWorld((s) => s.parcels)
  const myId = useGame((s) => s.profile?.id)

  const landCount: Record<string, number> = {}
  for (const p of Object.values(parcels)) if (p.ownerId) landCount[p.ownerId] = (landCount[p.ownerId] ?? 0) + 1

  return (
    <group>
      {Object.values(players).map((player) => {
        const home = parcels[player.home_parcel_id]
        if (!home) return null
        const [ox, oz] = parcelOrigin(home.x, home.y)
        const mine = player.id === myId
        return (
          <group key={player.id} position={[ox, 0, oz]}>
            <mesh geometry={mine ? MY_HOUSE : OTHER_HOUSE} material={vertexColorMaterial} castShadow receiveShadow />
            <Html position={[1, 1.75, 0.6]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
              <div
                className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-md ${
                  mine ? 'bg-[#E9B949] text-[#3B2F2A]' : 'bg-white/90 text-[#3B2F2A]'
                }`}
              >
                {player.farm_name} · {landTitle(landCount[player.id] ?? 1)}
              </div>
            </Html>
          </group>
        )
      })}
    </group>
  )
}
