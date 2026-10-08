import { formatDuration } from '../../logic/growth'
import { useCatalog } from '../../state/catalogStore'
import { useGame } from '../../state/gameStore'

export function SeedBar() {
  const crops = useCatalog((s) => s.crops)
  const selectedSeed = useGame((s) => s.selectedSeed)
  const selectSeed = useGame((s) => s.selectSeed)
  const level = useGame((s) => s.profile?.level ?? 1)

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
      <p className="mb-1.5 text-center text-xs font-semibold text-[#3B2F2A]/80 drop-shadow-[0_1px_0_white]">
        Chạm luống trống để gieo · chạm cây chín để thu hoạch
      </p>
      <div className="pointer-events-auto mx-auto flex max-w-3xl gap-2 overflow-x-auto rounded-2xl bg-white/90 p-2 shadow-lg">
        {crops.map((crop) => {
          const locked = level < crop.unlockLevel
          const active = crop.id === selectedSeed
          return (
            <button
              key={crop.id}
              disabled={locked}
              onClick={() => selectSeed(crop.id)}
              className={`min-w-28 shrink-0 rounded-xl border-2 px-2 py-1.5 text-left transition active:scale-95 ${
                active ? 'border-[#4E9F3D] bg-[#EAF6E4]' : 'border-transparent bg-black/5'
              } ${locked ? 'opacity-45' : ''}`}
            >
              <div className="flex items-center gap-1.5 text-sm font-bold">
                <span className="inline-block h-3 w-3 rounded-full" style={{ background: crop.produceColor }} />
                {crop.nameVi}
              </div>
              <div className="text-xs">
                {locked ? `Mở ở cấp ${crop.unlockLevel}` : `${crop.seedPrice} xu · ${formatDuration(crop.growSeconds * 1000)}`}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
