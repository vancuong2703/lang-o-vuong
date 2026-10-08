import { supabase } from './supabase'

// One function per RPC (ROADMAP 2.8). The server decides every result; the client only sends intents.
// Types are hand-written for now; later we generate them with `supabase gen types`.

export interface Profile {
  id: string
  username: string
  farm_name: string
  avatar_color: string
  coins: number
  xp: number
  level: number
  barn_level: number
  tool_level: number
  house_level: number
  home_parcel_id: number
}

export interface PlotRow {
  id: number
  parcel_id: number
  lx: number
  ly: number
  crop_item_id: string | null
  planted_at: string | null
  ready_at: string | null
}

export interface PlayerState {
  profile: Profile
  barn_capacity: number
  inventory: Record<string, number>
  plots: PlotRow[]
  server_now: string
  harvested?: number
  level_up?: boolean
  upgraded?: UpgradeKind
  level?: number
  target?: number | null
}

export type UpgradeKind = 'house' | 'barn' | 'tool' | 'fertility'

export interface UpgradeLevelRow {
  kind: UpgradeKind
  level: number
  cost: number
  required_player_level: number
  value: number
}

/** get_world compact rows (see migration 20261008130000). */
export type ParcelTuple = [number, number, number, string, boolean, number | null, string | null, number]
export type PlotTuple = [number, number, string, number, number, string | null, string | null, string | null]

export interface PlayerInfo {
  id: string
  username: string
  farm_name: string
  level: number
  avatar_color: string
  home_parcel_id: number
}

export interface WorldPayload {
  parcels: ParcelTuple[]
  players: PlayerInfo[]
  plots: PlotTuple[]
  server_now: string
}

export interface CropRow {
  item_id: string
  seed_price: number
  grow_seconds: number
  xp: number
  items: { name_vi: string; name_en: string; base_price: number; unlock_level: number; sort_order: number }
}

/** Error with the server's error code, e.g. NOT_ENOUGH_COINS (ROADMAP 2.11). */
export class GameError extends Error {
  readonly code: string
  constructor(code: string) {
    super(code)
    this.code = code
  }
}

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw new GameError(error.message)
  return data as T
}

export const api = {
  getMyState: () => rpc<PlayerState | null>('get_my_state'),
  startGame: (username: string, farmName: string) =>
    rpc<PlayerState>('start_game', { p_username: username, p_farm_name: farmName }),
  plant: (plotIds: number[], cropId: string) => rpc<PlayerState>('plant', { p_plot_ids: plotIds, p_crop_id: cropId }),
  harvest: (plotIds: number[]) => rpc<PlayerState>('harvest', { p_plot_ids: plotIds }),
  sell: (itemId: string, qty: number) => rpc<PlayerState>('sell', { p_item_id: itemId, p_qty: qty }),
  serverNow: () => rpc<string>('server_now'),
  getWorld: () => rpc<WorldPayload>('get_world'),
  buyParcel: (parcelId: number) => rpc<PlayerState & { price: number }>('buy_parcel', { p_parcel_id: parcelId }),
  upgrade: (kind: UpgradeKind, targetId?: number) => rpc<PlayerState>('upgrade', { p_kind: kind, p_target_id: targetId ?? null }),

  async loadUpgradeLevels(): Promise<UpgradeLevelRow[]> {
    const { data, error } = await supabase.from('upgrade_levels').select('kind, level, cost, required_player_level, value').order('level')
    if (error) throw new GameError(error.message)
    return (data as UpgradeLevelRow[]).map((r) => ({ ...r, cost: Number(r.cost), value: Number(r.value) }))
  },

  async loadConfig(): Promise<Record<string, unknown>> {
    const { data, error } = await supabase.from('game_config').select('key, value')
    if (error) throw new GameError(error.message)
    return Object.fromEntries((data as { key: string; value: unknown }[]).map((r) => [r.key, r.value]))
  },

  async loadCrops(): Promise<CropRow[]> {
    const { data, error } = await supabase
      .from('crops')
      .select('item_id, seed_price, grow_seconds, xp, items(name_vi, name_en, base_price, unlock_level, sort_order)')
    if (error) throw new GameError(error.message)
    return data as unknown as CropRow[]
  },
}
