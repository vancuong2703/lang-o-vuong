import { create } from 'zustand'
import type { LandParcel, LandWorld, Zone } from '../logic/land'
import { api, type PlayerInfo, type PlotRow } from '../services/api'

// The whole village: every parcel, every player, and the plots of OTHER players.
// My own plots live in gameStore (they come back from every RPC I call).

export interface Parcel extends LandParcel {
  fertility: number
}

interface FlyTarget {
  x: number
  z: number
  id: number
}

interface WorldState {
  loaded: boolean
  parcels: Record<number, Parcel>
  idByXY: Record<string, number>
  players: Record<string, PlayerInfo>
  /** Plots of other players, grouped by parcel id. */
  plotsByParcel: Record<number, PlotRow[]>
  selectedParcelId: number | null
  flyTarget: FlyTarget | null
  neighboursOpen: boolean

  load: () => Promise<void>
  setOwner: (parcelId: number, ownerId: string) => void
  selectParcel: (id: number | null) => void
  flyTo: (x: number, z: number) => void
  setNeighboursOpen: (open: boolean) => void
}

const key = (x: number, y: number) => `${x},${y}`

export const useWorld = create<WorldState>((set) => ({
  loaded: false,
  parcels: {},
  idByXY: {},
  players: {},
  plotsByParcel: {},
  selectedParcelId: null,
  flyTarget: null,
  neighboursOpen: false,

  load: async () => {
    const world = await api.getWorld()
    const parcels: Record<number, Parcel> = {}
    const idByXY: Record<string, number> = {}
    for (const [id, x, y, zone, isHomeSlot, prioritySlotId, ownerId, fertility] of world.parcels) {
      parcels[id] = { id, x, y, zone: zone as Zone, isHomeSlot, prioritySlotId, ownerId, fertility }
      idByXY[key(x, y)] = id
    }
    const plotsByParcel: Record<number, PlotRow[]> = {}
    for (const [id, parcel_id, , lx, ly, crop_item_id, planted_at, ready_at] of world.plots) {
      ;(plotsByParcel[parcel_id] ??= []).push({ id, parcel_id, lx, ly, crop_item_id, planted_at, ready_at })
    }
    const players = Object.fromEntries(world.players.map((p) => [p.id, p]))
    set({ loaded: true, parcels, idByXY, players, plotsByParcel })
  },

  setOwner: (parcelId, ownerId) =>
    set((s) => ({ parcels: { ...s.parcels, [parcelId]: { ...s.parcels[parcelId], ownerId } } })),
  selectParcel: (id) => set({ selectedParcelId: id }),
  flyTo: (x, z) => set((s) => ({ flyTarget: { x, z, id: (s.flyTarget?.id ?? 0) + 1 } })),
  setNeighboursOpen: (open) => set({ neighboursOpen: open }),
}))

/** Lookup helpers in the shape the land rules expect. */
export function landWorld(): LandWorld {
  const { parcels, idByXY } = useWorld.getState()
  return {
    at: (x, y) => parcels[idByXY[key(x, y)]],
    byId: (id) => parcels[id],
  }
}

export function parcelAt(x: number, y: number): Parcel | undefined {
  const { parcels, idByXY } = useWorld.getState()
  return parcels[idByXY[key(x, y)]]
}
