import { EPS } from './layoutMath.js'
export function calculatePanels(length, coverage, startOffset = 0) {
  if (length <= EPS || coverage <= EPS) return []

  const panels = []

  // Normalize offset into a 0..coverage range
  let offset = Number(startOffset) || 0
  offset = ((offset % coverage) + coverage) % coverage

  // Build the seam grid so the first seam can exist before x=0
  let pos = -offset
  let panelNo = 1

  while (pos < length - EPS) {
    const rawStart = pos
    const rawEnd = pos + coverage

    const start = Math.max(0, rawStart)
    const end = Math.min(length, rawEnd)
    const width = end - start

    if (width > EPS) {
      panels.push({
        panel: panelNo++,
        start,
        end,
        width,
        rawStart,
        rawEnd,
        leftTrim: start - rawStart,
      })
    }

    pos += coverage
  }

  return panels
}
