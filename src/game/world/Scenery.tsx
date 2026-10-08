// Decorative low-poly trees and rocks around the farm (no gameplay).

const TREES: [number, number, number][] = [
  [-3, -2, 1.1], [-4, 3, 0.9], [-2.5, 7, 1.2], [8, -2.5, 1], [9, 5, 1.3],
  [7.5, 9, 0.9], [2, -4, 1], [1, 9.5, 1.1], [-5.5, 0.5, 0.8], [11, 1, 1],
]
const ROCKS: [number, number][] = [[6.5, 1], [-1.8, 5], [4.5, -2.2], [6, 7.2]]

function Tree({ x, z, s }: { x: number; z: number; s: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.6, 5]} />
        <meshStandardMaterial color="#8A5A3B" flatShading />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <coneGeometry args={[0.55, 1.0, 6]} />
        <meshStandardMaterial color="#4E9F3D" flatShading />
      </mesh>
      <mesh position={[0, 1.35, 0]}>
        <coneGeometry args={[0.4, 0.7, 6]} />
        <meshStandardMaterial color="#5DB34A" flatShading />
      </mesh>
    </group>
  )
}

export function Scenery() {
  return (
    <group>
      {TREES.map(([x, z, s], i) => (
        <Tree key={i} x={x} z={z} s={s} />
      ))}
      {ROCKS.map(([x, z], i) => (
        <mesh key={`r${i}`} position={[x, 0.1, z]} scale={[0.3, 0.2, 0.25]}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#A7A9A4" flatShading />
        </mesh>
      ))}
    </group>
  )
}
