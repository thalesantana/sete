import type { CatalogEntry, Squad } from './types'
import { ROLL } from './config'
import { CATALOG as RAW } from './catalog.data'

export const CATALOG: CatalogEntry[] = RAW
export const keyOf = (c: { sel: string; copa: number }) => `${c.sel}:${c.copa}`

/** Map each entry key → roll weight, from its squad average strength. */
export function squadWeights(withAvg: (CatalogEntry & { avg: number })[]): Map<string, number> {
  const avgs = withAvg.map(c => c.avg)
  const min = Math.min(...avgs)
  const range = Math.max(...avgs) - min || 1
  const m = new Map<string, number>()
  for (const c of withAvg) m.set(keyOf(c), ROLL.floor + ROLL.span * ((c.avg - min) / range))
  return m
}

/**
 * Candidates for a reroll.
 * type 'copa' → keep selection, change cup. type 'sel' → keep cup, change selection.
 */
export function eligible(
  catalog: CatalogEntry[],
  current: { sel: string; copa: number },
  type: 'copa' | 'sel',
): CatalogEntry[] {
  if (type === 'copa') return catalog.filter(c => c.sel === current.sel && c.copa !== current.copa)
  return catalog.filter(c => c.copa === current.copa && c.sel !== current.sel)
}

const cache = new Map<string, Squad>()

/** Load a squad JSON from /squads on demand (browser). Cached by slug. */
export async function loadSquad(slug: string): Promise<Squad> {
  const hit = cache.get(slug)
  if (hit) return hit
  const res = await fetch(`${import.meta.env.BASE_URL}squads/${slug}.json`)
  if (!res.ok) throw new Error(`Falha ao carregar elenco ${slug}: HTTP ${res.status}`)
  const data = (await res.json()) as Squad
  cache.set(slug, data)
  return data
}
