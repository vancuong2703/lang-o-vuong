import { useEffect, useState } from 'react'
import { parcelCenter } from '../../logic/grid'
import { landTitle } from '../../logic/titles'
import { api, type LeaderboardEntry, type LeaderboardKind } from '../../services/api'
import { useGame } from '../../state/gameStore'
import { useWorld } from '../../state/worldStore'
import { errorMessage } from '../errorMessages'
import { formatNumber } from '../format'

// "Làng" panel: every family in the village + three leaderboards (GDD 7.1).

type Tab = 'neighbours' | LeaderboardKind

const TABS: { id: Tab; label: string }[] = [
  { id: 'neighbours', label: 'Hàng xóm' },
  { id: 'level', label: 'Cấp độ' },
  { id: 'land', label: 'Ruộng đất' },
  { id: 'weekly', label: 'Tuần này' },
]

const SCORE: Record<LeaderboardKind, (e: LeaderboardEntry) => string> = {
  level: (e) => `Cấp ${e.level} · ${formatNumber(e.xp ?? 0)} XP`,
  land: (e) => `${e.parcels ?? 0} mảnh ruộng · ${landTitle(e.parcels ?? 1)}`,
  weekly: (e) => `${formatNumber(e.weekly_xp ?? 0)} XP tuần này`,
}

const MEDALS = ['🥇', '🥈', '🥉']

export function NeighboursPanel() {
  const open = useWorld((s) => s.neighboursOpen)
  const players = useWorld((s) => s.players)
  const parcels = useWorld((s) => s.parcels)
  const setOpen = useWorld((s) => s.setNeighboursOpen)
  const flyTo = useWorld((s) => s.flyTo)
  const selectParcel = useWorld((s) => s.selectParcel)
  const online = useWorld((s) => s.onlineIds)
  const myId = useGame((s) => s.profile?.id)
  const clearSelection = useGame((s) => s.clearSelection)
  const [tab, setTab] = useState<Tab>('neighbours')
  const [board, setBoard] = useState<{ kind: LeaderboardKind; rows: LeaderboardEntry[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Leaderboards are read fresh from the server each time a tab is opened.
  useEffect(() => {
    if (!open || tab === 'neighbours') return
    let cancelled = false
    api
      .loadLeaderboard(tab)
      .then((rows) => {
        if (!cancelled) setBoard({ kind: tab, rows })
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err))
      })
    return () => {
      cancelled = true
      setError(null)
    }
  }, [open, tab])

  if (!open) return null

  const visit = (playerId: string) => {
    const home = parcels[players[playerId]?.home_parcel_id]
    if (!home) return
    clearSelection()
    flyTo(...parcelCenter(home.x, home.y))
    selectParcel(home.id)
    setOpen(false)
  }

  const landCount = (id: string) => Object.values(parcels).filter((p) => p.ownerId === id).length
  const neighbours = Object.values(players).sort((a, b) => b.level - a.level || a.farm_name.localeCompare(b.farm_name))
  const rows = tab !== 'neighbours' && board?.kind === tab ? board.rows : null

  const visitButton = (playerId: string) =>
    players[playerId] && (
      <button
        className="min-h-11 shrink-0 rounded-lg bg-[#4E9F3D] px-3 text-sm font-semibold text-white active:scale-95"
        onClick={() => visit(playerId)}
      >
        Thăm
      </button>
    )

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 p-4" onClick={() => setOpen(false)}>
      <div className="flex max-h-full w-full max-w-md flex-col rounded-2xl bg-[#FFF8EA] p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Làng · {neighbours.length} nhà</h2>
          <button className="min-h-11 min-w-11 rounded-full bg-black/5 font-bold" onClick={() => setOpen(false)} aria-label="Đóng">
            ✕
          </button>
        </div>

        <div className="mb-3 grid grid-cols-4 gap-1 rounded-xl bg-black/5 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`min-h-10 rounded-lg text-xs font-bold sm:text-sm ${tab === t.id ? 'bg-white shadow' : 'text-[#3B2F2A]/70'}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="-mr-1 overflow-y-auto pr-1">
          {tab === 'neighbours' ? (
            <ul className="space-y-2">
              {neighbours.map((p) => (
                <li key={p.id} className="flex items-center gap-2 rounded-xl bg-white p-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">
                      {p.farm_name} {p.id === myId && <span className="text-xs text-[#4E9F3D]">(bạn)</span>}
                      {online[p.id] && p.id !== myId && <span className="ml-1 text-xs font-semibold text-[#3CA552]">● đang online</span>}
                    </div>
                    <div className="text-xs">
                      {p.username} · Cấp {p.level} · {landTitle(landCount(p.id))} · {landCount(p.id)} mảnh ruộng
                    </div>
                  </div>
                  {visitButton(p.id)}
                </li>
              ))}
            </ul>
          ) : error ? (
            <p className="py-6 text-center text-sm text-[#C0473A]">{error}</p>
          ) : !rows ? (
            <p className="py-6 text-center text-sm">Đang tải bảng xếp hạng…</p>
          ) : rows.length === 0 ? (
            <p className="py-6 text-center text-sm">
              {tab === 'weekly' ? 'Tuần này chưa ai kiếm được XP. Hãy là người đầu tiên!' : 'Chưa có ai.'}
            </p>
          ) : (
            <ol className="space-y-2">
              {rows.map((e, i) => (
                <li key={e.id} className={`flex items-center gap-2 rounded-xl p-2 ${e.id === myId ? 'bg-[#FFF0C2]' : 'bg-white'}`}>
                  <span className="w-8 shrink-0 text-center text-lg font-bold">{MEDALS[i] ?? i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">
                      {e.farm_name} {e.id === myId && <span className="text-xs text-[#4E9F3D]">(bạn)</span>}
                    </div>
                    <div className="text-xs">
                      {e.username} · {SCORE[tab](e)}
                    </div>
                  </div>
                  {e.id !== myId && visitButton(e.id)}
                </li>
              ))}
            </ol>
          )}
        </div>
        {tab === 'weekly' && <p className="mt-2 text-center text-[11px] text-[#3B2F2A]/60">Bảng tuần reset lúc 0h thứ Hai (giờ Việt Nam)</p>}
      </div>
    </div>
  )
}
