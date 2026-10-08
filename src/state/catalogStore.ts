import { create } from 'zustand'
import { CROP_VISUALS, DEFAULT_CROP_VISUAL, type CropVisual } from '../game/data/cropVisuals'
import { itemColor } from '../game/data/itemVisuals'
import { api, type AnimalTypeRow, type ItemRow, type RecipeRow, type StructureTypeRow, type UpgradeLevelRow } from '../services/api'

// Game config loaded from the database (game_config, items, crops, structures, animals, recipes, upgrades),
// merged with how things look. Balance numbers always come from the database (AGENTS.md rule 5).

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

export interface ItemDef {
  id: string
  nameVi: string
  category: ItemRow['category']
  basePrice: number
  sellable: boolean
  unlockLevel: number
  sortOrder: number
  color: string
}

interface CatalogState {
  crops: CropDef[]
  cropsById: Record<string, CropDef>
  items: ItemDef[]
  itemsById: Record<string, ItemDef>
  structureTypes: StructureTypeRow[]
  structureTypesById: Record<string, StructureTypeRow>
  /** Animal type living in each pen type (key = pen type id). */
  animalByPen: Record<string, AnimalTypeRow>
  /** Recipes of each processor type (key = structure type id), in display order. */
  recipesByStructure: Record<string, RecipeRow[]>
  recipesById: Record<string, RecipeRow>
  houseMaxParcels: number[]
  /** upgrade_levels grouped by kind (house, barn, tool, fertility, or a structure type id); index 0 = level 1. */
  upgrades: Record<string, UpgradeLevelRow[]>
  /** Base coins for login streak day 1..7 (GDD 8.4). */
  loginRewards: number[]
  loaded: boolean
  load: () => Promise<void>
}

function groupBy<T>(rows: T[], key: (row: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {}
  for (const row of rows) (out[key(row)] ??= []).push(row)
  return out
}

export const useCatalog = create<CatalogState>((set, get) => ({
  crops: [],
  cropsById: {},
  items: [],
  itemsById: {},
  structureTypes: [],
  structureTypesById: {},
  animalByPen: {},
  recipesByStructure: {},
  recipesById: {},
  houseMaxParcels: [3, 6, 10, 16, 25],
  upgrades: { house: [], barn: [], tool: [], fertility: [] },
  loginRewards: [50, 80, 120, 160, 220, 300, 500],
  loaded: false,

  load: async () => {
    if (get().loaded) return
    const [cropRows, levels, config, itemRows, structureTypes, animalTypes, recipes] = await Promise.all([
      api.loadCrops(),
      api.loadUpgradeLevels(),
      api.loadConfig(),
      api.loadItems(),
      api.loadStructureTypes(),
      api.loadAnimalTypes(),
      api.loadRecipes(),
    ])

    const crops = cropRows
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

    const items = itemRows
      .map(
        (r): ItemDef => ({
          id: r.id,
          nameVi: r.name_vi,
          category: r.category,
          basePrice: r.base_price,
          sellable: r.sellable,
          unlockLevel: r.unlock_level,
          sortOrder: r.sort_order,
          color: itemColor(r.id),
        }),
      )
      .sort((a, b) => a.sortOrder - b.sortOrder)

    const upgrades: Record<string, UpgradeLevelRow[]> = { house: [], barn: [], tool: [], fertility: [], ...groupBy(levels, (r) => r.kind) }
    const houseMaxParcels = upgrades.house.length ? upgrades.house.map((r) => r.value) : get().houseMaxParcels
    const loginRewards = Array.isArray(config.login_rewards) ? (config.login_rewards as number[]) : get().loginRewards

    set({
      crops,
      cropsById: Object.fromEntries(crops.map((c) => [c.id, c])),
      items,
      itemsById: Object.fromEntries(items.map((i) => [i.id, i])),
      structureTypes,
      structureTypesById: Object.fromEntries(structureTypes.map((t) => [t.id, t])),
      animalByPen: Object.fromEntries(animalTypes.map((a) => [a.pen_type_id, a])),
      recipesByStructure: groupBy(recipes, (r) => r.structure_type_id),
      recipesById: Object.fromEntries(recipes.map((r) => [r.id, r])),
      houseMaxParcels,
      upgrades,
      loginRewards,
      loaded: true,
    })
  },
}))
