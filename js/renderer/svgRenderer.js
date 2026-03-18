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
  const height = 320

  setupSvg(svg,width,height)

  const {margin,drawWidth} = getDrawArea(width,height)

  if(!model.wallLength) return

  const scale = drawWidth / model.wallLength

  const wallTop = 140
  const wallHeight = 80

  const wallLeft = margin
  const wallRight = margin + model.wallLength * scale


  /* WALL */

  drawRect(svg, wallLeft, wallTop, model.wallLength * scale, wallHeight, "wall-outline")


  /* PANELS */

  model.panels.forEach(panel => {

    const x = wallLeft + panel.start * scale
    const w = (panel.end - panel.start) * scale

    drawRect(svg, x, wallTop, w, wallHeight, "panel-full")

  })


  /* SEAMS */

  const seams = model.panels.map(p => p.start)
  seams.push(model.wallLength)

  seams.forEach(pos => {

    const x = wallLeft + pos * scale

    drawLine(svg, x, wallTop, x, wallTop + wallHeight, "panel-seam")

  })


  /* RIBS */

  model.ribs.forEach(rib => {

    const x = wallLeft + rib.position * scale

    drawLine(svg, x, wallTop, x, wallTop + wallHeight, "rib-line")

  })


  /* FIELD MARK LINE */

  const markY = wallTop - 30

  drawLine(svg, wallLeft, markY, wallRight, markY, "dimension-line")

  seams.forEach(pos => {

    const x = wallLeft + pos * scale

    drawLine(svg, x, markY - 6, x, markY + 6, "seam-tick")

    drawText(
      svg,
      x,
      markY - 10,
      formatToField(pos),
      "dimension-text"
    )

  })


  /* OPENINGS */

  if(model.openings){

    model.openings.forEach(opening => {

      const x = wallLeft + opening.start * scale
      const w = opening.width * scale

      drawRect(
        svg,
        x,
        wallTop,
        w,
        wallHeight,
        "opening-box"
      )

    })

  }

}