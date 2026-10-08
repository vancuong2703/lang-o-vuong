import { useCallback, useEffect, useState } from 'react'
import { formatDuration } from '../../logic/growth'
import { api, type OrdersPayload } from '../../services/api'
import { useCatalog } from '../../state/catalogStore'
import { useClock } from '../../state/clock'
import { callGame, useGame } from '../../state/gameStore'
import { errorMessage } from '../errorMessages'
import { formatNumber } from '../format'

const SLOTS = [0, 1, 2, 3, 4, 5]

/** Order board at the market (GDD 8.3): 6 slots, pays 1.2-1.5x the market price. */
export function OrdersPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const inventory = useGame((s) => s.inventory)
  const showToast = useGame((s) => s.showToast)
  const itemsById = useCatalog((s) => s.itemsById)
  const now = useClock((s) => s.now)
  const [data, setData] = useState<OrdersPayload | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(() => {
    api
      .getOrders()
      .then(setData)
      .catch((err) => showToast(errorMessage(err), 'error'))
  }, [showToast])

  useEffect(() => {
    if (open) reload()
  }, [open, reload])

  // When a waiting slot's timer runs out, ask the server for the new order.
  const nextReadyAt = data?.cooldowns.map((c) => Date.parse(c.next_at)).sort((a, b) => a - b)[0]
  useEffect(() => {
    if (open && nextReadyAt && now >= nextReadyAt) reload()
  }, [open, now, nextReadyAt, reload])

  if (!open) return null

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    try {
      await action()
    } catch (err) {
      showToast(errorMessage(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  const fulfill = (id: number, reward: number) =>
    run(async () => {
      const result = await callGame(() => api.fulfillOrder(id))
      if (result) setData((d) => ({ ...result.orders, unlocked: d?.unlocked, unlock_level: d?.unlock_level }))
      showToast(result?.level_up ? `Giao xong! Lên cấp ${result.profile.level}!` : `Giao xong! +${formatNumber(reward)} xu`, 'success')
    })

  const skip = (id: number) =>
    run(async () => {
      const orders = await api.skipOrder(id)
      setData((d) => ({ ...orders, unlocked: d?.unlocked, unlock_level: d?.unlock_level }))
    })

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl bg-[#FFF8EA] p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Đơn hàng ở chợ làng</h2>
          <button className="min-h-11 min-w-11 rounded-full bg-black/5 font-bold" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>

        {!data ? (
          <p className="py-6 text-center text-sm">Đang tải…</p>
        ) : data.unlocked === false ? (
          <p className="py-6 text-center text-sm">Đạt cấp {data.unlock_level} để nhận đơn hàng.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SLOTS.map((slot) => {
              const order = data.active.find((o) => o.slot === slot)
              if (!order) {
                const cooldown = data.cooldowns.find((c) => c.slot === slot)
                const left = cooldown ? Date.parse(cooldown.next_at) - now : 0
                return (
                  <div
                    key={slot}
                    className="flex min-h-28 items-center justify-center rounded-xl border-2 border-dashed border-black/10 p-3 text-center text-sm text-[#3B2F2A]/60"
                  >
                    {left > 0 ? `Đơn mới sau ${formatDuration(left)}` : 'Đang có đơn mới…'}
                  </div>
                )
              }
              const enough = order.requirements.every((r) => (inventory[r.item_id] ?? 0) >= r.qty)
              return (
                <div key={slot} className="rounded-xl bg-white p-3">
                  <ul className="space-y-1 text-sm">
                    {order.requirements.map((r) => {
                      const item = itemsById[r.item_id]
                      const have = inventory[r.item_id] ?? 0
                      return (
                        <li key={r.item_id} className="flex items-center gap-1.5">
                          <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ background: item?.color ?? '#ccc' }} />
                          <span className="flex-1">{item?.nameVi ?? r.item_id}</span>
                          <span className={have >= r.qty ? 'font-semibold text-[#4E9F3D]' : 'font-semibold text-[#C0473A]'}>
                            {have}/{r.qty}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                  <p className="mt-2 text-xs">
                    Thưởng: <b>{formatNumber(order.reward_coins)} xu</b> · {order.reward_xp} XP
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      disabled={busy || !enough}
                      className="min-h-11 flex-1 rounded-lg bg-[#4E9F3D] text-sm font-bold text-white active:scale-95 disabled:opacity-40"
                      onClick={() => void fulfill(order.id, order.reward_coins)}
                    >
                      Giao hàng
                    </button>
                    <button
                      disabled={busy}
                      className="min-h-11 rounded-lg bg-black/5 px-3 text-sm font-semibold active:scale-95 disabled:opacity-40"
                      onClick={() => void skip(order.id)}
                    >
                      Bỏ qua
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <p className="mt-3 text-center text-[11px] text-[#3B2F2A]/60">Giao đơn được nhiều xu hơn bán ở chợ. Đơn mới tới sau 15 phút.</p>
      </div>
    </div>
  )
}
