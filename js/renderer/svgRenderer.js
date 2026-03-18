import { formatToField } from "../utils/formatter.js"
import {
  setupSvg,
  getDrawArea,
  drawRect,
  drawLine,
  drawText
} from "../utils/svgUtils.js"

export function renderSvg(model, options = {}) {

  const { mode = "field", direction = "LTR" } = options

  const svg = document.getElementById("wallSvg")
  if (!svg) return

  const width = svg.clientWidth || 900
  const height = 320

  setupSvg(svg, width, height)

  const { margin, drawWidth } = getDrawArea(width, height)

  if (!model.wallLength) return

  const scale = drawWidth / model.wallLength

  const wallTop = 140
  const wallHeight = 80

  const wallLeft = margin
  const wallRight = margin + model.wallLength * scale

  /* ================= WALL ================= */

  drawRect(svg, wallLeft, wallTop, model.wallLength * scale, wallHeight, "wall-outline")

  /* ================= PANELS ================= */

  const panels = direction === "RTL"
    ? [...model.panels].reverse()
    : model.panels

  panels.forEach((panel, i) => {

    const x = wallLeft + panel.start * scale
    const w = (panel.end - panel.start) * scale

    const isCut = (panel.end - panel.start) !== model.panelCoverage

    drawRect(
      svg,
      x,
      wallTop,
      w,
      wallHeight,
      isCut ? "panel-cut" : "panel-full"
    )

    if (mode !== "field") {
      drawText(
        svg,
        x + w / 2,
        wallTop + wallHeight / 2,
        `${i + 1}`,
        "panel-number"
      )
    }

  })

  /* ================= SEAMS ================= */

  const seamPositions = model.panels.map(p => p.start)
  seamPositions.push(model.wallLength)

  seamPositions.forEach(pos => {

    const x = wallLeft + pos * scale

    drawLine(svg, x, wallTop, x, wallTop + wallHeight, "panel-seam")

  })

  /* ================= RIBS ================= */

  if (mode !== "field") {

    model.ribs.forEach(rib => {

      const x = wallLeft + rib.position * scale

      drawLine(svg, x, wallTop, x, wallTop + wallHeight, "rib-line")

    })

  }

  /* ================= FIELD MARK LINE ================= */

  const markY = wallTop - 30

  drawLine(svg, wallLeft, markY, wallRight, markY, "dimension-line")

  seamPositions.forEach(pos => {

    const x = wallLeft + pos * scale

    drawLine(svg, x, markY - 6, x, markY + 6, "seam-tick")

  })

  /* SMART LABELS */

  let minSpacing = 55
  let lastX = -Infinity

  seamPositions.forEach(pos => {

    const x = wallLeft + pos * scale

    if (x - lastX < minSpacing) return

    lastX = x

    drawText(
      svg,
      x,
      markY - 10,
      formatToField(pos),
      "dimension-text"
    )

  })

  /* ================= TOTAL ================= */

  drawText(
    svg,
    width / 2,
    wallTop + wallHeight + 40,
    formatToField(model.wallLength),
    "dimension-text"
  )

}