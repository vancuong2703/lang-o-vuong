import { useState } from 'react'
import { nextLoginDay, vnDate } from '../../logic/vnDate'
import { api } from '../../services/api'
import { useCatalog } from '../../state/catalogStore'
import { useClock } from '../../state/clock'
import { callGame, useGame } from '../../state/gameStore'
import { errorMessage } from '../errorMessages'
import { formatNumber } from '../format'

/** Shown once per session when today's login reward has not been claimed yet (GDD 8.4). */
export function DailyLoginModal() {
  const profile = useGame((s) => s.profile)
  const showToast = useGame((s) => s.showToast)
  const today = useClock((s) => vnDate(s.now))
  const baseRewards = useCatalog((s) => s.loginRewards)
  const [dismissed, setDismissed] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!profile || dismissed || profile.last_login_date === today) return null

  const day = nextLoginDay(profile.last_login_date, profile.login_streak, today)
  const multiplier = 1 + profile.level / 10

  const claim = async () => {
    setBusy(true)
    try {
      const result = await callGame(api.claimDailyLogin)
      showToast(`Thưởng ngày ${result?.login_day}: +${formatNumber(result?.login_reward ?? 0)} xu`, 'success')
      setDismissed(true)
    } catch (err) {
      showToast(errorMessage(err), 'error')
      setDismissed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#FFF8EA] p-5 text-center shadow-xl">
        <h2 className="text-xl font-bold text-[#4E9F3D]">Chào ngày mới, chủ nhà!</h2>
        <p className="mt-1 text-sm">Về làng mỗi ngày để nhận quà. Nhận liền 7 ngày quà càng lớn.</p>
        <div className="mt-4 grid grid-cols-7 gap-1">
          {baseRewards.map((base, i) => {
            const d = i + 1
            const state = d < day ? 'done' : d === day ? 'today' : 'later'
            return (
              <div
                key={d}
                className={`rounded-lg px-0.5 py-1.5 text-[10px] font-bold sm:text-xs ${
                  state === 'today'
                    ? 'bg-[#F2B33D] text-[#3B2F2A] ring-2 ring-[#C98F1A]'
                    : state === 'done'
                      ? 'bg-[#CFE8C3] text-[#3B2F2A]/60'
                      : 'bg-white'
                }`}
              >
                <div>Ngày {d}</div>
                <div>{state === 'done' ? '✓' : formatNumber(Math.round(base * multiplier))}</div>
              </div>
            )
          })}
        </div>
        <button
          disabled={busy}
          className="mt-5 min-h-12 w-full rounded-xl bg-[#4E9F3D] font-bold text-white active:scale-95 disabled:opacity-50"
          onClick={() => void claim()}
        >
          Nhận {formatNumber(Math.round((baseRewards[day - 1] ?? 0) * multiplier))} xu
        </button>
        <button className="mt-2 text-xs text-[#3B2F2A]/60 underline" onClick={() => setDismissed(true)}>
          Để sau
        </button>
      </div>
    </div>
  )
}
