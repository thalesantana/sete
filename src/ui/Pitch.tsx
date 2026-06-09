import type { Slot } from '../engine/types'

export function Pitch(props: { slots: Slot[]; onSlot: (i: number) => void }) {
  return (
    <div className="pitch" style={{ background: 'var(--pitch)' }}>
      {props.slots.map((s, i) => (
        <button key={i} className="slot card" onClick={() => props.onSlot(i)}>
          <span className="slot-pos">{s.pos}</span>
          <span className="slot-name">{s.player ? s.player.name : '+'}</span>
        </button>
      ))}
    </div>
  )
}
