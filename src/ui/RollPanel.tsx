import type { CatalogEntry, Player, Slot, Squad } from '../engine/types'

export function RollPanel(props: {
  current: CatalogEntry | null
  rerollsLeft: number
  spinning: boolean
  squad: Squad | null
  slots: Slot[]
  activeSlot: number | null
  usedPlayerIds: Set<string>
  statsVisible: boolean
  onRoll: () => void
  onRerollSel: () => void
  onRerollCopa: () => void
  onSelectPlayer: (player: Player) => void
  onSimulate: () => void
}) {
  // Empty state: prompt + big roll button.
  if (!props.current) {
    return (
      <div className="roll-empty">
        <div className="roll-hint">
          Role para sortear uma seleção e uma Copa do Mundo
        </div>
        <button
          className="btn btn-primary roll-big"
          disabled={props.spinning}
          onClick={props.onRoll}
        >
          {props.spinning ? 'SORTEANDO…' : 'ROLAR 🎲'}
        </button>
      </div>
    )
  }

  const allFilled = props.slots.length > 0 && props.slots.every(s => s.player)

  return (
    <div className="roll-card">
      <div className="eyebrow">SAIU</div>
      <div className="display roll-sel">{props.current.sel}</div>
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

      {allFilled ? (
        <div className="lineup-done">
          <div className="eyebrow">ESCALAÇÃO COMPLETA</div>
          <div className="num lineup-count">11/11</div>
          <button className="btn btn-primary lineup-sim" onClick={props.onSimulate}>
            SIMULAR A COPA →
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
  onSelectPlayer: (player: Player) => void
}) {
  const all = props.squad?.squad ?? []
  const activePos = props.activeSlot != null ? props.slots[props.activeSlot]?.pos : null

  const rows = all
    .filter(p => !props.usedPlayerIds.has(p.playerId))
    .filter(p => (activePos ? p.positions.includes(activePos) : true))
    .sort((a, b) => b.force - a.force)

  return (
    <div className="player-list">
      {rows.map(p => (
        <button key={p.playerId} className="player-row" onClick={() => props.onSelectPlayer(p)}>
          <span className="player-num muted">#{p.number}</span>
          <span className="player-name">{p.name}</span>
          <span className="player-pos muted">{p.positions.join('/')}</span>
          {props.statsVisible && <span className="player-force num">{p.force}</span>}
        </button>
      ))}
    </div>
  )
}
