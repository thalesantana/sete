import type {
  Rating, CampaignResult, CampaignGame, NamedGoal, Shootout, PenaltyKick, LineupRef, Pos, Slot,
} from './types'
import { PHASES, PENALTY, BADGE, GROUP_ADVANCE_PTS, W_ATK } from './config'
import { playMatch } from './match'
import { makeRng, hashSeed } from './rng'
import type { Rng } from './rng'

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))

/** Minimal player shape the narrative needs. */
interface NarrPlayer { name: string; number?: number; force: number; positions: Pos[] }

export interface OpponentSquad { sel: string; copa: number; squad: NarrPlayer[] }

export interface CampaignContext {
  /** The assembled XI (slots with players). */
  lineup: Slot[]
  /** One real opponent squad per game, in phase order (3 group + 4 KO = 7). */
  opponents: OpponentSquad[]
}

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

function weightedPick<T>(rng: Rng, items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let n = rng() * total
  for (let i = 0; i < items.length; i++) if ((n -= weights[i]) <= 0) return items[i]
  return items[items.length - 1]
}

/** Name `n` goals, biased toward attackers, paired with their minutes. */
function nameGoals(rng: Rng, players: NarrPlayer[], minutes: number[]): NamedGoal[] {
  if (players.length === 0) return minutes.map(m => ({ minute: m, scorer: '' }))
  const weights = players.map(p => (W_ATK[p.positions[0]] ?? 0.3) + 0.25)
  return minutes.map(m => ({ minute: m, scorer: weightedPick(rng, players, weights).name }))
}

/** Outfield penalty takers, strongest first. */
function takers(players: NarrPlayer[]): string[] {
  const list = players
    .filter(p => p.positions[0] !== 'GOL')
    .sort((a, b) => b.force - a.force)
    .map(p => p.name)
  return list.length ? list : players.map(p => p.name)
}

/**
 * Build a display shootout whose winner equals `advanced`.
 * The better-fated side converts more often; ties go to sudden death.
 */
function buildShootout(rng: Rng, myT: string[], oppT: string[], advanced: boolean): Shootout {
  const kicks: PenaltyKick[] = []
  let me = 0, opp = 0
  const pHigh = 0.85, pLow = 0.62
  const pMe = advanced ? pHigh : pLow
  const pOpp = advanced ? pLow : pHigh
  const myName = (i: number) => myT[i % Math.max(1, myT.length)] ?? ''
  const oppName = (i: number) => oppT[i % Math.max(1, oppT.length)] ?? ''

  for (let i = 0; i < 5; i++) {
    const ms = rng() < pMe; kicks.push({ side: 'me', name: myName(i), scored: ms }); if (ms) me++
    const os = rng() < pOpp; kicks.push({ side: 'opp', name: oppName(i), scored: os }); if (os) opp++
  }
  let r = 5
  let guard = 0
  while ((me === opp || (me > opp) !== advanced) && guard < 50) {
    guard++
    if (me === opp) {
      // sudden death: the fated winner scores, the loser misses
      const ms = advanced, os = !advanced
      kicks.push({ side: 'me', name: myName(r), scored: ms }); if (ms) me++
      kicks.push({ side: 'opp', name: oppName(r), scored: os }); if (os) opp++
      r++
    } else {
      // wrong winner after regulation: undo the leader's last conversion
      const leader = me > opp ? 'me' : 'opp'
      for (let k = kicks.length - 1; k >= 0; k--) {
        if (kicks[k].side === leader && kicks[k].scored) {
          kicks[k].scored = false
          if (leader === 'me') me--; else opp--
          break
        }
      }
    }
  }
  return { kicks, myScore: me, oppScore: opp }
}

/**
 * Play a full campaign. `seedBase` seeds every match deterministically.
 * `starBonusValue` feeds match variance. `ctx` (optional) adds the narrative
 * layer: real opponents, named scorers, penalty shootouts, and the lineup.
 */
export function playCampaign(
  seedBase: string,
  my: Rating,
  starBonusValue: number,
  ctx?: CampaignContext,
): CampaignResult {
  let wins = 0, draws = 0, losses = 0, gf = 0, ga = 0
  let eliminated = false
  const games: CampaignGame[] = []
  const myOverall = (my.attack + my.defense) / 2
  const myPlayers: NarrPlayer[] = ctx
    ? ctx.lineup.filter(s => s.player).map(s => ({
        name: s.player!.name, number: s.player!.number, force: s.player!.force, positions: s.player!.positions,
      }))
    : []
  const myTakers = takers(myPlayers)
  let idx = 0

  for (const phase of PHASES) {
    let groupPts = 0
    for (const oppOverall of phase.overalls) {
      const opp = ctx?.opponents[idx]
      const oppPlayers = opp?.squad ?? []
      const rng = makeRng(`${seedBase}:m:${idx}`)
      const r = playMatch(rng, my, oppOverall, starBonusValue)
      gf += r.gf; ga += r.ga
      const win = r.outcome === 'V', draw = r.outcome === 'E'
      let advanced = win
      let penalties = false
      let shootout: Shootout | null = null

      if (phase.type === 'group') {
        groupPts += win ? 3 : draw ? 1 : 0
        if (win) wins++; else if (draw) draws++; else losses++
        advanced = true // group advancement decided after all 3 games
      } else {
        if (draw) {
          penalties = true
          const p = clamp(PENALTY.base + (myOverall - oppOverall) * PENALTY.slope, PENALTY.min, PENALTY.max)
          advanced = makeRng(`${seedBase}:pen:${idx}`)() < p
          shootout = buildShootout(makeRng(`${seedBase}:sh:${idx}`), myTakers, takers(oppPlayers), advanced)
        }
        if (advanced) wins++; else { losses++; eliminated = true }
      }

      games.push({
        phase: phase.key,
        oppSel: opp?.sel ?? '', oppCopa: opp?.copa ?? 0, oppOverall,
        gf: r.gf, ga: r.ga, outcome: r.outcome, advanced, penalties,
        scorers: nameGoals(makeRng(`${seedBase}:gf:${idx}`), myPlayers, goalMinutes(makeRng(`${seedBase}:gfm:${idx}`), r.gf)),
        conceded: nameGoals(makeRng(`${seedBase}:ga:${idx}`), oppPlayers, goalMinutes(makeRng(`${seedBase}:gam:${idx}`), r.ga)),
        shootout,
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

  const lineup: LineupRef[] = ctx
    ? ctx.lineup.filter(s => s.player).map(s => ({
        pos: s.pos, name: s.player!.name, number: s.player!.number,
        sel: s.player!.sel, copa: s.player!.copa,
      }))
    : []
  const overall = lineup.length ? Math.round(myOverall) : Math.round(myOverall)
  const seedCode = hashSeed(seedBase).toString(36).toUpperCase().padStart(6, '0').slice(0, 7)

  return {
    champion, perfect, wins, draws, losses, gf, ga, games, badge,
    record: `${wins}-${losses}`, seedCode, overall, lineup,
  }
}

/** Monte-Carlo helper used in tests and tuning. */
export function championRate(my: Rating, starBonusValue: number, N = 5000): number {
  let c = 0
  for (let i = 0; i < N; i++) if (playCampaign('mc:' + i, my, starBonusValue).champion) c++
  return c / N
}
