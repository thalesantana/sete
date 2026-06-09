import type { Slot, Style, Rating } from './types'
import { W_ATK, W_DEF, RATING, STYLE_TILT } from './config'

const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0)

/** Star bonus and weak-link penalty extracted as a helper (used by match variance). */
export function starBonus(forces: number[]): number {
  if (forces.length === 0) return 0
  const top3 = avg([...forces].sort((a, b) => b - a).slice(0, 3))
  return Math.max(0, top3 - avg(forces))
}

function weakLink(forces: number[]): number {
  if (forces.length === 0) return 0
  return Math.min(RATING.weakCap, Math.max(0, avg(forces) - Math.min(...forces)))
}

/** Compute attack/defense/overall for a lineup under a style. */
export function rate(slots: Slot[], style: Style): Rating {
  let ra = 0, wa = 0, rd = 0, wd = 0
  const forces: number[] = []
  for (const s of slots) {
    const a = W_ATK[s.pos], d = W_DEF[s.pos]
    wa += a; wd += d
    if (s.player) {
      ra += s.player.force * a
      rd += s.player.force * d
      forces.push(s.player.force)
    }
  }
  if (forces.length === 0) return { attack: 0, defense: 0, overall: 0 }

  const baseAtk = wa > 0 ? ra / wa : 0
  const baseDef = wd > 0 ? rd / wd : 0
  const adj = RATING.starWeight * starBonus(forces) - RATING.weakWeight * weakLink(forces)
  const tilt = STYLE_TILT[style]
  return {
    attack: (baseAtk + adj) * tilt.atk,
    defense: (baseDef + adj) * tilt.def,
    overall: avg(forces),
  }
}
