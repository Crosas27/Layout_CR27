import { $, show } from './dom.js'
import { parseMeasurement } from '../utils/measurementParser.js'
import { formatToField, formatInches } from '../utils/formatter.js'

/* MEASUREMENT KEYPAD — exactly one input event per change. */
export function setupMeasurementKeyboard() {
  const keyboard = $('measurementKeyboard')
  let active = null
  const viewport = window.visualViewport
  const resize = () => {
    $('editorDialog').style.setProperty(
      '--editor-viewport-height',
      `${viewport?.height ?? window.innerHeight}px`,
    )
    active?.scrollIntoView?.({ block: 'nearest' })
  }
  viewport?.addEventListener('resize', resize)
  window.addEventListener('resize', resize)
  resize()
  const update = () => {
    if (!active) return
    const n = parseMeasurement(active.value)
    $('measurementDisplay').textContent = !active.value.trim()
      ? ''
      : Number.isFinite(n)
        ? formatToField(n)
        : 'Incomplete measurement'
    const helper = active.nextElementSibling
    if (helper?.classList.contains('measure-helper'))
      helper.textContent = !active.value.trim()
        ? ''
        : Number.isFinite(n)
          ? formatInches(n)
          : 'Enter feet, inches or a fraction'
  }
  const hide = () => {
    show(keyboard, false)
    active?.closest('dialog')?.classList.remove('keypad-open')
    active = null
  }
  document.addEventListener('focusin', (e) => {
    if (!e.target.matches('.measure-input')) {
      if (!keyboard.contains(e.target)) hide()
      return
    }
    active = e.target
    const dialog = active.closest('dialog')
    // Keep the keypad in the modal's top layer so it stays interactive.
    if (dialog) {
      dialog.append(keyboard)
      dialog.classList.add('keypad-open')
    }
    $('measurementLabel').textContent =
      document.querySelector(`label[for="${active.id}"]`)?.textContent || 'Measurement'
    show(keyboard, true)
    resize()
    update()
    active.scrollIntoView?.({ block: 'nearest' })
  })
  document.addEventListener('input', (e) => {
    if (e.target === active) update()
  })
  keyboard.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) e.preventDefault()
  })
  keyboard.addEventListener('click', (e) => {
    const button = e.target.closest('button')
    if (!button || !active) return
    if (button.dataset.action === 'confirm') {
      hide()
      return
    }
    let start = active.selectionStart ?? active.value.length,
      end = active.selectionEnd ?? start
    if (button.dataset.action === 'backspace' && start === end) start = Math.max(0, start - 1)
    const key = button.dataset.key || ''
    active.setRangeText(key, start, end, 'end')
    active.dispatchEvent(new Event('input', { bubbles: true }))
    active.focus()
    update()
  })
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.measure-input') && !e.target.closest('#measurementKeyboard')) hide()
  })
  $('editorDialog').addEventListener('close', () => {
    hide()
    document.body.append(keyboard)
  })
  return { hide }
}
