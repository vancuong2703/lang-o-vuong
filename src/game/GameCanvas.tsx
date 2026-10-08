import { useEffect, useRef } from 'react'
import type { DirectionalLight } from 'three'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { MapControls } from '@react-three/drei'
import type { MapControls as MapControlsImpl } from 'three-stdlib'
import { Chunk } from './world/Chunk'
import { Roads } from './world/Roads'
import { ChunkWatcher } from './world/ChunkWatcher'
import { Trees } from './world/Trees'
import { Lotus } from './world/Lotus'
import { TownSquare } from './world/TownSquare'
import { SelectionMarkers } from './world/SelectionMarkers'
import { Houses } from './structures/Houses'
import { Structures } from './structures/Structures'
import { ReadyBubbles } from './structures/ReadyBubbles'
import { Animals } from './animals/Animals'
import { CHUNKS_PER_SIDE, MAP_CENTER, MAP_WORLD } from './world/mapConstants'
import { PARCEL_PITCH, quadrantOf, worldToPlot } from '../logic/grid'
import { useGame } from '../state/gameStore'
import { parcelAt, useWorld } from '../state/worldStore'

/** Pointer moved more than this (px) between down and up = drag, not a tap. */
const DRAG_THRESHOLD = 8
/** Camera offset from the point it looks at. */
const OFFSET = { x: 6, y: 8, z: 8 }

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

/**
 * Camera controls + smooth "fly to".
 * (Home and Visit buttons use the fly-to.)
 * The camera keeps the same offset from its target, so moving the target moves the view.
 */
function CameraRig() {
  const controls = useRef<MapControlsImpl>(null)
  const aspect = useThree((s) => s.size.width / s.size.height)
  const flyTarget = useWorld((s) => s.flyTarget)
  const flying = useRef(false)

  // Portrait screens need the camera further back to fit a whole parcel.
  useEffect(() => {
    const c = controls.current
    if (!c) return
    const zoom = aspect < 1 ? 1.45 : 1
    c.object.position.set(c.target.x + OFFSET.x * zoom, OFFSET.y * zoom, c.target.z + OFFSET.z * zoom)
  }, [aspect])

  useEffect(() => {
    if (flyTarget) flying.current = true
  }, [flyTarget])

  useFrame((state, dt) => {
    const c = controls.current
    if (!c || !flying.current || !flyTarget) return
    const k = 1 - Math.exp(-dt * 4)
    const dx = (flyTarget.x - c.target.x) * k
    const dz = (flyTarget.z - c.target.z) * k
    c.target.x += dx
    c.target.z += dz
    state.camera.position.x += dx
    state.camera.position.z += dz
    c.update()
    if (Math.hypot(flyTarget.x - c.target.x, flyTarget.z - c.target.z) < 0.05) flying.current = false
  })

  return (
    <MapControls
      ref={controls}
      makeDefault
      target={[MAP_CENTER, 0, MAP_CENTER]}
      minDistance={5}
      maxDistance={45}
      minPolarAngle={0.35}
      maxPolarAngle={1.15}
      onStart={() => {
        flying.current = false
      }}
      onChange={() => {
        // Keep the view inside the village so players cannot get lost.
        const t = controls.current?.target
        if (!t) return
        t.x = clamp(t.x, -5, MAP_WORLD + 5)
        t.z = clamp(t.z, -5, MAP_WORLD + 5)
      }}
    />
  )
}

/** Soft shadows only on devices with a mouse; phones skip them to stay cool and smooth (ROADMAP 4.6). */
const SOFT_SHADOWS = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches

