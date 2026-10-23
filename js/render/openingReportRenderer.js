import { formatToField as fmt } from '../utils/formatter.js'
import { escapeHTML as esc } from '../ui/dom.js'
export function renderOpeningReport(model) {
  document.getElementById('openingReport').innerHTML = model.openingAnalysis
    .map(
      (o) =>
        `<div class="opening-report-block"><h3>Opening ${String(o.id).padStart(2, '0')}</h3><p class="muted">${fmt(o.width)} × ${fmt(o.height)} · start ${fmt(o.start)} · sill ${fmt(o.bottom)}</p>${o.intersectingPanels.map((c) => `<div class="cut-instruction"><p><strong>Panel ${c.panel} · ${c.cutType.replaceAll('-', ' ')}</strong></p><p>From finished left edge ${fmt(c.cutFromLeft)} · cut width ${fmt(c.cutWidth)} · remaining right ${fmt(c.cutToRight)}</p><p>Sill ${fmt(c.bottom)} · top ${fmt(c.top)} · height ${fmt(c.height)}</p></div>`).join('')}${o.warnings.length ? `<div class="warning">${o.warnings.map(esc).join('<br>')}</div>` : '<p class="good">✓ Jamb clearance meets 6″.</p>'}</div>`,
    )
    .join('')
}
