/** Shown when the build has no Supabase settings (missing VITE_* environment variables). */
export function ConfigErrorScreen() {
  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-b from-[#BFE6FF] to-[#FFF3D6] p-6 font-sans text-[#3B2F2A]">
      <div className="w-full max-w-md rounded-3xl bg-white/90 p-6 shadow-xl">
        <h1 className="text-xl font-bold text-[#C0473A]">Thiếu cấu hình máy chủ</h1>
        <p className="mt-2 text-sm">
          Bản build này không có <b>VITE_SUPABASE_URL</b> hoặc <b>VITE_SUPABASE_PUBLISHABLE_KEY</b>, nên game không kết nối được.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          <li>
            Máy của bạn: tạo file <code>.env.local</code> theo mẫu <code>.env.example</code>.
          </li>
          <li>
            Vercel: Settings → Environment Variables → thêm 2 biến, rồi vào Deployments → <b>Redeploy</b>.
          </li>
        </ul>
      </div>
    </div>
  )
}
