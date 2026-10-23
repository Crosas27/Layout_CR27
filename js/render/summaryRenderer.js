import { formatToField as fmt, formatInches } from '../utils/formatter.js'
export function renderSummary(model) {
  const s = model.summary
  document.getElementById('panelSummary').innerHTML =
    `<div class="stats"><div class="stat"><strong>${s.totalPanels}</strong><span>Panels</span></div><div class="stat"><strong>${s.fullPanels}</strong><span>Full coverage</span></div><div class="stat"><strong>${s.totalPanels - s.fullPanels}</strong><span>Ripped panels</span></div><div class="stat"><strong>${model.openings.length}</strong><span>Openings</span></div></div><div class="layout-details"><span>Start rip: ${s.startPanel == null ? 'none' : fmt(s.startPanel)}</span><span>End rip: ${s.endPanel == null ? 'none' : fmt(s.endPanel)}</span><span>Offset: ${fmt(model.startOffset)}</span><span>Coverage: ${formatInches(model.panelCoverage)}</span></div>`
}
