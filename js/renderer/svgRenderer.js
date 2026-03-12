import { formatToField } from "../utils/formatter.js"

import {
setupSvg,
getDrawArea,
drawGrid,
drawRect,
drawLine,
drawText,
drawDimension
} from "../utils/svgUtils.js"

export function renderSvg(model){

const svg = document.getElementById("wallSvg")
if(!svg) return

const width = svg.clientWidth || 900
const height = 300

setupSvg(svg,width,height)

drawGrid(svg,width,height)

const {margin,drawWidth} = getDrawArea(width,height)

const {wallLength,ribs,panels} = model

/* prevent divide-by-zero */

if(!wallLength) return

const scale = drawWidth / wallLength

const wallTop = 100
const wallHeight = 80

/* -------------------- */
/* PANELS */
/* -------------------- */

panels.forEach((panel,i)=>{

drawRect(
svg,
margin + panel.start * scale,
wallTop,
(panel.end - panel.start) * scale,
wallHeight,
i % 2 ? "panel-fill-b" : "panel-fill-a"
)

})

/* -------------------- */
/* WALL OUTLINE */
/* -------------------- */

drawRect(
svg,
margin,
wallTop,
wallLength * scale,
wallHeight,
"wall-outline"
)

/* -------------------- */
/* RIBS */
/* -------------------- */

ribs.forEach((rib)=>{

const x = margin + rib.position * scale

drawLine(svg,x,wallTop,x,wallTop + wallHeight,"rib-line")

/* label every 3 feet */

if(rib.position % 36 === 0){

drawText(
svg,
x,
wallTop + wallHeight + 18,
formatToField(rib.position)
)

}

})

/* -------------------- */
/* PANEL DIMENSIONS */
/* -------------------- */

panels.forEach((panel)=>{

const start = margin + panel.start * scale
const end = margin + panel.end * scale

drawDimension(
svg,
start,
end,
60,
formatToField(panel.end - panel.start)
)

})

/* -------------------- */
/* TOTAL DIMENSION */
/* -------------------- */

drawDimension(
svg,
margin,
margin + wallLength * scale,
260,
formatToField(wallLength)
)

}
