import { formatToField } from "../utils/formatter.js"

import {
  setupSvg,
  getDrawArea,
  drawRect,
  drawLine,
  drawText
} from "../utils/svgUtils.js"


export function renderSvg(model){

  const svg = document.getElementById("wallSvg")
  if(!svg) return

  const width = svg.clientWidth || 900
  const height = 360

  setupSvg(svg, width, height)

  const { margin, drawWidth } = getDrawArea(width, height)

  if(!model.wallLength) return

  const scale = drawWidth / model.wallLength

  const wallTop = 140
  const wallHeight = 100

  const wallLeft = margin
  const wallRight = margin + model.wallLength * scale


  /* ---------------- WALL ---------------- */

  drawRect(
    svg,
    wallLeft,
    wallTop,
    model.wallLength * scale,
    wallHeight,
    "wall-outline"
  )


  /* ---------------- PANELS ---------------- */

  model.panels.forEach((panel, i) => {

    const x = wallLeft + panel.start * scale
    const w = (panel.end - panel.start) * scale

    const isCut =
      (i === 0 || i === model.panels.length - 1) &&
      (panel.end - panel.start !== model.panelCoverage)

    drawRect(
      svg,
      x,
      wallTop,
      w,
      wallHeight,
      isCut ? "panel-cut" : "panel-full"
    )

    drawText(
      svg,
      x + w / 2,
      wallTop + wallHeight / 2,
      `${i + 1}`,
      "panel-number"
    )

  })


  /* ---------------- SEAMS (DOMINANT) ---------------- */

  model.panels.forEach(panel => {

    const x = wallLeft + panel.start * scale

    drawLine(
      svg,
      x,
      wallTop,
      x,
      wallTop + wallHeight,
      "panel-seam"
    )

  })


  /* ---------------- RIB LINES (SECONDARY) ---------------- */

  model.ribs.forEach(rib => {

    const x = wallLeft + rib.position * scale

    drawLine(
      svg,
      x,
      wallTop,
      x,
      wallTop + wallHeight,
      "rib-line"
    )

  })


  /* ---------------- DIMENSION LINE ---------------- */

  const dimY = wallTop - 40

  drawLine(
    svg,
    wallLeft,
    dimY,
    wallRight,
    dimY,
    "dimension-line"
  )


  /* ---------------- SEAM TICKS (FIELD MARKS) ---------------- */

  const seamPositions = model.panels.map(p => p.start)
  seamPositions.push(model.wallLength)

  seamPositions.forEach(pos => {

    const x = wallLeft + pos * scale

    drawLine(
      svg,
      x,
      dimY - 8,
      x,
      dimY + 8,
      "seam-tick"
    )

  })


  /* ---------------- SEAM LABELS (SMART + CLEAN) ---------------- */

  const minPixelSpacing = 60
  let lastLabelX = -Infinity
  let toggle = false

  seamPositions.forEach(pos => {

    const x = wallLeft + pos * scale

    const isEdge = (pos === 0 || pos === model.wallLength)

    if (!isEdge && x - lastLabelX < minPixelSpacing) return

    drawText(
      svg,
      x,
      toggle ? dimY - 14 : dimY - 26,
      formatToField(pos),
      "dimension-text"
    )

    toggle = !toggle
    lastLabelX = x

  })


  /* ---------------- TOTAL WALL DIMENSION ---------------- */

  const bottomY = wallTop + wallHeight + 60

  drawLine(
    svg,
    wallLeft,
    bottomY,
    wallRight,
    bottomY,
    "dimension-line"
  )

  drawText(
    svg,
    width / 2,
    bottomY - 6,
    formatToField(model.wallLength),
    "dimension-text"
  )

}
