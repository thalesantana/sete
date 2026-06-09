import { describe, it, expect } from 'vitest'
import { hashSeed, mulberry32, makeRng, gaussian, poisson } from '../src/engine/rng'

describe('rng', () => {
  it('is deterministic for the same seed', () => {
    const a = makeRng('BRA-1970:roll:0')
    const b = makeRng('BRA-1970:roll:0')
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('produces different streams for different seeds', () => {
    const a = makeRng('x')
    const b = makeRng('y')
    expect(a()).not.toEqual(b())
  })

  it('returns floats in [0,1)', () => {
    const r = makeRng('seed')
    for (let i = 0; i < 1000; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('poisson(0) is always 0', () => {
    const r = makeRng('s')
    expect(poisson(r, 0)).toBe(0)
  })

  it('poisson mean approximates lambda', () => {
    const r = makeRng('mean-check')
    let sum = 0
    const N = 20000
    for (let i = 0; i < N; i++) sum += poisson(r, 2.5)
    expect(sum / N).toBeGreaterThan(2.3)
    expect(sum / N).toBeLessThan(2.7)
  })

  it('gaussian mean approximates 0', () => {
    const r = makeRng('g')
    let sum = 0
    const N = 20000
    for (let i = 0; i < N; i++) sum += gaussian(r)
    expect(Math.abs(sum / N)).toBeLessThan(0.05)
  })

  it('hashSeed is stable and unsigned', () => {
    const h = hashSeed('BRA-1970:roll:0')
    expect(h).toBe(hashSeed('BRA-1970:roll:0'))
    expect(h).toBeGreaterThanOrEqual(0)
  })
})
