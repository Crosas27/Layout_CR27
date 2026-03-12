import { formatToField } from "../utils/formatter.js"

import {
  setupSvg,
  getDrawArea,
  drawGrid,
  drawLine,
  drawText
} from "../utils/svgUtils.js"

export function renderGable(model){

  const svg = document.getElementById("wallSvg")
  if(!svg) return

  const width = svg.clientWidth || 900
  const height = 360

  setupSvg(svg,width,height)

  drawGrid(svg,width,height)

  const { margin, drawWidth, drawHeight } = getDrawArea(width,height)

  const {
    wallLength,
    eaveHeight,
    peakHeight,
    gableCuts
  } = model

  if(!wallLength || !peakHeight) return

  /* SCALE */

  const scale = calculateScale(
    drawWidth,
    drawHeight,
    wallLength,
    peakHeight
  )

  /* COORDINATE SYSTEM */

  const wallLeft = margin
  const wallRight = wallLeft + wallLength * scale

  const baseY = margin + drawHeight

  const eaveY = baseY - eaveHeight * scale

  const peakX = wallLeft + (wallLength * scale) / 2
  const peakY = baseY - peakHeight * scale

  /* WALL BASE */

  drawLine(svg,wallLeft,baseY,wallRight,baseY,"wall-line")

  /* WALL SIDES */

  drawLine(svg,wallLeft,baseY,wallLeft,eaveY,"wall-line")
  drawLine(svg,wallRight,baseY,wallRight,eaveY,"wall-line")

  /* ROOF */

  drawLine(svg,wallLeft,eaveY,peakX,peakY,"roof-line")
  drawLine(svg,wallRight,eaveY,peakX,peakY,"roof-line")

  /* PANEL SEAMS */

  gableCuts.forEach(panel => {

    if(panel.start === undefined) return

    const x = wallLeft + panel.start * scale

    const seamHeight = Math.max(panel.leftHeight, panel.rightHeight)

    const seamTop = baseY - seamHeight * scale

    drawLine(svg,x,baseY,x,seamTop,"panel-line")

  })

  /* PANEL CUT LABELS */

  gableCuts.forEach((panel,i) => {

    if(panel.start === undefined) return

    const startX = wallLeft + panel.start * scale
    const endX = wallLeft + panel.end * scale

    const midX = (startX + endX) / 2

    const seamHeight = Math.max(panel.leftHeight, panel.rightHeight)

    const offset = i % 2 === 0 ? 0 : 14

    const labelY = baseY - seamHeight * scale - 12 - offset

    drawText(
      svg,
      midX,
      labelY,
      `${formatToField(panel.leftHeight)} → ${formatToField(panel.rightHeight)}`
    )

  })

  /* PEAK LABEL */

  drawText(
    svg,
    peakX,
    peakY - 10,
    formatToField(peakHeight)
  )

}
