import { useEffect, useState } from 'react'
import { api, type QuestsPayload } from '../../services/api'
import { callGame, useGame } from '../../state/gameStore'
import { errorMessage } from '../errorMessages'
import { formatNumber } from '../format'

/** Today's 3 quests (GDD 8.2). Progress is counted by the server; this panel only shows and claims. */
export function QuestPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const showToast = useGame((s) => s.showToast)
  const [data, setData] = useState<QuestsPayload | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    api
      .getDailyQuests()
      .then((d) => !cancelled && setData(d))
      .catch((err) => showToast(errorMessage(err), 'error'))
    return () => {
      cancelled = true
    }
  }, [open, showToast])

  if (!open) return null

  const claim = async (id: number) => {
    setBusyId(id)
    try {
      const result = await callGame(() => api.claimQuest(id))
      if (result) setData((d) => (d ? { ...d, quests: result.quests } : d))
      showToast(result?.all_done_bonus ? 'Xong cả 3 nhiệm vụ! Được thưởng thêm XP' : 'Đã nhận thưởng nhiệm vụ', 'success')
    } catch (err) {
      showToast(errorMessage(err), 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl bg-[#FFF8EA] p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Việc trong ngày</h2>
          <button className="min-h-11 min-w-11 rounded-full bg-black/5 font-bold" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>

        {!data ? (
          <p className="py-6 text-center text-sm">Đang tải…</p>
        ) : !data.unlocked ? (
          <p className="py-6 text-center text-sm">Đạt cấp {data.unlock_level} để nhận việc hằng ngày.</p>
        ) : (
          <ul className="space-y-2">
            {data.quests.map((q) => {
              const done = q.progress >= q.target
              return (
                <li key={q.id} className={`rounded-xl p-3 ${q.claimed ? 'bg-[#E7F2DF]' : 'bg-white'}`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold">{q.name}</span>
                    <span className="shrink-0 text-xs">
                      +{formatNumber(q.reward_coins)} xu · +{q.reward_xp} XP
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/10">
                      <div className="h-full bg-[#4E9F3D]" style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }} />
                    </div>
                    <span className="w-16 text-right text-xs">
                      {formatNumber(q.progress)}/{formatNumber(q.target)}
                    </span>
                  </div>
                  {q.claimed ? (
                    <p className="mt-2 text-sm font-semibold text-[#4E9F3D]">Đã nhận ✓</p>
                  ) : (
                    <button
                      disabled={!done || busyId !== null}
                      className="mt-2 min-h-11 w-full rounded-xl bg-[#4E9F3D] font-bold text-white active:scale-95 disabled:opacity-40"
                      onClick={() => void claim(q.id)}
                    >
                      {done ? 'Nhận thưởng' : 'Chưa xong'}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        <p className="mt-3 text-center text-[11px] text-[#3B2F2A]/60">
          Việc mới lúc 0h mỗi ngày (giờ Việt Nam). Xong cả 3 được thưởng thêm XP.
        </p>
      </div>
    </div>
  )
}
