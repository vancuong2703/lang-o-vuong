// Grid math: world coordinates <-> parcel <-> plot. See docs/ROADMAP.md section 4.2.
// Pure functions only: no React, no Three, no Supabase.

/** Plots per parcel side (a parcel is 4x4 plots). */
export const PARCEL_PLOTS = 4
/** Distance between two neighbouring parcels: 4 plots + 1-unit path. */
export const PARCEL_PITCH = 5
/** Parcels per chunk side (a chunk is 8x8 parcels). */
export const CHUNK_PARCELS = 8

export interface PlotCoord {
  parcelX: number
  parcelY: number
  plotX: number
  plotY: number
}

/** Converts a point on the ground (x, z) to a plot, or null when the point is on a path. */
export function worldToPlot(x: number, z: number): PlotCoord | null {
  const parcelX = Math.floor(x / PARCEL_PITCH)
  const parcelY = Math.floor(z / PARCEL_PITCH)
  const rx = x - parcelX * PARCEL_PITCH
  const rz = z - parcelY * PARCEL_PITCH
  if (rx >= PARCEL_PLOTS || rz >= PARCEL_PLOTS) return null
  return { parcelX, parcelY, plotX: Math.floor(rx), plotY: Math.floor(rz) }
}

/** Returns the world (x, z) of a plot's center. */
export function plotToWorld(coord: PlotCoord): [number, number] {
  return [
    coord.parcelX * PARCEL_PITCH + coord.plotX + 0.5,
    coord.parcelY * PARCEL_PITCH + coord.plotY + 0.5,
  ]
}

/** Index 0..15 of a plot inside its parcel (row by row). */
export function plotIndex(plotX: number, plotY: number): number {
  return plotY * PARCEL_PLOTS + plotX
}

/** Inverse of plotIndex. */
export function plotFromIndex(index: number): { plotX: number; plotY: number } {
  return { plotX: index % PARCEL_PLOTS, plotY: Math.floor(index / PARCEL_PLOTS) }
}

/** Quadrant 0..3 (Q0 top-left, Q1 top-right, Q2 bottom-left, Q3 bottom-right). */
export function quadrantOf(plotX: number, plotY: number): number {
  return (plotY >= 2 ? 2 : 0) + (plotX >= 2 ? 1 : 0)
}

/** Chunk that contains a parcel. */
export function chunkOf(parcelX: number, parcelY: number): { chunkX: number; chunkY: number } {
  return {
    chunkX: Math.floor(parcelX / CHUNK_PARCELS),
    chunkY: Math.floor(parcelY / CHUNK_PARCELS),
  }
}
