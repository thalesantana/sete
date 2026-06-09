import type { CatalogEntry, Player, Slot, Squad } from '../engine/types'
import { POS_ORDER } from '../engine/config'
import { country } from '../engine/countries'
import { Flag } from './Flag'

export function RollPanel(props: {
  current: CatalogEntry | null
  rerollsLeft: number
  spinning: boolean
  spinDisplay: { sel: string; copa: number } | null
  needsEmergency: boolean
  squad: Squad | null
  slots: Slot[]
  activeSlot: number | null
  usedPlayerIds: Set<string>
  statsVisible: boolean
  previewId: string | null
  onRoll: () => void
  onRerollSel: () => void
  onRerollCopa: () => void
  onEmergencyReroll: () => void
  onSelectPlayer: (player: Player) => void
  onSimulate: () => void
}) {
  const filled = props.slots.filter(s => s.player).length
  const allFilled = props.slots.length > 0 && filled === props.slots.length

  // Spinning: roulette card cycling random draws before the reveal.
  if (props.spinning && props.spinDisplay) {
    return (
      <div className="roll-card">
        <div className="eyebrow">SORTEANDO…</div>
        <div className="display roll-sel is-spinning">
          <Flag sel={props.spinDisplay.sel} size={18} /> {country(props.spinDisplay.sel).name}
        </div>
        <div className="num led roll-copa is-spinning">Copa {props.spinDisplay.copa}</div>
      </div>
    )
  }

  // Lineup complete: simulate.
  if (allFilled) {
    return (
      <div className="lineup-done">
        <div className="eyebrow">ESCALAÇÃO COMPLETA</div>
        <div className="num lineup-count">11/11</div>
        <button className="btn btn-primary lineup-sim" onClick={props.onSimulate}>
          SIMULAR A COPA →
        </button>
      </div>
    )
  }

  // No current draw: roll for the next star.
  if (!props.current) {
    return (
      <div className="roll-empty">
        <div className="roll-hint">
          {filled === 0
            ? 'Role para sortear uma seleção e uma Copa do Mundo'
            : `Monte seu XI · ${filled}/11 · role para a próxima estrela`}
        </div>
        <button className="btn btn-primary roll-big" disabled={props.spinning} onClick={props.onRoll}>
          {props.spinning ? 'SORTEANDO…' : 'ROLAR 🎲'}
        </button>
      </div>
    )
  }

  const c = country(props.current.sel)
  return (
    <div className="roll-card">
      <div className="eyebrow">SAIU</div>
      <div key={`${props.current.sel}:${props.current.copa}`} className="display roll-sel snap-anim">
        <Flag sel={props.current.sel} size={18} /> {c.name}
      </div>
      <div className="num led roll-copa">Copa {props.current.copa}</div>

      <div className="eyebrow roll-reroll-label">
        NÃO CURTIU? RE-SORTEIE · {props.rerollsLeft} RESTANTES
      </div>
      <button
        className="btn btn-secondary roll-reroll-btn"
        disabled={props.rerollsLeft <= 0 || props.spinning}
        onClick={props.onRerollSel}
      >↺ OUTRA SELEÇÃO</button>
      <button
        className="btn btn-secondary roll-reroll-btn"
        disabled={props.rerollsLeft <= 0 || props.spinning}
        onClick={props.onRerollCopa}
      >↺ OUTRA COPA</button>

      {props.needsEmergency ? (
        <div className="roll-emergency">
          <div className="eyebrow">SEM JOGADOR PRA UMA VAGA</div>
          <button className="btn btn-secondary roll-reroll-btn" onClick={props.onEmergencyReroll}>
            ↻ SORTEAR OUTRO (GRÁTIS)
          </button>
        </div>
      ) : (
        <>
          <div className="eyebrow roll-pick-label">ESCOLHA UM JOGADOR</div>
          <PlayerList
            squad={props.squad}
            slots={props.slots}
            activeSlot={props.activeSlot}
            usedPlayerIds={props.usedPlayerIds}
            statsVisible={props.statsVisible}
            previewId={props.previewId}
            onSelectPlayer={props.onSelectPlayer}
          />
        </>
      )}
    </div>
  )
}

function PlayerList(props: {
  squad: Squad | null
  slots: Slot[]
  activeSlot: number | null
  usedPlayerIds: Set<string>
  statsVisible: boolean
  previewId: string | null
  onSelectPlayer: (player: Player) => void
}) {
  const all = props.squad?.squad ?? []
  const activePos = props.activeSlot != null ? props.slots[props.activeSlot]?.pos : null
  const openPos = new Set(props.slots.filter(s => !s.player).map(s => s.pos))
  const posRank = (p: Player) => POS_ORDER[p.positions[0]] ?? 99
  // A player can be placed if some position fits an open slot or the active slot.
  const canPlace = (p: Player) =>
    p.positions.some(pos => openPos.has(pos)) || (!!activePos && p.positions.includes(activePos))

  // Show the whole squad (minus already-used players), ordered GOL→CA.
  const rows = all
    .filter(p => !props.usedPlayerIds.has(p.playerId))
    .sort((a, b) => posRank(a) - posRank(b) || b.force - a.force)

  return (
    <div className="player-list">
      {rows.map(p => {
        const ok = canPlace(p)
        return (
        <button
          key={p.playerId}
          className={`player-row${ok ? '' : ' is-disabled'}${p.playerId === props.previewId ? ' is-preview' : ''}`}
          disabled={!ok}
          onClick={() => ok && props.onSelectPlayer(p)}
        >
          <span className="player-num muted">#{p.number}</span>
          <span className="player-name">{p.name}</span>
          <span className="player-pos muted">{p.positions.join('/')}</span>
          {props.statsVisible && <span className="player-force num">{p.force}</span>}
        </button>
        )
      })}
    </div>
  )
}
