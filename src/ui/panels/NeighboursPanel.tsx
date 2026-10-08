import { parcelCenter } from '../../logic/grid'
import { landTitle } from '../../logic/titles'
import { useGame } from '../../state/gameStore'
import { useWorld } from '../../state/worldStore'

/** List of every farm in the village; tap one to fly there. */
export function NeighboursPanel() {
  const open = useWorld((s) => s.neighboursOpen)
  const players = useWorld((s) => s.players)
  const parcels = useWorld((s) => s.parcels)
  const setOpen = useWorld((s) => s.setNeighboursOpen)
  const flyTo = useWorld((s) => s.flyTo)
  const selectParcel = useWorld((s) => s.selectParcel)
  const myId = useGame((s) => s.profile?.id)
  const clearSelection = useGame((s) => s.clearSelection)
  if (!open) return null

  const list = Object.values(players).sort((a, b) => b.level - a.level || a.farm_name.localeCompare(b.farm_name))
  const landCount = (id: string) => Object.values(parcels).filter((p) => p.ownerId === id).length

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 p-4" onClick={() => setOpen(false)}>
      <div className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl bg-[#FFF8EA] p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Các nhà trong làng · {list.length}</h2>
          <button className="min-h-11 min-w-11 rounded-full bg-black/5 font-bold" onClick={() => setOpen(false)} aria-label="Đóng">
            ✕
          </button>
        </div>
        <ul className="space-y-2">
          {list.map((p) => {
            const home = parcels[p.home_parcel_id]
            return (
              <li key={p.id} className="flex items-center gap-2 rounded-xl bg-white p-2">
                <div className="flex-1">
                  <div className="font-bold">
                    {p.farm_name} {p.id === myId && <span className="text-xs text-[#4E9F3D]">(bạn)</span>}
                  </div>
                  <div className="text-xs">
                    {p.username} · Cấp {p.level} · {landTitle(landCount(p.id))} · {landCount(p.id)} mảnh ruộng
                  </div>
                </div>
                {home && (
                  <button
                    className="min-h-11 rounded-lg bg-[#4E9F3D] px-3 text-sm font-semibold text-white active:scale-95"
                    onClick={() => {
                      clearSelection()
                      flyTo(...parcelCenter(home.x, home.y))
                      selectParcel(home.id)
                      setOpen(false)
                    }}
                  >
                    Thăm
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
