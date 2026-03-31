import { formatToField } from "../utils/formatter.js"

export function renderSummary(model) {
  const el = document.getElementById("panelSummary")
  if (!el || !model.summary) return

  const s = model.summary

  let html = `<h3>Panel Summary</h3>`

  if (model.wallType === "gable") {
    html += `
      <p><strong>Wall Type:</strong> Gable Endwall</p>
      <p><strong>Wall Width:</strong> ${formatToField(s.wallLength)}</p>
      <p><strong>Panel Coverage:</strong> ${formatToField(s.coverage)}</p>

      <p><strong>Left Eave:</strong> ${formatToField(model.leftEaveHeight)}</p>
      <p><strong>Left Panel Stop:</strong> ${formatToField(model.leftPanelStopHeight)}</p>

      <p><strong>Ridge Height:</strong> ${formatToField(model.ridgeHeight)}</p>
      <p><strong>Ridge Panel Stop:</strong> ${formatToField(model.ridgePanelStopHeight)}</p>

      <p><strong>Ridge Position:</strong> ${formatToField(model.ridgePosition)}</p>

      <p><strong>Right Eave:</strong> ${formatToField(model.rightEaveHeight)}</p>
      <p><strong>Right Panel Stop:</strong> ${formatToField(model.rightPanelStopHeight)}</p>

      <p><strong>Full Panels:</strong> ${s.fullPanels}</p>
    `

    if (s.startPanel !== null) {
      html += `<p><strong>Start Panel:</strong> ${formatToField(s.startPanel)}</p>`
    }

    if (s.endPanel !== null) {
      html += `<p><strong>End Panel:</strong> ${formatToField(s.endPanel)}</p>`
    }

    if (model.ridgePanelIndex !== null) {
      html += `<p><strong>Ridge Panel:</strong> Panel ${model.ridgePanelIndex}</p>`
    }

    if (Array.isArray(model.gableCuts) && model.gableCuts.length > 0) {
      html += `<div class="opening-report-block"><h4>Gable Cut List</h4><ul>`

      model.gableCuts.forEach(panel => {
        html += `
          <li>
            Panel ${panel.panel} —
            structural: ${formatToField(panel.leftHeight)} → ${formatToField(panel.rightHeight)}
            <br>
            panel stop: ${formatToField(panel.leftStopHeight)} → ${formatToField(panel.rightStopHeight)}
            ${panel.ridgePanel ? " (ridge panel)" : ""}
          </li>
        `
      })

      html += `</ul></div>`
    }
  } else {
    html += `
      <p><strong>Wall Type:</strong> Sidewall</p>
      <p><strong>Wall Width:</strong> ${formatToField(s.wallLength)}</p>
      <p><strong>Wall Height:</strong> ${formatToField(model.wallHeight || 0)}</p>
      <p><strong>Panel Stop Height:</strong> ${formatToField(model.panelStopHeight || 0)}</p>
      <p><strong>Panel Coverage:</strong> ${formatToField(s.coverage)}</p>
      <p><strong>Full Panels:</strong> ${s.fullPanels}</p>
    `

    if (s.startPanel !== null) {
      html += `<p><strong>Start Panel:</strong> ${formatToField(s.startPanel)}</p>`
    }

    if (s.endPanel !== null) {
      html += `<p><strong>End Panel:</strong> ${formatToField(s.endPanel)}</p>`
    }
  }

  el.innerHTML = html
}
