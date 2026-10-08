// How each crop LOOKS (shape and colors). Game numbers (price, time, XP) come from the database.

export type CropShape = 'leafy' | 'root' | 'stalk' | 'bush' | 'vine' | 'cactus'

export interface CropVisual {
  shape: CropShape
  leafColor: string
  produceColor: string
}

export const CROP_VISUALS: Record<string, CropVisual> = {
  bok_choy: { shape: 'leafy', leafColor: '#5DBB4F', produceColor: '#A8E07A' },
  radish: { shape: 'root', leafColor: '#4FA84A', produceColor: '#F2F2EA' },
  carrot: { shape: 'root', leafColor: '#4FA84A', produceColor: '#F28C28' },
  corn: { shape: 'stalk', leafColor: '#7DBF4A', produceColor: '#F5CF3B' },
  tomato: { shape: 'bush', leafColor: '#3E9A47', produceColor: '#E5483B' },
  sweet_potato: { shape: 'root', leafColor: '#5A9E3C', produceColor: '#B5527A' },
  watermelon: { shape: 'vine', leafColor: '#4C9F3E', produceColor: '#2F7D32' },
  pumpkin: { shape: 'vine', leafColor: '#5DA145', produceColor: '#F08A24' },
  rice: { shape: 'stalk', leafColor: '#8CBF4D', produceColor: '#E8C35A' },
  dragon_fruit: { shape: 'cactus', leafColor: '#4E9C5A', produceColor: '#E63E8C' },
}

export const DEFAULT_CROP_VISUAL: CropVisual = { shape: 'leafy', leafColor: '#5DBB4F', produceColor: '#A8E07A' }
