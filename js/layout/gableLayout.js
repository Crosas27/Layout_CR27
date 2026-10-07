import { EPS, num, clampNum, offSquareDeg, getSlopeAngleDeg } from './layoutMath.js'
import { calculatePanels } from './panelLayout.js'
import { calculateRibs } from './ribLayout.js'
import { buildSummary } from './layoutSummary.js'
import { analyzeOpenings, buildPanelOpeningCuts } from '../openings/openingAnalysis.js'
import { getGableHeightAtX } from './gableGeometry.js'
export function generateGableLayout(config) {
  const wallLength = num(config.wallLength)
  const panelCoverage = num(config.panelCoverage, 36)
  const ribSpacing = num(config.ribSpacing, 12)
  const startOffset = num(config.startOffset, 0)
  const openings = Array.isArray(config.openings) ? config.openings : []

  const leftEaveHeight = num(config.leftEaveHeight)
  const ridgeHeight = num(config.ridgeHeight)
  const ridgePosition = num(config.ridgePosition, wallLength / 2)
  const rightEaveHeight = num(config.rightEaveHeight)

  const leftPanelStopHeight = num(config.leftPanelStopHeight, leftEaveHeight)
  const ridgePanelStopHeight = num(config.ridgePanelStopHeight, ridgeHeight)
  const rightPanelStopHeight = num(config.rightPanelStopHeight, rightEaveHeight)

  const panels = calculatePanels(wallLength, panelCoverage, startOffset)
  const seams = panels.map((p) => p.start).concat(wallLength)
  const ribs = calculateRibs(wallLength, ribSpacing, startOffset, panelCoverage)

  const openingAnalysis = analyzeOpenings(openings, panels, seams, ribs, wallLength)
  const panelOpeningCuts = buildPanelOpeningCuts(openingAnalysis)

  const gableCuts = panels.map((panel) => {
    const cut = buildGablePanelCut(panel, {
      wallLength,
      leftEaveHeight,
      ridgeHeight,
      ridgePosition,
      rightEaveHeight,
      leftPanelStopHeight,
      ridgePanelStopHeight,
      rightPanelStopHeight,
    })

    return {
      ...cut,
      openingCuts: panelOpeningCuts[panel.panel] || [],
    }
  })

  const ridgePanelIndex = gableCuts.findIndex((p) => p.ridgePanel)
  const summary = buildSummary(wallLength, panelCoverage, panels)

  const leftSlopeDeg = getSlopeAngleDeg(leftEaveHeight, ridgeHeight, ridgePosition)
  const rightSlopeDeg = getSlopeAngleDeg(ridgeHeight, rightEaveHeight, wallLength - ridgePosition)

  return {
    wallType: config.wallType,
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
    summary,
  }
}

function buildGablePanelCut(panel, geo) {
  const ridgeX = clampNum(geo.ridgePosition, 0, geo.wallLength)

  const topArgs = [geo.wallLength, geo.leftEaveHeight, geo.ridgeHeight, ridgeX, geo.rightEaveHeight]

  const stopArgs = [
    geo.wallLength,
    geo.leftPanelStopHeight,
    geo.ridgePanelStopHeight,
    ridgeX,
    geo.rightPanelStopHeight,
  ]

  const leftHeight = getGableHeightAtX(panel.start, ...topArgs)
  const rightHeight = getGableHeightAtX(panel.end, ...topArgs)

  const leftStopHeight = getGableHeightAtX(panel.start, ...stopArgs)
  const rightStopHeight = getGableHeightAtX(panel.end, ...stopArgs)

  const ridgePanel = panel.start < ridgeX - EPS && panel.end > ridgeX + EPS

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
    segments: [],
  }

  if (!ridgePanel) {
    result.segments.push({
      x0: panel.start,
      x1: panel.end,
      width: panel.width,
      side: panel.end <= ridgeX ? 'left' : 'right',

      leftHeight,
      rightHeight,
      leftStopHeight,
      rightStopHeight,

      topCutAngleDeg,
      topCutComplementDeg: 90 - topCutAngleDeg,

      stopCutAngleDeg,
      stopCutComplementDeg: 90 - stopCutAngleDeg,
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
    side: 'left',

    leftHeight: leftSegTopL,
    rightHeight: leftSegTopR,
    leftStopHeight: leftSegStopL,
    rightStopHeight: leftSegStopR,

    topCutAngleDeg: leftTopDeg,
    topCutComplementDeg: 90 - leftTopDeg,

    stopCutAngleDeg: leftStopDeg,
    stopCutComplementDeg: 90 - leftStopDeg,
  })

  result.segments.push({
    x0: ridgeX,
    x1: panel.end,
    width: rightWidth,
    side: 'right',

    leftHeight: rightSegTopL,
    rightHeight: rightSegTopR,
    leftStopHeight: rightSegStopL,
    rightStopHeight: rightSegStopR,

    topCutAngleDeg: rightTopDeg,
    topCutComplementDeg: 90 - rightTopDeg,

    stopCutAngleDeg: rightStopDeg,
    stopCutComplementDeg: 90 - rightStopDeg,
  })

  return result
}
