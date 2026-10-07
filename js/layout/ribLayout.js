import { EPS } from './layoutMath.js'

/* RIB CENTERS — same sheet origin as panelLayout, including ripped ends. */
export function calculateRibs(length, spacing, startOffset = 0, coverage = 36) {
  if (length <= EPS || spacing <= EPS || coverage <= EPS) return []
  const offset = ((startOffset % coverage) + coverage) % coverage
  const centers = new Set()
  for (let sheet = -offset; sheet <= length + EPS; sheet += coverage) {
    for (let rib = 0; rib < coverage - EPS; rib += spacing) {
      const x = sheet + rib
      if (x >= -EPS && x <= length + EPS) centers.add(Math.round(x * 1e6) / 1e6)
    }
  }
  return [...centers].sort((a, b) => a - b).map((position) => ({ position }))
}
