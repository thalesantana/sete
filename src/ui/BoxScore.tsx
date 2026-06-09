import type { Rating, Slot } from '../engine/types'

export function BoxScore(props: { rating: Rating; slots: Slot[]; statsVisible: boolean }) {
  const filled = props.slots.filter(s => s.player).length
  return (
    <aside className="card boxscore">
      <h2>Box score · {filled}/11</h2>
      {props.statsVisible ? (
        <p>
          <span className="numeral">{Math.round(props.rating.attack)}</span> ataque{' · '}
          <span className="numeral">{Math.round(props.rating.defense)}</span> defesa{' · '}
          <span className="numeral">{Math.round(props.rating.overall)}</span> overall
        </p>
      ) : <p className="muted">notas escondidas (almanaque)</p>}
      <table>
        <tbody>
          {props.slots.map((s, i) => (
            <tr key={i}>
              <td>{s.pos}</td>
              <td>{s.player ? s.player.name : '—'}</td>
              <td className="numeral">{s.player && props.statsVisible ? s.player.force : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </aside>
  )
}
