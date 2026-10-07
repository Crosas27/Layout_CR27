import { $, show } from './dom.js'
/* MODAL EDITOR — draft changes reach project state only on Save. */
export function createEditor() {
  let commit = null
  $('closeEditorBtn').onclick = $('cancelEditorBtn').onclick = () => $('editorDialog').close()
  $('editorForm').addEventListener('submit', (e) => {
    e.preventDefault()
    try {
      commit(new FormData($('editorForm')))
      $('editorDialog').close()
    } catch (err) {
      $('editorError').textContent = err.message
      show($('editorError'), true)
    }
  })
  return function open({ title, fields, save, ready }) {
    $('editorTitle').textContent = title
    $('editorFields').innerHTML = fields
    show($('editorError'), false)
    commit = save
    $('editorDialog').showModal()
    ready?.()
  }
}
