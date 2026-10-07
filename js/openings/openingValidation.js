import { getGableHeightAtX } from '../layout/gableGeometry.js'

/* OPENING BOUNDS — checked on add, edit, import and geometry changes. */
export function validateOpening(o, c) {
  const errors = []
  if (!o || ![o.start, o.width, o.bottom, o.height].every(Number.isFinite))
    return ['Enter valid start, width, sill and height measurements.']
  if (o.start < 0 || o.bottom < 0 || o.width <= 0 || o.height <= 0)
    errors.push('Start and sill cannot be negative; width and height must be positive.')
  if (o.start + o.width > c.wallLength + 0.001) errors.push('Opening extends past the wall end.')
  let top = c.wallHeight
  if (c.wallType === 'gable') {
    const at = (x) =>
      getGableHeightAtX(
        x,
        c.wallLength,
        c.leftEaveHeight,
        c.ridgeHeight,
        c.ridgePosition,
        c.rightEaveHeight,
      )
    const samples = [at(o.start), at(o.start + o.width)]
    if (c.ridgePosition > o.start && c.ridgePosition < o.start + o.width)
      samples.push(at(c.ridgePosition))
    top = Math.min(...samples)
  }
  if (o.bottom + o.height > top + 0.001) errors.push('Opening extends above the wall roofline.')
  let panelTop = c.panelStopHeight ?? c.wallHeight
  if (c.wallType === 'gable') {
    const atStop = (x) =>
      getGableHeightAtX(
        x,
        c.wallLength,
        c.leftPanelStopHeight ?? c.leftEaveHeight,
        c.ridgePanelStopHeight ?? c.ridgeHeight,
        c.ridgePosition,
        c.rightPanelStopHeight ?? c.rightEaveHeight,
      )
    const samples = [atStop(o.start), atStop(o.start + o.width)]
    if (c.ridgePosition > o.start && c.ridgePosition < o.start + o.width)
      samples.push(atStop(c.ridgePosition))
    panelTop = Math.min(...samples)
  }
  if (o.bottom + o.height > panelTop + 0.001 && panelTop < top - 0.001)
    errors.push('Opening extends above the panel stop; review geometry before making cuts.')
  return errors
}

/* OVERLAP WARNINGS — intentional overlaps remain allowed. */
export function openingOverlaps(o, others) {
  return others.some(
    (b) =>
      o.start < b.start + b.width &&
      o.start + o.width > b.start &&
      o.bottom < b.bottom + b.height &&
      o.bottom + o.height > b.bottom,
  )
}
