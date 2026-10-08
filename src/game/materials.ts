import { BoxGeometry, MeshStandardMaterial } from 'three'

// Shared materials and geometries: every object reuses these instead of creating its own.

/** For InstancedMesh with per-instance colors (setColorAt). */
export const instanceColorMaterial = new MeshStandardMaterial({ flatShading: true })

/** For merged geometries that carry vertex colors (crops). */
export const vertexColorMaterial = new MeshStandardMaterial({ vertexColors: true, flatShading: true })

/** 1x1x1 box, scaled per instance. */
export const unitBox = new BoxGeometry(1, 1, 1)
