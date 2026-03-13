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
const height = 340

setupSvg(svg,width,height)

const {margin,drawWidth} = getDrawArea(width,height)

if(!model.wallLength) return

const scale = drawWidth / model.wallLength

const wallTop = 120
const wallHeight = 110
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

/* only label every 36" */

if(rib.position % 36 === 0){

drawText(
svg,
x,
wallTop + wallHeight + 20,
formatToField(rib.position),
"rib-label"
)

}

})


/* ---------------------------- */
/* RIB LABELS */
/* ---------------------------- */

model.ribs.forEach(rib=>{

const x = wallLeft + rib.position * scale

drawText(
svg,
x,
wallTop + wallHeight + 22,
formatToField(rib.position),
"rib-label"
)

})


/* ---------------------------- */
/* WALL LENGTH LABEL */
/* ---------------------------- */

drawText(
svg,
width/2,
wallTop - 20,
formatToField(model.wallLength),
"wall-label"
)

}