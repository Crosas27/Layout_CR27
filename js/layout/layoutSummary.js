import { EPS } from './layoutMath.js'
export function buildSummary(wallLength, coverage, panels) {
  const fullPanels = panels.filter((p) => Math.abs(p.width - coverage) < EPS).length
  const first = panels[0] || null
  const last = panels[panels.length - 1] || null

  const startPanel = first && Math.abs(first.width - coverage) > EPS ? first.width : null
  const endPanel = last && Math.abs(last.width - coverage) > EPS ? last.width : null

  return {
    wallLength,
    coverage,
    totalPanels: panels.length,
    fullPanels,
    startPanel,
    endPanel,
  }
}
