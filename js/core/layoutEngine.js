export function generateLayout(config) {
  if (config.wallType === "gable") {
    return generateGableLayout(config)
  }
  return generateSidewallLayout(config)
}

/* ---------------- SIDEWALL ---------------- */

function generateSidewallLayout(config) {
  const wallLength      = Number(config.wallLength)      || 0
  const wallHeight      = Number(config.wallHeight)      || 0
  const panelStopHeight = Number(config.panelStopHeight) || wallHeight
  const panelCoverage   = Number(config.panelCoverage)   || 36
  const ribSpacing      = Number(config.ribSpacing)      || 12
  const startOffset     = Number(config.startOffset)     || 0
  const openings        = Array.isArray(config.openings) ? config.openings : []

  const panels          = calculatePanels(wallLength, panelCoverage)
  const seams           = panels.map(p => p.start).concat(wallLength)
  const ribs            = calculateRibs(wallLength, ribSpacing, startOffset)
  const summary         = buildSummary(wallLength, panelCoverage, panels)
  const openingAnalysis = analyzeOpenings(openings, panels, seams, ribs, wallLength)
  const panelOpeningCuts = buildPanelOpeningCuts(openingAnalysis)
  return {
    wallType: "sidewall",
    wallLength,
    wallHeight,
    panelStopHeight,
    panelCoverage,
    ribSpacing,
    startOffset,
    panels,
    seams,
    ribs,
    openings,
    openingAnalysis,
    panelOpeningCuts,
    summary
  }
}

/* ---------------- GABLE ---------------- */

function generateGableLayout(config) {
  const wallLength    = Number(config.wallLength)    || 0
  const panelCoverage = Number(config.panelCoverage) || 36
  const ribSpacing    = Number(config.ribSpacing)    || 12
  const startOffset   = Number(config.startOffset)   || 0
  const openings      = Array.isArray(config.openings) ? config.openings : []

  const leftEaveHeight  = Number(config.leftEaveHeight)  || 0
  const ridgeHeight     = Number(config.ridgeHeight)     || 0
  const ridgePosition   = Number(config.ridgePosition)   || 0
  const rightEaveHeight = Number(config.rightEaveHeight) || 0

  const leftPanelStopHeight  = Number(config.leftPanelStopHeight)  || leftEaveHeight
  const ridgePanelStopHeight = Number(config.ridgePanelStopHeight) || ridgeHeight
  const rightPanelStopHeight = Number(config.rightPanelStopHeight) || rightEaveHeight

  const panels = calculatePanels(wallLength, panelCoverage)
  const seams  = panels.map(p => p.start).concat(wallLength)
  const ribs   = calculateRibs(wallLength, ribSpacing, startOffset)

  const gableCuts = panels.map(panel => {
    const args = [wallLength, leftEaveHeight, ridgeHeight, ridgePosition, rightEaveHeight]
    const stopArgs = [wallLength, leftPanelStopHeight, ridgePanelStopHeight, ridgePosition, rightPanelStopHeight]

    const leftHeight      = getGableHeightAtX(panel.start, ...args)
    const rightHeight     = getGableHeightAtX(panel.end,   ...args)
    const leftStopHeight  = getGableHeightAtX(panel.start, ...stopArgs)
    const rightStopHeight = getGableHeightAtX(panel.end,   ...stopArgs)
    const ridgePanel      = panel.start < ridgePosition && panel.end > ridgePosition
    const openingAnalysis = analyzeOpenings(openings, panels, seams, ribs, wallLength)
    const panelOpeningCuts = buildPanelOpeningCuts(openingAnalysis)
    return {
      panel: panel.panel,
      start: panel.start,
      end:   panel.end,
      width: panel.width,
      leftHeight,
      rightHeight,
      leftStopHeight,
      rightStopHeight,
      ridgePanel,
      openingAnalysis,
      panelOpeningCuts
    }
  })

  const ridgePanelIndex = gableCuts.findIndex(p => p.ridgePanel)
  const summary         = buildSummary(wallLength, panelCoverage, panels)
  const openingAnalysis = analyzeOpenings(openings, seams, ribs, wallLength)

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
    leftPanelStopHeight,
    ridgePanelStopHeight,
    rightPanelStopHeight,
    panels,
    seams,
    ribs,
    gableCuts,
    ridgePanelIndex: ridgePanelIndex >= 0 ? ridgePanelIndex + 1 : null,
    summary,
    openings,
    openingAnalysis
  }
}

