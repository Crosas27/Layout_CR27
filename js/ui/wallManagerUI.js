import { $, field, textArea, escapeHTML as esc, show } from './dom.js'
/* WALL GEOMETRY EDITOR — simple walls, symmetric gables or custom slopes. */
export function wallEditor(wall, apply) {
  const m = (key, label, placeholder = '') =>
    field(key, label, wall[key], { measure: true, placeholder })
  return {
    title: 'Edit wall',
    fields: `<div class="field-grid">${field('wallName', 'Wall name', wall.name, { full: true })}<div class="field-group"><label for="wallType">Wall type</label><select id="wallType" name="wallType"><option value="sidewall" ${wall.wallType === 'sidewall' ? 'selected' : ''}>Sidewall</option><option value="gable" ${wall.wallType === 'gable' ? 'selected' : ''}>Gable / sloped endwall</option></select></div>${m('wallLength', 'Wall width', "e.g. 60'")}</div><div id="sidewallFields" class="field-grid">${m('wallHeight', 'Wall height', "e.g. 16'")}</div><div id="gableFields"><div class="field-grid">${m('leftEaveHeight', 'Left eave height')}${m('rightEaveHeight', 'Right eave height')}${m('ridgeHeight', 'Ridge height')}${m('ridgePosition', 'Ridge from left', 'Blank = centered')}</div><button id="symmetricGableBtn" type="button">Center ridge &amp; match eaves</button></div><details><summary>Offset &amp; panel stops</summary><p class="muted">Offset is the amount trimmed from the first sheet's left edge. Openings never shift the layout.</p><div class="field-grid">${m('startOffset', 'Start offset', '0″')}${m('panelStopHeight', 'Sidewall panel stop', 'Blank = wall height')}${m('leftPanelStopHeight', 'Left stop height', 'Blank = left eave')}${m('ridgePanelStopHeight', 'Ridge stop height', 'Blank = ridge')}${m('rightPanelStopHeight', 'Right stop height', 'Blank = right eave')}</div></details><div class="field-grid">${textArea('wallNoteField', 'Wall notes', wall.notes)}</div>`,
    ready() {
      const mode = () => {
        show($('gableFields'), $('wallType').value === 'gable')
        show($('sidewallFields'), $('wallType').value !== 'gable')
      }
      $('wallType').onchange = mode
      mode()
      $('symmetricGableBtn').onclick = () => {
        $('ridgePosition').value = ''
        $('rightEaveHeight').value = $('leftEaveHeight').value
      }
    },
    save(data) {
      const next = {
        ...wall,
        name: String(data.get('wallName')).trim() || 'Unnamed wall',
        notes: data.get('wallNoteField'),
        wallType: data.get('wallType'),
      }
      for (const k of [
        'wallLength',
        'wallHeight',
        'panelStopHeight',
        'startOffset',
        'leftEaveHeight',
        'rightEaveHeight',
        'ridgeHeight',
        'ridgePosition',
        'leftPanelStopHeight',
        'ridgePanelStopHeight',
        'rightPanelStopHeight',
      ])
        next[k] = data.get(k)
      apply(next)
    },
  }
}
export function wallChoiceEditor(add) {
  return {
    title: 'Add a wall',
    fields:
      '<div class="field-grid"><div class="field-group full"><label for="newWallType">Wall template</label><select id="newWallType" name="newWallType"><option value="sidewall">Sidewall · straight top</option><option value="gable">Gable · centered ridge by default</option></select></div></div>',
    save(data) {
      add(data.get('newWallType'))
    },
  }
}
