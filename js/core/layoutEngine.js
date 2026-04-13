const EPS = 0.001
const EDGE_TOLERANCE = 0.5   // inches — jamb landing on rib centerline
const RIB_MIN_CLEARANCE = 6  // inches — minimum jamb-to-rib spacing

/* ---------------- PUBLIC API ---------------- */

export function generateLayout(config) {
  if (config?.wallType === "gable") {
    return generateGableLayout(config)
  }
  return generateSidewallLayout(config)
}

export function getGableHeightAtX(
  x,
  wallLength,
  leftEaveHeight,
  ridgeHeight,
  ridgePosition,
  rightEaveHeight
) {
  if (wallLength <= 0) return 0

  const clampedX = clampNum(x, 0, wallLength)
  const clampedRidge = clampNum(ridgePosition, 0, wallLength)

  if (clampedX <= clampedRidge) {
    if (clampedRidge <= EPS) return ridgeHeight
    return leftEaveHeight +
      (ridgeHeight - leftEaveHeight) * (clampedX / clampedRidge)
  }

  const rightRun = wallLength - clampedRidge
  if (rightRun <= EPS) return ridgeHeight

  return ridgeHeight -
    (ridgeHeight - rightEaveHeight) * ((clampedX - clampedRidge) / rightRun)
}

/* ---------------- SIDEWALL ---------------- */

function generateSidewallLayout(config) {
  const wallLength      = num(config.wallLength)
  const wallHeight      = num(config.wallHeight)
  const panelStopHeight = num(config.panelStopHeight, wallHeight)
  const panelCoverage   = num(config.panelCoverage, 36)
  const ribSpacing      = num(config.ribSpacing, 12)
  const startOffset     = num(config.startOffset, 0)
  const openings        = Array.isArray(config.openings) ? config.openings : []

  const panels = calculatePanels(wallLength, panelCoverage, startOffset)
  const seams = panels.map(p => p.start).concat(wallLength)
  const ribs = calculateRibs(wallLength, ribSpacing, startOffset)

  const summary = buildSummary(wallLength, panelCoverage, panels)
  const openingAnalysis = analyzeOpenings(openings, panels, seams, ribs, wallLength)
  const panelOpeningCuts = buildPanelOpeningCuts(openingAnalysis)

  const panelCuts = panels.map(panel => ({
    panel: panel.panel,
    start: panel.start,
    end: panel.end,
    width: panel.width,
    leftHeight: wallHeight,
    rightHeight: wallHeight,
    leftStopHeight: panelStopHeight,
    rightStopHeight: panelStopHeight,
    topCutAngleDeg: 0,
    topCutComplementDeg: 90,
    topCutDrop: 0,
    stopCutAngleDeg: 0,
    stopCutComplementDeg: 90,
    stopCutDrop: 0,
    ridgePanel: false,
    segments: [
      {
        x0: panel.start,
        x1: panel.end,
        width: panel.width,
        side: "flat",
        leftHeight: wallHeight,
        rightHeight: wallHeight,
        leftStopHeight: panelStopHeight,
        rightStopHeight: panelStopHeight,
        topCutAngleDeg: 0,
        topCutComplementDeg: 90,
        stopCutAngleDeg: 0,
        stopCutComplementDeg: 90
      }
    ],
    openingCuts: panelOpeningCuts[panel.panel] || []
  }))

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
    panelCuts,
    summary
  }
}

/* ---------------- GABLE ---------------- */

function generateGableLayout(config) {
  const wallLength    = num(config.wallLength)
  const panelCoverage = num(config.panelCoverage, 36)
  const ribSpacing    = num(config.ribSpacing, 12)
  const startOffset   = num(config.startOffset, 0)
  const openings      = Array.isArray(config.openings) ? config.openings : []

  const leftEaveHeight  = num(config.leftEaveHeight)
  const ridgeHeight     = num(config.ridgeHeight)
  const ridgePosition   = num(config.ridgePosition, wallLength / 2)
  const rightEaveHeight = num(config.rightEaveHeight)

  const leftPanelStopHeight  = num(config.leftPanelStopHeight, leftEaveHeight)
  const ridgePanelStopHeight = num(config.ridgePanelStopHeight, ridgeHeight)
  const rightPanelStopHeight = num(config.rightPanelStopHeight, rightEaveHeight)

  const panels = calculatePanels(wallLength, panelCoverage, startOffset)
  const seams = panels.map(p => p.start).concat(wallLength)
  const ribs = calculateRibs(wallLength, ribSpacing, startOffset)

  const openingAnalysis = analyzeOpenings(openings, panels, seams, ribs, wallLength)
  const panelOpeningCuts = buildPanelOpeningCuts(openingAnalysis)

  const gableCuts = panels.map(panel => {
    const cut = buildGablePanelCut(panel, {
      wallLength,
      leftEaveHeight,
      ridgeHeight,
      ridgePosition,
      rightEaveHeight,
      leftPanelStopHeight,
      ridgePanelStopHeight,
      rightPanelStopHeight
    })

    return {
      ...cut,
      openingCuts: panelOpeningCuts[panel.panel] || []
    }
  })

  const ridgePanelIndex = gableCuts.findIndex(p => p.ridgePanel)
  const summary = buildSummary(wallLength, panelCoverage, panels)

  const leftSlopeDeg = getSlopeAngleDeg(leftEaveHeight, ridgeHeight, ridgePosition)
  const rightSlopeDeg = getSlopeAngleDeg(ridgeHeight, rightEaveHeight, wallLength - ridgePosition)

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

    leftSlopeDeg,
    rightSlopeDeg,

    panels,
    seams,
    ribs,
    openings,
    openingAnalysis,
    panelOpeningCuts,
    gableCuts,
    ridgePanelIndex: ridgePanelIndex >= 0 ? ridgePanelIndex + 1 : null,
    summary
  }
}

