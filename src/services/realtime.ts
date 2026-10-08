import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'

// Realtime (ROADMAP 1.3 C): listen ONLY to the chunks around the camera.
// Messages are "doorbells" ({ parcel_id }); the caller re-reads real data from the database.
// Channels are private: the server only lets players listen, never broadcast (migration 20261008150000).

const chunkChannels = new Map<string, RealtimeChannel>()
let village: RealtimeChannel | null = null

function logStatus(name: string, status: string, err?: Error) {
  // The first connection of the day may report MissingPartition; supabase-js rejoins by itself.
  if (import.meta.env.DEV && status !== 'SUBSCRIBED') console.info(`[realtime] ${name}: ${status}`, err?.message ?? '')
}

/** Required once after login so private channels carry the user's token. */
export async function prepareRealtimeAuth() {
  await supabase.realtime.setAuth()
}

/** Join the chunk channels in `keys` ("cx:cy"), leave all others. */
export function syncChunkChannels(keys: string[], onParcelChanged: (parcelId: number) => void) {
  const wanted = new Set(keys)
  for (const [key, channel] of chunkChannels) {
    if (!wanted.has(key)) {
      void supabase.removeChannel(channel)
      chunkChannels.delete(key)
    }
  }
  for (const key of wanted) {
    if (chunkChannels.has(key)) continue
    const channel = supabase
      .channel(`chunk:${key}`, { config: { private: true } })
      .on('broadcast', { event: 'parcel_changed' }, ({ payload }) => {
        const id = Number((payload as { parcel_id?: unknown } | undefined)?.parcel_id)
        if (Number.isFinite(id)) onParcelChanged(id)
      })
      .subscribe((status, err) => logStatus(`chunk:${key}`, status, err))
    chunkChannels.set(key, channel)
  }
}

/** Presence: who is online in the village right now. */
export function joinVillage(userId: string, onOnline: (userIds: string[]) => void) {
  leaveVillage()
  const channel = supabase.channel('village', { config: { private: true, presence: { key: userId } } })
  channel
    .on('presence', { event: 'sync' }, () => onOnline(Object.keys(channel.presenceState())))
    .subscribe((status, err) => {
      logStatus('village', status, err)
      if (status === 'SUBSCRIBED') void channel.track({ online_at: new Date().toISOString() })
    })
  village = channel
}

export function leaveVillage() {
  if (village) void supabase.removeChannel(village)
  village = null
}

export function stopRealtime() {
  leaveVillage()
  for (const channel of chunkChannels.values()) void supabase.removeChannel(channel)
  chunkChannels.clear()
}
