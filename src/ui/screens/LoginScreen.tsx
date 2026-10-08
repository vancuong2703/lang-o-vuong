import { useGame } from '../../state/gameStore'

export function LoginScreen() {
  const signInGuest = useGame((s) => s.signInGuest)
  const signInGoogle = useGame((s) => s.signInGoogle)
  const busy = useGame((s) => s.busy)

  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-b from-[#BFE6FF] to-[#FFF3D6] p-6">
      <div className="w-full max-w-sm rounded-3xl bg-white/90 p-6 text-center shadow-xl">
        <h1 className="text-3xl font-bold text-[#4E9F3D]">Làng Ô Vuông</h1>
        <p className="mt-1 text-sm">Làm địa chủ một vùng quê: khai hoang, mua ruộng, buôn bán</p>

        <button
          className="mt-6 min-h-12 w-full rounded-xl border-2 border-black/10 bg-white font-bold active:scale-95"
          onClick={() => void signInGoogle()}
        >
          Đăng nhập bằng Google
        </button>
        <button
          disabled={busy}
          className="mt-3 min-h-12 w-full rounded-xl bg-[#4E9F3D] font-bold text-white active:scale-95 disabled:opacity-50"
          onClick={() => void signInGuest()}
        >
          Chơi ngay (khách)
        </button>
        <p className="mt-3 text-xs text-[#3B2F2A]/60">Tài khoản khách chỉ lưu trên trình duyệt này.</p>
      </div>
    </div>
  )
}
