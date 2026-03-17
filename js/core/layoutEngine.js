// layoutEngine.js
// FIELD-DRIVEN ENGINE
// All measurements in inches

export function generateLayout(config) {

  const wallLength = Number(config.wallLength) || 0
  const panelCoverage = Number(config.panelCoverage) || 36
  const ribSpacing = Number(config.ribSpacing) || 12

  // 1. SEAMS (PRIMARY)
  const seams = calculateBalancedSeams(wallLength, panelCoverage)

  // 2. PANELS (DERIVED)
  const panels = buildPanelsFromSeams(seams)

  // 3. RIBS (LOCKED TO PANELS)
  const ribs = calculateRibsFromSeams(seams, ribSpacing, panelCoverage)

  // 4. PANEL COUNT
  const panelCount = {
    full: panels.filter(p => nearlyEqual(p.width, panelCoverage)).length,
    cut: panels.filter(p => !nearlyEqual(p.width, panelCoverage)).length
  }

  return {
    wallLength,
    panelCoverage,
    ribSpacing,
    seams,
    panels,
    ribs,
    panelCount
  }
}

//
// 🔹 BALANCED SEAM GENERATOR (YOUR METHOD)
//
function calculateBalancedSeams(length, coverage) {

  if (length <= 0) return [0]

  const remainder = length % coverage

  // Perfect fit
  if (nearlyEqual(remainder, 0)) {
    return generateFullSeams(length, coverage)
  }

  // Balanced cuts (cut | full | ... | full | cut)
  const cutSize = (coverage + remainder) / 2

  const seams = [0]
  let pos = cutSize

  seams.push(round(pos))

  while (pos + coverage < length) {
    pos += coverage
    seams.push(round(pos))
  }

  seams.push(length)

  return seams
}

//
// 🔹 FULL PANEL CASE
//
function generateFullSeams(length, coverage) {

  const seams = []
  let pos = 0

  while (pos <= length) {
    seams.push(round(pos))
    pos += coverage
  }

  return seams
}

//
// 🔹 BUILD PANELS FROM SEAMS
//
function buildPanelsFromSeams(seams) {

  const panels = []

  for (let i = 0; i < seams.length - 1; i++) {

    const start = seams[i]
    const end = seams[i + 1]

    panels.push({
      index: i + 1,
      start,
      end,
      width: round(end - start)
    })
  }

  return panels
}

//
// 🔹 RIB GENERATOR (FIXED)
// Ribs are ALWAYS relative to seams
//
function calculateRibsFromSeams(seams, spacing, coverage) {

  const ribs = []

  for (let i = 0; i < seams.length - 1; i++) {

    const seamStart = seams[i]
    const seamEnd = seams[i + 1]

    let offset = spacing

    while (offset < coverage) {

      const pos = seamStart + offset

      // prevent crossing into next panel
      if (pos < seamEnd) {
        ribs.push({
          position: round(pos)
        })
      }

      offset += spacing
    }
  }

  return ribs
}

//
// 🔹 HELPERS
//
function round(num) {
  return Math.round(num * 1000) / 1000
}

function nearlyEqual(a, b, tolerance = 0.001) {
  return Math.abs(a - b) < tolerance
}
