import { formatToField } from "../utils/formatter.js"

export function renderSummary(model) {
  const el = document.getElementById("panelSummary")
  if (!el || !model.summary) return

  const s = model.summary

  let html = `
    <div class="report-card">
      <h3>Panel Summary</h3>
      <p><strong>Wall Length:</strong> ${formatToField(s.wallLength)}</p>
      <p><strong>Panel Coverage:</strong> ${formatToField(s.coverage)}</p>
      <p><strong>Full Panels:</strong> ${s.fullPanels}</p>
  `

  if (s.startPanel !== null) {
    html += `<p><strong>Start Panel:</strong> ${formatToField(s.startPanel)}</p>`
  }

  if (s.endPanel !== null) {
    html += `<p><strong>End Panel:</strong> ${formatToField(s.endPanel)}</p>`
  }

  html += `</div>`

  el.innerHTML = html
}
