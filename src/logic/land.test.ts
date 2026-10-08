import { describe, expect, it } from 'vitest'
import { checkBuy, type LandParcel, type LandWorld } from './land'

function makeWorld(parcels: LandParcel[]): LandWorld {
  return {
    at: (x, y) => parcels.find((p) => p.x === x && p.y === y),
    byId: (id) => parcels.find((p) => p.id === id),
  }
}

const base = { zone: 'normal' as const, isHomeSlot: false, prioritySlotId: null, ownerId: null }
const myHome: LandParcel = { ...base, id: 1, x: 2, y: 2, isHomeSlot: true, ownerId: 'me' }
const otherHome: LandParcel = { ...base, id: 2, x: 6, y: 2, isHomeSlot: true, ownerId: 'bob' }
const myZone: LandParcel = { ...base, id: 3, x: 3, y: 2, prioritySlotId: 1 }
const freeLine: LandParcel = { ...base, id: 4, x: 4, y: 2 }
const bobZone: LandParcel = { ...base, id: 5, x: 5, y: 2, prioritySlotId: 2 }
const far: LandParcel = { ...base, id: 6, x: 10, y: 10 }
const lake: LandParcel = { ...base, id: 7, x: 2, y: 3, zone: 'lake' }
const world = makeWorld([myHome, otherHome, myZone, freeLine, bobZone, far, lake])
const me = { id: 'me', coins: 1000, ownedCount: 1, maxParcels: 3 }

describe('checkBuy (GDD 6.5)', () => {
  it('allows a neighbour in my own priority zone', () => {
    expect(checkBuy(myZone, me, world)).toEqual({ price: 500, block: null })
  })

  it('blocks owned, special and far parcels', () => {
    expect(checkBuy(myHome, me, world).block).toBe('ALREADY_OWNED')
    expect(checkBuy(lake, me, world).block).toBe('NOT_BUYABLE')
    expect(checkBuy(far, me, world).block).toBe('NOT_ADJACENT')
  })

  it("blocks another player's priority zone", () => {
    const owningFreeLine = makeWorld([myHome, otherHome, { ...myZone, ownerId: 'me' }, { ...freeLine, ownerId: 'me' }, bobZone])
    expect(checkBuy(bobZone, { ...me, ownedCount: 3, maxParcels: 6 }, owningFreeLine).block).toBe('PRIORITY_ZONE')
  })

  it('blocks when over the house limit or short of coins', () => {
    expect(checkBuy(myZone, { ...me, ownedCount: 3 }, world).block).toBe('LAND_LIMIT')
    expect(checkBuy(myZone, { ...me, coins: 499 }, world).block).toBe('NOT_ENOUGH_COINS')
  })
})
