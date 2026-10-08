import { useState } from 'react'
import { formatDuration, growthProgress } from '../../logic/growth'
import { api, type PlayerState, type RecipeRow, type StructureState, type UpgradeLevelRow } from '../../services/api'
import { useCatalog } from '../../state/catalogStore'
import { useClock } from '../../state/clock'
import { callGame, useGame } from '../../state/gameStore'
import { ItemName } from '../components/ItemDot'
import { errorMessage } from '../errorMessages'
import { formatNumber } from '../format'

// Panel of one of MY pens or processors (GDD 3.3, 3.4). Every button is one RPC; the server decides.

function useAction() {
  const showToast = useGame((s) => s.showToast)
  const [busy, setBusy] = useState(false)
  const run = async <T extends PlayerState>(fn: () => Promise<T>, success: (r: T) => string) => {
    setBusy(true)
    try {
      const result = await callGame(fn)
      if (result) showToast(result.level_up ? `${success(result)} · Lên cấp ${result.profile.level}!` : success(result), 'success')
    } catch (err) {
      showToast(errorMessage(err), 'error')
    } finally {
      setBusy(false)
    }
  }
  return { busy, run }
}

const BUTTON = 'min-h-11 w-full rounded-xl font-bold active:scale-95 disabled:opacity-40'

// Zustand selectors must return a STABLE value: a new [] on every call makes React re-render forever.
const NO_RECIPES: RecipeRow[] = []
const NO_LEVELS: UpgradeLevelRow[] = []

function PenBody({ structure }: { structure: StructureState }) {
  const animal = useCatalog((s) => s.animalByPen[structure.type_id])
  const capacity = useCatalog((s) => s.upgrades[structure.type_id]?.find((r) => r.level === structure.level)?.value ?? 0)
  const inventory = useGame((s) => s.inventory)
  const profile = useGame((s) => s.profile)
  const now = useClock((s) => s.now)
  const { busy, run } = useAction()
  if (!animal || !profile) return null

  const hungry = structure.animals.filter((a) => a.fed_at === null)
  const ready = structure.animals.filter((a) => a.ready_at !== null && Date.parse(a.ready_at) <= now)
  const working = structure.animals.filter((a) => a.ready_at !== null && Date.parse(a.ready_at) > now)
  const soonest = Math.min(...working.map((a) => Date.parse(a.ready_at!)))
  const feedHave = inventory[animal.feed_item_id] ?? 0
  const full = structure.animals.length >= capacity

  return (
    <div className="space-y-3">
      <p className="text-sm">
        {animal.name_vi}: {structure.animals.length}/{capacity} con · mỗi lượt ăn 1{' '}
        <ItemName itemId={animal.feed_item_id} className="font-semibold" />, sau {formatDuration(animal.cycle_seconds * 1000)} cho 1{' '}
        <ItemName itemId={animal.product_item_id} className="font-semibold" />
      </p>

      <div className="flex flex-wrap gap-1.5">
        {structure.animals.map((a) => {
          const state = a.fed_at === null ? 'hungry' : Date.parse(a.ready_at!) <= now ? 'ready' : 'working'
          const progress = a.fed_at && a.ready_at ? growthProgress(Date.parse(a.fed_at), Date.parse(a.ready_at), now) : 0
          return (
            <span
              key={a.id}
              className={`relative overflow-hidden rounded-lg px-2 py-1 text-xs font-semibold ${
                state === 'ready' ? 'bg-[#4E9F3D] text-white' : state === 'hungry' ? 'bg-black/10' : 'bg-white'
              }`}
            >
              {state === 'working' && (
                <span className="absolute inset-y-0 left-0 bg-[#4E9F3D]/20" style={{ width: `${progress * 100}%` }} />
              )}
              <span className="relative">{state === 'ready' ? 'Có hàng' : state === 'hungry' ? 'Đói' : 'Đang làm'}</span>
            </span>
          )
        })}
        {structure.animals.length === 0 && (
          <span className="text-sm text-[#3B2F2A]/60">Chuồng còn trống, hãy mua {animal.name_vi.toLowerCase()} nhé.</span>
        )}
      </div>
      {working.length > 0 && <p className="text-xs text-[#3B2F2A]/70">Sắp có hàng sau {formatDuration(soonest - now)}</p>}

      <button
        disabled={busy || ready.length === 0}
        className={`${BUTTON} bg-[#4E9F3D] text-white`}
        onClick={() =>
          void run(
            () => api.collectAnimals(structure.id),
            (r) => `Đã thu ${r.collected} sản phẩm`,
          )
        }
      >
        Thu {ready.length > 0 ? ready.length : ''} <ItemName itemId={animal.product_item_id} />
      </button>
      <button
        disabled={busy || hungry.length === 0 || feedHave === 0}
        className={`${BUTTON} bg-[#E9B949] text-[#3B2F2A]`}
        onClick={() =>
          void run(
            () => api.feedAnimals(structure.id),
            (r) => `Đã cho ${r.fed} con ăn`,
          )
        }
      >
        {hungry.length === 0 ? 'Cả chuồng đã được cho ăn' : `Cho ${hungry.length} con ăn · kho có ${feedHave} thức ăn`}
      </button>
      {hungry.length > 0 && feedHave === 0 && (
        <p className="text-xs text-[#C0473A]">
          Hết <ItemName itemId={animal.feed_item_id} />. Hãy làm ở Máy xay thức ăn.
        </p>
      )}
      <button
        disabled={busy || full || profile.coins < animal.price || profile.level < animal.unlock_level}
        className={`${BUTTON} bg-black/5`}
        onClick={() =>
          void run(
            () => api.buyAnimal(structure.id),
            () => `Đã mua thêm 1 ${animal.name_vi.toLowerCase()}`,
          )
        }
      >
        {full ? 'Chuồng đã đầy · nâng cấp để nuôi thêm' : `Mua 1 ${animal.name_vi.toLowerCase()} · ${formatNumber(animal.price)} xu`}
      </button>
    </div>
  )
}

