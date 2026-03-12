import { formatToField } from "../utils/formatter.js"

export function renderRibTable(model){

const container=document.getElementById("ribTable")

let html=""

html+=`<strong>Total Panels:</strong> ${model.panels.length}<br>`
html+=`<strong>Wall Length:</strong> ${formatToField(model.wallLength)}<br><br>`

html+="<strong>Rib Layout</strong><br>"

model.ribs.forEach((rib,i)=>{

html+=`• Rib ${i+1} — ${formatToField(rib.position)}<br>`

})

if(model.wallType==="gable"){

html+="<br><strong>Gable Panel Cuts</strong><br>"

model.gableCuts.forEach(panel=>{

html+=`• Panel ${panel.panel} — 
${formatToField(panel.leftHeight)} → 
${formatToField(panel.rightHeight)}<br>`

})

}

container.innerHTML=html

}