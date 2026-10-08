// Tool area (GDD 5.3): how many plots one tap affects, by tool level.
// The server (private.tool_area_ok) checks the same rule; this copy picks the plots to send.

export interface AreaPlot {
  id: number
  parcel_id: number
  lx: number
  ly: number
}

export const TOOL_AREA_LABEL: Record<number, string> = {
  1: '1 luống',
  2: '1 góc (4 luống)',
  3: 'nửa mảnh (8 luống)',
  4: 'cả mảnh ruộng',
  5: 'mọi mảnh ruộng',
}

/** Same-area test between the tapped plot and another plot, for a tool level. */
function sameArea(level: number, a: AreaPlot, b: AreaPlot): boolean {
  if (level >= 5) return true
  if (a.parcel_id !== b.parcel_id) return false
  if (level === 4) return true
  if (level === 3) return a.ly >= 2 === b.ly >= 2
  if (level === 2) return a.ly >= 2 === b.ly >= 2 && a.lx >= 2 === b.lx >= 2
  return a.id === b.id
}

/** All plots (from `plots`) inside the area of `tapped` for the given tool level. Tapped plot first. */
export function plotsInArea<T extends AreaPlot>(level: number, tapped: T, plots: T[]): T[] {
  const others = plots.filter((p) => p.id !== tapped.id && sameArea(level, tapped, p))
  return [tapped, ...others]
}