/** Warm afternoon sun that follows the camera, so a small shadow map always covers the view. */
function SunLight() {
  const light = useRef<DirectionalLight>(null)
  const controls = useThree((s) => s.controls) as MapControlsImpl | null

  useFrame(() => {
    const l = light.current
    const t = controls?.target
    if (!l || !t) return
    l.position.set(t.x - 16, 26, t.z + 8)
    l.target.position.set(t.x, 0, t.z)
    l.target.updateMatrixWorld()
  })

  return (
    <directionalLight
      ref={light}
      color="#FFE9C7"
      intensity={1.5}
      castShadow={SOFT_SHADOWS}
      shadow-mapSize={[2048, 2048]}
      shadow-radius={3}
      shadow-bias={-0.0004}
      shadow-normalBias={0.03}
      shadow-camera-left={-32}
      shadow-camera-right={32}
      shadow-camera-top={32}
      shadow-camera-bottom={-32}
      shadow-camera-near={1}
      shadow-camera-far={80}
    />
  )
}

/** Invisible plane at plot height: taps become parcel/plot coordinates by math (ROADMAP 4.2). */
function PickPlane() {
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > DRAG_THRESHOLD) return
    const game = useGame.getState()
    const world = useWorld.getState()
    const coord = worldToPlot(e.point.x, e.point.z)
    const parcel = coord
      ? parcelAt(coord.parcelX, coord.parcelY)
      : parcelAt(Math.floor(e.point.x / PARCEL_PITCH), Math.floor(e.point.z / PARCEL_PITCH))
    if (!parcel) {
      game.clearSelection()
      world.selectParcel(null)
      return
    }
    if (coord && parcel.ownerId && parcel.ownerId === game.profile?.id) {
      // My pen or processor on this quadrant -> open its panel; otherwise plant / harvest.
      const quadrant = quadrantOf(coord.plotX, coord.plotY)
      const structure = game.structures.find((s) => s.parcel_id === parcel.id && s.quadrant === quadrant)
      if (structure) {
        world.selectParcel(null)
        game.openStructure(structure.id)
        return
      }
      game.tapPlot(parcel.id, coord.plotX, coord.plotY)
      return
    }
    game.clearSelection()
    world.selectParcel(parcel.id)
  }

  return (
    <mesh position={[MAP_CENTER, 0.12, MAP_CENTER]} rotation={[-Math.PI / 2, 0, 0]} onClick={onClick}>
      <planeGeometry args={[MAP_WORLD + 40, MAP_WORLD + 40]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

const CHUNKS = Array.from({ length: CHUNKS_PER_SIDE * CHUNKS_PER_SIDE }, (_, i) => [i % CHUNKS_PER_SIDE, Math.floor(i / CHUNKS_PER_SIDE)])

export function GameCanvas() {
  return (
    <Canvas
      className="absolute! inset-0"
      style={{ background: 'linear-gradient(#A9DDF3 0%, #D8EEF0 45%, #F6EBD3 100%)' }}
      gl={{ alpha: true }}
      shadows={SOFT_SHADOWS ? 'percentage' : false}
      camera={{ position: [MAP_CENTER + 6, 8, MAP_CENTER + 8], fov: 45, far: 400 }}
      dpr={[1, 1.5]}
    >
      <fog attach="fog" args={['#E8EEDC', 55, 130]} />
      <hemisphereLight args={['#FFF4E0', '#7FAF5C', 1.15]} />
      <SunLight />

      {/* grass under the whole village */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[MAP_CENTER, 0, MAP_CENTER]} receiveShadow>
        <planeGeometry args={[MAP_WORLD + 80, MAP_WORLD + 80]} />
        <meshStandardMaterial color="#9CC873" roughness={1} />
      </mesh>

      {CHUNKS.map(([cx, cy]) => (
        <Chunk key={`${cx}-${cy}`} cx={cx} cy={cy} />
      ))}
      <Roads />
      <Houses />
      <Structures />
      <Animals />
      <ReadyBubbles />
      <Trees />
      <Lotus />
      <TownSquare />
      <SelectionMarkers />
      <PickPlane />
      <CameraRig />
      <ChunkWatcher />
    </Canvas>
  )
}
