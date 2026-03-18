import { generateLayout } from "./js/core/layoutEngine.js"
import { renderSvg } from "./js/renderer/svgRenderer.js"

let openings = []

function updateLayout(){

  const config = {

    wallLength: Number(document.getElementById("wallLength").value) || 0,
    panelCoverage: Number(document.getElementById("panelCoverage").value) || 36,
    ribSpacing: Number(document.getElementById("ribSpacing").value) || 12,
    startOffset: Number(document.getElementById("startOffset").value) || 0,

    openings

  }

  const model = generateLayout(config)

  renderSvg(model)

}


/* ---------- OPENINGS UI ---------- */

function renderOpeningsList(){

  const list = document.getElementById("openingsList")
  list.innerHTML = ""

  openings.forEach((op, index) => {

    const div = document.createElement("div")
    div.className = "opening-item"

    div.innerHTML = `
      <span>${op.start}" → ${op.start + op.width}"</span>
      <button data-index="${index}">X</button>
    `

    div.querySelector("button").onclick = () => {
      openings.splice(index, 1)
      renderOpeningsList()
      updateLayout()
    }

    list.appendChild(div)

  })

}


function addOpening(){

  const start = Number(document.getElementById("openingStart").value)
  const width = Number(document.getElementById("openingWidth").value)

  if(!start || !width) return

  openings.push({ start, width })

  document.getElementById("openingStart").value = ""
  document.getElementById("openingWidth").value = ""

  renderOpeningsList()
  updateLayout()

}


/* ---------- INIT ---------- */

document.addEventListener("DOMContentLoaded", () => {

  const btn = document.getElementById("generateBtn")
  const addBtn = document.getElementById("addOpeningBtn")

  if(!btn){
    console.error("❌ Generate button missing")
    return
  }

  btn.addEventListener("click", updateLayout)
  addBtn.addEventListener("click", addOpening)

  console.log("✅ UI READY")

})