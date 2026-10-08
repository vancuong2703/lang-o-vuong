import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CROPS_BY_ID, type CropId } from '../game/data/crops'
import { plotFromIndex, quadrantOf } from '../logic/grid'
import { levelFromXp } from '../logic/progression'

// TEMPORARY (phase 1 only): game rules run in the browser and save to localStorage.
// In phase 2 every action here becomes an RPC call and the server decides the result.

export const STARTING_COINS = 150
export const BARN_CAPACITY = 75
export const PLOT_COUNT = 16

export interface PlotState {
  cropId: CropId
  plantedAt: number
  readyAt: number
}

export interface Toast {
  id: number
  text: string
  kind: 'info' | 'error' | 'success'
}

interface GameState {
  coins: number
  xp: number
  /** 16 plots of the home parcel; Q0 holds the house, so those 4 stay unusable. */
  plots: (PlotState | null)[]
  inventory: Partial<Record<CropId, number>>
  selectedSeed: CropId
  selectedPlot: number | null
  barnOpen: boolean
  toast: Toast | null

  tapPlot: (index: number, now: number) => void
  sell: (cropId: CropId, qty: number) => void
  selectSeed: (cropId: CropId) => void
  setBarnOpen: (open: boolean) => void
  clearSelection: () => void
  reset: () => void
}

/** Plots inside quadrant 0 belong to the house. */
export function isHousePlot(index: number): boolean {
  const { plotX, plotY } = plotFromIndex(index)
  return quadrantOf(plotX, plotY) === 0
}

export function barnUsed(inventory: Partial<Record<CropId, number>>): number {
  return Object.values(inventory).reduce((sum, qty) => sum + (qty ?? 0), 0)
}

let toastId = 0
const makeToast = (text: string, kind: Toast['kind'] = 'info'): Toast => ({ id: ++toastId, text, kind })

const initialData = () => ({
  coins: STARTING_COINS,
  xp: 0,
  plots: Array<PlotState | null>(PLOT_COUNT).fill(null),
  inventory: {},
})

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialData(),
      selectedSeed: 'bok_choy',
      selectedPlot: null,
      barnOpen: false,
      toast: null,

      tapPlot: (index, now) => {
        if (isHousePlot(index)) {
          set({ selectedPlot: null })
          return
        }
        const state = get()
        const plot = state.plots[index]

        // Empty plot -> plant the selected seed.
        if (!plot) {
          const crop = CROPS_BY_ID[state.selectedSeed]
          const { level } = levelFromXp(state.xp)
          if (level < crop.unlockLevel) {
            set({ toast: makeToast(`Cần cấp ${crop.unlockLevel} để trồng ${crop.nameVi}`, 'error') })
            return
          }
          if (state.coins < crop.seedPrice) {
            set({ toast: makeToast('Không đủ xu', 'error') })
            return
          }
          const plots = [...state.plots]
          plots[index] = { cropId: crop.id, plantedAt: now, readyAt: now + crop.growSeconds * 1000 }
          set({ plots, coins: state.coins - crop.seedPrice, selectedPlot: index })
          return
        }

        // Ripe plot -> harvest into the barn.
        if (now >= plot.readyAt) {
          if (barnUsed(state.inventory) >= BARN_CAPACITY) {
            set({ toast: makeToast('Kho đầy rồi, hãy bán bớt nhé', 'error') })
            return
          }
          const crop = CROPS_BY_ID[plot.cropId]
          const plots = [...state.plots]
          plots[index] = null
          const levelBefore = levelFromXp(state.xp).level
          const xp = state.xp + crop.xp
          const levelAfter = levelFromXp(xp).level
          set({
            plots,
            xp,
            inventory: { ...state.inventory, [crop.id]: (state.inventory[crop.id] ?? 0) + 1 },
            selectedPlot: null,
            toast: levelAfter > levelBefore ? makeToast(`Lên cấp ${levelAfter}!`, 'success') : state.toast,
          })
          return
        }

        // Growing plot -> just select it to show the countdown.
        set({ selectedPlot: index })
      },

      sell: (cropId, qty) => {
        const state = get()
        const have = state.inventory[cropId] ?? 0
        const amount = Math.min(qty, have)
        if (amount <= 0) return
        const crop = CROPS_BY_ID[cropId]
        set({
          coins: state.coins + crop.sellPrice * amount,
          inventory: { ...state.inventory, [cropId]: have - amount },
          toast: makeToast(`Đã bán ${amount} ${crop.nameVi}: +${crop.sellPrice * amount} xu`, 'success'),
        })
      },

      selectSeed: (cropId) => set({ selectedSeed: cropId }),
      setBarnOpen: (open) => set({ barnOpen: open }),
      clearSelection: () => set({ selectedPlot: null }),
      reset: () => set({ ...initialData(), selectedPlot: null, toast: makeToast('Đã chơi lại từ đầu') }),
    }),
    {
      name: 'lang-o-vuong-phase1',
      partialize: (s) => ({ coins: s.coins, xp: s.xp, plots: s.plots, inventory: s.inventory, selectedSeed: s.selectedSeed }),
    },
  ),
)
