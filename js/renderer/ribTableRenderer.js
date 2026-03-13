import { formatToField } from "../utils/formatter.js"

export function renderRibTable(model){

const container = document.getElementById("ribTable")
if(!container) return

container.innerHTML=""

const panels = model.panels || []
const ribs = model.ribs || []

const panelCount = panels.length

let lastPanel = panels[panelCount-1]
let lastPanelWidth = lastPanel ? (lastPanel.end - lastPanel.start) : 0

const html = `

<h3>Wall Summary</h3>

<p><b>Wall Length:</b> ${formatToField(model.wallLength)}</p>
<p><b>Panel Coverage:</b> ${formatToField(model.panelCoverage)}</p>
<p><b>Total Panels:</b> ${panelCount}</p>
<p><b>Last Panel Width:</b> ${formatToField(lastPanelWidth)}</p>


<h3>Panel Layout</h3>

<ul>
${panels.map((p,i)=>{

let width = p.end - p.start
let label = "Full"

if(width !== model.panelCoverage){
label = "Cut"
}

return `<li>Panel ${i+1} — ${label} (${formatToField(width)})</li>`

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