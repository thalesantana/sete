import type { Player, Pos } from '../engine/types'

export function PlayerPicker(props: {
  pos: Pos; players: Player[]; usedIds: Set<string>; statsVisible: boolean
  onPick: (p: Player) => void; onClose: () => void
}) {
  const eligible = props.players
    .filter(p => p.positions.includes(props.pos))
    .filter(p => !props.usedIds.has(p.playerId))
    .sort((a, b) => b.force - a.force)
  return (
    <div className="picker-overlay" onClick={props.onClose}>
      <div className="card picker" onClick={e => e.stopPropagation()}>
        <h2>Escolher {props.pos}</h2>
        <ul>
          {eligible.map(p => (
            <li key={p.playerId}>
              <button className="btn" onClick={() => props.onPick(p)}>
                {p.name} {props.statsVisible ? <span className="numeral">{p.force}</span> : null}
                {p.legend ? ' ★' : ''}
              </button>
            </li>
          ))}
          {eligible.length === 0 && <li className="muted">nenhum jogador elegível</li>}
        </ul>
        <button onClick={props.onClose}>fechar</button>
      </div>
    </div>
  )
}
