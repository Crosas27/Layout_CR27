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
  const wallY = 112
  const wallHeight = 60
  const wallW = model.wallLength * scale
  const wallRight = wallX + wallW

  const markLineY = 62
  const totalLineY = wallY + wallHeight + 40

  // wall outline
  drawRect(svg, wallX, wallY, wallW, wallHeight, "wall-outline")

  // panels
  model.panels.forEach((panel, index) => {
    const x = wallX + panel.start * scale
    const w = (panel.end - panel.start) * scale
    const isCut = (panel.end - panel.start) !== model.panelCoverage

    drawRect(svg, x, wallY, w, wallHeight, isCut ? "panel-cut" : "panel-full")

    if (w >= 22) {
      drawText(
        svg,
        x + w / 2,
        wallY + wallHeight / 2 + 4,
        String(index + 1),
        "panel-label"
      )
    }
  })

  // seams
  const seamPositions = model.panels.map(p => p.start)
  seamPositions.push(model.wallLength)

  seamPositions.forEach(pos => {
    const x = wallX + pos * scale
    drawLine(svg, x, wallY, x, wallY + wallHeight, "panel-seam")
  })

  // ribs
  model.ribs.forEach(rib => {
    const x = wallX + rib.position * scale
    drawLine(svg, x, wallY, x, wallY + wallHeight, "rib-line")
  })

  // top field mark line
  drawLine(svg, wallX, markLineY, wallRight, markLineY, "dimension-line")

  // seam ticks
  seamPositions.forEach(pos => {
    const x = wallX + pos * scale
    drawLine(svg, x, markLineY - 6, x, markLineY + 6, "tick")
  })

  // label every 36" panel mark + always show end
  const labeledPositions = []
  for (let pos = 0; pos <= model.wallLength; pos += model.panelCoverage) {
    labeledPositions.push(pos)
  }
  if (labeledPositions[labeledPositions.length - 1] !== model.wallLength) {
    labeledPositions.push(model.wallLength)
  }

  const minSpacing = 50 // px
  let lastX = -Infinity

  labeledPositions.forEach(pos => {
    const x = wallX + pos * scale

    const isStart = pos === 0
    const isEnd = pos === model.wallLength

    if (!isStart && !isEnd && (x - lastX < minSpacing)) return

    drawText(
      svg,
      x,
      markLineY - 10,
      formatToField(pos),
      "dimension-text"
    )

    lastX = x
  })

  // bottom total line
  drawLine(svg, wallX, totalLineY, wallRight, totalLineY, "dimension-line")
  drawText(
    svg,
    wallX + wallW / 2,
    totalLineY - 8,
    formatToField(model.wallLength),
    "dimension-text total-text"
  )

  // openings overlay
  if (Array.isArray(model.openings)) {
    model.openings.forEach(opening => {
      const x = wallX + opening.start * scale
      const w = opening.width * scale
      drawRect(svg, x, wallY, w, wallHeight, "opening-box")
    })
  }
}
