import { CROPS_BY_ID } from '../../game/data/crops'
import { formatDuration, growthProgress } from '../../logic/growth'
import { useClock } from '../../state/clock'
import { useGame } from '../../state/gameStore'

/** Small card showing the countdown of the selected plot. */
export function PlotInfo() {
  const plot = useGame((s) => (s.selectedPlot === null ? null : s.plots[s.selectedPlot]))
  const now = useClock((s) => s.now)
  if (!plot) return null

  const crop = CROPS_BY_ID[plot.cropId]
  const progress = growthProgress(plot.plantedAt, plot.readyAt, now)
  const ready = progress >= 1

  return (
    <div className="pointer-events-none absolute inset-x-0 top-16 flex justify-center px-3">
      <div className="w-64 rounded-2xl bg-white/95 px-4 py-2.5 shadow-lg">
        <div className="flex items-baseline justify-between font-bold">
          <span>{crop.nameVi}</span>
          <span className="text-sm font-semibold text-[#4E9F3D]">
            {ready ? 'Đã chín!' : `còn ${formatDuration(plot.readyAt - now)}`}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/10">
          <div className="h-full bg-[#4E9F3D] transition-[width] duration-500" style={{ width: `${progress * 100}%` }} />
        </div>
        {ready && <div className="mt-1 text-xs">Chạm vào cây để thu hoạch</div>}
      </div>
    </div>
  )
}
