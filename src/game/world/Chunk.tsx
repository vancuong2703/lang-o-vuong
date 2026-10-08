import { useMemo } from 'react'
import { CropInstances } from '../crops/CropInstances'
import { growthProgress, growthStage, type GrowthStage } from '../../logic/growth'
import { CHUNK_PARCELS, parcelOrigin } from '../../logic/grid'
import { checkBuy } from '../../logic/land'
import type { PlotRow } from '../../services/api'
import { useCatalog } from '../../state/catalogStore'
import { useClock } from '../../state/clock'
import { useGame } from '../../state/gameStore'
import { landWorld, useWorld, type Parcel } from '../../state/worldStore'
import { InstancedBoxes, type BoxInstance } from './InstancedBoxes'

// One chunk = 8x8 parcels, drawn with a handful of InstancedMeshes (ROADMAP 4.3-4.4).

const COLORS = {
  mine: '#E3CFA0',
  other: '#D8C49A',
  free: '#A9D47F',
  buyable: '#CBE9A0',
  town: '#D9CDB0',
  lake: '#6EC6E6',
  forest: '#5E9E48',
  alluvial: '#C9B26B',
  soil: '#9C6B44',
  railMine: '#F2B33D',
  railOther: '#A9744F',
}

function tileColor(p: Parcel, myId: string | undefined, buyable: boolean): string {
  if (p.ownerId) return p.ownerId === myId ? COLORS.mine : COLORS.other
  if (p.zone !== 'normal') return COLORS[p.zone]
  return buyable ? COLORS.buyable : COLORS.free
}

function useChunkParcels(cx: number, cy: number): Parcel[] {
  const parcels = useWorld((s) => s.parcels)
  return useMemo(
    () =>
      Object.values(parcels).filter(
        (p) => Math.floor(p.x / CHUNK_PARCELS) === cx && Math.floor(p.y / CHUNK_PARCELS) === cy,
      ),
    [parcels, cx, cy],
  )
}

export function Chunk({ cx, cy }: { cx: number; cy: number }) {
  const parcels = useChunkParcels(cx, cy)
  const profile = useGame((s) => s.profile)
  const myPlots = useGame((s) => s.plots)
  const otherPlots = useWorld((s) => s.plotsByParcel)
  const cropsById = useCatalog((s) => s.cropsById)
  const myId = profile?.id

  // Ground tiles + owner rails.
  const { tiles, rails } = useMemo(() => {
    const world = landWorld()
    const ownedCount = Object.values(useWorld.getState().parcels).filter((p) => p.ownerId === myId).length
    const tiles: BoxInstance[] = []
    const rails: BoxInstance[] = []
    for (const p of parcels) {
      const [ox, oz] = parcelOrigin(p.x, p.y)
      const full = p.zone !== 'normal' && !p.ownerId
      const size = full ? 5 : 4.6
      const block =
        myId && !p.ownerId && p.zone === 'normal'
          ? checkBuy(p, { id: myId, coins: Number.MAX_SAFE_INTEGER, ownedCount, maxParcels: Number.MAX_SAFE_INTEGER }, world).block
          : 'NOT_BUYABLE'
      tiles.push({
        position: [ox + 2, 0.01, oz + 2],
        scale: [size, 0.02, size],
        color: tileColor(p, myId, block === null),
      })
      if (p.ownerId) {
        const color = p.ownerId === myId ? COLORS.railMine : COLORS.railOther
        rails.push(
          { position: [ox + 2, 0.18, oz - 0.2], scale: [4.6, 0.08, 0.08], color },
          { position: [ox + 2, 0.18, oz + 4.2], scale: [4.6, 0.08, 0.08], color },
          { position: [ox - 0.2, 0.18, oz + 2], scale: [0.08, 0.08, 4.6], color },
          { position: [ox + 4.2, 0.18, oz + 2], scale: [0.08, 0.08, 4.6], color },
        )
      }
    }
    return { tiles, rails }
  }, [parcels, myId])

  // Plots of every owned parcel in this chunk (mine from gameStore, others from worldStore).
  const plots = useMemo(() => {
    const list: { plot: PlotRow; x: number; z: number }[] = []
    for (const p of parcels) {
      if (!p.ownerId) continue
      const rows = p.ownerId === myId ? myPlots.filter((pl) => pl.parcel_id === p.id) : (otherPlots[p.id] ?? [])
      const [ox, oz] = parcelOrigin(p.x, p.y)
      for (const plot of rows) list.push({ plot, x: ox + plot.lx + 0.5, z: oz + plot.ly + 0.5 })
    }
    return list
  }, [parcels, myId, myPlots, otherPlots])

  const soil = useMemo<BoxInstance[]>(
    () => plots.map(({ x, z }) => ({ position: [x, 0.06, z], scale: [0.9, 0.12, 0.9], color: COLORS.soil })),
    [plots],
  )

  // A string of stages; the chunk re-renders only when some crop changes stage.
  const stageKey = useClock((s) =>
    plots
      .map(({ plot }) =>
        plot.planted_at && plot.ready_at ? growthStage(growthProgress(Date.parse(plot.planted_at), Date.parse(plot.ready_at), s.now)) : '-',
      )
      .join(''),
  )

  const cropGroups = useMemo(() => {
    const groups = new Map<string, { cropId: string; stage: GrowthStage; positions: [number, number][] }>()
    plots.forEach(({ plot, x, z }, i) => {
      const stage = stageKey[i]
      if (!plot.crop_item_id || stage === '-' || stage === undefined) return
      const k = `${plot.crop_item_id}:${stage}`
      let g = groups.get(k)
      if (!g) groups.set(k, (g = { cropId: plot.crop_item_id, stage: Number(stage) as GrowthStage, positions: [] }))
      g.positions.push([x, z])
    })
    return [...groups.entries()]
  }, [plots, stageKey])

  return (
    <group>
      <InstancedBoxes boxes={tiles} />
      <InstancedBoxes boxes={rails} />
      <InstancedBoxes boxes={soil} />
      {cropGroups.map(([k, g]) =>
        cropsById[g.cropId] ? <CropInstances key={k} crop={cropsById[g.cropId]} stage={g.stage} positions={g.positions} /> : null,
      )}
    </group>
  )
}

