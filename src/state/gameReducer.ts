import type { CatalogEntry, Formation, Style, Mode, Slot, Player, CampaignResult } from '../engine/types'
import { slotsFor } from '../engine/formations'
import { MODES } from '../engine/config'

export interface GameState {
  phase: 'roll' | 'build' | 'result'
  mode: Mode
  formation: Formation
  style: Style
  seed: string
  rollIndex: number
  current: CatalogEntry | null
  recent: string[]
  slots: Slot[]
  usedPlayerIds: Set<string>
  rerollsLeft: number
  result: CampaignResult | null
}

export type Action =
  | { type: 'setMode'; mode: Mode }
  | { type: 'setFormation'; formation: Formation }
  | { type: 'setStyle'; style: Style }
  | { type: 'rolled'; entry: CatalogEntry }
  | { type: 'spendReroll' }
  | { type: 'selectPlayer'; slotIndex: number; player: Player }
  | { type: 'clearSlot'; slotIndex: number }
  | { type: 'simulated'; result: CampaignResult }
  | { type: 'restart' }

export function initialState(mode: Mode = 'classico', seed = 'SETE'): GameState {
  return {
    phase: 'roll', mode, formation: '4-3-3', style: 'equilibrado',
    seed, rollIndex: 0, current: null, recent: [],
    slots: slotsFor('4-3-3'), usedPlayerIds: new Set(),
    rerollsLeft: MODES[mode].rerolls, result: null,
  }
}

export function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'setMode':
      return { ...initialState(a.mode, s.seed) }
    case 'setFormation':
      return { ...s, formation: a.formation, slots: slotsFor(a.formation), usedPlayerIds: new Set() }
    case 'setStyle':
      return { ...s, style: a.style }
    case 'rolled':
      return {
        ...s, phase: 'build', current: a.entry,
        recent: [...s.recent, `${a.entry.sel}:${a.entry.copa}`].slice(-6),
        rollIndex: s.rollIndex + 1,
        slots: slotsFor(s.formation), usedPlayerIds: new Set(),
      }
    case 'spendReroll':
      if (s.rerollsLeft <= 0) throw new Error('Sem re-sorteios restantes')
      return { ...s, rerollsLeft: s.rerollsLeft - 1 }
    case 'selectPlayer': {
      const slots = s.slots.slice()
      const prev = slots[a.slotIndex].player
      const used = new Set(s.usedPlayerIds)
      if (prev) used.delete(prev.playerId)
      slots[a.slotIndex] = { ...slots[a.slotIndex], player: a.player }
      used.add(a.player.playerId)
      return { ...s, slots, usedPlayerIds: used }
    }
    case 'clearSlot': {
      const slots = s.slots.slice()
      const prev = slots[a.slotIndex].player
      const used = new Set(s.usedPlayerIds)
      if (prev) used.delete(prev.playerId)
      slots[a.slotIndex] = { ...slots[a.slotIndex], player: null }
      return { ...s, slots, usedPlayerIds: used }
    }
    case 'simulated':
      return { ...s, phase: 'result', result: a.result }
    case 'restart':
      return initialState(s.mode, s.seed)
    default:
      return s
  }
}
