import { useReducer, useMemo, useState, useEffect } from 'react'
import { initialState, reducer } from '../state/gameReducer'
import { CATALOG, keyOf, squadWeights, eligible, loadSquad } from '../engine/catalog'
import { rollInitial, pickUniform, pickWeighted } from '../engine/roll'
import { makeRng } from '../engine/rng'
import { rate, starBonus } from '../engine/rating'
import { playCampaign } from '../engine/campaign'
import { MODES } from '../engine/config'
import type { Player, Squad } from '../engine/types'
import { Controls } from './Controls'
import { Pitch } from './Pitch'
import { BoxScore } from './BoxScore'
import { RollPanel } from './RollPanel'
import { ResultScreen } from './ResultScreen'
import './app.css'

type Theme = 'escuro' | 'claro'

const MODE_LABELS_UP: Record<string, string> = { classico: 'CLÁSSICO', almanaque: 'ALMANAQUE' }

// Precompute roll weights once from squad averages (loaded lazily; fallback 0.5).
function useWeights() {
  const [weights, setWeights] = useState<Map<string, number>>(new Map())
  useEffect(() => {
    let alive = true
    Promise.all(CATALOG.map(async c => {
      try { const s = await loadSquad(c.slug); const avg = s.squad.reduce((a, p) => a + p.force, 0) / s.squad.length; return { ...c, avg } }
      catch { return { ...c, avg: 75 } }
    })).then(rows => { if (alive) setWeights(squadWeights(rows)) })
    return () => { alive = false }
  }, [])
  return weights
}

export function App() {
  const [theme, setTheme] = useState<Theme>('escuro')
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState('classico'))
  const [squad, setSquad] = useState<Squad | null>(null)
  const [spinning, setSpinning] = useState(false)
  const weights = useWeights()

  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])

  const rating = useMemo(() => rate(state.slots, state.style), [state.slots, state.style])
  const statsVisible = MODES[state.mode].statsVisible

  async function applyEntry(entry: { sel: string; copa: number; slug: string }) {
    const s = await loadSquad(entry.slug)
    setSquad(s)
    dispatch({ type: 'rolled', entry })
  }

  async function onRoll() {
    if (spinning) return
    setSpinning(true)
    const recent = new Set(state.recent)
    const w = weights.size ? weights : new Map(CATALOG.map(c => [keyOf(c), 0.5]))
    const entry = rollInitial(makeRng(`${state.seed}:roll:${state.rollIndex}`), CATALOG, w, recent)
    await applyEntry(entry)
    setSpinning(false)
  }

  async function onRerollSel() {
    if (!state.current || spinning || state.rerollsLeft <= 0) return
    setSpinning(true)
    dispatch({ type: 'spendReroll' })
    const pool = eligible(CATALOG, state.current, 'sel')
    const entry = pickUniform(makeRng(`${state.seed}:rsel:${state.rollIndex}`), pool)
    await applyEntry(entry)
    setSpinning(false)
  }

  async function onRerollCopa() {
    if (!state.current || spinning || state.rerollsLeft <= 0) return
    setSpinning(true)
    dispatch({ type: 'spendReroll' })
    const pool = eligible(CATALOG, state.current, 'copa')
    const w = pool.map(c => (weights.get(keyOf(c)) ?? 0.5))
    const entry = pickWeighted(makeRng(`${state.seed}:rcopa:${state.rollIndex}`), pool, w)
    await applyEntry(entry)
    setSpinning(false)
  }

  function onSelectPlayer(player: Player) {
    if (state.activeSlot != null) {
      dispatch({ type: 'selectPlayer', slotIndex: state.activeSlot, player })
      return
    }
    const idx = state.slots.findIndex(s => !s.player && player.positions.includes(s.pos))
    if (idx >= 0) dispatch({ type: 'selectPlayer', slotIndex: idx, player })
  }

  function onSimulate() {
    const bonus = starBonus(state.slots.filter(s => s.player).map(s => s.player!.force))
    const result = playCampaign(`${state.seed}:${keyOf(state.current!)}`, rating, bonus)
    dispatch({ type: 'simulated', result })
  }

  if (state.phase === 'result' && state.result) {
    return (
      <div className="screen tx-scan tx-crt">
        <ResultScreen result={state.result} onRestart={() => { setSquad(null); dispatch({ type: 'restart' }) }} />
      </div>
    )
  }

  const styleUp = state.style.toUpperCase()
  const modeUp = MODE_LABELS_UP[state.mode] ?? state.mode.toUpperCase()

  return (
    <div className="screen tx-scan tx-crt">
      <header className="topbar">
        <div className="topbar-left">
          <div className="score-led">
            <span className="num led">7</span>
            <span className="num led-green">:</span>
            <span className="num led">0</span>
          </div>
          <div className="topbar-divider" />
          <div className="brand">
            <div className="display brand-title">SETE</div>
            <div className="display brand-title">A ZERO</div>
            <div className="eyebrow brand-tag">MONTE · SIMULE · 7 A 0</div>
          </div>
        </div>

        <div className="topbar-right">
          <div className="eyebrow topbar-meta">
            {state.formation} · {styleUp} · {modeUp}
          </div>
          <div className="topbar-pills">
            <button className="pill">STREAM</button>
            <button className="pill">PT ▾</button>
            <button
              className="pill pill-accent"
              onClick={() => setTheme(theme === 'escuro' ? 'claro' : 'escuro')}
            >
              {theme === 'escuro' ? 'ESCURO' : 'CLARO'}
            </button>
          </div>
        </div>
      </header>

      <hr className="rule" />

      <main className="body">
        <section className="col col-left">
          <Controls
            formation={state.formation} style={state.style} mode={state.mode}
            onFormation={f => dispatch({ type: 'setFormation', formation: f })}
            onStyle={s => dispatch({ type: 'setStyle', style: s })}
            onMode={m => { setSquad(null); dispatch({ type: 'setMode', mode: m }) }}
          />
          <RollPanel
            current={state.current}
            rerollsLeft={state.rerollsLeft}
            spinning={spinning}
            squad={squad}
            slots={state.slots}
            activeSlot={state.activeSlot}
            usedPlayerIds={state.usedPlayerIds}
            statsVisible={statsVisible}
            onRoll={onRoll}
            onRerollSel={onRerollSel}
            onRerollCopa={onRerollCopa}
            onSelectPlayer={onSelectPlayer}
            onSimulate={onSimulate}
          />
        </section>

        <section className="col col-center">
          <div className="lower-third">ANUNCIE AQUI · CONTATO · ANUNCIE AQUI</div>
          <div style={{ aspectRatio: '800 / 980', width: '100%' }}>
            <Pitch
              formation={state.formation}
              style={state.style}
              slots={state.slots}
              activeSlot={state.activeSlot}
              onSlot={i => dispatch({ type: 'setActiveSlot', slotIndex: state.activeSlot === i ? null : i })}
            />
          </div>
          <div className="lower-third">ANUNCIE AQUI · CONTATO · ANUNCIE AQUI</div>
          <div className="eyebrow pitch-caption">Toque num jogador pra mudar de posição</div>
        </section>

        <section className="col col-right">
          <BoxScore rating={rating} slots={state.slots} statsVisible={statsVisible} />
        </section>
      </main>
    </div>
  )
}

export default App
