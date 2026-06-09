import type { Formation, Style, Slot } from '../engine/types'
import { coordsFor } from '../engine/formations'

/** Static field markings drawn in an 800×980 portrait viewBox. */
function FieldLines() {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 2 } as const
  return (
    <svg className="pitch-svg" viewBox="0 0 800 980" preserveAspectRatio="none">
      {/* boundary */}
      <rect x={12} y={10} width={776} height={960} {...s} />
      {/* halfway line + centre circle + spot */}
      <line x1={12} y1={490} x2={788} y2={490} {...s} />
      <circle cx={400} cy={490} r={74} {...s} />
      <circle cx={400} cy={490} r={4} fill="currentColor" stroke="none" />
      {/* top box / goal area / spot / D */}
      <rect x={208} y={10} width={384} height={150} {...s} />
      <rect x={312} y={10} width={176} height={60} {...s} />
      <circle cx={400} cy={120} r={4} fill="currentColor" stroke="none" />
      <path d="M320,160 Q400,224 480,160" {...s} />
      {/* bottom box / goal area / spot / D */}
      <rect x={208} y={820} width={384} height={150} {...s} />
      <rect x={312} y={910} width={176} height={60} {...s} />
      <circle cx={400} cy={860} r={4} fill="currentColor" stroke="none" />
      <path d="M320,820 Q400,756 480,820" {...s} />
      {/* corner arcs */}
      <path d="M12,38 A28,28 0 0 0 40,10" {...s} />
      <path d="M760,10 A28,28 0 0 0 788,38" {...s} />
      <path d="M12,942 A28,28 0 0 1 40,970" {...s} />
      <path d="M760,970 A28,28 0 0 1 788,942" {...s} />
    </svg>
  )
}

export function Pitch(props: {
  formation: Formation
  style: Style
  slots: Slot[]
  activeSlot: number | null
  onSlot: (i: number) => void
}) {
  const coords = coordsFor(props.formation, props.style)
  return (
    <div className="pitch">
      <FieldLines />
      {props.slots.map((slot, i) => {
        const c = coords[i]
        if (!c) return null
        const active = props.activeSlot === i
        const filled = !!slot.player
        const cls = ['disc', filled ? '' : 'slot-empty', active ? 'slot-active' : ''].join(' ').replace(/\s+/g, ' ').trim()
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
