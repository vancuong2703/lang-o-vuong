import { useCatalog } from '../../state/catalogStore'
import { barnUsed, useGame } from '../../state/gameStore'
import { formatNumber } from '../format'

export function BarnPanel() {
  const open = useGame((s) => s.barnOpen)
  const inventory = useGame((s) => s.inventory)
  const capacity = useGame((s) => s.barnCapacity)
  const busy = useGame((s) => s.busy)
  const setBarnOpen = useGame((s) => s.setBarnOpen)
  const sell = useGame((s) => s.sell)
  const signOut = useGame((s) => s.signOut)
  const crops = useCatalog((s) => s.crops)
  if (!open) return null

  const items = crops.filter((c) => (inventory[c.id] ?? 0) > 0)
  const totalValue = items.reduce((sum, c) => sum + c.sellPrice * (inventory[c.id] ?? 0), 0)

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/30 p-4" onClick={() => setBarnOpen(false)}>
      <div className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl bg-[#FFF8EA] p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            Kho · {barnUsed(inventory)}/{capacity}
          </h2>
          <button className="min-h-11 min-w-11 rounded-full bg-black/5 font-bold" onClick={() => setBarnOpen(false)} aria-label="Đóng">
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <p className="py-6 text-center text-sm">Kho trống. Hãy thu hoạch cây chín nhé!</p>
        ) : (
          <ul className="space-y-2">
            {items.map((crop) => {
              const qty = inventory[crop.id] ?? 0
              return (
                <li key={crop.id} className="flex items-center gap-2 rounded-xl bg-white p-2">
                  <span className="inline-block h-4 w-4 shrink-0 rounded-full" style={{ background: crop.produceColor }} />
                  <div className="flex-1">
                    <div className="font-bold">
                      {crop.nameVi} × {qty}
                    </div>
                    <div className="text-xs">{crop.sellPrice} xu / cái</div>
                  </div>
                  <button
                    disabled={busy}
                    className="min-h-11 rounded-lg bg-black/5 px-3 text-sm font-semibold active:scale-95 disabled:opacity-50"
                    onClick={() => void sell(crop.id, 1)}
                  >
                    Bán 1
                  </button>
                  <button
                    disabled={busy}
                    className="min-h-11 rounded-lg bg-[#4E9F3D] px-3 text-sm font-semibold text-white active:scale-95 disabled:opacity-50"
                    onClick={() => void sell(crop.id, qty)}
                  >
                    Bán hết
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {items.length > 0 && <p className="mt-3 text-right text-sm">Tổng giá trị: {formatNumber(totalValue)} xu</p>}

        <button
          className="mt-4 text-xs text-[#3B2F2A]/60 underline"
          onClick={() => {
            if (window.confirm('Đăng xuất? Nếu đang chơi bằng tài khoản khách, bạn sẽ không vào lại được nông trại này.')) void signOut()
          }}
        >
          Đăng xuất
        </button>
      </div>
    </div>
  )
}
