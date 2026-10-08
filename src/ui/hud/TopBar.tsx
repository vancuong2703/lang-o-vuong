import { levelFromXp } from '../../logic/progression'
import { barnUsed, useGame } from '../../state/gameStore'
import { formatNumber } from '../format'

export function TopBar() {
  const profile = useGame((s) => s.profile)
  const used = useGame((s) => barnUsed(s.inventory))
  const capacity = useGame((s) => s.barnCapacity)
  const setBarnOpen = useGame((s) => s.setBarnOpen)
  if (!profile) return null

  const { xpInLevel, xpNeeded } = levelFromXp(profile.xp)
  const pct = xpNeeded > 0 ? Math.min(100, (xpInLevel / xpNeeded) * 100) : 100

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
      <div className="pointer-events-auto flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 font-bold shadow">
          <span className="inline-block h-4 w-4 rounded-full border-2 border-[#C98F1A] bg-[#F2B33D]" />
          {formatNumber(profile.coins)} xu
        </div>
        <div className="rounded-full bg-white/90 px-3 py-1.5 shadow">
          <div className="text-xs font-bold">
            Cấp {profile.level} · {profile.farm_name}
          </div>
          <div className="mt-0.5 h-1.5 w-24 overflow-hidden rounded-full bg-black/10">
            <div className="h-full bg-[#4E9F3D]" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      <button
        className="pointer-events-auto min-h-11 rounded-full bg-white/90 px-4 font-bold shadow active:scale-95"
        onClick={() => setBarnOpen(true)}
      >
        Kho {used}/{capacity}
      </button>
    </div>
  )
}
