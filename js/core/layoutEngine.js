// layoutEngine.js
// FIELD-DRIVEN ENGINE
// All measurements in inches

export function generateLayout(config){

  const wallLength = Number(config.wallLength) || 0
  const panelCoverage = Number(config.panelCoverage) || 0
  const openings = config.openings || []

  const ribs = calculateRibs(
    wallLength,
    Number(config.ribSpacing) || 0,
    Number(config.startOffset) || 0
  )

  const panels = calculatePanels(wallLength, panelCoverage)

  const openingCuts = calculateOpeningCuts(panels, openings)

  return {
    ...config,
    wallLength,
    panels,
    ribs,
    openings,
    openingCuts
  }

}


/* ---------------- RIBS ---------------- */

function calculateRibs(length, spacing, start){

  const ribs = []

  let pos = start

  while(pos <= length){
    ribs.push({ position: pos })
    pos += spacing
  }

  return ribs

}


/* ---------------- PANELS ---------------- */

function calculatePanels(length, coverage){

  const panels = []

  let pos = 0
  let i = 1

  while(pos < length){

    panels.push({
      panel: i,
      start: pos,
      end: Math.min(pos + coverage, length)
    })

    pos += coverage
    i++

  }

  return panels

}


/* ---------------- OPENINGS ---------------- */

function calculateOpeningCuts(panels, openings){

  const results = []

  openings.forEach((opening, index) => {

    const leftEdge = opening.start
    const rightEdge = opening.start + opening.width

    const cuts = []

    panels.forEach((panel, i) => {

      if (rightEdge <= panel.start || leftEdge >= panel.end) return

      const cutStart = Math.max(leftEdge, panel.start)
      const cutEnd = Math.min(rightEdge, panel.end)

      cuts.push({
        panel: i + 1,
        from: cutStart - panel.start,
        to: cutEnd - panel.start
      })

    })

    results.push({
      id: index + 1,
      width: opening.width,
      start: leftEdge,
      end: rightEdge,
      cuts
    })

  })

  return results

}
