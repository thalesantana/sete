import { useEffect, useState } from 'react'
import type { CampaignResult, CampaignGame, NamedGoal } from '../engine/types'
import { country } from '../engine/countries'
import './result.css'

type Theme = 'escuro' | 'claro'
type Mode = 'auto' | 'step'
type Speed = 'lento' | 'normal' | 'rapida' | 'ultra'

const SPEED_MS: Record<Speed, number> = { lento: 1200, normal: 700, rapida: 350, ultra: 90 }
const SPEED_LABEL: Record<Speed, string> = { lento: 'Lento', normal: 'Normal', rapida: 'Rápida', ultra: 'Ultra' }

const PHASE_LABEL: Record<string, string> = {
  GRUPOS: 'GRUPOS', OITAVAS: 'OITAVAS', QUARTAS: 'QUARTAS', SEMI: 'SEMI', FINAL: 'FINAL',
}

interface Props {
  result: CampaignResult
  theme: Theme
  onToggleTheme: () => void
  onRestart: () => void
  onShowCard: () => void
}

/** A knockout game (or anything with a penalty shootout) can be expanded. */
function isExpandable(g: CampaignGame): boolean {
  return g.phase !== 'GRUPOS'
}

function MergedTimeline({ scorers, conceded }: { scorers: NamedGoal[]; conceded: NamedGoal[] }) {
  const rows = [
    ...scorers.map(g => ({ ...g, side: 'me' as const })),
    ...conceded.map(g => ({ ...g, side: 'opp' as const })),
  ].sort((a, b) => a.minute - b.minute)
  if (rows.length === 0) return null
  return (
    <div className="timeline">
      {rows.map((r, i) => (
        <div key={i} className={`tl-row ${r.side === 'me' ? 'is-me' : 'is-opp'}`}>
          <span className="tl-min">{r.minute}'</span>
          {r.side === 'me' ? '⚽ ' : ''}{r.scorer}
        </div>
      ))}
    </div>
  )
}

function ShootoutView({ g }: { g: CampaignGame }) {
  const so = g.shootout
  if (!so) return null
  const me = so.kicks.filter(k => k.side === 'me')
  const opp = so.kicks.filter(k => k.side === 'opp')
  const meMain = me.slice(0, 5)
  const oppMain = opp.slice(0, 5)
  const meExtra = me.slice(5)
  const oppExtra = opp.slice(5)
  const kickRow = (k: { name: string; scored: boolean }, i: number) => (
    <div className="so-kick" key={i}>
      <span className={`so-mark ${k.scored ? 'ok' : 'miss'}`}>{k.scored ? '✓' : '✗'}</span>
      <span>{k.name}</span>
    </div>
  )
  return (
    <div>
      <div className="eyebrow">DISPUTA DE PÊNALTIS · MELHOR DE 5</div>
      <div className="shootout-grid">
        <div className="so-col">{meMain.map(kickRow)}</div>
        <div className="so-col">{oppMain.map(kickRow)}</div>
        {(meExtra.length > 0 || oppExtra.length > 0) && (
          <>
            <div className="eyebrow so-sudden">ALTERNADAS (MORTE SÚBITA)</div>
            <div className="so-col">{meExtra.map(kickRow)}</div>
            <div className="so-col">{oppExtra.map(kickRow)}</div>
          </>
        )}
      </div>
      <div className="num led shootout-result">
        {so.myScore}–{so.oppScore} · {g.advanced ? 'CLASSIFICADO' : 'ELIMINADO'}
      </div>
    </div>
  )
}

function GameRow({ game }: { game: CampaignGame }) {
  const expandable = isExpandable(game)
  const [open, setOpen] = useState(false)
  const opp = country(game.oppSel)

  const scoreCls = game.outcome === 'V'
    ? 'is-win led-green'
    : !game.advanced ? 'is-out' : 'is-draw'
  const mark = game.advanced ? '✓' : (game.outcome === 'E' ? '–' : '✗')
  const markCls = game.advanced ? 'is-win' : (game.outcome === 'E' ? 'is-draw' : 'is-out')

  const golsTxt = game.scorers.map(s => s.scorer).join(', ')
  const sofreuTxt = game.conceded.map(c => c.scorer).join(', ')

  return (
    <div
      className={`game-row rise ${expandable ? 'is-expandable' : ''}`}
      onClick={expandable ? () => setOpen(o => !o) : undefined}
    >
      <div className="game-line">
        <span className="eyebrow game-phase">{PHASE_LABEL[game.phase] ?? game.phase}</span>
        <span className="game-opp">
          <span className="game-opp-vs">vs</span>
          <span className="game-opp-flag">{opp.flag}</span>
          <span className="eyebrow game-opp-code">{opp.code}</span>
          <span className="display game-opp-name">{opp.name} {game.oppCopa}</span>
        </span>
        <span className="game-score">
          <span className={`num game-score-num ${scoreCls}`}>{game.gf} - {game.ga}</span>
          {game.penalties && <span className="game-score-pen">pên</span>}
          <span className={`game-mark ${markCls}`}>{mark}</span>
        </span>
      </div>

      {(golsTxt || sofreuTxt) && (
        <div className="eyebrow game-goals">
          {golsTxt && <>GOLS {golsTxt}</>}
          {golsTxt && sofreuTxt && <span className="sep"> · </span>}
          {sofreuTxt && <>SOFREU {sofreuTxt}</>}
        </div>
      )}

      {expandable && open && (
        <div className="game-detail" onClick={e => e.stopPropagation()}>
          <MergedTimeline scorers={game.scorers} conceded={game.conceded} />
          <ShootoutView g={game} />
        </div>
      )}
    </div>
  )
}

