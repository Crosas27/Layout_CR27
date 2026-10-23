export const $ = (id) => document.getElementById(id)
export const escapeHTML = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )
export const show = (el, visible) => el.classList.toggle('hidden', !visible)
export function field(id, label, value = '', options = {}) {
  const { type = 'text', measure = false, full = false, placeholder = '' } = options
  return `<div class="field-group ${full ? 'full' : ''}"><label for="${id}">${escapeHTML(label)}</label><input id="${id}" name="${id}" type="${type}" value="${escapeHTML(value)}" placeholder="${escapeHTML(placeholder)}" ${measure ? 'class="measure-input" inputmode="none" autocomplete="off" spellcheck="false"' : ''}>${measure ? '<div class="measure-helper" aria-live="polite"></div>' : ''}</div>`
}
export function textArea(id, label, value = '') {
  return `<div class="field-group full"><label for="${id}">${label}</label><textarea id="${id}" name="${id}">${escapeHTML(value)}</textarea></div>`
}
