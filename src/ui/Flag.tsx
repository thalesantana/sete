import { useState } from 'react'
import { country, flagUrl } from '../engine/countries'

/**
 * Country flag as an SVG image (Windows doesn't render flag emoji).
 * Falls back to the country code text if the image can't load.
 */
export function Flag(props: { sel: string; size?: number }) {
  const [failed, setFailed] = useState(false)
  const url = flagUrl(props.sel)
  const h = props.size ?? 14
  const code = country(props.sel).code

  if (!url || failed) {
    return <span className="flag flag-code">{code}</span>
  }
  return (
    <img
      className="flag"
      src={url}
      alt={code}
      height={h}
      style={{ height: h, width: 'auto', borderRadius: 2, verticalAlign: 'middle' }}
      onError={() => setFailed(true)}
    />
  )
}
