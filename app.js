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
  if (!list) return

  list.innerHTML = ""

  openings.forEach(function(op, index){

    const div = document.createElement("div")
    div.className = "opening-item"

    const label = document.createElement("span")
    label.textContent = op.start + '" → ' + (op.start + op.width) + '"'

    const btn = document.createElement("button")
    btn.textContent = "X"

    btn.onclick = function(){
      openings.splice(index, 1)
      renderOpeningsList()
      updateLayout()
    }

    div.appendChild(label)
    div.appendChild(btn)

    list.appendChild(div)

  })

}


function addOpening(){

  const startEl = document.getElementById("openingStart")
  const widthEl = document.getElementById("openingWidth")

  if (!startEl || !widthEl) return

  const start = Number(startEl.value)
  const width = Number(widthEl.value)

  if(!start || !width) return

  openings.push({ start, width })

  startEl.value = ""
  widthEl.value = ""

  renderOpeningsList()
  updateLayout()
}


/* ---------- INIT ---------- */

document.addEventListener("DOMContentLoaded", function(){

  const btn = document.getElementById("generateBtn")
  const addBtn = document.getElementById("addOpeningBtn")

  if(!btn){
    console.error("❌ Generate button missing")
    return
  }

  if(!addBtn){
    console.error("❌ Add Opening button missing")
    return
  }

  btn.addEventListener("click", updateLayout)
  addBtn.addEventListener("click", addOpening)

  console.log("✅ UI READY")

})
