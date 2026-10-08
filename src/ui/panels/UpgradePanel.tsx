import { TOOL_AREA_LABEL } from '../../logic/toolArea'
import type { UpgradeKind } from '../../services/api'
import { useCatalog } from '../../state/catalogStore'
import { useGame } from '../../state/gameStore'
import { formatNumber } from '../format'

// Upgrades for the whole family (GDD 5.1-5.3). Fertility is per parcel, in the parcel card.

const ROWS: { kind: Exclude<UpgradeKind, 'fertility'>; title: string; effect: (value: number) => string }[] = [
  { kind: 'house', title: 'Nhà', effect: (v) => `Tối đa ${v} mảnh ruộng` },
  { kind: 'barn', title: 'Kho', effect: (v) => `Chứa ${formatNumber(v)} vật phẩm` },
  { kind: 'tool', title: 'Nông cụ', effect: (v) => `Mỗi lần chạm: ${TOOL_AREA_LABEL[v] ?? v}` },
]

export function UpgradePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const profile = useGame((s) => s.profile)
  const busy = useGame((s) => s.busy)
  const upgrade = useGame((s) => s.upgrade)
  const levels = useCatalog((s) => s.upgrades)
  if (!open || !profile) return null

  const current: Record<string, number> = { house: profile.house_level, barn: profile.barn_level, tool: profile.tool_level }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl bg-[#FFF8EA] p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Nâng cấp điền trang</h2>
          <button className="min-h-11 min-w-11 rounded-full bg-black/5 font-bold" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>
        <ul className="space-y-2">
          {ROWS.map(({ kind, title, effect }) => {
            const list = levels[kind]
            const level = current[kind]
            const now = list.find((r) => r.level === level)
            const next = list.find((r) => r.level === level + 1)
            const tooLow = next ? profile.level < next.required_player_level : false
            const poor = next ? profile.coins < next.cost : false
            return (
              <li key={kind} className="rounded-xl bg-white p-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold">
                    {title} · cấp {level}
                  </span>
                  {now && <span className="text-xs text-[#3B2F2A]/70">{effect(now.value)}</span>}
                </div>
                {next ? (
                  <>
                    <p className="mt-1 text-sm">
                      Lên cấp {next.level}: <b>{effect(next.value)}</b>
                    </p>
                    {tooLow && <p className="text-xs text-[#C0473A]">Cần đạt cấp {next.required_player_level}</p>}
                    <button
                      disabled={busy || tooLow || poor}
                      className="mt-2 min-h-11 w-full rounded-xl bg-[#4E9F3D] font-bold text-white active:scale-95 disabled:opacity-40"
                      onClick={() => void upgrade(kind)}
                    >
                      Nâng cấp · {formatNumber(next.cost)} xu
                    </button>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-[#4E9F3D]">Đã đạt cấp tối đa</p>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
