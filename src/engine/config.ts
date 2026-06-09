import type { Pos, Mode } from './types'

/** Attack contribution weight by position. */
export const W_ATK: Record<Pos, number> = {
  GOL: 0, LD: 0, ZAG: 0, LE: 0, MD: 0.5, ME: 0.5,
  VOL: 0.2, MC: 0.5, MEI: 0.8, PD: 1, CA: 1, PE: 1,
}

/** Display order of positions: goalkeeper → centre-forward. */
export const POS_ORDER: Record<Pos, number> = {
  GOL: 0, LD: 1, LE: 2, ZAG: 3, MD: 4, ME: 5, VOL: 6, MC: 7, MEI: 8, PD: 9, PE: 10, CA: 11,
}

/** Defense contribution weight by position. */
export const W_DEF: Record<Pos, number> = {
  GOL: 1, LD: 1, ZAG: 1, LE: 1, MD: 0.5, ME: 0.5,
  VOL: 0.8, MC: 0.5, MEI: 0.2, PD: 0, CA: 0, PE: 0,
}

/** Match model (exponential). */
export const MODEL = {
  base: 1.35,    // average goals per team
  sens: 1.2,     // sensitivity to strength gap
  scale: 12,     // strength-gap normaliser
}

/** Rating adjustments (calibrated by Monte-Carlo). */
export const RATING = {
  starWeight: 0.18,  // weight on star bonus
  weakWeight: 0.30,  // weight on weak-link penalty
  weakCap: 4,        // max weak-link penalty (pts)
  sigmaBase: 0.12,   // base "day form" variance
  sigmaStar: 0.03,   // extra variance per star-bonus point
}

/** Style tilt applied to attack/defense (keeps overall roughly constant). */
export const STYLE_TILT = {
  defensivo: { atk: 0.95, def: 1.05 },
  equilibrado: { atk: 1.0, def: 1.0 },
  ofensivo: { atk: 1.05, def: 0.95 },
}

/** Knockout penalty shootout probability params. */
export const PENALTY = { base: 0.5, slope: 0.012, min: 0.1, max: 0.9 }

/** Crusher badge threshold (goal difference). */
export const BADGE = { esmagadorGD: 18 }

/** Roll weighting: weight = floor + span * normalisedStrength. */
export const ROLL = { floor: 0.25, span: 0.75, recentKeep: 6 }

/** Campaign phases (opponent overalls). */
export const PHASES: { key: string; type: 'group' | 'ko'; overalls: number[] }[] = [
  { key: 'GRUPOS', type: 'group', overalls: [68, 72, 76] },
  { key: 'OITAVAS', type: 'ko', overalls: [79] },
  { key: 'QUARTAS', type: 'ko', overalls: [83] },
  { key: 'SEMI', type: 'ko', overalls: [87] },
  { key: 'FINAL', type: 'ko', overalls: [91] },
]
export const GROUP_ADVANCE_PTS = 4  // proxy for top-2

/** Mode budgets. */
export const MODES: Record<Mode, { rerolls: number; statsVisible: boolean }> = {
  classico: { rerolls: 3, statsVisible: true },
  almanaque: { rerolls: 1, statsVisible: false },
}
