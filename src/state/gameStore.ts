import { create } from 'zustand'
import { api, type PlayerState, type PlotRow, type Profile, type StructureState, type UpgradeKind } from '../services/api'
import { supabase } from '../services/supabase'
import { errorMessage } from '../ui/errorMessages'
import { useCatalog } from './catalogStore'
import { syncServerTime, useClock } from './clock'
import { useWorld } from './worldStore'
import { parcelCenter } from '../logic/grid'
import { plotsInArea } from '../logic/toolArea'

// Phase 2: the server decides everything. This store only keeps a COPY of the server state
// and turns taps into RPC calls (ROADMAP 1.3 B and 1.4). Never change coins/items here.

export type GameStatus = 'loading' | 'signed_out' | 'needs_farm' | 'ready'

export interface Toast {
  id: number
  text: string
  kind: 'info' | 'error' | 'success'
}

interface GameState {
  status: GameStatus
  profile: Profile | null
  plots: PlotRow[]
  /** My pens and processors, with animals and production jobs. */
  structures: StructureState[]
  /** Structure whose panel is open (pen or processor). */
  openStructureId: number | null
  inventory: Record<string, number>
  barnCapacity: number
  selectedSeed: string
  selectedPlotId: number | null
  pendingPlotIds: number[]
  barnOpen: boolean
  busy: boolean
  toast: Toast | null
  /** Time of my last RPC (used to ignore realtime echoes of my own actions). */
  lastActionAt: number

  init: () => () => void
  signInGuest: () => Promise<void>
  signInGoogle: () => Promise<void>
  signOut: () => Promise<void>
  createFarm: (username: string, farmName: string) => Promise<void>
  tapPlot: (parcelId: number, lx: number, ly: number) => void
  buyParcel: (parcelId: number) => Promise<void>
  upgrade: (kind: UpgradeKind, targetId?: number) => Promise<void>
  goHome: () => void
  refreshMyState: () => Promise<void>
  sell: (itemId: string, qty: number) => Promise<void>
  selectSeed: (cropId: string) => void
  setBarnOpen: (open: boolean) => void
  openStructure: (id: number | null) => void
  clearSelection: () => void
  showToast: (text: string, kind?: Toast['kind']) => void
}

export function barnUsed(inventory: Record<string, number>): number {
  return Object.values(inventory).reduce((sum, qty) => sum + qty, 0)
}

let toastId = 0

/** Calls an RPC, measures the round trip, syncs the server clock and stores the returned state. */
async function call<T extends PlayerState>(fn: () => Promise<T | null>): Promise<T | null> {
  const sentAt = Date.now()
  useGame.setState({ lastActionAt: sentAt })
  const state = await fn()
  if (state) {
    syncServerTime(state.server_now, sentAt, Date.now())
    useGame.setState({
      profile: state.profile,
      plots: state.plots,
      structures: state.structures ?? [],
      inventory: state.inventory,
      barnCapacity: state.barn_capacity,
    })
  }
  return state
}

