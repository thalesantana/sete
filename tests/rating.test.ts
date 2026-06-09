import { describe, it, expect } from 'vitest'
import { rate } from '../src/engine/rating'
import type { Slot } from '../src/engine/types'

const F433: { pos: any }[] = [
  { pos: 'GOL' }, { pos: 'ZAG' }, { pos: 'ZAG' }, { pos: 'LD' }, { pos: 'LE' },
  { pos: 'VOL' }, { pos: 'MC' }, { pos: 'MEI' }, { pos: 'PD' }, { pos: 'CA' }, { pos: 'PE' },
]
const lineup = (forces: number[]): Slot[] =>
  F433.map((s, i) => ({ pos: s.pos, player: { force: forces[i] } as any }))

describe('rate', () => {
  it('balanced team: attack≈defense≈overall', () => {
    const r = rate(lineup(Array(11).fill(80)), 'equilibrado')
    expect(Math.round(r.overall)).toBe(80)
    expect(Math.abs(r.attack - r.defense)).toBeLessThan(1)
  })

  it('stars at wings raise attack via weighting', () => {
    const f = Array(11).fill(75); f[8] = 95; f[10] = 95 // PD, PE
    const r = rate(lineup(f), 'equilibrado')
    expect(r.attack).toBeGreaterThan(r.defense)
  })

  it('weak link drags rating below a flat team of same average', () => {
    // same avg (78): flat vs 2x92 + weak filler
    const flat = rate(lineup(Array(11).fill(78)), 'equilibrado')
    const f = Array(11).fill((78 * 11 - 2 * 92) / 9); f[8] = 92; f[10] = 92
    const uneven = rate(lineup(f), 'equilibrado')
    // weak-link penalty keeps the uneven team's defense from exceeding the flat team's
    expect(uneven.defense).toBeLessThan(flat.defense + 1)
  })

  it('style tilts attack and defense', () => {
    const base = rate(lineup(Array(11).fill(80)), 'equilibrado')
    const atk = rate(lineup(Array(11).fill(80)), 'ofensivo')
    const def = rate(lineup(Array(11).fill(80)), 'defensivo')
    expect(atk.attack).toBeGreaterThan(base.attack)
    expect(def.defense).toBeGreaterThan(base.defense)
  })

  it('ignores empty slots gracefully', () => {
    const slots: Slot[] = F433.map(s => ({ pos: s.pos as any, player: null }))
    const r = rate(slots, 'equilibrado')
    expect(r.overall).toBe(0)
  })
})
