import { describe, it, expect } from 'vitest'
import { initialState, reducer } from '../src/state/gameReducer'

describe('gameReducer', () => {
  it('starts in roll phase with full reroll budget for classico', () => {
    const s = initialState('classico')
    expect(s.phase).toBe('roll')
    expect(s.rerollsLeft).toBe(3)
  })

  it('setFormation rebuilds empty slots of the new formation', () => {
    let s = initialState('classico')
    s = reducer(s, { type: 'setFormation', formation: '3-5-2' })
    expect(s.slots).toHaveLength(11)
    expect(s.slots.filter(x => x.pos === 'ZAG')).toHaveLength(3)
  })

  it('reroll decrements the budget and throws when empty (classico=3)', () => {
    let s = initialState('classico')
    s = { ...s, current: { sel: 'BRA', copa: 1970 }, phase: 'build' }
    for (let i = 0; i < 3; i++) s = reducer(s, { type: 'spendReroll' })
    expect(s.rerollsLeft).toBe(0)
    expect(() => reducer(s, { type: 'spendReroll' })).toThrow()
  })

  it('selectPlayer fills the slot and prevents reusing a player', () => {
    let s = initialState('classico')
    const p1 = { playerId: 'a', force: 80, positions: ['CA'] } as any
    s = reducer(s, { type: 'selectPlayer', slotIndex: 9, player: p1 })
    expect(s.slots[9].player?.playerId).toBe('a')
    expect(s.usedPlayerIds.has('a')).toBe(true)
  })
})
