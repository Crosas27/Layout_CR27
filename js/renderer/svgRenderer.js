import { formatToField } from "../utils/formatter.js"
import {
setupSvg,
getDrawArea,
drawRect,
drawLine,
drawText
} from "../utils/svgUtils.js"

export function renderSvg(model){

const svg=document.getElementById("wallSvg")
if(!svg) return

const width=svg.clientWidth||900
const height=320

setupSvg(svg,width,height)

const {margin,drawWidth}=getDrawArea(width,height)

const scale=drawWidth/model.wallLength

const wallTop=120
const wallHeight=100

model.panels.forEach(panel=>{

const x=margin+panel.start*scale
const w=(panel.end-panel.start)*scale

let cls="panel-full"

if(panel.type==="cut") cls="panel-cut"
if(panel.type==="opening") cls="panel-opening"

drawRect(svg,x,wallTop,w,wallHeight,cls)

})

model.ribs.forEach(rib=>{

const x=margin+rib.position*scale

drawLine(svg,x,wallTop,x,wallTop+wallHeight,"rib-line")

drawText(
svg,
x,
wallTop+wallHeight+18,
formatToField(rib.position)
)

})

}
