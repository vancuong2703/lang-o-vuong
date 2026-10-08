import { BoxGeometry, MeshStandardMaterial } from 'three'
import { RoundedBoxGeometry } from 'three-stdlib'

// Shared materials and geometries: every object reuses these instead of creating its own.
// Soft look (GDD 10.1): smooth shading, full roughness, rounded edges where it matters.

/** For InstancedMesh with per-instance colors (setColorAt). */
export const instanceColorMaterial = new MeshStandardMaterial({ roughness: 1 })

/** For merged geometries that carry vertex colors (crops, trees). */
export const vertexColorMaterial = new MeshStandardMaterial({ vertexColors: true, roughness: 0.95 })

/** 1x1x1 box, scaled per instance. */
export const unitBox = new BoxGeometry(1, 1, 1)

/** Soil bed of one plot, with soft rounded edges. */
export const soilGeometry = new RoundedBoxGeometry(0.9, 0.14, 0.9, 2, 0.05)
