import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function App() {
  return (
    <Canvas camera={{ position: [8, 8, 8], fov: 45 }} dpr={[1, 1.5]}>
      <color attach="background" args={['#BFE6FF']} />
      <hemisphereLight args={['#ffffff', '#8CC56B', 0.9]} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />

      {/* Grass: 10x10 plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#8CC56B" flatShading />
      </mesh>

      {/* One soil plot */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[1, 0.3, 1]} />
        <meshStandardMaterial color="#9C6B44" flatShading />
      </mesh>

      <OrbitControls maxPolarAngle={Math.PI / 2.2} minDistance={3} maxDistance={20} />
    </Canvas>
  )
}

export default App
