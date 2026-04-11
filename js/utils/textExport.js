import { formatToField } from "./formatter.js"

export function buildTextSummary(model) {
  const lines = []

  lines.push("PANEL LAYOUT CUT LIST")
  lines.push(`Generated: ${new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })}`)
  lines.push("====================================================")
  lines.push("")

  lines.push(`WALL TYPE: ${formatWallType(model.wallType)}`)
  lines.push("")

  lines.push("INPUTS")
  lines.push("------------------------------------")
  lines.push(`  Wall Width:         ${formatToField(model.wallLength)}`)
  addIfValue(lines, "  Wall Height:        ", model.wallHeight)
  addIfValue(lines, "  Panel Stop Height:  ", model.panelStopHeight)
  addIfValue(lines, "  Left Eave Height:   ", model.leftEaveHeight)
  addIfValue(lines, "  Ridge Height:       ", model.ridgeHeight)
  addIfValue(lines, "  Right Eave Height:  ", model.rightEaveHeight)
  addIfValue(lines, "  Panel Coverage:     ", model.panelCoverage)
  addIfValue(lines, "  Rib Spacing:        ", model.ribSpacing)
  addIfValue(lines, "  Start Offset:       ", model.startOffset)
  lines.push("")

  if (model.summary) {
    lines.push("PANEL SUMMARY")
    lines.push("------------------------------------")
    lines.push(`  Total Panels:        ${model.summary.totalPanels}`)

    if (model.summary.fullPanels != null) {
      const fullWidth = model.panelCoverage || model.summary.coverage
      lines.push(
        `  Full Panels:         ${model.summary.fullPanels} × ${formatToField(fullWidth)}`
      )
    }

    if (model.summary.startPanel != null) {
      lines.push(`  Start Panel Width:   ${formatToField(model.summary.startPanel)}`)
    }

    if (model.summary.endPanel != null) {
      lines.push(`  End Panel Width:     ${formatToField(model.summary.endPanel)}`)
    }

    lines.push("")
  }

  lines.push("OPENINGS & CUT INSTRUCTIONS")
  lines.push("------------------------------------")

  const openings = Array.isArray(model.openingAnalysis) ? model.openingAnalysis : []

  if (!openings.length) {
    lines.push("  No openings.")
    lines.push("")
  } else {
    openings.forEach(opening => {
      lines.push(`  Opening ${opening.id}`)
      lines.push(`    Start: ${formatToField(opening.start)}`)
      lines.push(`    End:   ${formatToField(opening.end)}`)
      lines.push(`    Size:  ${formatToField(opening.width)} × ${formatToField(opening.height || 0)}`)
      lines.push(`    Sill:  ${formatToField(opening.bottom || 0)}`)
      lines.push(`    Top:   ${formatToField(opening.top || 0)}`)
      lines.push("")

      if (opening.intersectingPanels?.length) {
        opening.intersectingPanels.forEach(cut => {
          lines.push(`    Panel ${cut.panel} — ${formatCutType(cut.cutType)}`)

          if (cut.cutType === "left-notch") {
            lines.push(`      From right seam:  ${formatToField(cut.cutWidth)}`)
          } else if (cut.cutType === "right-notch") {
            lines.push(`      From left seam:   ${formatToField(cut.cutFromLeft)}`)
          } else if (cut.cutType === "full-width") {
            lines.push(`      Full panel width: ${formatToField(cut.panelWidth)}`)
          } else {
            lines.push(`      From left seam:   ${formatToField(cut.cutFromLeft)}`)
            lines.push(`      From right seam:  ${formatToField(cut.cutToRight)}`)
          }

          lines.push(`      Opening height:   ${formatToField(cut.height || 0)}`)
          lines.push(`      Sill:             ${formatToField(cut.bottom || 0)}`)
          lines.push("")
        })
      } else {
        lines.push("    No panel cuts.")
        lines.push("")
      }

      if (opening.warnings?.length) {
        lines.push("    WARNINGS:")
        opening.warnings.forEach(w => {
          lines.push(`      ⚠ ${w}`)
        })
        lines.push("")
      } else {
        lines.push("    No warnings.")
        lines.push("")
      }
    })
  }

  lines.push("====================================================")
  return lines.join("\n")
}

function addIfValue(lines, label, value) {
  if (value == null) return
  if (!Number.isFinite(Number(value))) return
  lines.push(`${label}${formatToField(value)}`)
}

function formatWallType(type) {
  if (type === "gable") return "Gable"
  return "Sidewall"
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
