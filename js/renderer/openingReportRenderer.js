function inchesText(value) {
  return `${Math.round(value * 1000) / 1000}"`
}

export function renderOpeningReport(model) {
  const container = document.getElementById("openingReport")
  if (!container) return

  const analysis = model.openingAnalysis || []

  if (analysis.length === 0) {
    container.innerHTML = `
      <div class="report-card">
        <h3>Openings Report</h3>
        <p>No openings entered.</p>
      </div>
    `
    return
  }

  let html = `<div class="report-card"><h3>Openings Report</h3>`

  analysis.forEach(item => {
    html += `
      <div class="opening-report-block">
        <h4>Opening ${item.id}</h4>
        <p><strong>Start:</strong> ${inchesText(item.start)}</p>
        <p><strong>Width:</strong> ${inchesText(item.width)}</p>
        <p><strong>End:</strong> ${inchesText(item.end)}</p>

        <p><strong>Nearest left seam:</strong> ${inchesText(item.nearestLeftSeam)}</p>
        <p><strong>Nearest right seam:</strong> ${inchesText(item.nearestRightSeam)}</p>

        <p><strong>Left jamb offset from nearest seam:</strong> ${inchesText(item.leftOffsetFromSeam)}</p>
        <p><strong>Right jamb offset from nearest seam:</strong> ${inchesText(item.rightOffsetFromSeam)}</p>
    `

    if (item.leftNearbyRibs.length > 0) {
      html += `<p><strong>Left jamb nearby ribs:</strong> ${item.leftNearbyRibs.map(inchesText).join(", ")}</p>`
    }

    if (item.rightNearbyRibs.length > 0) {
      html += `<p><strong>Right jamb nearby ribs:</strong> ${item.rightNearbyRibs.map(inchesText).join(", ")}</p>`
    }

    if (item.ribsInsideOpening.length > 0) {
      html += `<p><strong>Ribs inside opening:</strong> ${item.ribsInsideOpening.map(inchesText).join(", ")}</p>`
    }

    if (item.intersectingPanels.length > 0) {
      html += `<div class="panel-cut-list"><strong>Panels affected:</strong><ul>`

      item.intersectingPanels.forEach(cut => {
        html += `
          <li>
            Panel ${cut.panel} —
            cut span ${inchesText(cut.cutStart)} to ${inchesText(cut.cutEnd)}
            (panel range ${inchesText(cut.panelStart)} to ${inchesText(cut.panelEnd)})
          </li>
        `
      })

      html += `</ul></div>`
    }

    if (item.warnings.length > 0) {
      html += `<div class="warning-box"><strong>Warnings:</strong><ul>`
      item.warnings.forEach(w => {
        html += `<li>${w}</li>`
      })
      html += `</ul></div>`
    } else {
      html += `<p class="good-status"><strong>Status:</strong> Clear</p>`
    }

    html += `</div>`
  })

  html += `</div>`

  container.innerHTML = html
}
