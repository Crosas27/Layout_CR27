import { generateLayout } from "./js/core/layoutEngine.js"
import { renderSvg } from "./js/renderer/svgRenderer.js"
import { renderGable } from "./js/renderer/gableRenderer.js"
import { renderRibTable } from "./js/renderer/ribTableRenderer.js"

function updateLayout() {

  const config = {
    wallType: document.getElementById("wallType").value,
    wallLength: Number(document.getElementById("wallLength").value) || 0,
    panelCoverage: Number(document.getElementById("panelCoverage").value) || 0,
    ribSpacing: Number(document.getElementById("ribSpacing").value) || 0,
    startOffset: Number(document.getElementById("startOffset").value) || 0,
    eaveHeight: Number(document.getElementById("eaveHeight").value) || 0,
    roofPitch: Number(document.getElementById("roofPitch").value) || 0
  }

  const mode = document.getElementById("mode").value
  const direction = document.getElementById("direction").value

  const model = generateLayout(config)

  if (config.wallType === "gable") {
    renderGable(model)
  } else {
    renderSvg(model, { mode, direction })
  }

  renderRibTable(model)
}

document.addEventListener("DOMContentLoaded", () => {

  const button = document.getElementById("generateBtn")

  if (!button) {
    console.error("❌ BUTTON NOT FOUND")
    return
  }

  console.log("✅ BUTTON FOUND")

  button.addEventListener("click", () => {
    updateLayout()
  })

})