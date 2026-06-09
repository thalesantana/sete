import { describe, it, expect } from 'vitest'
import { rate, starBonus } from '../src/engine/rating'
import { championRate } from '../src/engine/campaign'
import { slotsFor } from '../src/engine/formations'
import type { Slot } from '../src/engine/types'

function lineup(forces: number[]): Slot[] {
  const s = slotsFor('4-3-3')
  return s.map((slot, i) => ({ ...slot, player: { force: forces[i] } as any }))
}

describe('calibration (regression of the tuned model)', () => {
  it('two-star unbalanced team is NOT an absurd favorite', () => {
    // same average (87): flat vs 2x96 + weak filler
    const flat = rate(lineup(Array(11).fill(87)), 'equilibrado')
    const f = Array(11).fill((87 * 11 - 2 * 96) / 9); f[8] = 96; f[10] = 96
    const uneven = lineup(f)
    const uRate = rate(uneven, 'equilibrado')
    const uBonus = starBonus(uneven.map(s => s.player!.force))

    const flatPct = championRate(flat, 0, 3000)
    const unevenPct = championRate(uRate, uBonus, 3000)

    // the unbalanced team should be at most modestly ahead (calibrated ~+3-6 p.p.),
    // never the broken ~+39 p.p. of pure star power
    expect(unevenPct - flatPct).toBeLessThan(0.15)
  })

  it('a mid team carried by one genius stays a long shot', () => {
    // avg ~82, one 99, weak tail (Argentina-86-like)
    const f = [81, 83, 82, 80, 78, 82, 99, 85, 85, 76, 70]
    const xi = lineup(f)
    const pct = championRate(rate(xi, 'equilibrado'), starBonus(f.map(x => x)), 3000)
    expect(pct).toBeLessThan(0.05)
  })
})
