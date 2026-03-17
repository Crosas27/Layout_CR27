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


/* WALL */

drawRect(
svg,
wallLeft,
wallTop,
model.wallLength * scale,
wallHeight,
"wall-outline"
)


/* PANELS */

model.panels.forEach((panel,i)=>{

const x = wallLeft + panel.start * scale
const w = panel.width * scale

drawRect(svg,x,wallTop,w,wallHeight,"panel-full")

drawText(
svg,
x + w/2,
wallTop + wallHeight/2,
`${i+1}`,
"panel-number"
)

})


/* PANEL SEAMS */

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


/* RIB LINES */

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


/* RIB LABELS (adaptive) */

let ribStep = 36

if(model.wallLength > 600) ribStep = 72
if(model.wallLength > 900) ribStep = 120

model.ribs.forEach(rib=>{

if(rib.position % ribStep !== 0) return

const x = wallLeft + rib.position * scale

drawText(
svg,
x,
wallTop + wallHeight + 22,
formatToField(rib.position),
"rib-label"
)

})


/* TOP DIMENSION LINE */

const dimY = wallTop - 40

drawLine(svg,wallLeft,dimY,wallRight,dimY,"dimension-line")


/* PANEL TICKS */

model.panels.forEach(panel=>{

const x = wallLeft + panel.start * scale

drawLine(svg,x,dimY-6,x,dimY+6,"dimension-line")

})

drawLine(svg,wallRight,dimY-6,wallRight,dimY+6,"dimension-line")


/* PANEL WIDTH LABELS */

const panelCount = model.panels.length

let labelStep = 1

if(panelCount > 10) labelStep = 2
if(panelCount > 20) labelStep = 3
if(panelCount > 35) labelStep = 4

model.panels.forEach((panel,i)=>{

if(i % labelStep !== 0) return

const start = wallLeft + panel.start * scale
const end = wallLeft + panel.end * scale

drawText(
svg,
(start + end)/2,
dimY - 10,
formatToField(panel.end - panel.start),
"dimension-text"
)

})


/* TOTAL WALL DIMENSION */

const bottomY = wallTop + wallHeight + 60

drawLine(svg,wallLeft,bottomY,wallRight,bottomY,"dimension-line")

drawText(
svg,
(width/2),
bottomY - 6,
formatToField(model.wallLength),
"dimension-text"
)

}
