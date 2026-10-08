/** 1450 -> "1.450" (Vietnamese thousands separator). */
export function formatNumber(n: number): string {
  return n.toLocaleString('vi-VN')
}
