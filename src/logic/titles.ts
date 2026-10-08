// Land titles: the "landlord family" setting (GDD 1.2). Purely a name shown in the UI.

const TITLES: [minParcels: number, title: string][] = [
  [20, 'Đại địa chủ'],
  [11, 'Địa chủ'],
  [6, 'Điền chủ'],
  [3, 'Phú nông'],
  [1, 'Nông hộ'],
]

/** Title of a family by the number of parcels (mảnh ruộng) it owns. */
export function landTitle(parcels: number): string {
  return TITLES.find(([min]) => parcels >= min)?.[1] ?? 'Nông hộ'
}
