import { formatToField as fmt, formatInches } from '../utils/formatter.js'
export function panelNote(panel) {
  if (panel.ridgePanel)
    return `RIDGE · ${fmt(panel.segments[0].width)} from finished left edge · peak ${fmt(panel.segments[0].rightStopHeight)}`
  return Math.abs(panel.leftStopHeight - panel.rightStopHeight) < 0.001
    ? 'STRAIGHT CUT'
    : panel.rightStopHeight > panel.leftStopHeight
      ? 'RISING LEFT → RIGHT'
      : 'FALLING LEFT → RIGHT'
}
export function renderCutList(model) {
  const panels = model.gableCuts || model.panelCuts
  document.getElementById('cutList').innerHTML =
    `<div class="cut-sheet">${panels.map((p) => `<button class="cut-row ${p.ridgePanel ? 'ridge' : ''}" data-panel="${p.panel}" aria-label="Panel ${p.panel} cut details"><span class="cut-index">${String(p.panel).padStart(2, '0')}</span><span class="cut-height">${fmt(p.leftStopHeight)}<small>LEFT · ${formatInches(p.leftStopHeight)}</small></span><span>→</span><span class="cut-height">${fmt(p.rightStopHeight)}<small>RIGHT · ${formatInches(p.rightStopHeight)}</small></span><span class="cut-note ${p.ridgePanel ? 'ridge-note' : ''}">${panelNote(p)} · width ${fmt(p.width)}${p.openingCuts.length ? ` · ${p.openingCuts.length} opening cut(s)` : ''}</span></button>`).join('')}</div>`
}
export function panelDetails(p) {
  return `<div class="inspector-grid"><p>Finished width<strong>${fmt(p.width)}</strong></p><p>From outside corner<strong>${fmt(p.start)}</strong></p><p>Left stop height<strong>${fmt(p.leftStopHeight)}</strong></p><p>Right stop height<strong>${fmt(p.rightStopHeight)}</strong></p></div><p class="warning">${panelNote(p)}</p>${p.segments.map((s) => `<div class="cut-instruction"><p><strong>${s.side.toUpperCase()} SEGMENT · ${fmt(s.width)}</strong></p><p>${fmt(s.leftStopHeight)} → ${fmt(s.rightStopHeight)} · ${s.stopCutAngleDeg.toFixed(2)}° off square</p></div>`).join('')}${p.openingCuts.map((c) => `<div class="cut-instruction"><h3>Opening ${c.openingId}</h3><p>From finished left edge: <strong>${fmt(c.cutFromLeft)}</strong></p><p>Cut width: <strong>${fmt(c.cutWidth)}</strong> · remaining right: ${fmt(c.cutToRight)}</p><p>Sill: ${fmt(c.bottom)} · cut height: ${fmt(c.height)} · top: ${fmt(c.top)}</p></div>`).join('')}`
}
