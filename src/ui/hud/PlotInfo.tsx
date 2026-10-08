import { formatDuration, growthProgress } from '../../logic/growth'
import { useCatalog } from '../../state/catalogStore'
import { useClock } from '../../state/clock'
import { useGame } from '../../state/gameStore'

/** Small card showing the countdown of the selected plot. */
export function PlotInfo() {
  const plot = useGame((s) => s.plots.find((p) => p.id === s.selectedPlotId))
  const crop = useCatalog((s) => (plot?.crop_item_id ? s.cropsById[plot.crop_item_id] : undefined))
  const now = useClock((s) => s.now)
  if (!plot?.planted_at || !plot.ready_at || !crop) return null

  const readyAt = Date.parse(plot.ready_at)
  const progress = growthProgress(Date.parse(plot.planted_at), readyAt, now)
  const ready = progress >= 1

  return (
    <div className="pointer-events-none absolute inset-x-0 top-16 flex justify-center px-3">
      <div className="w-64 rounded-2xl bg-white/95 px-4 py-2.5 shadow-lg">
        <div className="flex items-baseline justify-between font-bold">
          <span>{crop.nameVi}</span>
          <span className="text-sm font-semibold text-[#4E9F3D]">{ready ? 'Đã chín!' : `còn ${formatDuration(readyAt - now)}`}</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/10">
          <div className="h-full bg-[#4E9F3D] transition-[width] duration-500" style={{ width: `${progress * 100}%` }} />
        </div>
        {ready && <div className="mt-1 text-xs">Chạm vào cây để thu hoạch</div>}
      </div>
    </div>
  )
}
