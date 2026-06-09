export type Pos =
  | 'GOL' | 'LD' | 'LE' | 'ZAG' | 'VOL' | 'MD' | 'ME' | 'MC' | 'MEI' | 'PD' | 'PE' | 'CA'

export interface Player {
  playerId: string
  name: string
  sel: string
  copa: number
  positions: Pos[]
  number: number
  force: number
  legend: boolean
}

export interface Squad {
  sel: string
  copa: number
  squad: Player[]
}

export interface CatalogEntry {
  sel: string
  copa: number
  slug: string
}

export type Formation =
  | '4-3-3' | '4-4-2' | '4-2-3-1' | '4-2-4' | '3-5-2' | '5-3-2' | '4-5-1' | '3-4-3'

export type Style = 'defensivo' | 'equilibrado' | 'ofensivo'
export type Mode = 'classico' | 'almanaque'

/** A starting slot: position to fill + the player chosen (or null). */
export interface Slot {
  pos: Pos
  player: Player | null
}

/** Team strength used by the match model. */
export interface Rating {
  attack: number
  defense: number
  overall: number   // display only (simple avg of forces)
}

export interface MatchResult {
  gf: number
  ga: number
  outcome: 'V' | 'E' | 'D'
}

export interface NamedGoal { minute: number; scorer: string }

export interface PenaltyKick { side: 'me' | 'opp'; name: string; scored: boolean }
export interface Shootout { kicks: PenaltyKick[]; myScore: number; oppScore: number }

export interface CampaignGame {
  phase: string
  oppSel: string         // opponent "face": selection code (empty if no context)
  oppCopa: number
  oppOverall: number     // ladder difficulty value used for the match
  gf: number
  ga: number
  outcome: 'V' | 'E' | 'D'
  advanced: boolean
  penalties: boolean
  scorers: NamedGoal[]   // your goals (minute + scorer name)
  conceded: NamedGoal[]  // opponent goals
  shootout: Shootout | null
}

/** A player as shown on the result card (carries their own team/year). */
export interface LineupRef { pos: Pos; name: string; number: number; sel: string; copa: number }

export interface CampaignResult {
  champion: boolean
  perfect: boolean
  wins: number
  draws: number
  losses: number
  gf: number
  ga: number
  games: CampaignGame[]
  badge: 'ESMAGADOR' | 'MURALHA' | null
  record: string
  seedCode: string       // short shareable code, e.g. "17LSTF4"
  overall: number        // assembled XI overall (avg force)
  lineup: LineupRef[]    // the assembled XI
}
