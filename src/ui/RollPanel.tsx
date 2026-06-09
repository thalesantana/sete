import type { CatalogEntry } from '../engine/types'

export function RollPanel(props: {
  current: CatalogEntry | null; rerollsLeft: number; spinning: boolean
  onRoll: () => void; onRerollSel: () => void; onRerollCopa: () => void
}) {
  if (!props.current) {
    return (
      <div className="roll-panel card">
        <p>Role para sortear uma seleção e uma Copa</p>
        <button className="btn" disabled={props.spinning} onClick={props.onRoll}>
          {props.spinning ? 'Sorteando…' : 'Roll 🎲'}
        </button>
      </div>
    )
  }
  return (
    <div className="roll-panel card">
      <p className="display">{props.current.sel} · {props.current.copa}</p>
      <div className="reroll-row">
        <button className="btn" disabled={props.rerollsLeft <= 0 || props.spinning} onClick={props.onRerollSel}>↺ Seleção</button>
        <button className="btn" disabled={props.rerollsLeft <= 0 || props.spinning} onClick={props.onRerollCopa}>↺ Copa</button>
        <span className="muted">{props.rerollsLeft} trocas</span>
      </div>
    </div>
  )
}