/* ---------------- PANEL CALCULATION (symmetry rule) ---------------- */

/**
 * Calculate panel positions with symmetry:
 * when wallLength % coverage !== 0, start panel == end panel width
 * so the layout is visually balanced — anchor doc law.
 */
function calculatePanels(length, coverage) {
  if (length <= 0) return []

  // Single panel: wall fits within one coverage width
  if (length <= coverage + 0.001) {
    return [{ panel: 1, start: 0, end: length, width: length }]
  }

  const leftover = length % coverage

  // Perfect fit — all full panels, tile normally
  if (leftover < 0.001) {
    const panels = []
    for (let pos = 0, i = 1; pos < length - 0.001; pos += coverage, i++) {
      panels.push({ panel: i, start: pos, end: pos + coverage, width: coverage })
    }
    return panels
  }

  // Symmetry rule: startPanelWidth == endPanelWidth == (coverage + leftover) / 2
  const endWidth   = (coverage + leftover) / 2
  const middleLen  = length - endWidth * 2
  const fullCount  = middleLen > 0.001 ? Math.round(middleLen / coverage) : 0

  const panels = []
  let i = 1

  panels.push({ panel: i++, start: 0, end: endWidth, width: endWidth })

  for (let j = 0; j < fullCount; j++) {
    const start = endWidth + j * coverage
    panels.push({ panel: i++, start, end: start + coverage, width: coverage })
  }

  panels.push({ panel: i, start: length - endWidth, end: length, width: endWidth })

  return panels
}

function calculateRibs(length, spacing, start) {
  const ribs = []
  let pos = start
  while (pos <= length + 0.001) {
    ribs.push({ position: pos })
    pos += spacing
  }
  return ribs
}

function buildSummary(wallLength, coverage, panels) {
  const fullPanels = panels.filter(p => Math.abs(p.width - coverage) < 0.001).length
  const first      = panels[0]                   || null
  const last       = panels[panels.length - 1]   || null
  const startPanel = first && Math.abs(first.width - coverage) > 0.001 ? first.width : null
  const endPanel   = last  && Math.abs(last.width  - coverage) > 0.001 ? last.width  : null
  return { wallLength, coverage, fullPanels, startPanel, endPanel }
}

/* ---------------- OPENING ANALYSIS ---------------- */

/* ---------------- OPENING ANALYSIS ---------------- */

const EDGE_TOLERANCE = 0.5   // inches — jamb landing on rib centerline
const RIB_MIN_CLEARANCE = 6  // inches — minimum jamb-to-rib spacing

function analyzeOpenings(openings, panels, seams, ribs, wallLength) {
  return openings.map((opening, index) => {
    const start = clampNum(opening.start, 0, wallLength)
    const width = Math.max(0, Number(opening.width) || 0)
    const end = clampNum(start + width, 0, wallLength)

    const nearestLeftSeam = findNearest(start, seams)
    const nearestRightSeam = findNearest(end, seams)

    const leftOffsetFromSeam = start - nearestLeftSeam
    const rightOffsetFromSeam = end - nearestRightSeam

    const leftEdgeHits = ribs
      .filter(r => Math.abs(r.position - start) <= EDGE_TOLERANCE)
      .map(r => r.position)

    const rightEdgeHits = ribs
      .filter(r => Math.abs(r.position - end) <= EDGE_TOLERANCE)
      .map(r => r.position)

    const intersectingPanels = panels
      .filter(panel => end > panel.start && start < panel.end)
      .map(panel => {
        const cutStart = Math.max(start, panel.start) - panel.start
        const cutEnd = Math.min(end, panel.end) - panel.start
        const cutWidth = Math.max(0, cutEnd - cutStart)

        const touchesLeftEdge = cutStart <= EDGE_TOLERANCE
        const touchesRightEdge = Math.abs(panel.width - cutEnd) <= EDGE_TOLERANCE
        const fullPanelCut = touchesLeftEdge && touchesRightEdge

        const nearestLeftRib = findNearest(start, ribs.map(r => r.position))
        const nearestRightRib = findNearest(end, ribs.map(r => r.position))

        return {
          panel: panel.panel,
          panelStart: panel.start,
          panelEnd: panel.end,
          panelWidth: panel.width,

          cutStart,
          cutEnd,
          cutWidth,

          touchesLeftEdge,
          touchesRightEdge,
          fullPanelCut,

          nearestLeftRib,
          nearestRightRib
        }
      })

    const warnings = []

    if (leftEdgeHits.length > 0) {
      warnings.push('Left jamb lands on a rib centerline (within 1/2" tolerance).')
    }

    if (rightEdgeHits.length > 0) {
      warnings.push('Right jamb lands on a rib centerline (within 1/2" tolerance).')
    }

    ribs.forEach(rib => {
      const dL = Math.abs(rib.position - start)
      const dR = Math.abs(rib.position - end)

      if (dL > EDGE_TOLERANCE && dL < RIB_MIN_CLEARANCE) {
        warnings.push(
          `Left jamb is ${fmtIn(dL)} from rib at ${rib.position}" — min clearance 6".`
        )
      }

      if (dR > EDGE_TOLERANCE && dR < RIB_MIN_CLEARANCE) {
        warnings.push(
          `Right jamb is ${fmtIn(dR)} from rib at ${rib.position}" — min clearance 6".`
        )
      }
    })

    return {
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
    }
  })
}

