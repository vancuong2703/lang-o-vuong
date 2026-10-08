// Land purchase rules (GDD 6.5), client copy used only for HINTS in the UI.
// The server (public.buy_parcel) checks the same rules and has the final word.
import { landPrice } from './progression'

export type Zone = 'normal' | 'town' | 'lake' | 'forest' | 'alluvial'

export interface LandParcel {
  id: number
  x: number
  y: number
  zone: Zone
  isHomeSlot: boolean
  prioritySlotId: number | null
  ownerId: string | null
}

export interface LandWorld {
  at: (x: number, y: number) => LandParcel | undefined
  byId: (id: number) => LandParcel | undefined
}

export type BuyBlock = 'ALREADY_OWNED' | 'NOT_BUYABLE' | 'NOT_ADJACENT' | 'PRIORITY_ZONE' | 'LAND_LIMIT' | 'NOT_ENOUGH_COINS'

export interface BuyCheck {
  price: number
  block: BuyBlock | null
}

const NEIGHBOURS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const

export function checkBuy(
  parcel: LandParcel,
  me: { id: string; coins: number; ownedCount: number; maxParcels: number },
  world: LandWorld,
): BuyCheck {
  const price = landPrice(me.ownedCount)
  const result = (block: BuyBlock | null): BuyCheck => ({ price, block })

  if (parcel.ownerId !== null) return result('ALREADY_OWNED')
  if (parcel.zone !== 'normal' || parcel.isHomeSlot) return result('NOT_BUYABLE')
  const adjacent = NEIGHBOURS.some(([dx, dy]) => world.at(parcel.x + dx, parcel.y + dy)?.ownerId === me.id)
  if (!adjacent) return result('NOT_ADJACENT')
  if (parcel.prioritySlotId !== null && world.byId(parcel.prioritySlotId)?.ownerId !== me.id) return result('PRIORITY_ZONE')
  if (me.ownedCount >= me.maxParcels) return result('LAND_LIMIT')
  if (me.coins < price) return result('NOT_ENOUGH_COINS')
  return result(null)
}
