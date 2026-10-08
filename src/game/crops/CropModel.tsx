import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { CropDef } from '../../state/catalogStore'
import type { GrowthStage } from '../../logic/growth'

// Low-poly crops built from basic shapes (GDD 10.1). One model per (crop, stage).
// Phase 3 will switch to InstancedMesh per chunk; this simple version is fine for 12 plots.

const SOIL_TOP = 0.12

function Mat({ color }: { color: string }) {
  return <meshStandardMaterial color={color} flatShading />
}

function Leaf({ color, angle, length = 0.28, tilt = 0.5, y = 0.05 }: { color: string; angle: number; length?: number; tilt?: number; y?: number }) {
  return (
    <group rotation={[0, angle, 0]}>
      <mesh position={[0, y + length * 0.25, length * 0.45]} rotation={[tilt, 0, 0]} scale={[0.12, 0.04, length]}>
        <sphereGeometry args={[1, 6, 4]} />
        <Mat color={color} />
      </mesh>
    </group>
  )
}

function Seed() {
  return (
    <group>
      <mesh position={[0, 0.02, 0]} scale={[0.22, 0.06, 0.22]}>
        <sphereGeometry args={[1, 6, 4]} />
        <Mat color="#7A5232" />
      </mesh>
      <mesh position={[0, 0.07, 0]}>
        <sphereGeometry args={[0.035, 5, 4]} />
        <Mat color="#9BD46A" />
      </mesh>
    </group>
  )
}

function Sprout({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.12, 4]} />
        <Mat color={color} />
      </mesh>
      <Leaf color={color} angle={0} length={0.12} tilt={-0.4} y={0.1} />
      <Leaf color={color} angle={Math.PI} length={0.12} tilt={-0.4} y={0.1} />
    </group>
  )
}

function radial(count: number, render: (angle: number, i: number) => ReactNode) {
  return Array.from({ length: count }, (_, i) => render((i / count) * Math.PI * 2, i))
}

function Leafy({ crop, ripe }: { crop: CropDef; ripe: boolean }) {
  const s = ripe ? 1.3 : 1
  return (
    <group scale={s}>
      {radial(6, (a, i) => <Leaf key={i} color={crop.leafColor} angle={a} tilt={-0.7} length={0.26} />)}
      {ripe && (
        <mesh position={[0, 0.12, 0]} scale={[0.12, 0.14, 0.12]}>
          <sphereGeometry args={[1, 6, 4]} />
          <Mat color={crop.produceColor} />
        </mesh>
      )}
    </group>
  )
}

function Root({ crop, ripe }: { crop: CropDef; ripe: boolean }) {
  return (
    <group>
      {radial(4, (a, i) => <Leaf key={i} color={crop.leafColor} angle={a} tilt={-1.1} length={ripe ? 0.32 : 0.24} y={ripe ? 0.12 : 0.04} />)}
      {ripe && (
        <mesh position={[0, 0.06, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.13, 0.22, 6]} />
          <Mat color={crop.produceColor} />
        </mesh>
      )}
    </group>
  )
}

