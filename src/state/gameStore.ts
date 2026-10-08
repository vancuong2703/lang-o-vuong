import { create } from 'zustand'
import { api, type PlayerState, type PlotRow, type Profile } from '../services/api'
import { supabase } from '../services/supabase'
import { errorMessage } from '../ui/errorMessages'
import { useCatalog } from './catalogStore'
import { syncServerTime, useClock } from './clock'

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
  inventory: Record<string, number>
  barnCapacity: number
  selectedSeed: string
  selectedPlotId: number | null
  pendingPlotIds: number[]
  barnOpen: boolean
  busy: boolean
  toast: Toast | null

  init: () => () => void
  signInGuest: () => Promise<void>
  signInGoogle: () => Promise<void>
  signOut: () => Promise<void>
  createFarm: (username: string, farmName: string) => Promise<void>
  tapPlot: (lx: number, ly: number) => void
  sell: (itemId: string, qty: number) => Promise<void>
  selectSeed: (cropId: string) => void
  setBarnOpen: (open: boolean) => void
  clearSelection: () => void
  showToast: (text: string, kind?: Toast['kind']) => void
}

export function barnUsed(inventory: Record<string, number>): number {
  return Object.values(inventory).reduce((sum, qty) => sum + qty, 0)
}

let toastId = 0

/** Calls an RPC, measures the round trip, syncs the server clock and stores the returned state. */
async function call(fn: () => Promise<PlayerState | null>): Promise<PlayerState | null> {
  const sentAt = Date.now()
  const state = await fn()
  if (state) {
    syncServerTime(state.server_now, sentAt, Date.now())
    useGame.setState({
      profile: state.profile,
      plots: state.plots,
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
  inventory: {},
  barnCapacity: 75,
  selectedSeed: localStorage.getItem('selectedSeed') ?? 'bok_choy',
  selectedPlotId: null,
  pendingPlotIds: [],
  barnOpen: false,
  busy: false,
  toast: null,

  init: () => {
    const load = async () => {
      set({ status: 'loading' })
      try {
        await useCatalog.getState().load()
        const state = await call(api.getMyState)
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
      if (event === 'SIGNED_IN') setTimeout(() => void load(), 0)
      if (event === 'SIGNED_OUT') set({ status: 'signed_out', profile: null, plots: [], inventory: {} })
    })
    return () => data.subscription.unsubscribe()
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
      set({ status: 'ready' })
      get().showToast('Chào mừng tới Làng Ô Vuông!', 'success')
    } catch (err) {
      get().showToast(errorMessage(err), 'error')
    } finally {
      set({ busy: false })
    }
  },

  tapPlot: (lx, ly) => {
    const { profile, plots, pendingPlotIds, selectedSeed } = get()
    if (!profile) return
    const plot = plots.find((p) => p.parcel_id === profile.home_parcel_id && p.lx === lx && p.ly === ly)
    if (!plot) {
      set({ selectedPlotId: null })
      return
    }
    if (pendingPlotIds.includes(plot.id)) return

    const now = useClock.getState().now
    const ripe = plot.ready_at !== null && now >= Date.parse(plot.ready_at)
    const growing = plot.crop_item_id !== null && !ripe
    if (growing) {
      set({ selectedPlotId: plot.id })
      return
    }

    const request = plot.crop_item_id === null ? () => api.plant([plot.id], selectedSeed) : () => api.harvest([plot.id])
    set({ pendingPlotIds: [...pendingPlotIds, plot.id], selectedPlotId: plot.crop_item_id === null ? plot.id : null })

    call(request)
      .then((state) => {
        if (state?.level_up) get().showToast(`Lên cấp ${state.profile.level}!`, 'success')
      })
      .catch((err) => get().showToast(errorMessage(err), 'error'))
      .finally(() => set((s) => ({ pendingPlotIds: s.pendingPlotIds.filter((id) => id !== plot.id) })))
  },

  sell: async (itemId, qty) => {
    if (qty <= 0) return
    set({ busy: true })
    try {
      const coinsBefore = get().profile?.coins ?? 0
      const state = await call(() => api.sell(itemId, qty))
      const earned = (state?.profile.coins ?? coinsBefore) - coinsBefore
      const name = useCatalog.getState().cropsById[itemId]?.nameVi ?? itemId
      get().showToast(`Đã bán ${qty} ${name}: +${earned} xu`, 'success')
    } catch (err) {
      get().showToast(errorMessage(err), 'error')
    } finally {
      set({ busy: false })
    }
  },

  selectSeed: (cropId) => {
    localStorage.setItem('selectedSeed', cropId)
    set({ selectedSeed: cropId })
  },
  setBarnOpen: (open) => set({ barnOpen: open }),
  clearSelection: () => set({ selectedPlotId: null }),
  showToast: (text, kind = 'info') => set({ toast: { id: ++toastId, text, kind } }),
}))
