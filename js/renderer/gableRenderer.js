import { formatToField } from "../utils/formatter.js"
import {
  setupSvg,
  drawRect,
  drawLine,
  drawText
} from "../utils/svgUtils.js"

export function renderGable(model) {
  const svg = document.getElementById("wallSvg")
  if (!svg || !model.wallLength) return

  const width = svg.clientWidth || 900
  const height = 460

  setupSvg(svg, width, height)

  const paddingX = 24
  const topPad = 70
  const bottomPad = 60
  const drawWidth = width - paddingX * 2
  const drawHeight = height - topPad - bottomPad

  const maxHeight = Math.max(
    model.leftEaveHeight || 0,
    model.ridgeHeight || 0,
    model.rightEaveHeight || 0
  )

  if (!maxHeight) return

  const scaleX = drawWidth / model.wallLength
  const scaleY = drawHeight / maxHeight
  const scale = Math.min(scaleX, scaleY)

  const wallX = paddingX
  const baseY = height - bottomPad
  const wallRight = wallX + model.wallLength * scale

  const leftEaveY = baseY - model.leftEaveHeight * scale
  const ridgeX = wallX + model.ridgePosition * scale
  const ridgeY = baseY - model.ridgeHeight * scale
  const rightEaveY = baseY - model.rightEaveHeight * scale

  const markLineY = 56

  /* ---------------- TOP MARK LINE ---------------- */

  drawLine(svg, wallX, markLineY, wallRight, markLineY, "dimension-line")

  model.seams.forEach(pos => {
    const x = wallX + pos * scale
    drawLine(svg, x, markLineY - 6, x, markLineY + 6, "tick")
  })

  const labeledPositions = []
  for (let pos = 0; pos <= model.wallLength; pos += model.panelCoverage) {
    labeledPositions.push(pos)
  }
  if (labeledPositions[labeledPositions.length - 1] !== model.wallLength) {
    labeledPositions.push(model.wallLength)
  }

  const minSpacing = 56
  let lastX = -Infinity

  labeledPositions.forEach(pos => {
    const x = wallX + pos * scale
    const isStart = pos === 0
    const isEnd = pos === model.wallLength
    const distanceToEnd = wallRight - x
    const tooCloseToEnd = !isEnd && distanceToEnd < minSpacing

    if (!isStart && !isEnd) {
      if (x - lastX < minSpacing) return
      if (tooCloseToEnd) return
    }

    drawText(svg, x, markLineY - 12, `${Math.round(pos)}"`, "dimension-text")
    lastX = x
  })

  /* ---------------- OUTLINE ---------------- */

  drawLine(svg, wallX, baseY, wallRight, baseY, "dimension-line")

  drawLine(svg, wallX, baseY, wallX, leftEaveY, "panel-seam")
  drawLine(svg, wallX, leftEaveY, ridgeX, ridgeY, "panel-seam")
  drawLine(svg, ridgeX, ridgeY, wallRight, rightEaveY, "panel-seam")
  drawLine(svg, wallRight, rightEaveY, wallRight, baseY, "panel-seam")

  /* ---------------- PANELS ---------------- */

  model.gableCuts.forEach(panel => {
    const x = wallX + panel.start * scale
    const w = panel.width * scale

    const leftY = baseY - panel.leftHeight * scale
    const rightY = baseY - panel.rightHeight * scale
    const topY = Math.min(leftY, rightY)

    drawRect(
      svg,
      x,
      topY,
      w,
      baseY - topY,
      panel.ridgePanel ? "panel-cut" : "panel-full"
    )

    drawLine(svg, x, baseY, x, leftY, "panel-seam")

    if (w >= 22) {
      drawText(
        svg,
        x + w / 2,
        baseY - 20,
        String(panel.panel),
        "panel-label"
      )
    }
  })

  drawLine(svg, wallRight, baseY, wallRight, rightEaveY, "panel-seam")

  /* ---------------- RIBS ---------------- */

  model.ribs.forEach(rib => {
    const x = wallX + rib.position * scale
    const topY = getTopYAtX(x, wallX, baseY, scale, model)

    drawLine(svg, x, baseY, x, topY, "rib-line")
  })

  /* ---------------- RIDGE CALLOUT ---------------- */

  drawLine(svg, ridgeX, ridgeY - 4, ridgeX, ridgeY - 24, "tick")
  drawText(
    svg,
    ridgeX,
    ridgeY - 52,
    `RIDGE ${formatToField(model.ridgeHeight)}`,
    "dimension-text ridge-label"
  )

  /* ---------------- PANEL HEIGHT LABELS ---------------- */

  model.gableCuts.forEach((panel, index) => {
    const shouldLabel = panel.ridgePanel || index % 2 === 0
    if (!shouldLabel) return

    const midX = wallX + (panel.start + panel.width / 2) * scale
    const highPoint = Math.max(panel.leftHeight, panel.rightHeight)
    const topY = baseY - highPoint * scale

    let labelOffset = 14
    if (panel.ridgePanel) labelOffset = 30
    else if (index % 4 === 0) labelOffset = 14
    else labelOffset = 26

    drawText(
      svg,
      midX,
      topY - labelOffset,
      `${formatToField(panel.leftHeight)} → ${formatToField(panel.rightHeight)}`,
      "dimension-text"
    )
  })

  /* ---------------- TOTAL WIDTH ---------------- */

  drawLine(svg, wallX, baseY + 28, wallRight, baseY + 28, "dimension-line")
  drawText(
    svg,
    wallX + (wallRight - wallX) / 2,
    baseY + 16,
    formatToField(model.wallLength),
    "dimension-text total-text"
  )
}

function getTopYAtX(xPx, wallX, baseY, scale, model) {
  const x = (xPx - wallX) / scale

  let heightAtX

  if (x <= model.ridgePosition) {
    const leftRun = model.ridgePosition || 1
    const rise = model.ridgeHeight - model.leftEaveHeight
    heightAtX = model.leftEaveHeight + rise * (x / leftRun)
  } else {
    const rightRun = (model.wallLength - model.ridgePosition) || 1
    const drop = model.ridgeHeight - model.rightEaveHeight
    heightAtX = model.ridgeHeight - drop * ((x - model.ridgePosition) / rightRun)
  }

  return baseY - heightAtX * scale
}
