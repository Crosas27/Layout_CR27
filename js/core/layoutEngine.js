export function generateLayout(config) {
  const wallType = config.wallType || "sidewall"

  if (wallType === "gable") {
    return generateGableLayout(config)
  }

  return generateSidewallLayout(config)
}

/* ---------------- SIDEWALL ---------------- */

function generateSidewallLayout(config) {
  const wallLength = Number(config.wallLength) || 0
  const panelCoverage = Number(config.panelCoverage) || 36
  const ribSpacing = Number(config.ribSpacing) || 12
  const startOffset = Number(config.startOffset) || 0
  const openings = Array.isArray(config.openings) ? config.openings : []

  const panels = calculatePanels(wallLength, panelCoverage)
  const seams = panels.map(p => p.start).concat(wallLength)
  const ribs = calculateRibs(wallLength, ribSpacing, startOffset)

  const summary = generatePanelSummary(wallLength, panelCoverage, panels)
  const openingAnalysis = analyzeOpenings(openings, seams, ribs)

  return {
    wallType: "sidewall",
    wallLength,
    panelCoverage,
    ribSpacing,
    startOffset,
    panels,
    seams,
    ribs,
    openings,
    openingAnalysis,
    summary
  }
}

/* ---------------- GABLE ---------------- */

function generateGableLayout(config) {
  const wallLength = Number(config.wallLength) || 0
  const panelCoverage = Number(config.panelCoverage) || 36
  const ribSpacing = Number(config.ribSpacing) || 12
  const startOffset = Number(config.startOffset) || 0

  const leftEaveHeight = Number(config.leftEaveHeight) || 0
  const ridgeHeight = Number(config.ridgeHeight) || 0
  const ridgePosition = Number(config.ridgePosition) || 0
  const rightEaveHeight = Number(config.rightEaveHeight) || 0

  const panels = calculatePanels(wallLength, panelCoverage)
  const seams = panels.map(p => p.start).concat(wallLength)
  const ribs = calculateRibs(wallLength, ribSpacing, startOffset)

  const gableCuts = panels.map(panel => {
    const leftHeight = getGableHeightAtX(
      panel.start,
      wallLength,
      leftEaveHeight,
      ridgeHeight,
      ridgePosition,
      rightEaveHeight
    )

    const rightHeight = getGableHeightAtX(
      panel.end,
      wallLength,
      leftEaveHeight,
      ridgeHeight,
      ridgePosition,
      rightEaveHeight
    )

    const ridgePanel =
      panel.start < ridgePosition && panel.end > ridgePosition

    return {
      panel: panel.panel,
      start: panel.start,
      end: panel.end,
      width: panel.width,
      leftHeight,
      rightHeight,
      ridgePanel
    }
  })

  const ridgePanelIndex = gableCuts.findIndex(p => p.ridgePanel)
  const summary = generatePanelSummary(wallLength, panelCoverage, panels)

  return {
    wallType: "gable",
    wallLength,
    panelCoverage,
    ribSpacing,
    startOffset,
    leftEaveHeight,
    ridgeHeight,
    ridgePosition,
    rightEaveHeight,
    panels,
    seams,
    ribs,
    gableCuts,
    ridgePanelIndex: ridgePanelIndex >= 0 ? ridgePanelIndex + 1 : null,
    summary,
    openings: [],
    openingAnalysis: []
  }
}

/* ---------------- COMMON ---------------- */

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

function calculateRibs(length, spacing, start) {
  const ribs = []
  let pos = start

  while (pos <= length) {
    ribs.push({ position: pos })
    pos += spacing
  }

  return ribs
}

function generatePanelSummary(wallLength, coverage, panels) {
  const fullPanels = panels.filter(p => p.width === coverage).length

  const first = panels[0] || null
  const last = panels[panels.length - 1] || null

  const startPanel = first && first.width !== coverage ? first.width : null
  const endPanel = last && last.width !== coverage ? last.width : null

  return {
    wallLength,
    coverage,
    fullPanels,
    startPanel,
    endPanel
  }
}

/* ---------------- SIDEWALL OPENINGS ---------------- */

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

/* ---------------- GABLE HEIGHT ---------------- */

function getGableHeightAtX(
  x,
  wallLength,
  leftEaveHeight,
  ridgeHeight,
  ridgePosition,
  rightEaveHeight
) {
  if (wallLength <= 0) return 0

  if (x <= ridgePosition) {
    const leftRun = ridgePosition
    if (leftRun <= 0) return ridgeHeight

    const rise = ridgeHeight - leftEaveHeight
    return leftEaveHeight + (rise * (x / leftRun))
  }

  const rightRun = wallLength - ridgePosition
  if (rightRun <= 0) return ridgeHeight

  const drop = ridgeHeight - rightEaveHeight
  const distanceFromRidge = x - ridgePosition

  return ridgeHeight - (drop * (distanceFromRidge / rightRun))
}
