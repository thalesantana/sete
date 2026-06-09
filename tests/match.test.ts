import { describe, it, expect } from 'vitest'
import { lambda, playMatch } from '../src/engine/match'
import { makeRng } from '../src/engine/rng'

describe('match', () => {
  it('lambda is always positive (no bottom clamp)', () => {
    expect(lambda(60, 99)).toBeGreaterThan(0)
    expect(lambda(99, 60)).toBeGreaterThan(lambda(60, 99))
  })

  it('equal strength → lambda ≈ base (1.35)', () => {
    expect(lambda(80, 80)).toBeCloseTo(1.35, 5)
  })

  it('playMatch is deterministic for the same seed', () => {
    const my = { attack: 85, defense: 84, overall: 85 }
    const a = playMatch(makeRng('s:0'), my, 80, 0)
    const b = playMatch(makeRng('s:0'), my, 80, 0)
    expect(a).toEqual(b)
  })

  it('stronger team has positive expected goal difference', () => {
    const my = { attack: 90, defense: 90, overall: 90 }
    let gd = 0
    const N = 4000
    for (let i = 0; i < N; i++) gd += (() => { const r = playMatch(makeRng('gd:' + i), my, 75, 5); return r.gf - r.ga })()
    expect(gd / N).toBeGreaterThan(0)
  })

  it('star variance widens the spread of goals scored', () => {
    const my = { attack: 85, defense: 85, overall: 85 }
    const samples = (bonus: number) => {
      const xs: number[] = []
      for (let i = 0; i < 4000; i++) xs.push(playMatch(makeRng('v:' + i), my, 85, bonus).gf)
      const m = xs.reduce((a, b) => a + b, 0) / xs.length
      return xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length
    }
    expect(samples(10)).toBeGreaterThan(samples(0))
  })
})
