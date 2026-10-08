import { CROP_VISUALS } from './cropVisuals'

// Icon color of every item in the UI (barn, orders, recipes). Crops reuse their produce color.

const OTHER_ITEM_COLORS: Record<string, string> = {
  chicken_feed: '#D8C27A',
  cow_feed: '#9BB86A',
  egg: '#F1E3C8',
  milk: '#F4F4EE',
  cornmeal: '#F2D27A',
  corn_bread: '#D9A441',
  butter: '#F6E27A',
  cheese: '#F2C14E',
  pumpkin_pie: '#E39A4C',
}

export function itemColor(itemId: string): string {
  return CROP_VISUALS[itemId]?.produceColor ?? OTHER_ITEM_COLORS[itemId] ?? '#CCCCCC'
}
