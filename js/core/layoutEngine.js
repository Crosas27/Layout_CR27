export function generateLayout(config) {
  const wallLength = Number(config.wallLength) || 0
  const panelCoverage = Number(config.panelCoverage) || 36
  const ribSpacing = Number(config.ribSpacing) || 12
  const startOffset = Number(config.startOffset) || 0
  const openings = Array.isArray(config.openings) ? config.openings : []

  const panels = calculatePanels(wallLength, panelCoverage)
  const seams = panels.map(p => p.start).concat(wallLength)
  const ribs = calculateRibs(wallLength, ribSpacing, startOffset)

  const openingAnalysis = analyzeOpenings(openings, seams, ribs, panelCoverage)

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
    panels.push({
      panel: i,
      start: pos,
      end: Math.min(pos + coverage, length),
      width: Math.min(pos + coverage, length) - pos
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

/* ---------------- OPENINGS V2 ---------------- */

function analyzeOpenings(openings, seams, ribs, panelCoverage) {
  const minClearance = 6
  const results = []

  openings.forEach((opening, index) => {
    const start = Number(opening.start) || 0
    const width = Number(opening.width) || 0
    const end = start + width

    const nearestLeftSeam = findNearestValue(start, seams)
    const nearestRightSeam = findNearestValue(end, seams)

    const leftOffsetFromSeam = start - nearestLeftSeam
    const rightOffsetFromSeam = end - nearestRightSeam

    const leftNearbyRibs = ribs
      .filter(r => Math.abs(r.position - start) <= minClearance)
      .map(r => r.position)

    const rightNearbyRibs = ribs
      .filter(r => Math.abs(r.position - end) <= minClearance)
      .map(r => r.position)

    const ribsInsideOpening = ribs
      .filter(r => r.position > start && r.position < end)
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

    if (leftNearbyRibs.length > 0) {
      warnings.push("Left jamb is within 6 inches of a rib.")
    }

    if (rightNearbyRibs.length > 0) {
      warnings.push("Right jamb is within 6 inches of a rib.")
    }

    if (ribsInsideOpening.length > 0) {
      warnings.push("One or more ribs fall inside the opening span.")
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
      leftNearbyRibs,
      rightNearbyRibs,
      ribsInsideOpening,
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
