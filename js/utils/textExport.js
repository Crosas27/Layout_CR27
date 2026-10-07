import { formatToField as fmt, formatInches } from './formatter.js'
import { panelNote } from '../render/cutListRenderer.js'
/* PORTABLE FABRICATION SHEET — includes ridge point and opening marks. */
export function buildTextSummary(model, jobName = '', wallName = '') {
  const lines = [
    'CR27 FABRICATION SHEET',
    jobName,
    wallName,
    `${model.wallType.toUpperCase()} · ${fmt(model.wallLength)}`,
    `Coverage ${formatInches(model.panelCoverage)} · ribs ${formatInches(model.ribSpacing)} · offset ${fmt(model.startOffset)}`,
    `${model.summary.totalPanels} panels · ${model.summary.fullPanels} full coverage`,
    '',
    'PANEL HEIGHTS (PANEL STOPS)',
  ]
  for (const p of model.gableCuts || model.panelCuts) {
    lines.push(
      `${String(p.panel).padStart(2, '0')}  ${fmt(p.leftStopHeight)} → ${fmt(p.rightStopHeight)} · width ${fmt(p.width)}`,
      `    ${panelNote(p)}`,
    )
    for (const s of p.segments)
      lines.push(`    ${s.side}: run ${fmt(s.width)} · ${s.stopCutAngleDeg.toFixed(2)}° off square`)
    for (const c of p.openingCuts)
      lines.push(
        `    Opening ${c.openingId}: finished left edge ${fmt(c.cutFromLeft)} · cut width ${fmt(c.cutWidth)} · remaining right ${fmt(c.cutToRight)} · sill ${fmt(c.bottom)} · height ${fmt(c.height)}`,
      )
  }
  lines.push('', 'OPENINGS')
  for (const o of model.openingAnalysis) {
    lines.push(
      `${o.id}: start ${fmt(o.start)} · ${fmt(o.width)} × ${fmt(o.height)} · sill ${fmt(o.bottom)}`,
    )
    lines.push(...o.warnings.map((w) => `WARNING: ${w}`))
  }
  return lines.filter((x) => x !== undefined).join('\n')
}