export function CampaignScreen({ result, theme, onToggleTheme, onRestart, onShowCard }: Props) {
  const [mode, setMode] = useState<Mode>('auto')
  const [speed, setSpeed] = useState<Speed>('rapida')
  const [revealed, setRevealed] = useState(0)
  const total = result.games.length

  // Auto mode: tick reveal one row at a time at the chosen cadence.
  useEffect(() => {
    if (mode !== 'auto') return
    if (revealed >= total) return
    const t = setTimeout(() => setRevealed(r => Math.min(r + 1, total)), SPEED_MS[speed])
    return () => clearTimeout(t)
  }, [mode, speed, revealed, total])

  // Reset reveal when switching back to auto so the animation replays.
  function switchMode(next: Mode) {
    setMode(next)
    setRevealed(next === 'auto' ? 0 : revealed)
  }

  const allRevealed = revealed >= total
  const shown = result.games.slice(0, revealed)

  return (
    <div className="result-flow">
      <div className="camp-head">
        <div>
          <div className="eyebrow">A CAMPANHA · SEED #{result.seedCode}</div>
          <h1 className="display camp-title">A CAMPANHA</h1>
        </div>
        <div className="camp-head-right">
          <div className="camp-toggle">
            <button
              className={`chip ${mode === 'step' ? 'is-active' : ''}`}
              onClick={() => switchMode('step')}
            >Jogo a jogo</button>
            <button
              className={`chip ${mode === 'auto' ? 'is-active' : ''}`}
              onClick={() => switchMode('auto')}
            >Automático</button>
          </div>
          <select
            className="camp-speed"
            value={speed}
            onChange={e => setSpeed(e.target.value as Speed)}
            aria-label="Velocidade"
          >
            {(Object.keys(SPEED_LABEL) as Speed[]).map(s => (
              <option key={s} value={s}>{SPEED_LABEL[s]}</option>
            ))}
          </select>
          <button className="pill pill-accent" onClick={onToggleTheme}>
            {theme === 'escuro' ? 'ESCURO' : 'CLARO'}
          </button>
        </div>
      </div>

      <hr className="rule" style={{ marginTop: 16 }} />

      <div className="camp-games">
        {shown.map((g, i) => (
          <GameRow key={i} game={g} />
        ))}
      </div>

      {mode === 'step' && !allRevealed && (
        <div className="camp-next">
          <button
            className="btn btn-primary"
            onClick={() => setRevealed(r => Math.min(r + 1, total))}
          >PRÓXIMO →</button>
        </div>
      )}

      {allRevealed && (
        <>
          <div className="camp-summary rise">
            <div className={`num summary-record ${result.champion ? 'is-champ' : 'is-out'}`}>
              {result.record}
            </div>
            <div className="display summary-wins">{result.wins} VITÓRIAS</div>
            <div className="summary-stats">
              <div className="summary-stat">
                <span className="num">{result.gf}</span>
                <span className="eyebrow">GOLS PRÓ</span>
              </div>
              <div className="summary-stat">
                <span className="num">{result.ga}</span>
                <span className="eyebrow">SOFRIDOS</span>
              </div>
              <div className="summary-stat">
                <span className="num">{result.wins}</span>
                <span className="eyebrow">VITÓRIAS</span>
              </div>
            </div>
          </div>

          <div className="camp-actions">
            <button className="btn btn-secondary" onClick={onRestart}>↺ REPETIR</button>
            <button className="btn btn-primary" onClick={onShowCard}>VER MEU CARD →</button>
          </div>
        </>
      )}
    </div>
  )
}

export default CampaignScreen
