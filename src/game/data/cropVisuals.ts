// TEMPORARY (phase 1 only): crop data copied from docs/GDD.md section 3.2.
// In phase 2 this moves to the `items` and `crops` tables in Supabase.

export type CropShape = 'leafy' | 'root' | 'stalk' | 'bush' | 'vine' | 'cactus'

export interface CropDef {
  id: CropId
  nameVi: string
  nameEn: string
  growSeconds: number
  seedPrice: number
  sellPrice: number
  xp: number
  unlockLevel: number
  shape: CropShape
  leafColor: string
  produceColor: string
}

export type CropId =
  | 'bok_choy'
  | 'radish'
  | 'carrot'
  | 'corn'
  | 'tomato'
  | 'sweet_potato'
  | 'watermelon'
  | 'pumpkin'
  | 'rice'
  | 'dragon_fruit'

export const CROPS: CropDef[] = [
  { id: 'bok_choy', nameVi: 'Cải xanh', nameEn: 'Bok choy', growSeconds: 30, seedPrice: 5, sellPrice: 10, xp: 1, unlockLevel: 1, shape: 'leafy', leafColor: '#5DBB4F', produceColor: '#A8E07A' },
  { id: 'radish', nameVi: 'Củ cải', nameEn: 'Radish', growSeconds: 120, seedPrice: 10, sellPrice: 25, xp: 2, unlockLevel: 2, shape: 'root', leafColor: '#4FA84A', produceColor: '#F2F2EA' },
  { id: 'carrot', nameVi: 'Cà rốt', nameEn: 'Carrot', growSeconds: 300, seedPrice: 20, sellPrice: 50, xp: 4, unlockLevel: 3, shape: 'root', leafColor: '#4FA84A', produceColor: '#F28C28' },
  { id: 'corn', nameVi: 'Ngô', nameEn: 'Corn', growSeconds: 600, seedPrice: 35, sellPrice: 90, xp: 6, unlockLevel: 5, shape: 'stalk', leafColor: '#7DBF4A', produceColor: '#F5CF3B' },
  { id: 'tomato', nameVi: 'Cà chua', nameEn: 'Tomato', growSeconds: 1200, seedPrice: 60, sellPrice: 160, xp: 10, unlockLevel: 7, shape: 'bush', leafColor: '#3E9A47', produceColor: '#E5483B' },
  { id: 'sweet_potato', nameVi: 'Khoai lang', nameEn: 'Sweet potato', growSeconds: 2700, seedPrice: 100, sellPrice: 300, xp: 18, unlockLevel: 9, shape: 'root', leafColor: '#5A9E3C', produceColor: '#B5527A' },
  { id: 'watermelon', nameVi: 'Dưa hấu', nameEn: 'Watermelon', growSeconds: 5400, seedPrice: 180, sellPrice: 540, xp: 30, unlockLevel: 11, shape: 'vine', leafColor: '#4C9F3E', produceColor: '#2F7D32' },
  { id: 'pumpkin', nameVi: 'Bí ngô', nameEn: 'Pumpkin', growSeconds: 10800, seedPrice: 300, sellPrice: 950, xp: 50, unlockLevel: 13, shape: 'vine', leafColor: '#5DA145', produceColor: '#F08A24' },
  { id: 'rice', nameVi: 'Lúa', nameEn: 'Rice', growSeconds: 18000, seedPrice: 450, sellPrice: 1450, xp: 75, unlockLevel: 15, shape: 'stalk', leafColor: '#8CBF4D', produceColor: '#E8C35A' },
  { id: 'dragon_fruit', nameVi: 'Thanh long', nameEn: 'Dragon fruit', growSeconds: 28800, seedPrice: 600, sellPrice: 2100, xp: 110, unlockLevel: 18, shape: 'cactus', leafColor: '#4E9C5A', produceColor: '#E63E8C' },
]

export const CROPS_BY_ID = Object.fromEntries(CROPS.map((c) => [c.id, c])) as Record<CropId, CropDef>
