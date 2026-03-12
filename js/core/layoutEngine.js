export function generateLayout(config) {

  const wallLength = Number(config.wallLength) || 0
  const eaveHeight = Number(config.eaveHeight) || 0
  const roofPitch = Number(config.roofPitch) || 0
  const ribSpacing = Number(config.ribSpacing) || 0
  const startOffset = Number(config.startOffset) || 0
  const panelCoverage = Number(config.panelCoverage) || 0

  const ribs = calculateRibs(wallLength, ribSpacing, startOffset)
  const panels = calculatePanels(wallLength, panelCoverage)

  const peakHeight = calculatePeakHeight(
    wallLength,
    eaveHeight,
    roofPitch
  )

  const gableCuts = calculateGableCuts(
    wallLength,
    eaveHeight,
    roofPitch,
    panelCoverage
  )

  return {
    wallLength,
    eaveHeight,
    roofPitch,
    ribSpacing,
    startOffset,
    panelCoverage,
    wallType: config.wallType || "side",

    peakHeight,
    ribs,
    panels,
    gableCuts
  }

}


/* -------------------------------- */
/* PEAK HEIGHT                      */
/* -------------------------------- */

function calculatePeakHeight(width, eaveHeight, pitch) {

  if (!width || !pitch) return eaveHeight

  const halfSpan = width / 2
  const rise = (pitch / 12) * halfSpan

  return eaveHeight + rise

}


/* -------------------------------- */
/* RIB LAYOUT                       */
/* -------------------------------- */

function calculateRibs(wallLength, ribSpacing, startOffset) {

  const ribs = []

  if (!ribSpacing) return ribs

  let position = startOffset

  while (position <= wallLength) {

    ribs.push({
      position
    })

    position += ribSpacing

  }

  return ribs

}


/* -------------------------------- */
/* PANEL POSITIONS                  */
/* -------------------------------- */

function calculatePanels(wallLength, panelCoverage) {

  const panels = []

  if (!panelCoverage) return panels

  let position = 0

  while (position < wallLength) {

    panels.push({
      start: position,
      end: Math.min(position + panelCoverage, wallLength)
    })

    position += panelCoverage

  }

  return panels

}


/* -------------------------------- */
/* GABLE PANEL CUTS                 */
/* -------------------------------- */

function calculateGableCuts(width, eaveHeight, pitch, panelCoverage) {

  const cuts = []

  if (!panelCoverage || !width) return cuts

  let start = 0
  let index = 1

  while (start < width) {

    const end = Math.min(start + panelCoverage, width)

    const leftHeight = getRoofHeight(start, width, eaveHeight, pitch)
    const rightHeight = getRoofHeight(end, width, eaveHeight, pitch)

    cuts.push({
      panel: index,
      start,
      end,
      leftHeight,
      rightHeight
    })

    start += panelCoverage
    index++

  }

  return cuts

}


/* -------------------------------- */
/* ROOF HEIGHT AT POSITION          */
/* -------------------------------- */

function getRoofHeight(x, width, eaveHeight, pitch) {

  const half = width / 2
  const slope = pitch / 12

  let rise

  if (x <= half) {

    rise = x * slope

  } else {

    rise = (width - x) * slope

  }

  return eaveHeight + rise

}
