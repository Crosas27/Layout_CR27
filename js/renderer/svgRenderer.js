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

setupSvg(svg,width,height)

const {margin,drawWidth} = getDrawArea(width,height)

if(!model.wallLength) return

const scale = drawWidth / model.wallLength

const wallTop = 140
const wallHeight = 100

const wallLeft = margin
const wallRight = margin + model.wallLength * scale


/* ---------------------------- */
/* WALL OUTLINE */
/* ---------------------------- */

drawRect(
svg,
wallLeft,
wallTop,
model.wallLength * scale,
wallHeight,
"wall-outline"
)


/* ---------------------------- */
/* PANELS */
/* ---------------------------- */

model.panels.forEach(panel=>{

const x = wallLeft + panel.start * scale
const w = (panel.end - panel.start) * scale

let cls = "panel-full"

if(panel.type === "cut") cls = "panel-cut"
if(panel.type === "opening") cls = "panel-opening"

drawRect(
svg,
x,
wallTop,
w,
wallHeight,
cls
)

})


/* ---------------------------- */
/* PANEL SEAMS */
/* ---------------------------- */

model.panels.forEach(panel=>{

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


/* ---------------------------- */
/* RIB LINES */
/* ---------------------------- */

model.ribs.forEach(rib=>{

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


/* ---------------------------- */
/* RIB LABELS */
/* Only label every 36" */
/* ---------------------------- */

model.ribs.forEach(rib=>{

if(rib.position % 36 !== 0) return

const x = wallLeft + rib.position * scale

drawText(
svg,
x,
wallTop + wallHeight + 24,
formatToField(rib.position),
"rib-label"
)

})


/* ---------------------------- */
/* PANEL DIMENSIONS (TOP) */
/* ---------------------------- */

model.panels.forEach(panel=>{

const start = wallLeft + panel.start * scale
const end = wallLeft + panel.end * scale

drawLine(
svg,
start,
wallTop - 40,
end,
wallTop - 40,
"dimension-line"
)

drawText(
svg,
(start + end) / 2,
wallTop - 46,
formatToField(panel.end - panel.start),
"dimension-text"
)

})


/* ---------------------------- */
/* TOTAL WALL DIMENSION */
/* ---------------------------- */

drawLine(
svg,
wallLeft,
wallTop + wallHeight + 60,
wallRight,
wallTop + wallHeight + 60,
"dimension-line"
)

drawText(
svg,
(width/2),
wallTop + wallHeight + 54,
formatToField(model.wallLength),
"dimension-text"
)

}