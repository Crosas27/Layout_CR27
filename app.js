import { generateLayout } from "./js/core/layoutEngine.js"
import { renderSvg } from "./js/renderer/svgRenderer.js"
import { renderGable } from "./js/renderer/gableRenderer.js"
import { renderOpeningReport } from "./js/renderer/openingReportRenderer.js"
import { renderSummary } from "./js/renderer/summaryRenderer.js"

let openings = []

function updateLayout() {
  const wallTypeEl = document.getElementById("wallType")
  const wallLengthEl = document.getElementById("wallLength")
  const wallHeightEl = document.getElementById("wallHeight")
  const panelStopHeightEl = document.getElementById("panelStopHeight")
  const panelCoverageEl = document.getElementById("panelCoverage")
  const ribSpacingEl = document.getElementById("ribSpacing")
  const startOffsetEl = document.getElementById("startOffset")

  if (!wallTypeEl || !wallLengthEl || !wallHeightEl || !panelStopHeightEl || !panelCoverageEl || !ribSpacingEl || !startOffsetEl) {
    console.error("Required input missing")
    return
  }

  const wallType = wallTypeEl.value

  const config = {
    wallType,
    wallLength: Number(wallLengthEl.value) || 0,
    wallHeight: Number(wallHeightEl.value) || 0,
    panelStopHeight: Number(panelStopHeightEl.value) || 0,
    panelCoverage: Number(panelCoverageEl.value) || 36,
    ribSpacing: Number(ribSpacingEl.value) || 12,
    startOffset: Number(startOffsetEl.value) || 0,
    openings
  }

  if (wallType === "gable") {
    config.leftEaveHeight = Number(document.getElementById("leftEaveHeight")?.value) || 0
    config.leftPanelStopHeight = Number(document.getElementById("leftPanelStopHeight")?.value) || 0
    config.ridgeHeight = Number(document.getElementById("ridgeHeight")?.value) || 0
    config.ridgePanelStopHeight = Number(document.getElementById("ridgePanelStopHeight")?.value) || 0
    config.ridgePosition = Number(document.getElementById("ridgePosition")?.value) || 0
    config.rightEaveHeight = Number(document.getElementById("rightEaveHeight")?.value) || 0
    config.rightPanelStopHeight = Number(document.getElementById("rightPanelStopHeight")?.value) || 0
  }

  if (config.wallLength <= 0) {
    console.warn("Invalid wall length")
    return
  }

  const model = generateLayout(config)

  if (wallType === "gable") {
    renderGable(model)
  } else {
    renderSvg(model)
  }

  renderOpeningReport(model)
  renderSummary(model)
}

function renderOpeningsList() {
  const list = document.getElementById("openingsList")
  if (!list) return

  list.innerHTML = ""

  openings.forEach(function(op, index) {
    const div = document.createElement("div")
    div.className = "opening-item"

    const label = document.createElement("span")
    label.textContent = op.start + '" to ' + (op.start + op.width) + '"'

    const btn = document.createElement("button")
    btn.textContent = "X"
    btn.className = "delete-btn"

    btn.onclick = function() {
      openings.splice(index, 1)
      renderOpeningsList()
      updateLayout()
    }

    div.appendChild(label)
    div.appendChild(btn)
    list.appendChild(div)
  })
}

function addOpening() {
  const startEl = document.getElementById("openingStart")
  const widthEl = document.getElementById("openingWidth")

  if (!startEl || !widthEl) return

  const start = Number(startEl.value)
  const width = Number(widthEl.value)

  if (!start || !width) return

  openings.push({ start, width })

  startEl.value = ""
  widthEl.value = ""

  renderOpeningsList()
  updateLayout()
}

function syncModeUI() {
  const wallType = document.getElementById("wallType")?.value
  const gableFields = document.getElementById("gableFields")
  const openingsCard = document.getElementById("openingsCard")

  if (wallType === "gable") {
    if (gableFields) gableFields.style.display = "block"
    if (openingsCard) openingsCard.style.display = "none"
  } else {
    if (gableFields) gableFields.style.display = "none"
    if (openingsCard) openingsCard.style.display = "block"
  }
}

document.addEventListener("DOMContentLoaded", function() {
  const btn = document.getElementById("generateBtn")
  const addBtn = document.getElementById("addOpeningBtn")
  const wallType = document.getElementById("wallType")

  if (!btn) {
    console.error("Generate button missing")
    return
  }

  if (!addBtn) {
    console.error("Add Opening button missing")
    return
  }

  if (wallType) {
    wallType.addEventListener("change", function() {
      syncModeUI()
      updateLayout()
    })
  }

  btn.addEventListener("click", updateLayout)
  addBtn.addEventListener("click", addOpening)

  syncModeUI()
  updateLayout()
})

export { updateLayout }
