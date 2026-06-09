import { describe, it, expect } from 'vitest'
import { playCampaign, championRate } from '../src/engine/campaign'
import type { Rating } from '../src/engine/types'

const R = (att: number, def: number): Rating => ({ attack: att, defense: def, overall: (att + def) / 2 })

describe('campaign', () => {
  it('is deterministic by seed', () => {
    const a = playCampaign('seed:copa', R(88, 88), 6)
    const b = playCampaign('seed:copa', R(88, 88), 6)
    expect(a).toEqual(b)
  })

  it('produces 7 games when champion, fewer when eliminated', () => {
    const r = playCampaign('x', R(99, 99), 6)
    expect(r.games.length).toBeLessThanOrEqual(7)
    if (r.champion) expect(r.wins + r.draws + r.losses).toBe(7)
  })

  it('elite team wins the title far more often than a weak one', () => {
    const elite = championRate(R(95, 95), 6, 3000)
    const weak = championRate(R(72, 72), 6, 3000)
    expect(elite).toBeGreaterThan(weak)
    expect(elite).toBeGreaterThan(0.3)
  })

  it('Muralha badge requires zero goals conceded', () => {
    // run several seeds; any championed run with ga>0 must not be MURALHA
    for (let i = 0; i < 50; i++) {
      const r = playCampaign('badge:' + i, R(96, 96), 6)
      if (r.badge === 'MURALHA') expect(r.ga).toBe(0)
    }
  })
})
