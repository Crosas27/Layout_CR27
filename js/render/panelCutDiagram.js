import { formatInches } from '../utils/formatter.js'
import { escapeHTML as esc } from '../ui/dom.js'

/* PANEL OPENING DIAGRAM — finished panel coordinates, never raw sheet seams.
   Each opening gets its own dimension lanes to keep multiple cuts readable. */
export function panelCutDiagram(panel, cut) {
  const left = 90,
    right = 290,
    base = 342,
    top = 42
  const maxHeight = Math.max(
    ...panel.segments.flatMap((s) => [s.leftStopHeight, s.rightStopHeight]),
  )
  const x = (inches) => left + (inches / panel.width) * (right - left)
  const y = (inches) => base - (inches / maxHeight) * (base - top)
  const n = (value) => Number(value.toFixed(3))
  const id = `cut-${panel.panel}-${cut.openingId}`
  const label = (px, py, value, extra = '') =>
    `<text x="${n(px)}" y="${n(py)}" text-anchor="middle" ${extra}>${esc(value)}</text>`
  const line = (x1, y1, x2, y2, extra = '') =>
    `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" ${extra}/>`
  const arrows = `marker-start="url(#${id}-arrow)" marker-end="url(#${id}-arrow)"`
  const horizontal = (a, b, row, text) =>
    `<g class="cut-diagram-dimension">${line(a, row, b, row, Math.abs(b - a) > 1 ? arrows : '')}${line(a, row - 4, a, row + 4)}${line(b, row - 4, b, row + 4)}${label(190, row - 9, text)}</g>`
  const vertical = (px, a, b, text, textX) =>
    `<g class="cut-diagram-dimension">${line(px, a, px, b, Math.abs(b - a) > 1 ? arrows : '')}${line(px - 4, a, px + 4, a)}${line(px - 4, b, px + 4, b)}${label(textX, (a + b) / 2, text, `transform="rotate(-90 ${textX} ${n((a + b) / 2)})"`)}</g>`
  const outline = [
    [left, base],
    [left, y(panel.leftStopHeight)],
    ...panel.segments.map((s) => [x(s.x1 - panel.start), y(s.rightStopHeight)]),
    [right, base],
  ]
  const rect = (c, cls) =>
    `<rect class="${cls}" x="${n(x(c.cutFromLeft))}" y="${n(y(c.top))}" width="${n(x(c.cutWidth) - left)}" height="${n(y(c.bottom) - y(c.top))}"/>`
  const summary = `Panel ${panel.panel}, opening ${cut.openingId}. Finished width ${formatInches(panel.width)}. From finished left edge ${formatInches(cut.cutFromLeft)}, cut width ${formatInches(cut.cutWidth)}, remaining right ${formatInches(cut.cutToRight)}. Sill ${formatInches(cut.bottom)}, cut height ${formatInches(cut.height)}, top ${formatInches(cut.top)}.`
  return `<figure class="cut-diagram">
    <div class="cut-diagram-scroll"><svg viewBox="0 0 400 478" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="${id}-title ${id}-description">
      <title id="${id}-title">Panel ${panel.panel} · opening ${cut.openingId} cut dimensions</title>
      <desc id="${id}-description">${esc(summary)} Schematic, not to scale. Shaded area is removed; dashed boxes mark other openings on this panel.</desc>
      <defs><marker id="${id}-arrow" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 8 0 L 0 4 L 8 8" class="cut-diagram-arrow"/></marker><pattern id="${id}-hatch" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M 0 8 L 8 0" class="cut-diagram-hatch"/></pattern></defs>
      <polygon class="cut-diagram-panel" points="${outline.map((p) => p.map(n).join(',')).join(' ')}"/>
      ${panel.openingCuts
        .filter((c) => c.openingId !== cut.openingId)
        .map((c) => rect(c, 'cut-diagram-other'))
        .join('')}
      ${rect(cut, 'cut-diagram-cut')}
      <rect x="${n(x(cut.cutFromLeft))}" y="${n(y(cut.top))}" width="${n(x(cut.cutWidth) - left)}" height="${n(y(cut.bottom) - y(cut.top))}" fill="url(#${id}-hatch)"/>
      ${horizontal(left, right, 28, `Finished width ${formatInches(panel.width)}`)}
      ${vertical(55, y(cut.bottom), base, `Sill ${formatInches(cut.bottom)}`, 35)}
      ${vertical(326, y(cut.top), y(cut.bottom), `Cut height ${formatInches(cut.height)}`, 350)}
      ${label(left, base + 17, 'LEFT', 'class="cut-diagram-edge"')}${label(right, base + 17, 'RIGHT', 'class="cut-diagram-edge"')}
      ${horizontal(left, x(cut.cutFromLeft), 390, `From left ${formatInches(cut.cutFromLeft)}`)}
      ${horizontal(x(cut.cutFromLeft), x(cut.cutFromLeft + cut.cutWidth), 428, `Cut width ${formatInches(cut.cutWidth)}`)}
      ${horizontal(x(cut.cutFromLeft + cut.cutWidth), right, 466, `Remaining right ${formatInches(cut.cutToRight)}`)}
    </svg></div>
    <figcaption>Shaded area = remove · dimensions in inches · not to scale</figcaption>
  </figure>`
}
