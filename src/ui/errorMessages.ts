// Server error codes (ROADMAP 2.11) -> Vietnamese messages.
const MESSAGES: Record<string, string> = {
  NOT_AUTHENTICATED: 'Bạn cần đăng nhập lại',
  NO_PROFILE: 'Bạn chưa lập điền trang',
  BANNED: 'Tài khoản đã bị khóa',
  RATE_LIMITED: 'Bạn thao tác nhanh quá, chờ một chút nhé',
  NOT_OWNER: 'Đây không phải ruộng nhà bạn',
  NOT_ENOUGH_COINS: 'Không đủ xu',
  NOT_ENOUGH_ITEMS: 'Không đủ vật phẩm trong kho',
  NOT_READY: 'Chưa chín đâu, chờ thêm nhé',
  PLOT_NOT_EMPTY: 'Luống này đang có cây',
  LEVEL_TOO_LOW: 'Cần lên cấp cao hơn',
  BARN_FULL: 'Kho đầy rồi, hãy bán bớt nhé',
  INVALID_INPUT: 'Dữ liệu không hợp lệ',
  INVALID_NAME: 'Tên 3–16 ký tự, tên điền trang 1–24 ký tự, không dùng ký tự đặc biệt',
  NAME_TAKEN: 'Tên này đã có người dùng',
  ALREADY_STARTED: 'Bạn đã có điền trang rồi',
  MAP_FULL: 'Làng đã hết chỗ',
  TOOL_AREA: 'Công cụ chưa đủ cấp để làm cả vùng này',
  MAX_LEVEL: 'Đã đạt cấp tối đa',
}

export function errorMessage(err: unknown): string {
  const code = err instanceof Error ? err.message : String(err)
  if (MESSAGES[code]) return MESSAGES[code]
  if (code.includes('Failed to fetch')) return 'Mất kết nối mạng, thử lại nhé'
  return 'Có lỗi xảy ra, thử lại nhé'
}