function Stalk({ crop, ripe }: { crop: CropDef; ripe: boolean }) {
  const height = ripe ? 0.75 : 0.5
  const offsets: [number, number][] = [[-0.15, -0.1], [0.15, -0.05], [0, 0.15]]
  return (
    <group>
      {offsets.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, height / 2, 0]}>
            <cylinderGeometry args={[0.025, 0.035, height, 5]} />
            <Mat color={crop.leafColor} />
          </mesh>
          <Leaf color={crop.leafColor} angle={i * 2.1} length={0.22} tilt={-0.6} y={height * 0.4} />
          {ripe && (
            <mesh position={[0.05, height * 0.75, 0]} rotation={[0, 0, -0.3]} scale={[0.06, 0.14, 0.06]}>
              <sphereGeometry args={[1, 6, 4]} />
              <Mat color={crop.produceColor} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

function Bush({ crop, ripe }: { crop: CropDef; ripe: boolean }) {
  const r = ripe ? 0.28 : 0.22
  const fruits: [number, number, number][] = [[0.2, 0.25, 0.1], [-0.15, 0.32, 0.18], [0.05, 0.4, -0.2], [-0.2, 0.2, -0.1]]
  return (
    <group>
      <mesh position={[0, r, 0]}>
        <icosahedronGeometry args={[r, 0]} />
        <Mat color={crop.leafColor} />
      </mesh>
      {ripe &&
        fruits.map((p, i) => (
          <mesh key={i} position={p}>
            <icosahedronGeometry args={[0.07, 0]} />
            <Mat color={crop.produceColor} />
          </mesh>
        ))}
    </group>
  )
}

function Vine({ crop, ripe }: { crop: CropDef; ripe: boolean }) {
  return (
    <group>
      {radial(5, (a, i) => <Leaf key={i} color={crop.leafColor} angle={a} tilt={-0.15} length={0.3} y={0.02} />)}
      {ripe && (
        <mesh position={[0.05, 0.17, 0.05]} scale={crop.id === 'pumpkin' ? [0.24, 0.17, 0.24] : [0.22, 0.17, 0.28]}>
          <icosahedronGeometry args={[1, 1]} />
          <Mat color={crop.produceColor} />
        </mesh>
      )}
    </group>
  )
}

function Cactus({ crop, ripe }: { crop: CropDef; ripe: boolean }) {
  const h = ripe ? 0.7 : 0.5
  return (
    <group>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[0.12, h, 0.12]} />
        <Mat color={crop.leafColor} />
      </mesh>
      <mesh position={[0.14, h * 0.6, 0]} rotation={[0, 0, -0.9]}>
        <boxGeometry args={[0.08, 0.3, 0.08]} />
        <Mat color={crop.leafColor} />
      </mesh>
      <mesh position={[-0.14, h * 0.45, 0]} rotation={[0, 0, 0.9]}>
        <boxGeometry args={[0.08, 0.3, 0.08]} />
        <Mat color={crop.leafColor} />
      </mesh>
      {ripe &&
        ([[0, h + 0.06, 0], [0.26, h * 0.6 + 0.12, 0], [-0.26, h * 0.45 + 0.12, 0]] as [number, number, number][]).map((p, i) => (
          <mesh key={i} position={p}>
            <icosahedronGeometry args={[0.08, 0]} />
            <Mat color={crop.produceColor} />
          </mesh>
        ))}
    </group>
  )
}

function Grown({ crop, ripe }: { crop: CropDef; ripe: boolean }) {
  switch (crop.shape) {
    case 'leafy':
      return <Leafy crop={crop} ripe={ripe} />
    case 'root':
      return <Root crop={crop} ripe={ripe} />
    case 'stalk':
      return <Stalk crop={crop} ripe={ripe} />
    case 'bush':
      return <Bush crop={crop} ripe={ripe} />
    case 'vine':
      return <Vine crop={crop} ripe={ripe} />
    case 'cactus':
      return <Cactus crop={crop} ripe={ripe} />
  }
}

export function CropModel({ crop, stage, position }: { crop: CropDef; stage: GrowthStage; position: [number, number] }) {
  const group = useRef<Group>(null)

  // Ripe crops bob gently so players notice them.
  useFrame(({ clock }) => {
    if (!group.current) return
    group.current.position.y = stage === 3 ? SOIL_TOP + Math.abs(Math.sin(clock.elapsedTime * 3)) * 0.05 : SOIL_TOP
  })

  return (
    <group ref={group} position={[position[0], SOIL_TOP, position[1]]}>
      {stage === 0 && <Seed />}
      {stage === 1 && <Sprout color={crop.leafColor} />}
      {stage >= 2 && <Grown crop={crop} ripe={stage === 3} />}
    </group>
  )
}
