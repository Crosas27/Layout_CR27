import { generateLayout } from "./js/core/layoutEngine.js"
import { renderSvg } from "./js/renderer/svgRenderer.js"
import { renderRibTable } from "./js/renderer/ribTableRenderer.js"

export function updateLayout(){

const config={

wallLength:Number(document.getElementById("wallLength").value),
panelCoverage:Number(document.getElementById("panelCoverage").value),
ribSpacing:Number(document.getElementById("ribSpacing").value),
startOffset:Number(document.getElementById("startOffset").value),
wallType:document.getElementById("wallType").value

}

const model=generateLayout(config)

renderSvg(model)

renderRibTable(model)

}
