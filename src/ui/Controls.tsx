import type { Formation, Style, Mode } from '../engine/types'
import { FORMATION_KEYS } from '../engine/formations'

const STYLES: Style[] = ['defensivo', 'equilibrado', 'ofensivo']
const STYLE_LABELS: Record<Style, string> = {
  defensivo: 'Defensivo', equilibrado: 'Equilibrado', ofensivo: 'Ofensivo',
}
const MODES: Mode[] = ['classico', 'almanaque']
const MODE_LABELS: Record<Mode, string> = { classico: 'Clássico', almanaque: 'De almanaque' }

export function Controls(props: {
  formation: Formation; style: Style; mode: Mode
  formationLocked?: boolean
  onFormation: (f: Formation) => void; onStyle: (s: Style) => void; onMode: (m: Mode) => void
}) {
  return (
    <div className="ctrl-card">
      <div className="ctrl-block">
        <div className="eyebrow">FORMAÇÃO{props.formationLocked ? ' · TRAVADA' : ''}</div>
        <div className="chip-grid">
          {FORMATION_KEYS.map(f => (
            <button
              key={f}
              className={`chip${f === props.formation ? ' is-active' : ''}`}
              disabled={props.formationLocked && f !== props.formation}
              onClick={() => !props.formationLocked && props.onFormation(f)}
            >{f}</button>
          ))}
        </div>
      </div>

      <div className="ctrl-block">
        <div className="eyebrow">ESTILO</div>
        <div className="chip-row">
          {STYLES.map(s => (
            <button
              key={s}
              className={`chip${s === props.style ? ' is-active' : ''}`}
              onClick={() => props.onStyle(s)}
            >{STYLE_LABELS[s]}</button>
          ))}
        </div>
      </div>

      <div className="ctrl-block">
        <div className="eyebrow">MODO · DIFICULDADE</div>
        <div className="chip-row">
          {MODES.map(m => (
            <button
              key={m}
              className={`chip${m === props.mode ? ' is-active' : ''}`}
              onClick={() => props.onMode(m)}
            >{MODE_LABELS[m]}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
