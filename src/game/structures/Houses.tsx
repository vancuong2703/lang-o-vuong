import { Html } from '@react-three/drei'
import { parcelOrigin } from '../../logic/grid'
import { useGame } from '../../state/gameStore'
import { useWorld } from '../../state/worldStore'

const WOOD = '#A9744F'

/** House + barn, drawn in quadrant Q0 of a home parcel (local coordinates 0..2). */
function House({ roof }: { roof: string }) {
  return (
    <group position={[0.8, 0, 0.9]}>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[1.2, 0.9, 1.0]} />
        <meshStandardMaterial color="#F4E6C8" flatShading />
      </mesh>
      <mesh position={[0, 1.2, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.95, 0.6, 4]} />
        <meshStandardMaterial color={roof} flatShading />
      </mesh>
      <mesh position={[0, 0.25, 0.51]}>
        <boxGeometry args={[0.28, 0.5, 0.02]} />
        <meshStandardMaterial color={WOOD} flatShading />
      </mesh>
      <group position={[0.85, 0, 0.75]}>
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#C0473A" flatShading />
        </mesh>
        <mesh position={[0, 0.58, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[0.4, 0.25, 4]} />
          <meshStandardMaterial color="#8A3A30" flatShading />
        </mesh>
      </group>
    </group>
  )
}

/** Every player's house with a floating name tag. */
export function Houses() {
  const players = useWorld((s) => s.players)
  const parcels = useWorld((s) => s.parcels)
  const myId = useGame((s) => s.profile?.id)

  return (
    <group>
      {Object.values(players).map((player) => {
        const home = parcels[player.home_parcel_id]
        if (!home) return null
        const [ox, oz] = parcelOrigin(home.x, home.y)
        const mine = player.id === myId
        return (
          <group key={player.id} position={[ox, 0, oz]}>
            <House roof={mine ? '#E06D5A' : '#7C8FB8'} />
            <Html position={[0.8, 1.9, 0.9]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
              <div
                className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold shadow ${
                  mine ? 'bg-[#F2B33D] text-[#3B2F2A]' : 'bg-white/90 text-[#3B2F2A]'
                }`}
              >
                {player.farm_name} · Cấp {player.level}
              </div>
            </Html>
          </group>
        )
      })}
    </group>
  )
}
