import type { Rating, CampaignResult, CampaignGame } from './types'
import { PHASES, PENALTY, BADGE, GROUP_ADVANCE_PTS } from './config'
import { playMatch } from './match'
import { makeRng } from './rng'
import type { Rng } from './rng'

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))

/** Distinct minutes for `n` goals, deterministic via rng. */
function goalMinutes(rng: Rng, n: number): number[] {
  const set = new Set<number>()
  let guard = 0
  while (set.size < n && guard < 1000) {
    guard++
    set.add(1 + Math.floor(90 * Math.pow(rng(), 0.85)))
  }
  return [...set].sort((a, b) => a - b)
}

/**
 * Play a full campaign. `seedBase` seeds every match deterministically.
 * `starBonusValue` feeds match variance (the team's "day form").
 */
export function playCampaign(seedBase: string, my: Rating, starBonusValue: number): CampaignResult {
  let wins = 0, draws = 0, losses = 0, gf = 0, ga = 0
  let eliminated = false
  const games: CampaignGame[] = []
  const myOverall = (my.attack + my.defense) / 2
  let idx = 0

  for (const phase of PHASES) {
    let groupPts = 0
    for (const oppOverall of phase.overalls) {
      const rng = makeRng(`${seedBase}:m:${idx}`)
      const r = playMatch(rng, my, oppOverall, starBonusValue)
      gf += r.gf; ga += r.ga
      const win = r.outcome === 'V', draw = r.outcome === 'E'
      let advanced = win
      let penalties = false

      if (phase.type === 'group') {
        groupPts += win ? 3 : draw ? 1 : 0
        if (win) wins++; else if (draw) draws++; else losses++
        advanced = true // group advancement decided after all 3 games
      } else {
        if (draw) {
          penalties = true
          const p = clamp(PENALTY.base + (myOverall - oppOverall) * PENALTY.slope, PENALTY.min, PENALTY.max)
          advanced = makeRng(`${seedBase}:pen:${idx}`)() < p
        }
        if (advanced) wins++; else { losses++; eliminated = true }
      }

      games.push({
        phase: phase.key, oppOverall, gf: r.gf, ga: r.ga, outcome: r.outcome,
        advanced, penalties,
        scorers: goalMinutes(makeRng(`${seedBase}:gf:${idx}`), r.gf),
        conceded: goalMinutes(makeRng(`${seedBase}:ga:${idx}`), r.ga),
      })
      idx++
      if (phase.type === 'ko' && !advanced) break
    }
    if (eliminated) break
    if (phase.type === 'group' && groupPts < GROUP_ADVANCE_PTS) { eliminated = true; break }
  }

  const champion = !eliminated
  const perfect = champion && wins === 7 && draws === 0 && losses === 0
  const badge: CampaignResult['badge'] =
    perfect && gf - ga >= BADGE.esmagadorGD ? 'ESMAGADOR' : champion && ga === 0 ? 'MURALHA' : null

  return { champion, perfect, wins, draws, losses, gf, ga, games, badge, record: `${wins}-${losses}` }
}

/** Monte-Carlo helper used in tests and tuning. */
export function championRate(my: Rating, starBonusValue: number, N = 5000): number {
  let c = 0
  for (let i = 0; i < N; i++) if (playCampaign('mc:' + i, my, starBonusValue).champion) c++
  return c / N
}
