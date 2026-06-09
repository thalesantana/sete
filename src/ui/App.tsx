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
import { PlayerPicker } from './PlayerPicker'
import { ResultScreen } from './ResultScreen'
import './app.css'

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
  const [theme, setTheme] = useState<'paper' | 'crt'>('paper')
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState('classico'))
  const [squad, setSquad] = useState<Squad | null>(null)
  const [picking, setPicking] = useState<number | null>(null)
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
    setSpinning(true)
    const recent = new Set(state.recent)
    const w = weights.size ? weights : new Map(CATALOG.map(c => [keyOf(c), 0.5]))
    const entry = rollInitial(makeRng(`${state.seed}:roll:${state.rollIndex}`), CATALOG, w, recent)
    await applyEntry(entry)
    setSpinning(false)
  }

  async function onRerollSel() {
    if (!state.current) return
    dispatch({ type: 'spendReroll' })
    const pool = eligible(CATALOG, state.current, 'sel')
    const entry = pickUniform(makeRng(`${state.seed}:rsel:${state.rollIndex}`), pool)
    await applyEntry(entry)
  }

  async function onRerollCopa() {
    if (!state.current) return
    dispatch({ type: 'spendReroll' })
    const pool = eligible(CATALOG, state.current, 'copa')
    const w = pool.map(c => (weights.get(keyOf(c)) ?? 0.5))
    const entry = pickWeighted(makeRng(`${state.seed}:rcopa:${state.rollIndex}`), pool, w)
    await applyEntry(entry)
  }

  function onSimulate() {
    const bonus = starBonus(state.slots.filter(s => s.player).map(s => s.player!.force))
    const result = playCampaign(`${state.seed}:${keyOf(state.current!)}`, rating, bonus)
    dispatch({ type: 'simulated', result })
  }

  const allFilled = state.slots.every(s => s.player)

  return (
    <div className="app">
      <header className="topbar">
        <span className="numeral logo">7–:0</span>
        <strong className="display">SETE</strong>
        <button onClick={() => setTheme(theme === 'paper' ? 'crt' : 'paper')}>
          {theme === 'paper' ? 'CRT' : 'Paper'}
        </button>
      </header>

      {state.phase === 'result' && state.result ? (
        <ResultScreen result={state.result} onRestart={() => { setSquad(null); dispatch({ type: 'restart' }) }} />
      ) : (
        <main className="layout">
          <section>
            <Controls
              formation={state.formation} style={state.style} mode={state.mode}
              onFormation={f => dispatch({ type: 'setFormation', formation: f })}
              onStyle={s => dispatch({ type: 'setStyle', style: s })}
              onMode={m => { setSquad(null); dispatch({ type: 'setMode', mode: m }) }}
            />
            <RollPanel
              current={state.current} rerollsLeft={state.rerollsLeft} spinning={spinning}
              onRoll={onRoll} onRerollSel={onRerollSel} onRerollCopa={onRerollCopa}
            />
            <Pitch slots={state.slots} onSlot={i => squad && setPicking(i)} />
            {allFilled && state.phase === 'build' &&
              <button className="btn simulate" onClick={onSimulate}>Simular 7 jogos →</button>}
          </section>
          <BoxScore rating={rating} slots={state.slots} statsVisible={statsVisible} />
        </main>
      )}

      {picking !== null && squad && (
        <PlayerPicker
          pos={state.slots[picking].pos}
          players={squad.squad}
          usedIds={state.usedPlayerIds}
          statsVisible={statsVisible}
          onPick={(p: Player) => { dispatch({ type: 'selectPlayer', slotIndex: picking, player: p }); setPicking(null) }}
          onClose={() => setPicking(null)}
        />
      )}
    </div>
  )
}

export default App
