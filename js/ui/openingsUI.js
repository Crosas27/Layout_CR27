import { field, escapeHTML as esc } from './dom.js'
import { parseMeasurement } from '../utils/measurementParser.js'
import { formatToField as fmt } from '../utils/formatter.js'
import { openingOverlaps, validateOpening } from '../openings/openingValidation.js'
/* OPENING OBJECT EDITOR */
export function openingEditor(opening, apply) {
  const o = opening || { name: 'Walk door', start: 0, width: 36, bottom: 0, height: 84 }
  return {
    title: opening ? 'Edit opening' : 'Add opening',
    fields: `<div class="field-grid">${field('openingName', 'Name / type', o.name, { full: true })}${field('openingStart', 'Start from outside corner', fmt(o.start), { measure: true })}${field('openingWidth', 'Width', fmt(o.width), { measure: true })}${field('openingBottom', 'Sill / bottom', fmt(o.bottom), { measure: true })}${field('openingHeight', 'Height', fmt(o.height), { measure: true })}</div><p class="muted">Jamb clearance is checked at 6″ from rib centers. Overlapping openings are allowed and flagged.</p>`,
    save(data) {
      const next = { name: String(data.get('openingName')).trim() || 'Opening' }
      for (const [k, field] of [
        ['start', 'openingStart'],
        ['width', 'openingWidth'],
        ['bottom', 'openingBottom'],
        ['height', 'openingHeight'],
      ])
        next[k] = parseMeasurement(data.get(field))
      apply(next)
    },
  }
}
/* OPENING CARDS — stay editable even when imported geometry is invalid. */
export function openingCards(wall, config, model) {
  if (!wall.openings.length)
    return '<div class="empty-state">No openings yet. Add a door or window when your panel layout is ready.</div>'
  return wall.openings
    .map((o, i) => {
      const warnings = [
        ...validateOpening(o, config),
        ...(model?.openingAnalysis[i]?.warnings || []),
      ]
      if (
        openingOverlaps(
          o,
          wall.openings.filter((_, j) => j !== i),
        )
      )
        warnings.push('Overlaps another opening.')
      return `<article class="opening-card"><button class="opening-main" data-edit-opening="${esc(o.id)}"><p class="eyebrow">OPENING ${String(i + 1).padStart(2, '0')}</p><h3>${esc(o.name || 'Opening')}</h3><p class="size">${fmt(o.width)} × ${fmt(o.height)}</p><p class="muted">@ ${fmt(o.start)} from start · sill ${fmt(o.bottom)}</p></button><div class="opening-status ${warnings.length ? 'warning' : 'good'}">${warnings.length ? warnings.map(esc).join('<br>') : model ? '✓ Jamb clearance meets 6″' : 'Set valid wall geometry to check clearance.'}</div><div class="action-bar"><button data-edit-opening="${esc(o.id)}">Edit</button><button data-delete-opening="${esc(o.id)}" class="danger" aria-label="Delete opening ${i + 1}">Delete</button></div></article>`
    })
    .join('')
}
