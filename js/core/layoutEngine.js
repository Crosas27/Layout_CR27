export function generateLayout(config) {
  const wallLength = Number(config.wallLength) || 0
  const panelCoverage = Number(config.panelCoverage) || 36
  const ribSpacing = Number(config.ribSpacing) || 12
  const startOffset = Number(config.startOffset) || 0
  const openings = Array.isArray(config.openings) ? config.openings : []

  const panels = calculatePanels(wallLength, panelCoverage)
  const seams = panels.map(p => p.start).concat(wallLength)
  const ribs = calculateRibs(wallLength, ribSpacing, startOffset)

  const openingAnalysis = analyzeOpenings(openings, seams, ribs)

  return {
    wallLength,
    panelCoverage,
    ribSpacing,
    startOffset,
    panels,
    seams,
    ribs,
    openings,
    openingAnalysis
  }
}

/* ---------------- PANELS ---------------- */

function calculatePanels(length, coverage) {
  const panels = []
  let pos = 0
  let i = 1

  while (pos < length) {
    const end = Math.min(pos + coverage, length)

    panels.push({
      panel: i,
      start: pos,
      end,
      width: end - pos
    })

    pos += coverage
    i++
  }

  return panels
}

/* ---------------- RIBS ---------------- */

function calculateRibs(length, spacing, start) {
  const ribs = []
  let pos = start

  while (pos <= length) {
    ribs.push({ position: pos })
    pos += spacing
  }

  return ribs
}

/* ---------------- OPENINGS ---------------- */

function analyzeOpenings(openings, seams, ribs) {
  const edgeTolerance = 0.5
  const results = []

  openings.forEach((opening, index) => {
    const start = Number(opening.start) || 0
    const width = Number(opening.width) || 0
    const end = start + width

    const nearestLeftSeam = findNearestValue(start, seams)
    const nearestRightSeam = findNearestValue(end, seams)

    const leftOffsetFromSeam = start - nearestLeftSeam
    const rightOffsetFromSeam = end - nearestRightSeam

    const leftEdgeHits = ribs
      .filter(r => Math.abs(r.position - start) <= edgeTolerance)
      .map(r => r.position)

    const rightEdgeHits = ribs
      .filter(r => Math.abs(r.position - end) <= edgeTolerance)
      .map(r => r.position)

    const intersectingPanels = []

    for (let i = 0; i < seams.length - 1; i++) {
      const panelStart = seams[i]
      const panelEnd = seams[i + 1]

      if (end <= panelStart || start >= panelEnd) continue

      intersectingPanels.push({
        panel: i + 1,
        panelStart,
        panelEnd,
        cutStart: Math.max(start, panelStart) - panelStart,
        cutEnd: Math.min(end, panelEnd) - panelStart
      })
    }

    const warnings = []

    if (leftEdgeHits.length > 0) {
      warnings.push("Left jamb edge lands on a rib centerline (within 1/2 inch tolerance).")
    }

    if (rightEdgeHits.length > 0) {
      warnings.push("Right jamb edge lands on a rib centerline (within 1/2 inch tolerance).")
    }

    results.push({
      id: index + 1,
      start,
      width,
      end,
      nearestLeftSeam,
      nearestRightSeam,
      leftOffsetFromSeam,
      rightOffsetFromSeam,
      leftEdgeHits,
      rightEdgeHits,
      intersectingPanels,
      warnings
    })
  })

  return results
}

function findNearestValue(target, values) {
  if (!values.length) return 0

  let nearest = values[0]
  let smallestDiff = Math.abs(target - nearest)

  values.forEach(value => {
    const diff = Math.abs(target - value)
    if (diff < smallestDiff) {
      smallestDiff = diff
      nearest = value
    }
  })

  return nearest
}
