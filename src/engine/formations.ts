import type { Formation, Pos, Slot, Style } from './types'
import { COORDS, type SlotCoord } from './formationCoords'

/** Default position list per formation (equilibrado layout) — used for quick checks. */
export const FORMATIONS = Object.fromEntries(
  (Object.keys(COORDS) as Formation[]).map(f => [f, COORDS[f].equilibrado.map(c => c.pos)]),
) as Record<Formation, Pos[]>

/** All formation keys, in display order. */
export const FORMATION_KEYS: Formation[] = [
  '4-3-3', '4-4-2', '4-2-3-1', '4-2-4', '3-5-2', '5-3-2', '4-5-1', '3-4-3',
]

/** Pitch coordinates (x/y %) for a formation+style. */
export function coordsFor(formation: Formation, style: Style): SlotCoord[] {
  return COORDS[formation][style]
}

/** Build a fresh, empty slot list for a formation+style (defaults to equilibrado). */
export function slotsFor(formation: Formation, style: Style = 'equilibrado'): Slot[] {
  return COORDS[formation][style].map(c => ({ pos: c.pos, player: null }))
}

/**
 * Re-layout an existing lineup into a new formation+style, keeping each player
 * where the new slot at the same index can hold them (player can play that pos),
 * otherwise dropping them. Returns the new slots and the set of kept player ids.
 */
export function relayout(prev: Slot[], formation: Formation, style: Style): {
  slots: Slot[]
  usedPlayerIds: Set<string>
} {
  const next = slotsFor(formation, style)
  const used = new Set<string>()
  next.forEach((slot, i) => {
    const cand = prev[i]?.player
    if (cand && cand.positions.includes(slot.pos) && !used.has(cand.playerId)) {
      slot.player = cand
      used.add(cand.playerId)
    }
  })
  return { slots: next, usedPlayerIds: used }
}
