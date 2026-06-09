import type { CatalogEntry } from './types'
import { keyOf } from './catalog'
import type { Rng } from './rng'

export function pickWeighted<T>(rng: Rng, items: T[], weights: number[]): T {
  if (items.length === 0) throw new Error('pickWeighted: vazio')
  const total = weights.reduce((a, b) => a + b, 0)
  let n = rng() * total
  for (let i = 0; i < items.length; i++) if ((n -= weights[i]) <= 0) return items[i]
  return items[items.length - 1]
}

export function pickUniform<T>(rng: Rng, items: T[]): T {
  if (items.length === 0) throw new Error('pickUniform: vazio')
  return items[Math.floor(rng() * items.length)]
}

/** Initial roll: weighted by strength, avoiding the recent set when possible. */
export function rollInitial(
  rng: Rng,
  catalog: CatalogEntry[],
  weights: Map<string, number>,
  recent: Set<string>,
): CatalogEntry {
  const fresh = catalog.filter(c => !recent.has(keyOf(c)))
  const pool = fresh.length ? fresh : catalog
  return pickWeighted(rng, pool, pool.map(c => weights.get(keyOf(c)) ?? 0.5))
}
