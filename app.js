import { generateLayout } from "./js/core/layoutEngine.js"

import { renderSvg } from "./js/renderer/svgRenderer.js"
import { renderGable } from "./js/renderer/gableRenderer.js"
import { renderRibTable } from "./js/renderer/ribTableRenderer.js"


/* ---------------------------- */
/* UPDATE LAYOUT */
/* ---------------------------- */

export function updateLayout(){

const config={

wallType:document.getElementById("wallType").value,

wallLength:Number(
document.getElementById("wallLength").value
)||0,

panelCoverage:Number(
document.getElementById("panelCoverage").value
)||0,

ribSpacing:Number(
document.getElementById("ribSpacing").value
)||0,

startOffset:Number(
document.getElementById("startOffset").value
)||0,

eaveHeight:Number(
document.getElementById("eaveHeight").value
)||0,

roofPitch:Number(
document.getElementById("roofPitch").value
)||0

}


/* generate layout model */

const model = generateLayout(config)


/* render svg */

if(config.wallType === "gable"){

renderGable(model)

}else{

renderSvg(model)

}


/* render results */

renderRibTable(model)

}



/* ---------------------------- */
/* UI CONTROLLER */
/* ---------------------------- */

window.addEventListener("DOMContentLoaded",()=>{

/* generate button */

const btn=document.getElementById("generateBtn")

if(btn){

btn.addEventListener("click",updateLayout)

}

/* optional: allow inputs to update automatically */

document.querySelectorAll("input,select")
.forEach(el=>{

el.addEventListener("change",updateLayout)

})

})
