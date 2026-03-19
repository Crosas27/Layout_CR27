import { formatToField } from "../utils/formatter.js"
import {
  setupSvg,
  drawRect,
  drawLine,
  drawText
} from "../utils/svgUtils.js"

export function renderSvg(model) {
  const svg = document.getElementById("wallSvg")
  if (!svg || !model.wallLength) return

  const width = svg.clientWidth || 900
  const height = 280

  setupSvg(svg, width, height)

  const paddingX = 24
  const drawWidth = width - paddingX * 2
  const scale = drawWidth / model.wallLength

  const wallX = paddingX
  const wallY = 110
  const wallHeight = 64
  const wallW = model.wallLength * scale
  const wallRight = wallX + wallW

  const seamLineY = 58
  const totalLineY = wallY + wallHeight + 42

  // Wall outline
  drawRect(svg, wallX, wallY, wallW, wallHeight, "wall-outline")

  // Panels
  model.panels.forEach((panel, index) => {
    const x = wallX + panel.start * scale
    const w = (panel.end - panel.start) * scale
    const isCut = (panel.end - panel.start) !== model.panelCoverage

    drawRect(svg, x, wallY, w, wallHeight, isCut ? "panel-cut" : "panel-full")

    // Only draw panel number if there's room
    if (w >= 26) {
      drawText(
        svg,
        x + w / 2,
        wallY + wallHeight / 2 + 4,
        String(index + 1),
        "panel-label"
      )
    }
  })

  // Seams
  const seamPositions = model.panels.map(p => p.start)
  seamPositions.push(model.wallLength)

  seamPositions.forEach(pos => {
    const x = wallX + pos * scale
    drawLine(svg, x, wallY, x, wallY + wallHeight, "panel-seam")
  })

  // Ribs
  model.ribs.forEach(rib => {
    const x = wallX + rib.position * scale
    drawLine(svg, x, wallY, x, wallY + wallHeight, "rib-line")
  })

  // Top seam mark line
  drawLine(svg, wallX, seamLineY, wallRight, seamLineY, "dimension-line")

  seamPositions.forEach(pos => {
    const x = wallX + pos * scale
    drawLine(svg, x, seamLineY - 6, x, seamLineY + 6, "tick")
  })

  // Smart seam labels: always show first/last, then every other if crowded
  const minPx = 72
  let lastShownX = -Infinity

  seamPositions.forEach((pos, i) => {
    const x = wallX + pos * scale
    const isEdge = i === 0 || i === seamPositions.length - 1

    if (!isEdge && x - lastShownX < minPx) return

    drawText(
      svg,
      x,
      seamLineY - 12,
      formatToField(pos),
      "dimension-text"
    )

    lastShownX = x
  })

  // Bottom total line
  drawLine(svg, wallX, totalLineY, wallRight, totalLineY, "dimension-line")
  drawText(
    svg,
    wallX + wallW / 2,
    totalLineY - 8,
    formatToField(model.wallLength),
    "dimension-text"
  )

  // Openings overlay
  if (Array.isArray(model.openings)) {
    model.openings.forEach(opening => {
      const x = wallX + opening.start * scale
      const w = opening.width * scale
      drawRect(svg, x, wallY, w, wallHeight, "opening-box")
    })
  }
}
