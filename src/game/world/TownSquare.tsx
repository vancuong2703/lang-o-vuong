import { Html } from '@react-three/drei'
import { MAP_CENTER } from './mapConstants'

// Placeholder village center (GDD 6.3). Buildings become interactive in later phases.

function Label({ text, y }: { text: string; y: number }) {
  return (
    <Html position={[0, y, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      <div className="whitespace-nowrap rounded-full bg-[#3B2F2A]/80 px-2 py-0.5 text-[11px] font-bold text-white">{text}</div>
    </Html>
  )
}

function Building({ position, wall, roof, label }: { position: [number, number, number]; wall: string; roof: string; label: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[4, 2, 3]} />
        <meshStandardMaterial color={wall} flatShading />
      </mesh>
      <mesh position={[0, 2.6, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1.45, 1, 1.05]}>
        <coneGeometry args={[2.2, 1.2, 4]} />
        <meshStandardMaterial color={roof} flatShading />
      </mesh>
      <Label text={label} y={3.8} />
    </group>
  )
}

export function TownSquare() {
  const c = MAP_CENTER
  return (
    <group>
      {/* fountain */}
      <group position={[c, 0, c]}>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[2, 2.2, 0.5, 10]} />
          <meshStandardMaterial color="#C9C2B5" flatShading />
        </mesh>
        <mesh position={[0, 0.48, 0]}>
          <cylinderGeometry args={[1.7, 1.7, 0.1, 10]} />
          <meshStandardMaterial color="#6EC6E6" flatShading />
        </mesh>
        <mesh position={[0, 1, 0]}>
          <cylinderGeometry args={[0.25, 0.35, 1.2, 6]} />
          <meshStandardMaterial color="#C9C2B5" flatShading />
        </mesh>
        <Label text="Quảng trường làng" y={2.2} />
      </group>
      <Building position={[c - 8, 0, c - 8]} wall="#F4E6C8" roof="#E06D5A" label="Cửa hàng làng" />
      <Building position={[c + 8, 0, c - 8]} wall="#EFE3D0" roof="#4E9F3D" label="Bảng đơn hàng (sắp có)" />
      <Building position={[c - 8, 0, c + 8]} wall="#EFE3D0" roof="#F2B33D" label="Bảng xếp hạng (sắp có)" />
      <Building position={[c + 8, 0, c + 8]} wall="#EDE0F0" roof="#8A6BB8" label="Chợ & đấu giá (sau MVP)" />
    </group>
  )
}
