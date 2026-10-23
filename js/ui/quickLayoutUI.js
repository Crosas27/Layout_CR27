import { $, field, show, escapeHTML as esc } from './dom.js'
import { calculateQuickLayout } from '../layout/quickLayout.js'
import { EPS } from '../layout/layoutMath.js'
import { formatToField as feet, formatInches as inches } from '../utils/formatter.js'

/* QUICK LAYOUT — retained only in this tab; never reads or writes a saved job. */
export function setupQuickLayout() {
  let model = null
  let selected = 1
  $('quickFields').innerHTML =
    field('quickLength', 'Wall length', '', { measure: true, placeholder: "e.g. 50'" }) +
    field('quickCoverage', 'Panel coverage', '36"', { measure: true })
  $('quickOffsetField').innerHTML = field('quickOffset', 'Start offset', '0"', { measure: true })

  const describePanel = () => {
    const panel = model?.panels[selected - 1]
    if (!panel) return
    $('quickPanelTitle').textContent = `Panel ${panel.panel} · ${inches(panel.width)} wide`
    $('quickPanelStart').textContent = feet(panel.start)
    $('quickPanelEnd').textContent = feet(panel.end)
    for (const button of $('quickPanelStrip').querySelectorAll('button'))
      button.setAttribute('aria-pressed', String(Number(button.dataset.quickPanel) === selected))
  }
  const render = () => {
    model = null
    $('quickPanelStrip').replaceChildren()
    show($('quickResults'), false)
    show($('quickSummary'), false)
    show($('quickMessage'), true)
    $('quickMessage').classList.remove('error')
    for (const id of ['quickLength', 'quickCoverage', 'quickOffset']) {
      const input = $(id)
      // Keep the inch helper current for physical keyboards, pastes and the custom keypad.
      input.nextElementSibling.textContent = ''
    }
    if (!$('quickLength').value.trim()) {
      $('quickMessage').textContent = 'Enter a wall length to see your panel count.'
      return
    }
    try {
      model = calculateQuickLayout(
        $('quickLength').value,
        $('quickCoverage').value,
        $('quickOffset').value,
      )
    } catch (err) {
      $('quickMessage').textContent = err.message
      $('quickMessage').classList.add('error')
      return
    }
    $('quickLength').nextElementSibling.textContent = inches(model.wallLength)
    $('quickCoverage').nextElementSibling.textContent = inches(model.coverage)
    $('quickOffset').nextElementSibling.textContent = inches(model.startOffset)
    show($('quickMessage'), false)
    show($('quickResults'), true)
    show($('quickSummary'), true)
    $('quickTotal').textContent = model.totalPanels
    $('quickCountLabel').textContent = model.totalPanels === 1 ? 'panel' : 'panels'
    $('quickBreakdown').textContent =
      `${model.fullPanels} full-width · ${model.rippedPanels} ${model.rippedPanels === 1 ? 'rip' : 'rips'}`
    const first = model.panels[0],
      last = model.panels.at(-1)
    $('quickFirstWidth').textContent = inches(first.width)
    $('quickLastWidth').textContent = inches(last.width)
    $('quickFirstLabel').textContent = model.totalPanels === 1 ? 'Only panel' : 'First panel'
    show($('quickLastStat'), model.totalPanels > 1)
    selected = Math.min(selected, model.totalPanels)
    $('quickPanelStrip').innerHTML = model.panels
      .map((p) => {
        const ripped = Math.abs(p.width - model.coverage) >= EPS
        return `<button type="button" class="quick-panel${ripped ? ' is-rip' : ''}" data-quick-panel="${p.panel}" aria-pressed="false" aria-label="${esc(`Panel ${p.panel}, ${inches(p.width)} wide, from ${feet(p.start)} to ${feet(p.end)}`)}" style="--panel-size:${Math.max(56, (p.width / model.coverage) * 76)}px"><span>${p.panel}</span><small>${ripped ? 'RIP' : 'FULL'}</small></button>`
      })
      .join('')
    describePanel()
    if ($('quickInputs').contains(document.activeElement))
      document.activeElement.scrollIntoView?.({ block: 'nearest' })
  }
  $('quickInputs').addEventListener('input', render)
  $('quickInputs').addEventListener('submit', (e) => e.preventDefault())
  $('quickPanelStrip').addEventListener('click', (e) => {
    const button = e.target.closest('[data-quick-panel]')
    if (!button || !model) return
    selected = Number(button.dataset.quickPanel)
    describePanel()
  })
  render()
}
