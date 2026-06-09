import type { Rating, MatchResult } from './types'
import { MODEL, RATING } from './config'
import { gaussian, poisson, type Rng } from './rng'

/** Expected goals for an attack quality vs a defense quality. */
export function lambda(qAttack: number, qDefense: number): number {
  return MODEL.base * Math.exp((MODEL.sens * (qAttack - qDefense)) / MODEL.scale)
}

/** Lognormal "day form" factor with mean 1; spread grows with star bonus. */
function formFactor(rng: Rng, starBonusValue: number): number {
  const sigma = RATING.sigmaBase + RATING.sigmaStar * starBonusValue
  return Math.exp(sigma * gaussian(rng) - (sigma * sigma) / 2)
}

/**
 * Simulate one match. `my` is the player's team rating; `oppOverall` is the
 * opponent's single strength (acts as both their attack and defense).
 * `starBonusValue` drives the player's variance only.
 */
export function playMatch(rng: Rng, my: Rating, oppOverall: number, starBonusValue: number): MatchResult {
  const form = formFactor(rng, starBonusValue)
  const gf = poisson(rng, lambda(my.attack, oppOverall) * form)
  const ga = poisson(rng, lambda(oppOverall, my.defense))
  return { gf, ga, outcome: gf > ga ? 'V' : gf < ga ? 'D' : 'E' }
}
