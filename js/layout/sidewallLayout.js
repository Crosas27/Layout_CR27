import { EPS, num, clampNum, offSquareDeg, getSlopeAngleDeg } from './layoutMath.js'
import { calculatePanels } from './panelLayout.js'
import { calculateRibs } from './ribLayout.js'
import { buildSummary } from './layoutSummary.js'
import { analyzeOpenings, buildPanelOpeningCuts } from '../openings/openingAnalysis.js'
import { getGableHeightAtX } from './gableGeometry.js'
export function generateSidewallLayout(config) {
  const wallLength = num(config.wallLength)
  const wallHeight = num(config.wallHeight)
  const panelStopHeight = num(config.panelStopHeight, wallHeight)
  const panelCoverage = num(config.panelCoverage, 36)
  const ribSpacing = num(config.ribSpacing, 12)
  const startOffset = num(config.startOffset, 0)
  const openings = Array.isArray(config.openings) ? config.openings : []

  const panels = calculatePanels(wallLength, panelCoverage, startOffset)
  const seams = panels.map((p) => p.start).concat(wallLength)
  const ribs = calculateRibs(wallLength, ribSpacing, startOffset, panelCoverage)

  const summary = buildSummary(wallLength, panelCoverage, panels)
  const openingAnalysis = analyzeOpenings(openings, panels, seams, ribs, wallLength)
  const panelOpeningCuts = buildPanelOpeningCuts(openingAnalysis)

  const panelCuts = panels.map((panel) => ({
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
        side: 'flat',
        leftHeight: wallHeight,
        rightHeight: wallHeight,
        leftStopHeight: panelStopHeight,
        rightStopHeight: panelStopHeight,
        topCutAngleDeg: 0,
        topCutComplementDeg: 90,
        stopCutAngleDeg: 0,
        stopCutComplementDeg: 90,
      },
    ],
    openingCuts: panelOpeningCuts[panel.panel] || [],
  }))

  return {
    wallType: 'sidewall',
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
    summary,
  }
}
