import { create } from 'zustand'
import { CROP_VISUALS, DEFAULT_CROP_VISUAL, type CropVisual } from '../game/data/cropVisuals'
import { api } from '../services/api'

// Game config loaded from the database (game_config, items, crops), merged with how crops look.

export interface CropDef extends CropVisual {
  id: string
  nameVi: string
  nameEn: string
  growSeconds: number
  seedPrice: number
  sellPrice: number
  xp: number
  unlockLevel: number
}

interface CatalogState {
  crops: CropDef[]
  cropsById: Record<string, CropDef>
  houseMaxParcels: number[]
  loaded: boolean
  load: () => Promise<void>
}

export const useCatalog = create<CatalogState>((set, get) => ({
  crops: [],
  cropsById: {},
  houseMaxParcels: [3, 6, 10, 16, 25],
  loaded: false,

  load: async () => {
    if (get().loaded) return
    const [rows, config] = await Promise.all([api.loadCrops(), api.loadConfig()])
    const crops = rows
      .map(
        (r): CropDef => ({
          id: r.item_id,
          nameVi: r.items.name_vi,
          nameEn: r.items.name_en,
          growSeconds: r.grow_seconds,
          seedPrice: r.seed_price,
          sellPrice: r.items.base_price,
          xp: r.xp,
          unlockLevel: r.items.unlock_level,
          ...(CROP_VISUALS[r.item_id] ?? DEFAULT_CROP_VISUAL),
        }),
      )
      .sort((a, b) => a.unlockLevel - b.unlockLevel)
    const houseMaxParcels = Array.isArray(config.house_max_parcels) ? (config.house_max_parcels as number[]) : get().houseMaxParcels
    set({ crops, cropsById: Object.fromEntries(crops.map((c) => [c.id, c])), houseMaxParcels, loaded: true })
  },
}))
