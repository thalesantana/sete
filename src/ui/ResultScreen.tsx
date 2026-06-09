import type { CampaignResult } from '../engine/types'

const BADGE_LABEL: Record<string, string> = { ESMAGADOR: 'ESMAGADOR DE RECORDES', MURALHA: 'MURALHA' }

export function ResultScreen(props: { result: CampaignResult; onRestart: () => void }) {
  const r = props.result
  return (
    <div className="result card">
      <h1>{r.champion ? (r.perfect ? 'CAMPEÃO 7 A 0!' : 'CAMPEÃO!') : 'ELIMINADO'}</h1>
      <p className="numeral">{r.record} · {r.gf}–{r.ga}</p>
      {r.badge && <p className="badge">🏅 {BADGE_LABEL[r.badge]}</p>}
      <ol className="games">
        {r.games.map((g, i) => (
          <li key={i}>
            <strong>{g.phase}</strong> (adv {g.oppOverall}):{' '}
            <span className="numeral">{g.gf}–{g.ga}</span>
            {g.penalties ? ' (pênaltis)' : ''} {g.advanced ? '✓' : '✗ fora'}
          </li>
        ))}
      </ol>
      <button className="btn" onClick={props.onRestart}>Jogar de novo</button>
    </div>
  )
}
