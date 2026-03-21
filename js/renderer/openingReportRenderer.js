function inchesText(value) {
  return `${Math.round(value * 1000) / 1000}"`
}

function offsetText(value) {
  const rounded = Math.round(value * 1000) / 1000

  if (rounded === 0) return `0"`

  if (rounded > 0) return `${rounded}" right of seam`
  return `${Math.abs(rounded)}" left of seam`
}

export function renderOpeningReport(model) {
  const container = document.getElementById("openingReport")
  if (!container) return

  const analysis = model.openingAnalysis || []

  if (analysis.length === 0) {
    container.innerHTML = `
      <h3>Openings Report</h3>
      <p>No openings entered.</p>
    `
    return
  }

  let html = `<h3>Openings Report</h3>`

  analysis.forEach(item => {
    html += `
      <div class="opening-report-block">
        <h4>Opening ${item.id}</h4>
        <p><strong>Start:</strong> ${inchesText(item.start)}</p>
        <p><strong>Width:</strong> ${inchesText(item.width)}</p>
        <p><strong>End:</strong> ${inchesText(item.end)}</p>

        <p><strong>Nearest left seam:</strong> ${inchesText(item.nearestLeftSeam)}</p>
        <p><strong>Nearest right seam:</strong> ${inchesText(item.nearestRightSeam)}</p>

        <p><strong>Left jamb from nearest seam:</strong> ${offsetText(item.leftOffsetFromSeam)}</p>
        <p><strong>Right jamb from nearest seam:</strong> ${offsetText(item.rightOffsetFromSeam)}</p>
    `

    if (item.leftEdgeHits && item.leftEdgeHits.length > 0) {
      html += `<p><strong>Left jamb edge hits:</strong> ${item.leftEdgeHits.map(inchesText).join(", ")}</p>`
    }

    if (item.rightEdgeHits && item.rightEdgeHits.length > 0) {
      html += `<p><strong>Right jamb edge hits:</strong> ${item.rightEdgeHits.map(inchesText).join(", ")}</p>`
    }

    if (item.intersectingPanels && item.intersectingPanels.length > 0) {
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

    if (item.warnings && item.warnings.length > 0) {
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

  container.innerHTML = html
}
