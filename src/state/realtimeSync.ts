import { useEffect } from 'react'
import { joinVillage, prepareRealtimeAuth, stopRealtime, syncChunkChannels } from '../services/realtime'
import { useGame } from './gameStore'
import { useWorld } from './worldStore'

/** Ignore doorbells about my own parcels right after my own action (I already have the new state). */
const SELF_ECHO_MS = 3000
/** Many changes to one parcel within this window cause a single re-read. */
const DEBOUNCE_MS = 300

/** Keeps the village in sync while the game is running (ROADMAP GĐ4). */
export function useRealtimeSync(enabled: boolean) {
  const myId = useGame((s) => s.profile?.id)

  useEffect(() => {
    if (!enabled || !myId) return
    const timers = new Map<number, ReturnType<typeof setTimeout>>()

    const handle = async (parcelId: number) => {
      const game = useGame.getState()
      const before = useWorld.getState().parcels[parcelId]
      if (before?.ownerId === myId) {
        // My own parcel changed: from this device (ignore) or from another device (re-read my state).
        if (Date.now() - game.lastActionAt > SELF_ECHO_MS) void game.refreshMyState()
        return
      }
      const after = await useWorld.getState().refreshParcel(parcelId)
      if (after?.ownerId === myId) void game.refreshMyState() // bought on another device
    }

    const onParcelChanged = (parcelId: number) => {
      clearTimeout(timers.get(parcelId))
      timers.set(
        parcelId,
        setTimeout(() => {
          timers.delete(parcelId)
          void handle(parcelId).catch(() => {})
        }, DEBOUNCE_MS),
      )
    }

    let unsubscribe = () => {}
    void prepareRealtimeAuth().then(() => {
      syncChunkChannels(useWorld.getState().visibleChunks, onParcelChanged)
      unsubscribe = useWorld.subscribe((s, prev) => {
        if (s.visibleChunks !== prev.visibleChunks) syncChunkChannels(s.visibleChunks, onParcelChanged)
      })
      joinVillage(myId, (ids) => useWorld.getState().setOnline(ids))
    })

    return () => {
      unsubscribe()
      stopRealtime()
      timers.forEach(clearTimeout)
    }
  }, [enabled, myId])
}
