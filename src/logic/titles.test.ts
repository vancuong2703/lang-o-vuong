import { describe, expect, it } from 'vitest'
import { landTitle } from './titles'

describe('landTitle', () => {
  it('grows with the number of parcels', () => {
    expect(landTitle(1)).toBe('Nông hộ')
    expect(landTitle(2)).toBe('Nông hộ')
    expect(landTitle(3)).toBe('Phú nông')
    expect(landTitle(6)).toBe('Điền chủ')
    expect(landTitle(10)).toBe('Điền chủ')
    expect(landTitle(11)).toBe('Địa chủ')
    expect(landTitle(25)).toBe('Đại địa chủ')
  })
})
