import { PARCEL_PITCH } from '../../logic/grid'

/** Parcels per map side (GDD 6.1). */
export const MAP_SIZE = 32
/** Map width in world units. */
export const MAP_WORLD = MAP_SIZE * PARCEL_PITCH
/** World center of the map (middle of the town square). */
export const MAP_CENTER = MAP_WORLD / 2 - 0.5
/** Number of chunks per side. */
export const CHUNKS_PER_SIDE = 4
