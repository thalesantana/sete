import type { CampaignResult } from '../engine/types'
import { country } from '../engine/countries'
import './result.css'

const BADGE_LABEL: Record<string, string> = {
  ESMAGADOR: 'ESMAGADOR DE RECORDES',
  MURALHA: 'MURALHA',
}

interface Props {
  result: CampaignResult
  onBack: () => void
  onRestart: () => void
}

export function ResultCard({ result, onBack, onRestart }: Props) {
  const champ = result.champion
  return (
    <div className="result-flow">
      <div className="card-wrap foil-bg">
        <div className="card-inner">
          <div className="card-mini">
            <div className="card-mini-left">
              <span className={`num card-mini-score ${champ ? 'led-green' : 'led'}`}>7:0</span>
              <span className="display card-mini-name">SETE A ZERO</span>
            </div>
            <span className="eyebrow card-mini-seed">seed #{result.seedCode}</span>
          </div>

          <div className="card-status">
            <div className="display card-status-label">{champ ? 'CAMPEÃO' : 'ELIMINADO'}</div>
            <div className="num led card-record">{result.record}</div>
            {result.badge && (
              <div className="card-badge">🏅 {BADGE_LABEL[result.badge] ?? result.badge}</div>
            )}
          </div>

          <div className="card-boxes">
            <div className="card-box">
              <span className="num is-green">{result.gf}</span>
              <span className="eyebrow">GOLS PRÓ</span>
            </div>
            <div className="card-box">
              <span className="num is-green">{result.ga}</span>
              <span className="eyebrow">SOFRIDOS</span>
            </div>
            <div className="card-box">
              <span className="num is-green">{result.overall}</span>
              <span className="eyebrow">OVERALL</span>
            </div>
            <div className="card-box">
              <span className="num is-amber">{result.wins}</span>
              <span className="eyebrow">VITÓRIAS</span>
            </div>
          </div>

          <div className="card-lineup">
            {result.lineup.map((p, i) => {
              const c = country(p.sel)
              return (
                <div className="card-player" key={i}>
                  <span className="num card-player-num">{p.number}</span>
                  <span className="card-player-name">{p.name}</span>
                  <span className="card-player-team">
                    <span className="card-player-flag">{c.flag}</span>
                    <span className="eyebrow">{c.code}</span>
                    <span className="num card-player-copa">{p.copa}</span>
                  </span>
                </div>
              )
            })}
          </div>

          <div className="card-actions">
            <button className="btn btn-secondary" onClick={onBack}>← VOLTAR</button>
            <button className="btn btn-secondary" onClick={onRestart}>↺ REPETIR</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResultCard
