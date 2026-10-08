import { useMemo, useState } from 'react'
import { quadrantOf, quadrantOrigin } from '../../logic/grid'
import { api } from '../../services/api'
import { useCatalog } from '../../state/catalogStore'
import { callGame, useGame } from '../../state/gameStore'
import { useWorld } from '../../state/worldStore'
import { QuadrantIcon } from '../components/ItemDot'
import { errorMessage } from '../errorMessages'
import { formatNumber } from '../format'

// Build a pen or processor (GDD 3.3, 3.4). It needs one 2x2 corner of your own field with 4 EMPTY plots.

interface Spot {
  parcelId: number
  x: number
  y: number
  quadrant: number
  home: boolean
}

export function BuildPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const types = useCatalog((s) => s.structureTypes)
  const profile = useGame((s) => s.profile)
  const plots = useGame((s) => s.plots)
  const structures = useGame((s) => s.structures)
  const showToast = useGame((s) => s.showToast)
  const openStructure = useGame((s) => s.openStructure)
  const parcels = useWorld((s) => s.parcels)
  const flyTo = useWorld((s) => s.flyTo)
  const [typeId, setTypeId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Corners of my parcels where all 4 plots exist and are empty (the server checks the same rule).
  const spots = useMemo<Spot[]>(() => {
    if (!profile) return []
    const byCorner = new Map<string, { total: number; empty: number }>()
    for (const p of plots) {
      const k = `${p.parcel_id}:${quadrantOf(p.lx, p.ly)}`
      const v = byCorner.get(k) ?? { total: 0, empty: 0 }
      v.total += 1
      if (p.crop_item_id === null) v.empty += 1
      byCorner.set(k, v)
    }
    const list: Spot[] = []
    for (const [k, v] of byCorner) {
      if (v.total !== 4 || v.empty !== 4) continue
      const [parcelId, quadrant] = k.split(':').map(Number)
      const parcel = parcels[parcelId]
      if (!parcel) continue
      list.push({ parcelId, x: parcel.x, y: parcel.y, quadrant, home: parcelId === profile.home_parcel_id })
    }
    return list.sort((a, b) => Number(b.home) - Number(a.home) || a.parcelId - b.parcelId || a.quadrant - b.quadrant)
  }, [plots, parcels, profile])

  if (!open || !profile) return null
  const selected = types.find((t) => t.id === typeId)

  const build = async (spot: Spot) => {
    if (!selected) return
    setBusy(true)
    try {
      const result = await callGame(() => api.buildStructure(spot.parcelId, spot.quadrant, selected.id))
      showToast(`Đã xây ${selected.name_vi}!`, 'success')
      const [qx, qz] = quadrantOrigin(spot.x, spot.y, spot.quadrant)
      flyTo(qx + 1, qz + 1)
      onClose()
      setTypeId(null)
      if (result?.built_structure_id) openStructure(result.built_structure_id)
    } catch (err) {
      showToast(errorMessage(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl bg-[#FFF8EA] p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">{selected ? `Xây ${selected.name_vi}` : 'Xây chuồng trại & xưởng'}</h2>
          <button className="min-h-11 min-w-11 rounded-full bg-black/5 font-bold" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>

        {!selected ? (
          <ul className="space-y-2">
            {types.map((t) => {
              const built = structures.filter((s) => s.type_id === t.id).length
              const locked = profile.level < t.unlock_level
              const maxed = built >= t.max_per_player
              return (
                <li key={t.id} className={`flex items-center gap-2 rounded-xl bg-white p-3 ${locked ? 'opacity-50' : ''}`}>
                  <div className="flex-1">
                    <div className="font-bold">{t.name_vi}</div>
                    <div className="text-xs">
                      {t.kind === 'pen' ? 'Chuồng nuôi' : 'Xưởng chế biến'} · {formatNumber(t.build_price)} xu
                      {locked ? ` · mở ở cấp ${t.unlock_level}` : maxed ? ' · đã xây' : ''}
                    </div>
                  </div>
                  <button
                    disabled={locked || maxed || profile.coins < t.build_price}
                    className="min-h-11 rounded-lg bg-[#4E9F3D] px-4 text-sm font-semibold text-white active:scale-95 disabled:opacity-40"
                    onClick={() => setTypeId(t.id)}
                  >
                    Chọn
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <>
            <p className="mb-2 text-sm">
              Chọn một góc ruộng trống (4 luống không có cây). Xây xong, 4 luống ở góc đó sẽ thành{' '}
              {selected.kind === 'pen' ? 'chuồng' : 'xưởng'}.
            </p>
            {spots.length === 0 ? (
              <p className="rounded-xl bg-white p-3 text-sm text-[#C0473A]">
                Chưa có góc nào trống. Hãy thu hoạch một góc 2×2 hoặc mua thêm ruộng.
              </p>
            ) : (
              <ul className="space-y-2">
                {spots.map((spot) => {
                  const [qx, qz] = quadrantOrigin(spot.x, spot.y, spot.quadrant)
                  return (
                    <li key={`${spot.parcelId}:${spot.quadrant}`} className="flex items-center gap-2 rounded-xl bg-white p-2">
                      <QuadrantIcon quadrant={spot.quadrant} />
                      <div className="flex-1 text-sm">
                        Mảnh ({spot.x}, {spot.y}){spot.home ? ' · đất hương hỏa' : ''}
                      </div>
                      <button className="min-h-11 rounded-lg bg-black/5 px-3 text-sm font-semibold" onClick={() => flyTo(qx + 1, qz + 1)}>
                        Xem
                      </button>
                      <button
                        disabled={busy}
                        className="min-h-11 rounded-lg bg-[#4E9F3D] px-3 text-sm font-semibold text-white active:scale-95 disabled:opacity-40"
                        onClick={() => void build(spot)}
                      >
                        Xây
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            <button className="mt-3 text-sm text-[#3B2F2A]/70 underline" onClick={() => setTypeId(null)}>
              ← Chọn loại khác
            </button>
          </>
        )}
      </div>
    </div>
  )
}
