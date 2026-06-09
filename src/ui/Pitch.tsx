import type { Formation, Style, Slot, Player } from '../engine/types'
import { coordsFor } from '../engine/formations'

/** Static field markings drawn in an 800×980 portrait viewBox. */
function FieldLines() {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 2 } as const
  return (
    <svg className="pitch-svg" viewBox="0 0 520 694" preserveAspectRatio="none">
      {/* boundary */}
      <rect x={8} y={6} width={504} height={682} {...s} />
      {/* halfway line + centre circle + spot */}
      <line x1={8} y1={347} x2={512} y2={347} {...s} />
      <circle cx={260} cy={347} r={66} {...s} />
      <circle cx={260} cy={347} r={3} fill="currentColor" stroke="none" />
      {/* top box / goal area / spot / D */}
      <rect x={110} y={6} width={300} height={114} {...s} />
      <rect x={182} y={6} width={156} height={44} {...s} />
      <circle cx={260} cy={88} r={3} fill="currentColor" stroke="none" />
      <path d="M210,120 Q260,165 310,120" {...s} />
      {/* bottom box / goal area / spot / D */}
      <rect x={110} y={574} width={300} height={114} {...s} />
      <rect x={182} y={644} width={156} height={44} {...s} />
      <circle cx={260} cy={606} r={3} fill="currentColor" stroke="none" />
      <path d="M210,574 Q260,529 310,574" {...s} />
      {/* corner arcs */}
      <path d="M8,26 A20,20 0 0 0 28,6" {...s} />
      <path d="M492,6 A20,20 0 0 0 512,26" {...s} />
      <path d="M8,668 A20,20 0 0 1 28,688" {...s} />
      <path d="M492,688 A20,20 0 0 1 512,668" {...s} />
    </svg>
  )
}

export function Pitch(props: {
  formation: Formation
  style: Style
  slots: Slot[]
  activeSlot: number | null
  previewPlayer?: Player | null
  onSlot: (i: number) => void
}) {
  const coords = coordsFor(props.formation, props.style)
  return (
    <div className="pitch">
      <FieldLines />
      {props.slots.map((slot, i) => {
        const c = coords[i]
        if (!c) return null
        const filled = !!slot.player
        // a previewed player can drop only into an EMPTY slot whose position they play
        const droppable = !!props.previewPlayer && !filled && props.previewPlayer.positions.includes(slot.pos)
        // hide the "active slot" highlight while previewing, so only droppable slots glow
        const active = props.activeSlot === i && !props.previewPlayer
        const cls = ['disc', filled ? '' : 'slot-empty', active ? 'slot-active' : '', droppable ? 'slot-drop' : '']
          .join(' ').replace(/\s+/g, ' ').trim()
        return (
          <div
            key={`${i}-${slot.player?.playerId ?? 'empty'}`}
            className={cls}
            style={{ left: `${c.x}%`, top: `${c.y}%` }}
            onClick={() => props.onSlot(i)}
            role="button"
            title={slot.pos}
          >
            <div className={`disc-circle${filled ? ' rise' : ''}`}>
              {filled ? slot.player!.number : slot.pos}
            </div>
            {filled && <div className="disc-name">{slot.player!.name}</div>}
          </div>
        )
      })}
    </div>
  )
}
