import type { Rating, Slot } from '../engine/types'

export function BoxScore(props: { rating: Rating; slots: Slot[]; statsVisible: boolean }) {
  const filled = props.slots.filter(s => s.player).length
  const showStats = props.statsVisible && filled > 0

  return (
    <aside className="box-panel">
      <div className="box-head">
        <span className="eyebrow">BOX SCORE · {filled}/11</span>
        {filled > 0 && (
          <span className="num led-green box-overall">{Math.round(props.rating.overall)}</span>
        )}
      </div>

      <div className="box-legend">
        <span className="box-legend-item">
          <span className="box-dash box-dash-atk" />
          {showStats
            ? <><span className="num led">{Math.round(props.rating.attack)}</span> ATAQUE</>
            : <>— ATAQUE</>}
        </span>
        <span className="box-legend-item">
          <span className="box-dash box-dash-def" />
          {showStats
            ? <><span className="num led-green">{Math.round(props.rating.defense)}</span> DEFESA</>
            : <>— DEFESA</>}
        </span>
      </div>

      <table className="boxscore">
        <tbody>
          {props.slots.map((s, i) => (
            <tr key={i} className={s.player ? undefined : 'empty'}>
              <td className="pos">{s.pos}</td>
              <td>{s.player ? s.player.name : '(vazio)'}</td>
              <td className="val">{s.player && props.statsVisible ? s.player.force : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </aside>
  )
}
