import { describe, it, expect } from 'vitest'
import { FORMATIONS, slotsFor } from '../src/engine/formations'

describe('formations', () => {
  it('every formation has exactly 11 slots and one GOL', () => {
    for (const f of Object.keys(FORMATIONS) as any[]) {
      const slots = slotsFor(f)
      expect(slots).toHaveLength(11)
      expect(slots.filter(s => s.pos === 'GOL')).toHaveLength(1)
      expect(slots.every(s => s.player === null)).toBe(true)
    }
  })

  it('slotsFor returns a fresh array (no shared mutation)', () => {
    const a = slotsFor('4-3-3'); a[0].player = { force: 99 } as any
    const b = slotsFor('4-3-3')
    expect(b[0].player).toBeNull()
  })
})
