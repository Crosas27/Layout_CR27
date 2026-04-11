import { formatToField } from "../utils/formatter.js"

export function renderOpeningReport(model) {
  const el = document.getElementById("openingReport")
  if (!el) return

  const openings = Array.isArray(model?.openingAnalysis) ? model.openingAnalysis : []

  if (!openings.length) {
    el.innerHTML = `<h3>Openings Report</h3><p>No openings added.</p>`
    return
  }

  const blocks = openings.map(opening => renderOpeningBlock(opening)).join("")

  el.innerHTML = `
    <h3>Openings Report</h3>
    ${blocks}
  `
}

function renderOpeningBlock(opening) {
  const sizeLine = `${formatToField(opening.width)} × ${formatToField(opening.height || 0)}`
  const sillLine = formatToField(opening.bottom || 0)
  const topLine = formatToField(opening.top || 0)

  const seamNotes = `
    <p><strong>Start:</strong> ${formatToField(opening.start)}</p>
    <p><strong>Width:</strong> ${formatToField(opening.width)}</p>
    <p><strong>End:</strong> ${formatToField(opening.end)}</p>
    <p><strong>Size:</strong> ${sizeLine}</p>
    <p><strong>Sill:</strong> ${sillLine}</p>
    <p><strong>Top:</strong> ${topLine}</p>
    <p><strong>Nearest left seam:</strong> ${formatToField(opening.nearestLeftSeam)}</p>
    <p><strong>Nearest right seam:</strong> ${formatToField(opening.nearestRightSeam)}</p>
    <p><strong>Left jamb from nearest seam:</strong> ${describeOffset(opening.leftOffsetFromSeam)}</p>
    <p><strong>Right jamb from nearest seam:</strong> ${describeOffset(opening.rightOffsetFromSeam)}</p>
  `

  const ribHits = []
  if (opening.leftEdgeHits?.length) {
    ribHits.push(
      `<p><strong>Left jamb edge hits:</strong> ${opening.leftEdgeHits.map(formatToField).join(", ")}</p>`
    )
  }
  if (opening.rightEdgeHits?.length) {
    ribHits.push(
      `<p><strong>Right jamb edge hits:</strong> ${opening.rightEdgeHits.map(formatToField).join(", ")}</p>`
    )
  }

  const panelCuts = opening.intersectingPanels?.length
    ? `
      <div class="panel-cut-list">
        <p><strong>Panel cuts:</strong></p>
        <ul>
          ${opening.intersectingPanels.map(renderPanelCutInstruction).join("")}
        </ul>
      </div>
    `
    : `<p><strong>Panel cuts:</strong> None</p>`

  const warnings = opening.warnings?.length
    ? `
      <div class="warning-box">
        <p><strong>Warnings:</strong></p>
        <ul>
          ${opening.warnings.map(w => `<li>${escapeHtml(w)}</li>`).join("")}
        </ul>
      </div>
    `
    : `<p class="good-status">No rib/seam warnings.</p>`

  return `
    <div class="opening-report-block">
      <p><strong>Opening ${opening.id}</strong></p>
      ${seamNotes}
      ${ribHits.join("")}
      ${panelCuts}
      ${warnings}
    </div>
  `
}

function renderPanelCutInstruction(cut) {
  const typeLabel = formatCutType(cut.cutType)

  const widthLine = `<div><strong>Cut width:</strong> ${formatToField(cut.cutWidth)}</div>`
  const heightLine = `<div><strong>Height:</strong> ${formatToField(cut.height || 0)}</div>`
  const sillLine = `<div><strong>Sill:</strong> ${formatToField(cut.bottom || 0)}</div>`

  let seamInstruction = ""

  if (cut.cutType === "left-notch") {
    seamInstruction = `<div><strong>From right seam:</strong> ${formatToField(cut.cutWidth)}</div>`
  } else if (cut.cutType === "right-notch") {
    seamInstruction = `<div><strong>From left seam:</strong> ${formatToField(cut.cutFromLeft)}</div>`
  } else if (cut.cutType === "full-width") {
    seamInstruction = `<div><strong>Full panel width cut:</strong> ${formatToField(cut.panelWidth)}</div>`
  } else {
    seamInstruction = `
      <div><strong>From left seam:</strong> ${formatToField(cut.cutFromLeft)}</div>
      <div><strong>From right seam:</strong> ${formatToField(cut.cutToRight)}</div>
    `
  }

  return `
    <li>
      <strong>Panel ${cut.panel}</strong> — ${typeLabel}
      <div>${seamInstruction}</div>
      ${widthLine}
      ${heightLine}
      ${sillLine}
    </li>
  `
}

function formatCutType(type) {
  switch (type) {
    case "left-notch":
      return "Left Notch"
    case "right-notch":
      return "Right Notch"
    case "full-width":
      return "Full-Width Cut"
    case "interior-notch":
      return "Interior Notch"
    default:
      return "Cut"
  }
}

function describeOffset(value) {
  const abs = Math.abs(Number(value) || 0)
  const dir = value > 0 ? "right of seam" : value < 0 ? "left of seam" : "at seam"
  return `${formatToField(abs)} ${dir}`
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}
