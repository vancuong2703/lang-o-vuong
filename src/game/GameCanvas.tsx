import { useEffect, useRef } from 'react'
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber'
import { MapControls } from '@react-three/drei'
import type { MapControls as MapControlsImpl } from 'three-stdlib'
import { HomeParcel } from './world/HomeParcel'
import { Scenery } from './world/Scenery'
import { worldToPlot } from '../logic/grid'
import { useGame } from '../state/gameStore'

const PARCEL_CENTER: [number, number, number] = [2, 0, 2]
/** Pointer moved more than this (px) between down and up = drag, not a tap. */
const DRAG_THRESHOLD = 8

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

/** Moves the camera further back on portrait screens so the whole parcel fits. */
function CameraFit() {
  const camera = useThree((s) => s.camera)
  const aspect = useThree((s) => s.size.width / s.size.height)

  useEffect(() => {
    const zoom = aspect < 1 ? 1.45 : 1
    camera.position.set(PARCEL_CENTER[0] + 6 * zoom, 8 * zoom, PARCEL_CENTER[2] + 8 * zoom)
  }, [camera, aspect])

  return null
}

/** Invisible plane at plot height: every tap is converted to a plot with math (ROADMAP 4.2). */
function PickPlane() {
  const tapPlot = useGame((s) => s.tapPlot)
  const clearSelection = useGame((s) => s.clearSelection)

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > DRAG_THRESHOLD) return
    const coord = worldToPlot(e.point.x, e.point.z)
    if (!coord || coord.parcelX !== 0 || coord.parcelY !== 0) {
      clearSelection()
      return
    }
    tapPlot(coord.plotX, coord.plotY)
  }

  return (
    <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]} onClick={onClick}>
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

export function GameCanvas() {
  const controls = useRef<MapControlsImpl>(null)

  return (
    <Canvas className="absolute! inset-0" camera={{ position: [8, 8, 10], fov: 45 }} dpr={[1, 1.5]}>
      <color attach="background" args={['#BFE6FF']} />
      <hemisphereLight args={['#ffffff', '#8CC56B', 1.0]} />
      <directionalLight position={[6, 12, 4]} intensity={1.3} />

      {/* grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2, 0, 2]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#8CC56B" />
      </mesh>

      <CameraFit />
      <Scenery />
      <HomeParcel />
      <PickPlane />

      <MapControls
        makeDefault
        target={PARCEL_CENTER}
        minDistance={4}
        maxDistance={22}
        minPolarAngle={0.35}
        maxPolarAngle={1.15}
        onChange={() => {
          // Keep the camera target near the farm so players cannot get lost.
          const target = controls.current?.target
          if (!target) return
          target.x = clamp(target.x, -10, 14)
          target.z = clamp(target.z, -10, 14)
        }}
        ref={controls}
      />
    </Canvas>
  )
}