function buildGablePanelCut(panel, geo) {
  const ridgeX = clampNum(geo.ridgePosition, 0, geo.wallLength)

  const topArgs = [
    geo.wallLength,
    geo.leftEaveHeight,
    geo.ridgeHeight,
    ridgeX,
    geo.rightEaveHeight
  ]

  const stopArgs = [
    geo.wallLength,
    geo.leftPanelStopHeight,
    geo.ridgePanelStopHeight,
    ridgeX,
    geo.rightPanelStopHeight
  ]

  const leftHeight = getGableHeightAtX(panel.start, ...topArgs)
  const rightHeight = getGableHeightAtX(panel.end, ...topArgs)

  const leftStopHeight = getGableHeightAtX(panel.start, ...stopArgs)
  const rightStopHeight = getGableHeightAtX(panel.end, ...stopArgs)

  const ridgePanel =
    panel.start < ridgeX - EPS &&
    panel.end > ridgeX + EPS

  const topCutAngleDeg = offSquareDeg(leftHeight, rightHeight, panel.width)
  const stopCutAngleDeg = offSquareDeg(leftStopHeight, rightStopHeight, panel.width)

  const result = {
    panel: panel.panel,
    start: panel.start,
    end: panel.end,
    width: panel.width,

    leftHeight,
    rightHeight,
    leftStopHeight,
    rightStopHeight,

    topCutAngleDeg,
    topCutComplementDeg: 90 - topCutAngleDeg,
    topCutDrop: Math.abs(rightHeight - leftHeight),

    stopCutAngleDeg,
    stopCutComplementDeg: 90 - stopCutAngleDeg,
    stopCutDrop: Math.abs(rightStopHeight - leftStopHeight),

    ridgePanel,
    segments: []
  }

  if (!ridgePanel) {
    result.segments.push({
      x0: panel.start,
      x1: panel.end,
      width: panel.width,
      side: panel.end <= ridgeX ? "left" : "right",

      leftHeight,
      rightHeight,
      leftStopHeight,
      rightStopHeight,

      topCutAngleDeg,
      topCutComplementDeg: 90 - topCutAngleDeg,

      stopCutAngleDeg,
      stopCutComplementDeg: 90 - stopCutAngleDeg
    })

    return result
  }

  const leftWidth = ridgeX - panel.start
  const rightWidth = panel.end - ridgeX

  const leftSegTopL = getGableHeightAtX(panel.start, ...topArgs)
  const leftSegTopR = getGableHeightAtX(ridgeX, ...topArgs)
  const leftSegStopL = getGableHeightAtX(panel.start, ...stopArgs)
  const leftSegStopR = getGableHeightAtX(ridgeX, ...stopArgs)

  const rightSegTopL = getGableHeightAtX(ridgeX, ...topArgs)
  const rightSegTopR = getGableHeightAtX(panel.end, ...topArgs)
  const rightSegStopL = getGableHeightAtX(ridgeX, ...stopArgs)
  const rightSegStopR = getGableHeightAtX(panel.end, ...stopArgs)

  const leftTopDeg = offSquareDeg(leftSegTopL, leftSegTopR, leftWidth)
  const leftStopDeg = offSquareDeg(leftSegStopL, leftSegStopR, leftWidth)
  const rightTopDeg = offSquareDeg(rightSegTopL, rightSegTopR, rightWidth)
  const rightStopDeg = offSquareDeg(rightSegStopL, rightSegStopR, rightWidth)

  result.segments.push({
    x0: panel.start,
    x1: ridgeX,
    width: leftWidth,
    side: "left",

    leftHeight: leftSegTopL,
    rightHeight: leftSegTopR,
    leftStopHeight: leftSegStopL,
    rightStopHeight: leftSegStopR,

    topCutAngleDeg: leftTopDeg,
    topCutComplementDeg: 90 - leftTopDeg,

    stopCutAngleDeg: leftStopDeg,
    stopCutComplementDeg: 90 - leftStopDeg
  })

  result.segments.push({
    x0: ridgeX,
    x1: panel.end,
    width: rightWidth,
    side: "right",

    leftHeight: rightSegTopL,
    rightHeight: rightSegTopR,
    leftStopHeight: rightSegStopL,
    rightStopHeight: rightSegStopR,

    topCutAngleDeg: rightTopDeg,
    topCutComplementDeg: 90 - rightTopDeg,

    stopCutAngleDeg: rightStopDeg,
    stopCutComplementDeg: 90 - rightStopDeg
  })

  return result
}

