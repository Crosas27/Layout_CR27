console.log("🔥 APP JS LOADED 🔥")

import { generateLayout } from "./js/core/layoutEngine.js"
import { renderSvg } from "./js/renderer/svgRenderer.js"
import { renderGable } from "./js/renderer/gableRenderer.js"
import { renderRibTable } from "./js/renderer/ribTableRenderer.js"


function updateLayout(){

  console.log("RENDER START")

  const config = {

    wallType: document.getElementById("wallType").value,

    wallLength: Number(document.getElementById("wallLength").value) || 0,
    panelCoverage: Number(document.getElementById("panelCoverage").value) || 0,
    ribSpacing: Number(document.getElementById("ribSpacing").value) || 0,
    startOffset: Number(document.getElementById("startOffset").value) || 0,

    eaveHeight: Number(document.getElementById("eaveHeight").value) || 0,
    roofPitch: Number(document.getElementById("roofPitch").value) || 0

  }

  const model = generateLayout(config)

  console.log("MODEL:", model)

  if(config.wallType === "gable"){
    renderGable(model)
  } else {
    renderSvg(model)
  }

  renderRibTable(model)
}


document.addEventListener("DOMContentLoaded", () => {

  console.log("APP LOADED")

  const button = document.getElementById("generateBtn")

  if(!button){
    console.log("BUTTON NOT FOUND")
    return
  }

  button.addEventListener("click", updateLayout)

})
