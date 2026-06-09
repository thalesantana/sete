import { describe, it, expect } from 'vitest'
import { pickWeighted, pickUniform, rollInitial } from '../src/engine/roll'
import { makeRng } from '../src/engine/rng'
import { CATALOG } from '../src/engine/catalog'

describe('roll', () => {
  it('pickWeighted returns an element and respects weights', () => {
    const items = ['a', 'b', 'c']
    const r = makeRng('w')
    const got = pickWeighted(r, items, [0, 0, 1]) // only c has weight
    expect(got).toBe('c')
  })

  it('pickUniform is deterministic by seed', () => {
    const a = pickUniform(makeRng('u'), [1, 2, 3, 4, 5])
    const b = pickUniform(makeRng('u'), [1, 2, 3, 4, 5])
    expect(a).toBe(b)
  })

  it('rollInitial avoids the recent set when possible', () => {
    const weights = new Map(CATALOG.map(c => [`${c.sel}:${c.copa}`, 0.5]))
    const recent = new Set(CATALOG.slice(0, 200).map(c => `${c.sel}:${c.copa}`))
    const got = rollInitial(makeRng('seed:roll:0'), CATALOG, weights, recent)
    expect(recent.has(`${got.sel}:${got.copa}`)).toBe(false)
  })

  it('rollInitial is deterministic by seed', () => {
    const weights = new Map(CATALOG.map(c => [`${c.sel}:${c.copa}`, 0.5]))
    const a = rollInitial(makeRng('seed:roll:3'), CATALOG, weights, new Set())
    const b = rollInitial(makeRng('seed:roll:3'), CATALOG, weights, new Set())
    expect(a).toEqual(b)
  })
})
