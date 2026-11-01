import { clampNum, findNearest } from '../layout/layoutMath.js'
import { formatInches } from '../utils/formatter.js'
const EDGE_TOLERANCE = 0.5
const RIB_MIN_CLEARANCE = 6
export function analyzeOpenings(openings, panels, seams, ribs, wallLength) {
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
      .filter((r) => Math.abs(r.position - start) <= EDGE_TOLERANCE)
      .map((r) => r.position)

    const rightEdgeHits = ribs
      .filter((r) => Math.abs(r.position - end) <= EDGE_TOLERANCE)
      .map((r) => r.position)

    const ribPositions = ribs.map((r) => r.position)

    const intersectingPanels = panels
      .filter((panel) => end > panel.start && start < panel.end)
      .map((panel) => {
        const cutStart = Math.max(start, panel.start) - panel.start
        const cutEnd = Math.min(end, panel.end) - panel.start
        const cutWidth = Math.max(0, cutEnd - cutStart)

        const touchesLeftEdge = cutStart <= 0.001
        const touchesRightEdge = Math.abs(panel.width - cutEnd) <= 0.001
        const fullPanelCut = touchesLeftEdge && touchesRightEdge

        let cutType = 'interior-notch'
        if (fullPanelCut) {
          cutType = 'full-width'
        } else if (touchesLeftEdge) {
          cutType = 'left-notch'
        } else if (touchesRightEdge) {
          cutType = 'right-notch'
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
          nearestRightRib: findNearest(end, ribPositions),
        }
      })

    const warnings = []

    if (leftEdgeHits.length > 0) {
      warnings.push('Left jamb lands on a rib centerline (within 1/2" tolerance).')
    }

    if (rightEdgeHits.length > 0) {
      warnings.push('Right jamb lands on a rib centerline (within 1/2" tolerance).')
    }

    ribs.forEach((rib) => {
      const dL = Math.abs(rib.position - start)
      const dR = Math.abs(rib.position - end)

      if (dL > EDGE_TOLERANCE && dL < RIB_MIN_CLEARANCE) {
        warnings.push(
          `Left jamb is ${formatInches(dL)} from rib at ${rib.position}" — min clearance 6".`,
        )
      }

      if (dR > EDGE_TOLERANCE && dR < RIB_MIN_CLEARANCE) {
        warnings.push(
          `Right jamb is ${formatInches(dR)} from rib at ${rib.position}" — min clearance 6".`,
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
      warnings,
    }
  })
}

export function buildPanelOpeningCuts(openingAnalysis) {
  const map = {}

  openingAnalysis.forEach((opening) => {
    opening.intersectingPanels.forEach((cut) => {
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
        cutType: cut.cutType,
      })
    })
  })

  return map
}