function ProcessorBody({ structure }: { structure: StructureState }) {
  const recipes = useCatalog((s) => s.recipesByStructure[structure.type_id] ?? NO_RECIPES)
  const recipesById = useCatalog((s) => s.recipesById)
  const slots = useCatalog((s) => s.upgrades[structure.type_id]?.find((r) => r.level === structure.level)?.value ?? 2)
  const inventory = useGame((s) => s.inventory)
  const level = useGame((s) => s.profile?.level ?? 1)
  const now = useClock((s) => s.now)
  const { busy, run } = useAction()

  const jobs = [...structure.jobs].sort((a, b) => Date.parse(a.ready_at) - Date.parse(b.ready_at))
  const ready = jobs.filter((j) => Date.parse(j.ready_at) <= now)
  const queueFull = jobs.length >= slots

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1 text-sm font-semibold">
          Hàng đợi {jobs.length}/{slots}
        </p>
        <ul className="space-y-1.5">
          {Array.from({ length: slots }, (_, i) => {
            const job = jobs[i]
            if (!job)
              return (
                <li key={i} className="rounded-lg border-2 border-dashed border-black/10 px-2 py-1.5 text-xs text-[#3B2F2A]/50">
                  Trống
                </li>
              )
            const recipe = recipesById[job.recipe_id]
            const start = Date.parse(job.start_at)
            const end = Date.parse(job.ready_at)
            const done = end <= now
            const waiting = start > now
            return (
              <li key={job.id} className="relative overflow-hidden rounded-lg bg-white px-2 py-1.5 text-xs">
                {!done && !waiting && (
                  <span
                    className="absolute inset-y-0 left-0 bg-[#4E9F3D]/20"
                    style={{ width: `${growthProgress(start, end, now) * 100}%` }}
                  />
                )}
                <span className="relative flex justify-between gap-2">
                  <span>
                    {recipe && <ItemName itemId={recipe.output_item_id} className="font-semibold" />}{' '}
                    {recipe && recipe.output_qty > 1 && `×${recipe.output_qty}`}
                  </span>
                  <span className={done ? 'font-bold text-[#4E9F3D]' : ''}>
                    {done ? 'Xong!' : waiting ? `Chờ, xong sau ${formatDuration(end - now)}` : `còn ${formatDuration(end - now)}`}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <button
        disabled={busy || ready.length === 0}
        className={`${BUTTON} bg-[#4E9F3D] text-white`}
        onClick={() =>
          void run(
            () => api.collectProduction(structure.id),
            (r) => `Đã thu ${r.collected} mẻ hàng`,
          )
        }
      >
        Thu thành phẩm {ready.length > 0 ? `(${ready.length})` : ''}
      </button>

      <div>
        <p className="mb-1 text-sm font-semibold">Làm món mới</p>
        <ul className="space-y-2">
          {recipes.map((recipe) => {
            const locked = level < recipe.unlock_level
            const enough = recipe.recipe_inputs.every((inp) => (inventory[inp.item_id] ?? 0) >= inp.qty)
            return (
              <li key={recipe.id} className={`rounded-xl bg-white p-2.5 ${locked ? 'opacity-50' : ''}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-bold">
                    <ItemName itemId={recipe.output_item_id} /> {recipe.output_qty > 1 && `×${recipe.output_qty}`}
                  </span>
                  <span className="shrink-0 text-xs">
                    {formatDuration(recipe.seconds * 1000)} · +{recipe.xp} XP
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                  {recipe.recipe_inputs.map((inp) => {
                    const have = inventory[inp.item_id] ?? 0
                    return (
                      <span key={inp.item_id}>
                        <ItemName itemId={inp.item_id} />{' '}
                        <b className={have >= inp.qty ? 'text-[#4E9F3D]' : 'text-[#C0473A]'}>
                          {have}/{inp.qty}
                        </b>
                      </span>
                    )
                  })}
                </div>
                <button
                  disabled={busy || locked || !enough || queueFull}
                  className="mt-2 min-h-10 w-full rounded-lg bg-[#E9B949] text-sm font-bold text-[#3B2F2A] active:scale-95 disabled:opacity-40"
                  onClick={() =>
                    void run(
                      () => api.startProduction(structure.id, recipe.id),
                      () => 'Đã cho vào hàng đợi',
                    )
                  }
                >
                  {locked ? `Mở ở cấp ${recipe.unlock_level}` : queueFull ? 'Hàng đợi đã đầy' : 'Làm'}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export function StructurePanel() {
  const structure = useGame((s) => s.structures.find((x) => x.id === s.openStructureId))
  const openStructure = useGame((s) => s.openStructure)
  const coins = useGame((s) => s.profile?.coins ?? 0)
  const type = useCatalog((s) => (structure ? s.structureTypesById[structure.type_id] : undefined))
  const levels = useCatalog((s) => (structure ? (s.upgrades[structure.type_id] ?? NO_LEVELS) : NO_LEVELS))
  const { busy, run } = useAction()
  if (!structure || !type) return null

  const next = levels.find((r) => r.level === structure.level + 1)
  const close = () => openStructure(null)

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 p-4" onClick={close}>
      <div
        className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl bg-[#FFF8EA] p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {type.name_vi} · cấp {structure.level}
          </h2>
          <button className="min-h-11 min-w-11 rounded-full bg-black/5 font-bold" onClick={close} aria-label="Đóng">
            ✕
          </button>
        </div>

        {type.kind === 'pen' ? <PenBody structure={structure} /> : <ProcessorBody structure={structure} />}

        <div className="mt-4 rounded-xl bg-white p-3">
          {next ? (
            <>
              <p className="text-sm">
                Lên cấp {next.level}: <b>{type.kind === 'pen' ? `nuôi tối đa ${next.value} con` : `${next.value} chỗ trong hàng đợi`}</b>
              </p>
              <button
                disabled={busy || coins < next.cost}
                className="mt-2 min-h-11 w-full rounded-xl bg-[#8B5E3C] font-bold text-white active:scale-95 disabled:opacity-40"
                onClick={() =>
                  void run(
                    () => api.upgrade('structure', structure.id),
                    (r) => `Đã nâng lên cấp ${r.level}`,
                  )
                }
              >
                Nâng cấp · {formatNumber(next.cost)} xu
              </button>
            </>
          ) : (
            <p className="text-sm text-[#4E9F3D]">Đã đạt cấp tối đa</p>
          )}
        </div>
      </div>
    </div>
  )
}
