import { describe, it, expect } from 'vitest'
import { CATALOG, squadWeights, eligible } from '../src/engine/catalog'

describe('catalog', () => {
  it('has 250 entries across 52 selections', () => {
    expect(CATALOG).toHaveLength(250)
    expect(new Set(CATALOG.map(c => c.sel)).size).toBe(52)
  })

  it('squadWeights returns a weight in [floor, floor+span] per entry', () => {
    const w = squadWeights(CATALOG.map(c => ({ ...c, avg: 75 })))
    for (const v of w.values()) {
      expect(v).toBeGreaterThanOrEqual(0.25)
      expect(v).toBeLessThanOrEqual(1.0001)
    }
  })

  it('eligible filters by selection or by copa', () => {
    const sameSel = eligible(CATALOG, { sel: 'BRA', copa: 1970 }, 'copa')
    expect(sameSel.every(c => c.sel === 'BRA' && c.copa !== 1970)).toBe(true)
    const sameCopa = eligible(CATALOG, { sel: 'BRA', copa: 1970 }, 'sel')
    expect(sameCopa.every(c => c.copa === 1970 && c.sel !== 'BRA')).toBe(true)
  })
})
