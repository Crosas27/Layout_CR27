import { formatToField } from "../utils/formatter.js"
import {
  setupSvg,
  drawLine,
  drawText,
  drawRect
} from "../utils/svgUtils.js"

export function renderSvg(model){

  const svg = document.getElementById("wallSvg")
  if(!svg || !model.wallLength) return

  const width = svg.clientWidth || 900
  const height = 260

  setupSvg(svg, width, height)

  const padding = 40
  const drawWidth = width - padding * 2

  const scale = drawWidth / model.wallLength

  const wallY = 100
  const wallHeight = 60

  const left = padding
  const right = padding + model.wallLength * scale

  /* ---------------- WALL ---------------- */

  drawRect(
    svg,
    left,
    wallY,
    model.wallLength * scale,
    wallHeight,
    "wall-outline"
  )

  /* ---------------- PANELS ---------------- */

  model.panels.forEach((panel, i) => {

    const x = left + panel.start * scale
    const w = (panel.end - panel.start) * scale

    drawRect(svg, x, wallY, w, wallHeight, "panel")

    drawText(
      svg,
      x + w / 2,
      wallY + wallHeight / 2,
      `${i + 1}`,
      "panel-label"
    )

  })

  /* ---------------- SEAM TICKS (FIELD MARKS) ---------------- */

  const markY = wallY - 25

  drawLine(svg, left, markY, right, markY, "dimension-line")

  model.panels.forEach(panel => {

    const x = left + panel.start * scale

    drawLine(
      svg,
      x,
      markY - 6,
      x,
      markY + 6,
      "tick"
    )

  })

  drawLine(svg, right, markY - 6, right, markY + 6, "tick")

  /* ---------------- LABELS (SMART SPACING) ---------------- */

  const spacing = 80 // px minimum spacing between labels
  let lastX = -9999

  model.panels.forEach(panel => {

    const x = left + panel.start * scale

    if (x - lastX < spacing) return

    drawText(
      svg,
      x,
      markY - 10,
      formatToField(panel.start),
      "dimension-text"
    )

    lastX = x

  })

  /* ---------------- TOTAL LENGTH ---------------- */

  const bottomY = wallY + wallHeight + 40

  drawLine(svg, left, bottomY, right, bottomY, "dimension-line")

  drawText(
    svg,
    width / 2,
    bottomY - 6,
    formatToField(model.wallLength),
    "dimension-text"
  )

}
