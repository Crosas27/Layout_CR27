import { formatToField } from "../utils/formatter.js"

export function renderRibTable(model){

const container = document.getElementById("ribTable")
if(!container) return

container.innerHTML=""

const panels = model.panels || []
const ribs = model.ribs || []

const panelCount = panels.length

const html = `

<h3>Wall Summary</h3>

<p><b>Wall Length:</b> ${formatToField(model.wallLength)}</p>
<p><b>Panel Coverage:</b> ${formatToField(model.panelCoverage)}</p>
<p><b>Total Panels:</b> ${panelCount}</p>


<h3>Panel Layout</h3>

<ul>

${panels.map((p,i)=>{

let label = "Full"

if((p.end - p.start) !== model.panelCoverage){
label = "Cut"
}

return `<li>Panel ${i+1} — ${label} (${formatToField(p.end)})</li>`

}).join("")}

</ul>


<h3>Rib Layout</h3>

<ul>

${ribs.map((r,i)=>{

return `<li>Rib ${i+1} — ${formatToField(r.position)}</li>`

}).join("")}

</ul>

`

container.innerHTML = html

}