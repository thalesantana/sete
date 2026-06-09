import type { CatalogEntry, Formation, Style, Mode, Slot, Player, CampaignResult } from '../engine/types'
import { slotsFor, relayout } from '../engine/formations'
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
  activeSlot: number | null
  rerollsLeft: number
  result: CampaignResult | null
}

export type Action =
  | { type: 'setMode'; mode: Mode }
  | { type: 'setFormation'; formation: Formation }
  | { type: 'setStyle'; style: Style }
  | { type: 'rolled'; entry: CatalogEntry }
  | { type: 'spendReroll' }
  | { type: 'setActiveSlot'; slotIndex: number | null }
  | { type: 'selectPlayer'; slotIndex: number; player: Player }
  | { type: 'clearSlot'; slotIndex: number }
  | { type: 'simulated'; result: CampaignResult }
  | { type: 'restart' }

export function initialState(mode: Mode = 'classico', seed = 'SETE'): GameState {
  return {
    phase: 'roll', mode, formation: '4-3-3', style: 'equilibrado',
    seed, rollIndex: 0, current: null, recent: [],
    slots: slotsFor('4-3-3', 'equilibrado'), usedPlayerIds: new Set(),
    activeSlot: null, rerollsLeft: MODES[mode].rerolls, result: null,
  }
}

export function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'setMode':
      return initialState(a.mode, s.seed)
    case 'setFormation': {
      const { slots, usedPlayerIds } = relayout(s.slots, a.formation, s.style)
      return { ...s, formation: a.formation, slots, usedPlayerIds, activeSlot: null }
    }
    case 'setStyle': {
      const { slots, usedPlayerIds } = relayout(s.slots, s.formation, a.style)
      return { ...s, style: a.style, slots, usedPlayerIds, activeSlot: null }
    }
    case 'rolled':
      return {
        ...s, phase: 'build', current: a.entry,
        recent: [...s.recent, `${a.entry.sel}:${a.entry.copa}`].slice(-6),
        rollIndex: s.rollIndex + 1,
        slots: slotsFor(s.formation, s.style), usedPlayerIds: new Set(), activeSlot: null,
      }
    case 'spendReroll':
      if (s.rerollsLeft <= 0) throw new Error('Sem re-sorteios restantes')
      return { ...s, rerollsLeft: s.rerollsLeft - 1 }
    case 'setActiveSlot':
      return { ...s, activeSlot: a.slotIndex }
    case 'selectPlayer': {
      const slots = s.slots.slice()
      const prev = slots[a.slotIndex].player
      const used = new Set(s.usedPlayerIds)
      if (prev) used.delete(prev.playerId)
      slots[a.slotIndex] = { ...slots[a.slotIndex], player: a.player }
      used.add(a.player.playerId)
      return { ...s, slots, usedPlayerIds: used, activeSlot: null }
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
