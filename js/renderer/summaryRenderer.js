import { formatToField } from "../utils/formatter.js"

export function renderSummary(model) {
  const el = document.getElementById("panelSummary")
  if (!el || !model.summary) return

  const s = model.summary

  let html = `<h3>Panel Summary</h3>`

  if (model.wallType === "gable") {
    html += `
      <div class="summary-meta">
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

    html += `</div>`

    if (Array.isArray(model.gableCuts) && model.gableCuts.length > 0) {
      html += `
        <div class="cutlist-card">
          <div class="cutlist-header">
            <h4>Gable Cut List</h4>
            <div class="cutlist-subhead">
              <span>Total Panels: ${model.gableCuts.length}</span>
              <span>Full Sheets Needed: ${model.gableCuts.length}</span>
            </div>
          </div>

          <div class="cutlist-table">
      `

      model.gableCuts.forEach(panel => {
        const rowClass = panel.ridgePanel ? "cutlist-row ridge-row" : "cutlist-row"

        html += `
          <div class="${rowClass}">
            <div class="cutlist-cell cutlist-index">
              ${String(panel.panel).padStart(2, "0")}
            </div>

            <div class="cutlist-cell cutlist-main">
              <div class="cutlist-value">${formatToField(panel.leftStopHeight)}</div>
              <div class="cutlist-subvalue">${formatTotalInches(panel.leftStopHeight)}</div>
            </div>

            <div class="cutlist-cell cutlist-arrow">→</div>

            <div class="cutlist-cell cutlist-main">
              <div class="cutlist-value">${formatToField(panel.rightStopHeight)}</div>
              <div class="cutlist-subvalue">${formatTotalInches(panel.rightStopHeight)}</div>
            </div>

            <div class="cutlist-cell cutlist-notes">
              ${buildCutNote(panel)}
            </div>
          </div>
        `
      })

      html += `
          </div>

          <div class="cutlist-footer">
            <p><strong>Total panels:</strong> ${model.gableCuts.length}</p>
            <p><strong>Full sheets needed:</strong> ${model.gableCuts.length}</p>
          </div>
        </div>
      `
    }
  } else {
    html += `
      <div class="summary-meta">
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

    html += `</div>`
  }

  el.innerHTML = html
}

function buildCutNote(panel) {
  const left = panel.leftStopHeight
  const right = panel.rightStopHeight

  if (panel.ridgePanel) {
    return `RIDGE PANEL`
  }

  if (Math.abs(left - right) < 0.001) {
    return `STRAIGHT CUT`
  }

  if (right > left) {
    return `RISING LEFT → RIGHT`
  }

  return `FALLING LEFT → RIGHT`
}

function formatTotalInches(inches) {
  const rounded = Math.round(inches * 8) / 8
  const whole = Math.floor(rounded)
  const frac = rounded - whole

  const map = {
    0.125: "1/8",
    0.25: "1/4",
    0.375: "3/8",
    0.5: "1/2",
    0.625: "5/8",
    0.75: "3/4",
    0.875: "7/8"
  }

  const fracText = map[Number(frac.toFixed(3))] || ""

  if (fracText && whole > 0) return `${whole} ${fracText}"`
  if (fracText) return `${fracText}"`
  return `${whole}"`
}
