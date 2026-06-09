export type Rng = () => number

/** MurmurHash3-style string hash → unsigned 32-bit int. */
export function hashSeed(str: string): number {
  let e = 0x6a09e667 ^ str.length
  for (let i = 0; i < str.length; i++) {
    e = Math.imul(e ^ str.charCodeAt(i), 0xcc9e2d51)
    e = (e << 13) | (e >>> 19)
  }
  return e >>> 0
}

/** Mulberry32 PRNG seeded with a 32-bit int. */
export function mulberry32(seed: number): Rng {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let a = Math.imul(s ^ (s >>> 15), 1 | s)
    a = (a + Math.imul(a ^ (a >>> 7), 61 | a)) ^ a
    return ((a ^ (a >>> 14)) >>> 0) / 0x100000000
  }
}

/** Convenience: build a deterministic Rng from a seed string. */
export function makeRng(seedStr: string): Rng {
  return mulberry32(hashSeed(seedStr))
}

/** Standard normal via Box-Muller, using the given Rng. */
export function gaussian(rng: Rng): number {
  let u = 0, v = 0
  while (u === 0) u = rng()
  while (v === 0) v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/** Poisson sample (Knuth) with lambda, using the given Rng. */
export function poisson(rng: Rng, lambda: number): number {
  if (lambda <= 0) return 0
  const L = Math.exp(-lambda)
  let k = 0, p = 1
  do {
    k++
    p *= rng()
  } while (p > L)
  return k - 1
}
