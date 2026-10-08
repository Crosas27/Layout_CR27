export const EPS = 0.001
export function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function clampNum(value, min, max) {
  const n = Number(value)
  if (!Number.isFinite(n)) return min
  return Math.min(Math.max(n, min), max)
}

export function findNearest(target, values) {
  if (!values.length) return 0
  return values.reduce(
    (best, v) => (Math.abs(v - target) < Math.abs(best - target) ? v : best),
    values[0],
  )
}

export function toDeg(rad) {
  return (rad * 180) / Math.PI
}

export function offSquareDeg(leftHeight, rightHeight, width) {
  if (width <= EPS) return 0
  return toDeg(Math.atan2(Math.abs(rightHeight - leftHeight), width))
}

export function getSlopeAngleDeg(startHeight, endHeight, run) {
  if (run <= EPS) return 0
  return toDeg(Math.atan2(Math.abs(endHeight - startHeight), run))
}
