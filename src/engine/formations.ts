import type { Formation, Pos, Slot } from './types'

/** Slot layout (11 positions) for each formation. */
export const FORMATIONS: Record<Formation, Pos[]> = {
  '4-3-3':   ['GOL', 'LD', 'ZAG', 'ZAG', 'LE', 'VOL', 'MC', 'MEI', 'PD', 'CA', 'PE'],
  '4-4-2':   ['GOL', 'LD', 'ZAG', 'ZAG', 'LE', 'MD', 'MC', 'MC', 'ME', 'CA', 'CA'],
  '4-2-3-1': ['GOL', 'LD', 'ZAG', 'ZAG', 'LE', 'VOL', 'VOL', 'PD', 'MEI', 'PE', 'CA'],
  '4-2-4':   ['GOL', 'LD', 'ZAG', 'ZAG', 'LE', 'VOL', 'MC', 'PD', 'CA', 'CA', 'PE'],
  '3-5-2':   ['GOL', 'ZAG', 'ZAG', 'ZAG', 'MD', 'VOL', 'MC', 'MEI', 'ME', 'CA', 'CA'],
  '5-3-2':   ['GOL', 'LD', 'ZAG', 'ZAG', 'ZAG', 'LE', 'VOL', 'MC', 'MEI', 'CA', 'CA'],
  '4-5-1':   ['GOL', 'LD', 'ZAG', 'ZAG', 'LE', 'MD', 'VOL', 'MC', 'MEI', 'ME', 'CA'],
  '3-4-3':   ['GOL', 'ZAG', 'ZAG', 'ZAG', 'MD', 'VOL', 'MC', 'ME', 'PD', 'CA', 'PE'],
}

/** Build a fresh, empty slot list for a formation. */
export function slotsFor(formation: Formation): Slot[] {
  return FORMATIONS[formation].map(pos => ({ pos, player: null }))
}
