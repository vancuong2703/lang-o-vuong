import { useCatalog } from '../../state/catalogStore'

/** Small colored dot + Vietnamese name of an item. */
export function ItemName({ itemId, className = '' }: { itemId: string; className?: string }) {
  const item = useCatalog((s) => s.itemsById[itemId])
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="inline-block h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: item?.color ?? '#ccc' }} />
      {item?.nameVi ?? itemId}
    </span>
  )
}

/** 2x2 mini map of a parcel with one quadrant highlighted. */
export function QuadrantIcon({ quadrant }: { quadrant: number }) {
  return (
    <span className="inline-grid h-6 w-6 shrink-0 grid-cols-2 gap-0.5 rounded bg-[#8B5E3C]/20 p-0.5">
      {[0, 1, 2, 3].map((q) => (
        <span key={q} className={`rounded-sm ${q === quadrant ? 'bg-[#4E9F3D]' : 'bg-white/80'}`} />
      ))}
    </span>
  )
}
