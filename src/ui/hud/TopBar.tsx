import { useState } from 'react'
import { levelFromXp } from '../../logic/progression'
import { UpgradePanel } from '../panels/UpgradePanel'
import { QuestPanel } from '../panels/QuestPanel'
import { OrdersPanel } from '../panels/OrdersPanel'
import { landTitle } from '../../logic/titles'
import { barnUsed, useGame } from '../../state/gameStore'
import { useWorld } from '../../state/worldStore'
import { formatNumber } from '../format'

export function TopBar() {
  const profile = useGame((s) => s.profile)
  const used = useGame((s) => barnUsed(s.inventory))
  const capacity = useGame((s) => s.barnCapacity)
  const setBarnOpen = useGame((s) => s.setBarnOpen)
  const goHome = useGame((s) => s.goHome)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [questsOpen, setQuestsOpen] = useState(false)
  const [ordersOpen, setOrdersOpen] = useState(false)
  const setNeighboursOpen = useWorld((s) => s.setNeighboursOpen)
  const ownedCount = useWorld((s) => Object.values(s.parcels).filter((p) => p.ownerId === profile?.id).length)
  if (!profile) return null

  const { xpInLevel, xpNeeded } = levelFromXp(profile.xp)
  const pct = xpNeeded > 0 ? Math.min(100, (xpInLevel / xpNeeded) * 100) : 100

  return (
    <>
      <UpgradePanel open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <QuestPanel open={questsOpen} onClose={() => setQuestsOpen(false)} />
      <OrdersPanel open={ordersOpen} onClose={() => setOrdersOpen(false)} />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        {/* Left: coins, then level + title + estate name (stacked so it never wraps on phones) */}
        <div className="pointer-events-auto flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/90 px-3 py-1.5 font-bold shadow">
            <span className="inline-block h-4 w-4 shrink-0 rounded-full border-2 border-[#C98F1A] bg-[#F2B33D]" />
            {formatNumber(profile.coins)} xu
          </div>
          <div className="min-w-0 max-w-[60vw] rounded-2xl bg-white/90 px-3 py-1.5 shadow sm:max-w-xs">
            <div className="truncate text-xs font-bold">
              Cấp {profile.level} · {landTitle(ownedCount)}
            </div>
            <div className="truncate text-[11px] text-[#3B2F2A]/70">{profile.farm_name}</div>
            <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-black/10">
              <div className="h-full bg-[#4E9F3D]" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="min-h-11 whitespace-nowrap rounded-full bg-white/90 px-4 text-sm font-bold shadow active:scale-95"
              onClick={() => setQuestsOpen(true)}
            >
              Việc ngày
            </button>
            <button
              className="min-h-11 whitespace-nowrap rounded-full bg-white/90 px-4 text-sm font-bold shadow active:scale-95"
              onClick={() => setOrdersOpen(true)}
            >
              Đơn hàng
            </button>
          </div>
        </div>
        <div className="pointer-events-auto flex shrink-0 flex-col items-end gap-2">
          <button
            className="min-h-11 whitespace-nowrap rounded-full bg-white/90 px-4 font-bold shadow active:scale-95"
            onClick={() => setBarnOpen(true)}
          >
            Kho {used}/{capacity}
          </button>
          <button
            className="min-h-11 whitespace-nowrap rounded-full bg-white/90 px-4 text-sm font-bold shadow active:scale-95"
            onClick={goHome}
          >
            Về nhà
          </button>
          <button
            className="min-h-11 whitespace-nowrap rounded-full bg-white/90 px-4 text-sm font-bold shadow active:scale-95"
            onClick={() => setNeighboursOpen(true)}
          >
            Làng · Xếp hạng
          </button>
          <button
            className="min-h-11 whitespace-nowrap rounded-full bg-[#4E9F3D] px-4 text-sm font-bold text-white shadow active:scale-95"
            onClick={() => setUpgradeOpen(true)}
          >
            Nâng cấp
          </button>
        </div>
      </div>
    </>
  )
}
