import { useReducer, useMemo, useState, useEffect } from 'react'
import { initialState, reducer } from '../state/gameReducer'
import { CATALOG, keyOf, squadWeights, eligible, loadSquad, pickOpponents } from '../engine/catalog'
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
import { CampaignScreen } from './CampaignScreen'
import { ResultCard } from './ResultCard'
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
  const [resultView, setResultView] = useState<'campaign' | 'card'>('campaign')
  const [spinning, setSpinning] = useState(false)
  const [spinDisplay, setSpinDisplay] = useState<{ sel: string; copa: number } | null>(null)
  const weights = useWeights()

  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])

  // Always land on the campaign view when a fresh result comes in.
  useEffect(() => { setResultView('campaign') }, [state.result?.seedCode])

  const rating = useMemo(() => rate(state.slots, state.style), [state.slots, state.style])
  const statsVisible = MODES[state.mode].statsVisible

  /** Slot-machine reveal: flash random draws with a decelerating cadence (~1s). */
  function runSpin(): Promise<void> {
    return new Promise(resolve => {
      let delay = 55
      let elapsed = 0
      const tick = () => {
        const r = CATALOG[Math.floor(Math.random() * CATALOG.length)]
        setSpinDisplay({ sel: r.sel, copa: r.copa })
        elapsed += delay
        delay *= 1.18
        if (elapsed < 950) setTimeout(tick, delay)
        else resolve()
      }
      tick()
    })
  }

  /** Animate the roulette, then reveal the (deterministic) drawn entry. */
  async function spinTo(entry: { sel: string; copa: number; slug: string }) {
    setSpinning(true)
    const squadPromise = loadSquad(entry.slug)
    await runSpin()
    const s = await squadPromise
    setSquad(s)
    setSpinDisplay(null)
    dispatch({ type: 'rolled', entry })
    setSpinning(false)
  }

  async function onRoll() {
    if (spinning) return
    const recent = new Set(state.recent)
    const w = weights.size ? weights : new Map(CATALOG.map(c => [keyOf(c), 0.5]))
    const entry = rollInitial(makeRng(`${state.seed}:roll:${state.rollIndex}`), CATALOG, w, recent)
    await spinTo(entry)
  }

  async function onRerollSel() {
    if (!state.current || spinning || state.rerollsLeft <= 0) return
    dispatch({ type: 'spendReroll' })
    const pool = eligible(CATALOG, state.current, 'sel')
    const entry = pickUniform(makeRng(`${state.seed}:rsel:${state.rollIndex}`), pool)
    await spinTo(entry)
  }

  async function onRerollCopa() {
    if (!state.current || spinning || state.rerollsLeft <= 0) return
    dispatch({ type: 'spendReroll' })
    const pool = eligible(CATALOG, state.current, 'copa')
    const w = pool.map(c => (weights.get(keyOf(c)) ?? 0.5))
    const entry = pickWeighted(makeRng(`${state.seed}:rcopa:${state.rollIndex}`), pool, w)
    await spinTo(entry)
  }

  function onSelectPlayer(player: Player) {
    if (state.activeSlot != null) {
      dispatch({ type: 'selectPlayer', slotIndex: state.activeSlot, player })
      return
    }
    const idx = state.slots.findIndex(s => !s.player && player.positions.includes(s.pos))
    if (idx >= 0) dispatch({ type: 'selectPlayer', slotIndex: idx, player })
  }

  /** Free redraw when the drawn team has no player for any remaining slot. */
  async function onEmergencyReroll() {
    if (spinning) return
    const recent = new Set(state.recent)
    const w = weights.size ? weights : new Map(CATALOG.map(c => [keyOf(c), 0.5]))
    const entry = rollInitial(makeRng(`${state.seed}:emg:${state.rollIndex}`), CATALOG, w, recent)
    await spinTo(entry)
  }

  async function onSimulate() {
    if (spinning) return
    const bonus = starBonus(state.slots.filter(s => s.player).map(s => s.player!.force))
    // Seed the campaign from the assembled XI so the same team always replays the same.
    const ids = state.slots.map(s => s.player?.playerId ?? '').join(',')
    const seedBase = `${state.seed}:${ids}`
    // Draw 7 real opponent "faces" (display only; difficulty stays the fixed ladder).
    const exclude = new Set(state.slots.filter(s => s.player).map(s => `${s.player!.sel}:${s.player!.copa}`))
    const oppEntries = pickOpponents(makeRng(`${seedBase}:opp`), 7, exclude)
    const opponents = await Promise.all(oppEntries.map(async e => {
      const sq = await loadSquad(e.slug)
      return { sel: e.sel, copa: e.copa, squad: sq.squad }
    }))
    const result = playCampaign(seedBase, rating, bonus, { lineup: state.slots, opponents })
    dispatch({ type: 'simulated', result })
  }

  if (state.phase === 'result' && state.result) {
    const result = state.result
    const onRestart = () => { setSquad(null); dispatch({ type: 'restart' }) }
    const onToggleTheme = () => setTheme(theme === 'escuro' ? 'claro' : 'escuro')
    return (
      <div className="screen tx-scan tx-crt">
        {resultView === 'campaign'
          ? (
            <CampaignScreen
              result={result}
              theme={theme}
              onToggleTheme={onToggleTheme}
              onRestart={onRestart}
              onShowCard={() => setResultView('card')}
            />
          )
          : (
            <ResultCard
              result={result}
              onBack={() => setResultView('campaign')}
              onRestart={onRestart}
            />
          )}
      </div>
    )
  }

  const styleUp = state.style.toUpperCase()
  const modeUp = MODE_LABELS_UP[state.mode] ?? state.mode.toUpperCase()

  // Emergency reroll: a drawn team with no player for any empty slot.
  const emptyPositions = new Set(state.slots.filter(s => !s.player).map(s => s.pos))
  const drawHasEligible = !squad || squad.squad.some(
    p => !state.usedPlayerIds.has(p.playerId) && p.positions.some(pos => emptyPositions.has(pos)),
  )
  const needsEmergency = !!state.current && !spinning && !drawHasEligible

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
            spinDisplay={spinDisplay}
            needsEmergency={needsEmergency}
            onEmergencyReroll={onEmergencyReroll}
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
          <div style={{ aspectRatio: '520 / 694', width: '100%', maxWidth: 520, margin: '0 auto' }}>
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
