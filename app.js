import { generateLayout } from "./js/core/layoutEngine.js"
import { renderSvg } from "./js/renderer/svgRenderer.js"

function updateLayout(){

  const config = {

    wallType: document.getElementById("wallType").value,

    wallLength: Number(document.getElementById("wallLength").value) || 0,
    panelCoverage: Number(document.getElementById("panelCoverage").value) || 36,
    ribSpacing: Number(document.getElementById("ribSpacing").value) || 12,
    startOffset: Number(document.getElementById("startOffset").value) || 0

  }

  // 🔥 TEMP TEST OPENING
  config.openings = [
    { start: 84, width: 36 }
  ]

  const model = generateLayout(config)

  renderSvg(model)

}

document.addEventListener("DOMContentLoaded", () => {

  const btn = document.getElementById("generateBtn")

  if(!btn){
    console.error("❌ BUTTON NOT FOUND")
    return
  }

  console.log("✅ APP READY")

  btn.addEventListener("click", updateLayout)

})