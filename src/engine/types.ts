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

export interface CampaignGame {
  phase: string
  oppOverall: number
  gf: number
  ga: number
  outcome: 'V' | 'E' | 'D'
  advanced: boolean
  penalties: boolean
  scorers: number[]      // minutes (own goals scored)
  conceded: number[]     // minutes conceded
}

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
}
