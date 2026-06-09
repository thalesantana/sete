import type { Formation, Style, Mode } from '../engine/types'
import { FORMATIONS } from '../engine/formations'

const STYLES: Style[] = ['defensivo', 'equilibrado', 'atacante']
const MODE_LABELS: Record<Mode, string> = { classico: 'Clássico', almanaque: 'Almanaque' }

export function Controls(props: {
  formation: Formation; style: Style; mode: Mode
  onFormation: (f: Formation) => void; onStyle: (s: Style) => void; onMode: (m: Mode) => void
  disabled?: boolean
}) {
  return (
    <div className="controls">
      <label>Formação{' '}
        <select value={props.formation} disabled={props.disabled}
          onChange={e => props.onFormation(e.target.value as Formation)}>
          {Object.keys(FORMATIONS).map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </label>
      <label>Estilo{' '}
        <select value={props.style} disabled={props.disabled}
          onChange={e => props.onStyle(e.target.value as Style)}>
          {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label>Modo{' '}
        <select value={props.mode}
          onChange={e => props.onMode(e.target.value as Mode)}>
          {(['classico', 'almanaque'] as Mode[]).map(m => <option key={m} value={m}>{MODE_LABELS[m]}</option>)}
        </select>
      </label>
    </div>
  )
}
