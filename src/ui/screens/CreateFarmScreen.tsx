import { useState, type FormEvent } from 'react'
import { useGame } from '../../state/gameStore'

export function CreateFarmScreen() {
  const createFarm = useGame((s) => s.createFarm)
  const signOut = useGame((s) => s.signOut)
  const busy = useGame((s) => s.busy)
  const [username, setUsername] = useState('')
  const [farmName, setFarmName] = useState('')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void createFarm(username.trim(), farmName.trim())
  }

  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-b from-[#BFE6FF] to-[#FFF3D6] p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-3xl bg-white/90 p-6 shadow-xl">
        <h1 className="text-center text-2xl font-bold text-[#4E9F3D]">Tạo nông trại</h1>

        <label className="mt-5 block text-sm font-semibold">
          Tên của bạn (3–16 ký tự)
          <input
            className="mt-1 min-h-11 w-full rounded-xl border-2 border-black/10 px-3 font-normal outline-none focus:border-[#4E9F3D]"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={16}
            autoFocus
          />
        </label>

        <label className="mt-3 block text-sm font-semibold">
          Tên nông trại (1–24 ký tự)
          <input
            className="mt-1 min-h-11 w-full rounded-xl border-2 border-black/10 px-3 font-normal outline-none focus:border-[#4E9F3D]"
            value={farmName}
            onChange={(e) => setFarmName(e.target.value)}
            maxLength={24}
            placeholder="Ví dụ: Vườn Xanh"
          />
        </label>

        <button
          type="submit"
          disabled={busy || username.trim().length < 3 || farmName.trim().length < 1}
          className="mt-5 min-h-12 w-full rounded-xl bg-[#4E9F3D] font-bold text-white active:scale-95 disabled:opacity-50"
        >
          Vào làng
        </button>
        <button type="button" className="mt-3 w-full text-xs text-[#3B2F2A]/60 underline" onClick={() => void signOut()}>
          Quay lại
        </button>
      </form>
    </div>
  )
}