/* ---------------- PANEL CALCULATION ---------------- */

/**
 * Symmetry rule:
 * when wallLength % coverage !== 0, start panel width == end panel width
 * so the layout is visually balanced.
 */
function calculatePanels(length, coverage, startOffset = 0) {
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
        width
      })
    }

    pos += coverage
  }

  return panels
}
/* ================================================================
   OPENING ANALYSIS
================================================================ */

function analyzeOpenings(openings, panels, seams, ribs, wallLength) {
  return openings.map((opening, index) => {
    const start = clampNum(opening.start, 0, wallLength)
    const width = Math.max(0, Number(opening.width) || 0)
    const end = clampNum(start + width, 0, wallLength)

    const bottom = Math.max(0, Number(opening.bottom) || 0)
    const height = Math.max(0, Number(opening.height) || 0)
    const top = bottom + height

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

    const ribPositions = ribs.map(r => r.position)

    const intersectingPanels = panels
      .filter(panel => end > panel.start && start < panel.end)
      .map(panel => {
        const cutStart = Math.max(start, panel.start) - panel.start
        const cutEnd = Math.min(end, panel.end) - panel.start
        const cutWidth = Math.max(0, cutEnd - cutStart)

        const touchesLeftEdge = cutStart <= EDGE_TOLERANCE
        const touchesRightEdge = Math.abs(panel.width - cutEnd) <= EDGE_TOLERANCE
        const fullPanelCut = touchesLeftEdge && touchesRightEdge

        let cutType = "interior-notch"
        if (fullPanelCut) {
          cutType = "full-width"
        } else if (touchesLeftEdge) {
          cutType = "left-notch"
        } else if (touchesRightEdge) {
          cutType = "right-notch"
        }

        return {
          panel: panel.panel,
          panelStart: panel.start,
          panelEnd: panel.end,
          panelWidth: panel.width,

          cutStart,
          cutEnd,
          cutWidth,

          cutFromLeft: cutStart,
          cutToRight: Math.max(0, panel.width - cutEnd),

          bottom,
          height,
          top,

          touchesLeftEdge,
          touchesRightEdge,
          fullPanelCut,
          cutType,

          nearestLeftRib: findNearest(start, ribPositions),
          nearestRightRib: findNearest(end, ribPositions)
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

      bottom,
      height,
      top,

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
        panel: cut.panel,
        panelWidth: cut.panelWidth,

        openingStart: opening.start,
        openingEnd: opening.end,

        cutStart: cut.cutStart,
        cutEnd: cut.cutEnd,
        cutWidth: cut.cutWidth,

        cutFromLeft: cut.cutFromLeft,
        cutToRight: cut.cutToRight,

        bottom: cut.bottom,
        height: cut.height,
        top: cut.top,

        touchesLeftEdge: cut.touchesLeftEdge,
        touchesRightEdge: cut.touchesRightEdge,
        fullPanelCut: cut.fullPanelCut,
        cutType: cut.cutType
      })
    })
  })

  return map
}

/* ---------------- MATH HELPERS ---------------- */

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function clampNum(value, min, max) {
  const n = Number(value)
  if (!Number.isFinite(n)) return min
  return Math.min(Math.max(n, min), max)
}

function findNearest(target, values) {
  if (!values.length) return 0
  return values.reduce(
    (best, v) => Math.abs(v - target) < Math.abs(best - target) ? v : best,
    values[0]
  )
}

function toDeg(rad) {
  return rad * 180 / Math.PI
}

function offSquareDeg(leftHeight, rightHeight, width) {
  if (width <= EPS) return 0
  return toDeg(Math.atan2(Math.abs(rightHeight - leftHeight), width))
}

function getSlopeAngleDeg(startHeight, endHeight, run) {
  if (run <= EPS) return 0
  return toDeg(Math.atan2(Math.abs(endHeight - startHeight), run))
}

function fmtIn(inches) {
  const r = Math.round(inches * 8) / 8
  const w = Math.floor(r)
  const f = r - w
  const map = {
    0.125: "1/8",
    0.25: "1/4",
    0.375: "3/8",
    0.5: "1/2",
    0.625: "5/8",
    0.75: "3/4",
    0.875: "7/8"
  }
  const fs = map[Number(f.toFixed(3))] || ""
  if (w === 0 && fs) return `${fs}"`
  if (fs) return `${w} ${fs}"`
  return `${w}"`
}