export const useGame = create<GameState>()((set, get) => ({
  status: 'loading',
  profile: null,
  plots: [],
  structures: [],
  openStructureId: null,
  inventory: {},
  barnCapacity: 75,
  selectedSeed: localStorage.getItem('selectedSeed') ?? 'bok_choy',
  selectedPlotId: null,
  pendingPlotIds: [],
  barnOpen: false,
  busy: false,
  toast: null,
  lastActionAt: 0,

  init: () => {
    const load = async () => {
      set({ status: 'loading' })
      try {
        await useCatalog.getState().load()
        const state = await call(api.getMyState)
        if (state) {
          await useWorld.getState().load()
          get().goHome()
        }
        set({ status: state ? 'ready' : 'needs_farm' })
      } catch (err) {
        get().showToast(errorMessage(err), 'error')
        set({ status: 'signed_out' })
      }
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void load()
      else set({ status: 'signed_out' })
    })

    const { data } = supabase.auth.onAuthStateChange((event) => {
      // Do not await Supabase calls inside this callback (supabase-js docs); defer them.
      if (event === 'SIGNED_IN' && get().status === 'signed_out') setTimeout(() => void load(), 0)
      if (event === 'SIGNED_OUT') set({ status: 'signed_out', profile: null, plots: [], structures: [], inventory: {}, openStructureId: null })
    })

    // Realtime keeps nearby parcels fresh; a full reload every 10 minutes and when the tab comes back
    // catches everything else (other players' levels, far-away chunks).
    const refreshWorld = () => {
      if (get().status === 'ready' && document.visibilityState === 'visible') void useWorld.getState().load().catch(() => {})
    }
    const timer = setInterval(refreshWorld, 600_000)
    document.addEventListener('visibilitychange', refreshWorld)

    return () => {
      data.subscription.unsubscribe()
      clearInterval(timer)
      document.removeEventListener('visibilitychange', refreshWorld)
    }
  },

  signInGuest: async () => {
    set({ busy: true })
    const { error } = await supabase.auth.signInAnonymously()
    set({ busy: false })
    if (error) get().showToast('Chưa bật chế độ khách (Anonymous sign-ins) trên Supabase', 'error')
  },

  signInGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) get().showToast('Chưa bật đăng nhập Google trên Supabase', 'error')
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ barnOpen: false })
  },

  createFarm: async (username, farmName) => {
    set({ busy: true })
    try {
      await call(() => api.startGame(username, farmName))
      await useWorld.getState().load()
      get().goHome()
      set({ status: 'ready' })
      get().showToast('Chào mừng tới Làng Ô Vuông!', 'success')
    } catch (err) {
      get().showToast(errorMessage(err), 'error')
    } finally {
      set({ busy: false })
    }
  },

  tapPlot: (parcelId, lx, ly) => {
    const { profile, plots, pendingPlotIds, selectedSeed } = get()
    if (!profile) return
    const plot = plots.find((p) => p.parcel_id === parcelId && p.lx === lx && p.ly === ly)
    if (!plot) {
      // House quadrant of my home parcel: show the parcel card instead.
      set({ selectedPlotId: null })
      useWorld.getState().selectParcel(parcelId)
      return
    }
    useWorld.getState().selectParcel(null)
    if (pendingPlotIds.includes(plot.id)) return

    const now = useClock.getState().now
    const ripe = plot.ready_at !== null && now >= Date.parse(plot.ready_at)
    const growing = plot.crop_item_id !== null && !ripe
    if (growing) {
      set({ selectedPlotId: plot.id })
      return
    }

    // Tool area (GDD 5.3): one tap acts on every matching plot in the area of the tool level.
    const area = plotsInArea(profile.tool_level, plot, plots).filter((p) => !pendingPlotIds.includes(p.id))
    let ids: number[]
    let request: () => Promise<PlayerState>
    if (plot.crop_item_id === null) {
      const seedPrice = useCatalog.getState().cropsById[selectedSeed]?.seedPrice ?? 0
      const affordable = seedPrice > 0 ? Math.floor(profile.coins / seedPrice) : area.length
      ids = area.filter((p) => p.crop_item_id === null).slice(0, Math.max(1, affordable)).map((p) => p.id)
      request = () => api.plant(ids, selectedSeed)
    } else {
      ids = area.filter((p) => p.ready_at !== null && now >= Date.parse(p.ready_at)).map((p) => p.id)
      request = () => api.harvest(ids)
    }
    set({ pendingPlotIds: [...pendingPlotIds, ...ids], selectedPlotId: plot.crop_item_id === null ? plot.id : null })

    call(request)
      .then((state) => {
        if (state?.level_up) get().showToast(`Lên cấp ${state.profile.level}!`, 'success')
        else if (state?.harvested && state.harvested > 1) get().showToast(`Đã gặt ${state.harvested} luống`, 'success')
      })
      .catch((err) => get().showToast(errorMessage(err), 'error'))
      .finally(() => set((s) => ({ pendingPlotIds: s.pendingPlotIds.filter((id) => !ids.includes(id)) })))
  },

  upgrade: async (kind, targetId) => {
    set({ busy: true })
    try {
      const state = await call(() => api.upgrade(kind, targetId))
      if (kind === 'fertility' && targetId && state?.level) useWorld.getState().setFertility(targetId, state.level)
      get().showToast(`Đã nâng cấp lên cấp ${state?.level ?? ''}!`, 'success')
    } catch (err) {
      get().showToast(errorMessage(err), 'error')
    } finally {
      set({ busy: false })
    }
  },

  sell: async (itemId, qty) => {
    if (qty <= 0) return
    set({ busy: true })
    try {
      const coinsBefore = get().profile?.coins ?? 0
      const state = await call(() => api.sell(itemId, qty))
      const earned = (state?.profile.coins ?? coinsBefore) - coinsBefore
      const name = useCatalog.getState().itemsById[itemId]?.nameVi ?? itemId
      get().showToast(`Đã bán ${qty} ${name}: +${earned} xu`, 'success')
    } catch (err) {
      get().showToast(errorMessage(err), 'error')
    } finally {
      set({ busy: false })
    }
  },

  buyParcel: async (parcelId) => {
    set({ busy: true })
    try {
      const state = await call(() => api.buyParcel(parcelId))
      if (state && state.profile) useWorld.getState().setOwner(parcelId, state.profile.id)
      get().showToast(`Đã mua ruộng! −${(state as { price?: number } | null)?.price ?? ''} xu`, 'success')
    } catch (err) {
      get().showToast(errorMessage(err), 'error')
    } finally {
      set({ busy: false })
    }
  },

  refreshMyState: async () => {
    try {
      await call(api.getMyState)
    } catch {
      // ignore: the next action or reload will sync again
    }
  },

  goHome: () => {
    const home = get().profile?.home_parcel_id
    const parcel = home ? useWorld.getState().parcels[home] : undefined
    if (parcel) {
      useWorld.getState().selectParcel(null)
      useWorld.getState().flyTo(...parcelCenter(parcel.x, parcel.y))
    }
  },

  selectSeed: (cropId) => {
    localStorage.setItem('selectedSeed', cropId)
    set({ selectedSeed: cropId })
  },
  setBarnOpen: (open) => set({ barnOpen: open }),
  openStructure: (id) => set({ openStructureId: id, selectedPlotId: null }),
  clearSelection: () => set({ selectedPlotId: null }),
  showToast: (text, kind = 'info') => set({ toast: { id: ++toastId, text, kind } }),
}))

/** For panels: run an RPC that returns the player state, keep the store in sync, return the full result. */
export const callGame = call
