import type { ItemDef } from '../../state/catalogStore'
import { useCatalog } from '../../state/catalogStore'
import { barnUsed, useGame } from '../../state/gameStore'
import { formatNumber } from '../format'

// The barn holds every item (GDD 3.1), grouped by category. Feed is an intermediate good and cannot be sold.

const GROUPS: { category: ItemDef['category']; title: string }[] = [
  { category: 'crop', title: 'Nông sản' },
  { category: 'animal_product', title: 'Sản phẩm chăn nuôi' },
  { category: 'processed', title: 'Hàng chế biến' },
  { category: 'feed', title: 'Thức ăn chăn nuôi' },
  { category: 'rare', title: 'Vật phẩm hiếm' },
]

export function BarnPanel() {
  const open = useGame((s) => s.barnOpen)
  const inventory = useGame((s) => s.inventory)
  const capacity = useGame((s) => s.barnCapacity)
  const busy = useGame((s) => s.busy)
  const setBarnOpen = useGame((s) => s.setBarnOpen)
  const sell = useGame((s) => s.sell)
  const signOut = useGame((s) => s.signOut)
  const allItems = useCatalog((s) => s.items)
  if (!open) return null

  const owned = allItems.filter((i) => (inventory[i.id] ?? 0) > 0)
  const totalValue = owned.filter((i) => i.sellable).reduce((sum, i) => sum + i.basePrice * (inventory[i.id] ?? 0), 0)

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 p-4" onClick={() => setBarnOpen(false)}>
      <div className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl bg-[#FFF8EA] p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            Kho · {barnUsed(inventory)}/{capacity}
          </h2>
          <button className="min-h-11 min-w-11 rounded-full bg-black/5 font-bold" onClick={() => setBarnOpen(false)} aria-label="Đóng">
            ✕
          </button>
        </div>

        {owned.length === 0 ? (
          <p className="py-6 text-center text-sm">Kho trống. Hãy thu hoạch cây chín nhé!</p>
        ) : (
          GROUPS.map(({ category, title }) => {
            const items = owned.filter((i) => i.category === category)
            if (items.length === 0) return null
            return (
              <section key={category} className="mb-3">
                <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[#3B2F2A]/60">{title}</h3>
                <ul className="space-y-2">
                  {items.map((item) => {
                    const qty = inventory[item.id] ?? 0
                    return (
                      <li key={item.id} className="flex items-center gap-2 rounded-xl bg-white p-2">
                        <span className="inline-block h-4 w-4 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: item.color }} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-bold">
                            {item.nameVi} × {qty}
                          </div>
                          <div className="text-xs">{item.sellable ? `${formatNumber(item.basePrice)} xu / cái` : 'Dùng cho vật nuôi, không bán được'}</div>
                        </div>
                        {item.sellable && (
                          <>
                            <button
                              disabled={busy}
                              className="min-h-11 rounded-lg bg-black/5 px-3 text-sm font-semibold active:scale-95 disabled:opacity-50"
                              onClick={() => void sell(item.id, 1)}
                            >
                              Bán 1
                            </button>
                            <button
                              disabled={busy}
                              className="min-h-11 rounded-lg bg-[#4E9F3D] px-3 text-sm font-semibold text-white active:scale-95 disabled:opacity-50"
                              onClick={() => void sell(item.id, qty)}
                            >
                              Bán hết
                            </button>
                          </>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })
        )}

        {owned.length > 0 && <p className="mt-1 text-right text-sm">Tổng giá trị có thể bán: {formatNumber(totalValue)} xu</p>}

        <button
          className="mt-4 text-xs text-[#3B2F2A]/60 underline"
          onClick={() => {
            if (window.confirm('Đăng xuất? Nếu đang chơi bằng tài khoản khách, bạn sẽ không vào lại được điền trang này.')) void signOut()
          }}
        >
          Đăng xuất
        </button>
      </div>
    </div>
  )
}
