import { formatToField } from "./formatter.js"

/**
 * Build a plain-text cut list from a layout model.
 * Suitable for clipboard copy, texting to crew, or printing.
 */
export function buildTextSummary(model) {
  const lines = []
  const date  = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

  lines.push("PANEL LAYOUT CUT LIST")
  lines.push(`Generated: ${date}`)
  lines.push("=".repeat(52))
  lines.push("")

  // ---- Wall type ----
  const typeLabel = model.wallType === "gable" ? "Gable Endwall" : "Sidewall"
  lines.push(`WALL TYPE: ${typeLabel}`)
  lines.push("")

  // ---- Inputs ----
  lines.push("INPUTS")
  lines.push("-".repeat(36))
  lines.push(`  Wall Length:         ${formatToField(model.wallLength)}`)

  if (model.wallType === "sidewall") {
    lines.push(`  Wall Height:         ${formatToField(model.wallHeight || 0)}`)
    lines.push(`  Panel Stop Height:   ${formatToField(model.panelStopHeight || 0)}`)
  }

  lines.push(`  Panel Coverage:      ${formatToField(model.panelCoverage)}`)
  lines.push(`  Rib Spacing:         ${formatToField(model.ribSpacing)}`)
  lines.push(`  Start Offset:        ${formatToField(model.startOffset)}`)

  if (model.wallType === "gable") {
    lines.push("")
    lines.push(`  Left Eave:           ${formatToField(model.leftEaveHeight)}`)
    lines.push(`  Left Panel Stop:     ${formatToField(model.leftPanelStopHeight)}`)
    lines.push(`  Ridge Height:        ${formatToField(model.ridgeHeight)}`)
    lines.push(`  Ridge Panel Stop:    ${formatToField(model.ridgePanelStopHeight)}`)
    lines.push(`  Ridge Position:      ${formatToField(model.ridgePosition)}`)
    lines.push(`  Right Eave:          ${formatToField(model.rightEaveHeight)}`)
    lines.push(`  Right Panel Stop:    ${formatToField(model.rightPanelStopHeight)}`)
  }

  lines.push("")

  // ---- Panel summary ----
  const s = model.summary
  lines.push("PANEL SUMMARY")
  lines.push("-".repeat(36))
  lines.push(`  Total Panels:        ${model.panels.length}`)
  lines.push(`  Full Panels:         ${s.fullPanels} × ${formatToField(s.coverage)}`)

  if (s.startPanel !== null) lines.push(`  Start Panel Width:   ${formatToField(s.startPanel)}`)
  if (s.endPanel   !== null) lines.push(`  End Panel Width:     ${formatToField(s.endPanel)}`)
  if (model.ridgePanelIndex) lines.push(`  Ridge Panel:         Panel ${model.ridgePanelIndex}`)

  lines.push("")

  // ---- Gable cut list ----
  if (model.wallType === "gable" && Array.isArray(model.gableCuts) && model.gableCuts.length > 0) {
    lines.push("GABLE CUT LIST")
    lines.push("-".repeat(36))

    model.gableCuts.forEach(cut => {
      const ridgeTag = cut.ridgePanel ? "  ← RIDGE PANEL" : ""
      lines.push(`  Panel ${String(cut.panel).padStart(2)}  (${formatToField(cut.start)} → ${formatToField(cut.end)})${ridgeTag}`)
      lines.push(`    Structural:   ${formatToField(cut.leftHeight)} → ${formatToField(cut.rightHeight)}`)
      lines.push(`    Panel Stop:   ${formatToField(cut.leftStopHeight)} → ${formatToField(cut.rightStopHeight)}`)
    })

    lines.push("")
  }

  // ---- Openings & cut instructions ----
  const analysis = Array.isArray(model.openingAnalysis) ? model.openingAnalysis : []

  if (analysis.length > 0) {
    lines.push("OPENINGS & CUT INSTRUCTIONS")
    lines.push("-".repeat(36))

    analysis.forEach(item => {
      lines.push(`  Opening ${item.id}: ${formatToField(item.start)} → ${formatToField(item.end)}  (width: ${formatToField(item.width)})`)
      lines.push(`    Left jamb:   ${offsetLabel(item.leftOffsetFromSeam)} of seam at ${formatToField(item.nearestLeftSeam)}`)
      lines.push(`    Right jamb:  ${offsetLabel(item.rightOffsetFromSeam)} of seam at ${formatToField(item.nearestRightSeam)}`)

      if (item.intersectingPanels && item.intersectingPanels.length > 0) {
        lines.push(`    Panels affected:`)
        item.intersectingPanels.forEach(cut => {
          lines.push(`      Panel ${cut.panel}:  cut ${formatToField(cut.cutStart)} → ${formatToField(cut.cutEnd)}  (within panel ${formatToField(cut.panelStart)} → ${formatToField(cut.panelEnd)})`)
        })
      }

      if (item.warnings && item.warnings.length > 0) {
        lines.push(`    WARNINGS:`)
        item.warnings.forEach(w => lines.push(`      ⚠  ${w}`))
      } else {
        lines.push(`    Status:  Clear`)
      }

      lines.push("")
    })
  } else {
    lines.push("OPENINGS: None")
    lines.push("")
  }

  lines.push("=".repeat(52))

  return lines.join("\n")
}

function offsetLabel(offset) {
  const r = Math.round(offset * 1000) / 1000
  if (r === 0)  return `0"`
  if (r > 0)    return `${formatToField(r)} right`
  return `${formatToField(Math.abs(r))} left`
}
