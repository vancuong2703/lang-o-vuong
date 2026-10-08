import { parcelOrigin } from '../../logic/grid'
import { useGame } from '../../state/gameStore'
import { useWorld } from '../../state/worldStore'

const HIGHLIGHT = '#FFE066'

/** Yellow frame around the selected parcel and a glow on the selected plot. */
export function SelectionMarkers() {
  const selectedParcel = useWorld((s) => (s.selectedParcelId ? s.parcels[s.selectedParcelId] : undefined))
  const plot = useGame((s) => s.plots.find((p) => p.id === s.selectedPlotId))
  const plotParcel = useWorld((s) => (plot ? s.parcels[plot.parcel_id] : undefined))

  return (
    <group>
      {selectedParcel &&
        (() => {
          const [ox, oz] = parcelOrigin(selectedParcel.x, selectedParcel.y)
          const bars: [number, number, number, number][] = [
            [ox + 2, oz - 0.35, 5, 0.12],
            [ox + 2, oz + 4.35, 5, 0.12],
            [ox - 0.35, oz + 2, 0.12, 5],
            [ox + 4.35, oz + 2, 0.12, 5],
          ]
          return bars.map(([x, z, sx, sz], i) => (
            <mesh key={i} position={[x, 0.25, z]} scale={[sx, 0.1, sz]}>
              <boxGeometry />
              <meshBasicMaterial color={HIGHLIGHT} />
            </mesh>
          ))
        })()}
      {plot && plotParcel && (
        <mesh position={[parcelOrigin(plotParcel.x, plotParcel.y)[0] + plot.lx + 0.5, 0.13, parcelOrigin(plotParcel.x, plotParcel.y)[1] + plot.ly + 0.5]}>
          <boxGeometry args={[0.96, 0.02, 0.96]} />
          <meshBasicMaterial color={HIGHLIGHT} transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  )
}
