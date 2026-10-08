import { CROPS_BY_ID } from '../data/crops'
import { CropModel } from '../crops/CropModel'
import { growthProgress, growthStage } from '../../logic/growth'
import { PARCEL_PLOTS, plotFromIndex } from '../../logic/grid'
import { useClock } from '../../state/clock'
import { isHousePlot, useGame, type PlotState } from '../../state/gameStore'

// The player's home parcel at parcel (0,0): house + barn in Q0, 12 plots elsewhere.

const SOIL = '#9C6B44'
const SOIL_SELECTED = '#C28A5C'
const PATH = '#E3CFA0'
const WOOD = '#A9744F'

function Plot({ index, plot, selected }: { index: number; plot: PlotState | null; selected: boolean }) {
  const { plotX, plotY } = plotFromIndex(index)
  const x = plotX + 0.5
  const z = plotY + 0.5
  // Selector returns a primitive, so this plot only re-renders when its stage changes.
  const stage = useClock((s) => (plot ? growthStage(growthProgress(plot.plantedAt, plot.readyAt, s.now)) : 0))

  return (
    <group>
      <mesh position={[x, 0.06, z]}>
        <boxGeometry args={[0.9, 0.12, 0.9]} />
        <meshStandardMaterial color={selected ? SOIL_SELECTED : SOIL} flatShading />
      </mesh>
      {plot && <CropModel crop={CROPS_BY_ID[plot.cropId]} stage={stage} position={[x, z]} />}
    </group>
  )
}

function House() {
  return (
    <group position={[0.8, 0, 0.9]}>
      {/* walls */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[1.2, 0.9, 1.0]} />
        <meshStandardMaterial color="#F4E6C8" flatShading />
      </mesh>
      {/* roof */}
      <mesh position={[0, 1.2, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.95, 0.6, 4]} />
        <meshStandardMaterial color="#E06D5A" flatShading />
      </mesh>
      {/* door */}
      <mesh position={[0, 0.25, 0.51]}>
        <boxGeometry args={[0.28, 0.5, 0.02]} />
        <meshStandardMaterial color={WOOD} flatShading />
      </mesh>
      {/* barn (kho) */}
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

function Fence() {
  const size = PARCEL_PLOTS + 0.3
  const half = PARCEL_PLOTS / 2
  const rails: { pos: [number, number, number]; scale: [number, number, number] }[] = [
    { pos: [half, 0.22, -0.15], scale: [size, 0.05, 0.05] },
    { pos: [half, 0.22, PARCEL_PLOTS + 0.15], scale: [size, 0.05, 0.05] },
    { pos: [-0.15, 0.22, half], scale: [0.05, 0.05, size] },
    { pos: [PARCEL_PLOTS + 0.15, 0.22, half], scale: [0.05, 0.05, size] },
  ]
  const posts: [number, number][] = []
  for (let i = 0; i <= PARCEL_PLOTS; i++) {
    const p = i - 0.15 + (0.3 * i) / PARCEL_PLOTS
    posts.push([p, -0.15], [p, PARCEL_PLOTS + 0.15], [-0.15, p], [PARCEL_PLOTS + 0.15, p])
  }
  return (
    <group>
      {rails.map((r, i) => (
        <mesh key={i} position={r.pos} scale={r.scale}>
          <boxGeometry />
          <meshStandardMaterial color={WOOD} flatShading />
        </mesh>
      ))}
      {posts.map(([x, z], i) => (
        <mesh key={`p${i}`} position={[x, 0.15, z]}>
          <boxGeometry args={[0.08, 0.3, 0.08]} />
          <meshStandardMaterial color={WOOD} flatShading />
        </mesh>
      ))}
    </group>
  )
}

export function HomeParcel() {
  const plots = useGame((s) => s.plots)
  const selectedPlot = useGame((s) => s.selectedPlot)

  return (
    <group>
      {/* path ring around the parcel */}
      <mesh position={[PARCEL_PLOTS / 2, 0.005, PARCEL_PLOTS / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[PARCEL_PLOTS + 1, PARCEL_PLOTS + 1]} />
        <meshStandardMaterial color={PATH} />
      </mesh>
      <Fence />
      <House />
      {plots.map((plot, i) =>
        isHousePlot(i) ? null : <Plot key={i} index={i} plot={plot} selected={selectedPlot === i} />,
      )}
    </group>
  )
}