function buildPanelOpeningCuts(openingAnalysis) {
  const map = {}

  openingAnalysis.forEach(opening => {
    opening.intersectingPanels.forEach(cut => {
      if (!map[cut.panel]) map[cut.panel] = []

      map[cut.panel].push({
        openingId: opening.id,
        openingStart: opening.start,
        openingEnd: opening.end,

        cutStart: cut.cutStart,
        cutEnd: cut.cutEnd,
        cutWidth: cut.cutWidth,

        touchesLeftEdge: cut.touchesLeftEdge,
        touchesRightEdge: cut.touchesRightEdge,
        fullPanelCut: cut.fullPanelCut
      })
    })
  })

  return map
}

function clampNum(value, min, max) {
  const n = Number(value)
  if (!Number.isFinite(n)) return min
  return Math.min(Math.max(n, min), max)
}
    const warnings = []

    if (leftEdgeHits.length > 0)  warnings.push('Left jamb lands on a rib centerline (within 1/2" tolerance).')
    if (rightEdgeHits.length > 0) warnings.push('Right jamb lands on a rib centerline (within 1/2" tolerance).')

    // 6-inch clearance rule: jamb is near (but not on) a rib
    ribs.forEach(rib => {
      const dL = Math.abs(rib.position - start)
      const dR = Math.abs(rib.position - end)
      if (dL > EDGE_TOLERANCE && dL < RIB_MIN_CLEARANCE)
        warnings.push(`Left jamb is ${fmtIn(dL)} from rib at ${rib.position}" — min clearance 6".`)
      if (dR > EDGE_TOLERANCE && dR < RIB_MIN_CLEARANCE)
        warnings.push(`Right jamb is ${fmtIn(dR)} from rib at ${rib.position}" — min clearance 6".`)
    })

    return {
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
    }
  })
}

function findNearest(target, values) {
  if (!values.length) return 0
  return values.reduce((best, v) => Math.abs(v - target) < Math.abs(best - target) ? v : best, values[0])
}

function fmtIn(inches) {
  const r   = Math.round(inches * 8) / 8
  const w   = Math.floor(r)
  const f   = r - w
  const map = { 0.125: "1/8", 0.25: "1/4", 0.375: "3/8", 0.5: "1/2", 0.625: "5/8", 0.75: "3/4", 0.875: "7/8" }
  const fs  = map[Number(f.toFixed(3))] || ""
  if (w === 0 && fs) return `${fs}"`
  if (fs) return `${w} ${fs}"`
  return `${w}"`
}

/* ---------------- GABLE HEIGHT (exported for renderer) ---------------- */

export function getGableHeightAtX(x, wallLength, leftEaveHeight, ridgeHeight, ridgePosition, rightEaveHeight) {
  if (wallLength <= 0) return 0
  if (x <= ridgePosition) {
    if (ridgePosition <= 0) return ridgeHeight
    return leftEaveHeight + (ridgeHeight - leftEaveHeight) * (x / ridgePosition)
  }
  const rightRun = wallLength - ridgePosition
  if (rightRun <= 0) return ridgeHeight
  return ridgeHeight - (ridgeHeight - rightEaveHeight) * ((x - ridgePosition) / rightRun)
}
