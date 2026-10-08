import { create } from 'zustand'
import { CROP_VISUALS, DEFAULT_CROP_VISUAL, type CropVisual } from '../game/data/cropVisuals'
import { api, type UpgradeKind, type UpgradeLevelRow } from '../services/api'

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
  /** upgrade_levels grouped by kind, index 0 = level 1 (GDD 5). */
  upgrades: Record<UpgradeKind, UpgradeLevelRow[]>
  /** Base coins for login streak day 1..7 (GDD 8.4). */
  loginRewards: number[]
  loaded: boolean
  load: () => Promise<void>
}

export const useCatalog = create<CatalogState>((set, get) => ({
  crops: [],
  cropsById: {},
  houseMaxParcels: [3, 6, 10, 16, 25],
  upgrades: { house: [], barn: [], tool: [], fertility: [] },
  loginRewards: [50, 80, 120, 160, 220, 300, 500],
  loaded: false,

  load: async () => {
    if (get().loaded) return
    const [rows, levels, config] = await Promise.all([api.loadCrops(), api.loadUpgradeLevels(), api.loadConfig()])
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
    const upgrades: Record<UpgradeKind, UpgradeLevelRow[]> = { house: [], barn: [], tool: [], fertility: [] }
    for (const row of levels) upgrades[row.kind].push(row)
    const houseMaxParcels = upgrades.house.length ? upgrades.house.map((r) => r.value) : get().houseMaxParcels
    const loginRewards = Array.isArray(config.login_rewards) ? (config.login_rewards as number[]) : get().loginRewards
    set({ crops, cropsById: Object.fromEntries(crops.map((c) => [c.id, c])), houseMaxParcels, upgrades, loginRewards, loaded: true })
  },
}))
