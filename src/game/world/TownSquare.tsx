import { Html } from '@react-three/drei'
import { MAP_CENTER } from './mapConstants'
import { vertexColorMaterial } from '../materials'
import { banyanAndWellGeometry, communalHouseGeometry, marketGeometry } from '../structures/houseGeometry'

// Village center (GDD 6.3): communal house, banyan tree + well, market. Interactive in later phases.

const COMMUNAL_HOUSE = communalHouseGeometry()
const MARKET = marketGeometry()
const BANYAN = banyanAndWellGeometry()

function Label({ text, position }: { text: string; position: [number, number, number] }) {
  return (
    <Html position={position} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      <div className="whitespace-nowrap rounded-full bg-[#5A3B2A]/85 px-2.5 py-0.5 text-[11px] font-bold text-[#FFF3D6] shadow-md">{text}</div>
    </Html>
  )
}

export function TownSquare() {
  const c = MAP_CENTER
  return (
    <group>
      <group position={[c, 0, c - 7]}>
        <mesh geometry={COMMUNAL_HOUSE} material={vertexColorMaterial} castShadow receiveShadow />
        <Label text="Đình làng" position={[0, 4.4, 0]} />
      </group>
      <group position={[c - 8, 0, c + 6]}>
        <mesh geometry={BANYAN} material={vertexColorMaterial} castShadow receiveShadow />
        <Label text="Cây đa · Giếng làng" position={[0, 5.4, 0]} />
      </group>
      <group position={[c + 8, 0, c + 6]}>
        <mesh geometry={MARKET} material={vertexColorMaterial} castShadow receiveShadow />
        <Label text="Chợ làng" position={[0, 2.4, 0]} />
      </group>
    </group>
  )
}
