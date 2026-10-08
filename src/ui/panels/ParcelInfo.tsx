import type { ReactNode } from 'react'
import { parcelCenter } from '../../logic/grid'
import { checkBuy, type BuyBlock } from '../../logic/land'
import { useCatalog } from '../../state/catalogStore'
import { useGame } from '../../state/gameStore'
import { landWorld, useWorld } from '../../state/worldStore'
import { formatNumber } from '../format'

const ZONE_LABEL = {
  town: 'Quảng trường làng',
  lake: 'Hồ nước',
  forest: 'Rừng',
  alluvial: 'Đất phù sa (sắp đấu giá)',
  normal: 'Ruộng hoang',
}

const BLOCK_TEXT: Record<BuyBlock, string> = {
  ALREADY_OWNED: 'Đã có chủ',
  NOT_BUYABLE: 'Không bán khu này',
  NOT_ADJACENT: 'Chỉ mua được ruộng liền kề ruộng nhà mình',
  PRIORITY_ZONE: 'Vùng ưu tiên của người khác',
  LAND_LIMIT: 'Hãy nâng cấp nhà để có thêm ruộng',
  NOT_ENOUGH_COINS: 'Chưa đủ xu',
}

/** Card for the selected parcel: owner info, visit, or buy. */
export function ParcelInfo() {
  const parcel = useWorld((s) => (s.selectedParcelId ? s.parcels[s.selectedParcelId] : undefined))
  const owner = useWorld((s) => (parcel?.ownerId ? s.players[parcel.ownerId] : undefined))
  const parcels = useWorld((s) => s.parcels)
  const selectParcel = useWorld((s) => s.selectParcel)
  const flyTo = useWorld((s) => s.flyTo)
  const profile = useGame((s) => s.profile)
  const busy = useGame((s) => s.busy)
  const buyParcel = useGame((s) => s.buyParcel)
  const houseMax = useCatalog((s) => s.houseMaxParcels)
  const fertilityLevels = useCatalog((s) => s.upgrades.fertility)
  const upgrade = useGame((s) => s.upgrade)
  if (!parcel || !profile) return null

  const ownedCount = Object.values(parcels).filter((p) => p.ownerId === profile.id).length
  const maxParcels = houseMax[profile.house_level - 1] ?? 3
  const mine = parcel.ownerId === profile.id

  let body: ReactNode
  if (mine) {
    const fertility = fertilityLevels.find((r) => r.level === parcel.fertility)
    const nextFertility = fertilityLevels.find((r) => r.level === parcel.fertility + 1)
    body = (
      <>
        <p className="text-sm">
          Ruộng nhà mình{parcel.id === profile.home_parcel_id ? ' (đất hương hỏa)' : ''}. Chạm vào luống để gieo hoặc thu hoạch.
        </p>
        <p className="mt-1 text-sm">
          Độ phì nhiêu cấp {parcel.fertility}
          {fertility && fertility.value > 0 ? ` · cây lớn nhanh hơn ${Math.round(fertility.value * 100)}%` : ''}
        </p>
        {nextFertility && (
          <button
            disabled={busy || profile.coins < nextFertility.cost}
            className="mt-2 min-h-11 w-full rounded-xl bg-[#8B5E3C] font-bold text-white active:scale-95 disabled:opacity-40"
            onClick={() => void upgrade('fertility', parcel.id)}
          >
            Bón đất lên cấp {nextFertility.level} (+{Math.round(nextFertility.value * 100)}%) · {formatNumber(nextFertility.cost)} xu
          </button>
        )}
      </>
    )
  } else if (owner) {
    const home = parcels[owner.home_parcel_id]
    body = (
      <>
        <p className="text-sm">
          <b>{owner.farm_name}</b> của {owner.username} · Cấp {owner.level}
        </p>
        {home && (
          <button
            className="mt-2 min-h-11 w-full rounded-xl bg-[#4E9F3D] font-bold text-white active:scale-95"
            onClick={() => flyTo(...parcelCenter(home.x, home.y))}
          >
            Sang chơi nhà
          </button>
        )}
      </>
    )
  } else if (parcel.zone !== 'normal' || parcel.isHomeSlot) {
    body = <p className="text-sm">{parcel.isHomeSlot ? 'Đất dành cho gia đình mới về làng.' : 'Khu vực này không bán.'}</p>
  } else {
    const { price, block } = checkBuy(parcel, { id: profile.id, coins: profile.coins, ownedCount, maxParcels }, landWorld())
    body = (
      <>
        <p className="text-sm">
          Giá: <b>{formatNumber(price)} xu</b> · Nhà bạn có {ownedCount}/{maxParcels} mảnh
        </p>
        {block && <p className="mt-1 text-xs text-[#C0473A]">{BLOCK_TEXT[block]}</p>}
        <button
          disabled={busy || block !== null}
          className="mt-2 min-h-11 w-full rounded-xl bg-[#4E9F3D] font-bold text-white active:scale-95 disabled:opacity-40"
          onClick={() => void buyParcel(parcel.id)}
        >
          Mua mảnh ruộng này
        </button>
      </>
    )
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-32 z-20 flex justify-center px-3">
      <div className="pointer-events-auto w-72 rounded-2xl bg-white/95 px-4 py-3 shadow-lg">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="font-bold">
            {mine ? 'Ruộng nhà mình' : owner ? 'Ruộng nhà hàng xóm' : ZONE_LABEL[parcel.zone]}{' '}
            <span className="text-xs font-normal text-[#3B2F2A]/60">
              ({parcel.x}, {parcel.y})
            </span>
          </h3>
          <button className="-mr-2 -mt-1 min-h-9 min-w-9 rounded-full text-sm" onClick={() => selectParcel(null)} aria-label="Đóng">
            ✕
          </button>
        </div>
        {body}
      </div>
    </div>
  )
}
