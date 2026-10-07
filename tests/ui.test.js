import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { JSDOM } from 'jsdom'
import { IDBFactory } from 'fake-indexeddb'
import { initApp } from '../js/app/appController.js'
import { OLD_PROJECT_KEY } from '../js/project/projectStorage.js'
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const saved = {
  details: { jobName: 'Four wall shop', location: 'Chino Valley' },
  profile: { name: 'PBR', panelCoverage: '36"', ribSpacing: '12"' },
  activeWallId: 1,
  walls: ['Front', 'Back', 'Left', 'Right'].map((name, i) => ({
    id: i + 1,
    name,
    wallType: 'sidewall',
    wallLength: "60'",
    wallHeight: "16'",
    startOffset: '0',
    openings: [],
  })),
}
function setup(indexedDB = new IDBFactory(), hash = '') {
  const dom = new JSDOM(html, { url: 'https://example.com/cr27/' + hash, pretendToBeVisual: true })
  for (const key of [
    'window',
    'document',
    'localStorage',
    'location',
    'FormData',
    'HTMLElement',
    'Element',
    'Event',
    'MouseEvent',
  ])
    Object.defineProperty(globalThis, key, {
      value: dom.window[key],
      configurable: true,
      writable: true,
    })
  Object.defineProperty(globalThis, 'navigator', {
    value: dom.window.navigator,
    configurable: true,
  })
  Object.defineProperty(dom.window, 'indexedDB', { value: indexedDB })
  dom.window.scrollTo = () => {}
  dom.window.HTMLElement.prototype.scrollIntoView = () => {}
  dom.window.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  dom.window.HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
    this.dispatchEvent(new dom.window.Event('close'))
  }
  return dom
}
const $ = (id) => document.getElementById(id)
const click = (id) => $(id).click()
const save = () =>
  $('editorForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
test('migrate → open wall → edit opening → delete → undo → reload; multi-wall data survives', async () => {
  const db = new IDBFactory(),
    dom = setup(db)
  localStorage.setItem(OLD_PROJECT_KEY, JSON.stringify(saved))
  const app = await initApp()
  assert.equal(document.querySelectorAll('[data-project]').length, 1)
  document.querySelector('[data-project]').click()
  assert.equal(document.querySelectorAll('[data-wall]').length, 4)
  document.querySelector('[data-wall]').click()
  assert.equal(document.querySelectorAll('.svg-hit[data-panel]').length, 20)
  click('addOpeningBtn')
  $('openingStart').value = '6"'
  save()
  assert.equal(app.getWorkspace().projects[0].walls[0].openings.length, 1)
  document.querySelector('[data-edit-opening]').click()
  assert.equal($('openingStart').value, '6"')
  save()
  assert.equal(app.getWorkspace().projects[0].walls[0].openings[0].width, 36)
  document.querySelector('[data-delete-opening]').click()
  assert.equal(app.getWorkspace().projects[0].walls[0].openings.length, 0)
  click('undoBtn')
  assert.equal(app.getWorkspace().projects[0].walls[0].openings.length, 1)
  await app.whenSaved()
  assert.equal(location.hash, '')
  app.storage.close()
  dom.window.close()
  const refreshed = setup(db),
    reloaded = await initApp()
  assert.equal(reloaded.getWorkspace().projects[0].walls.length, 4)
  assert.equal(reloaded.getWorkspace().projects[0].walls[0].openings.length, 1)
  reloaded.storage.close()
  refreshed.window.close()
})
test('invalid measurements block save, drafts cancel cleanly, keypad dispatches once', async () => {
  const dom = setup()
  localStorage.setItem(OLD_PROJECT_KEY, JSON.stringify(saved))
  const app = await initApp()
  document.querySelector('[data-project]').click()
  document.querySelector('[data-wall]').click()
  click('addOpeningBtn')
  $('openingStart').value = 'potato'
  save()
  assert.equal(app.getWorkspace().projects[0].walls[0].openings.length, 0)
  assert.match($('editorError').textContent, /valid/)
  $('openingStart').value = '0'
  $('openingStart').focus()
  let inputs = 0
  $('openingStart').addEventListener('input', () => inputs++)
  document.querySelector('#measurementKeyboard [data-key="1"]').click()
  assert.equal(inputs, 1)
  click('cancelEditorBtn')
  assert.equal(app.getWorkspace().projects[0].walls[0].openings.length, 0)
  assert.equal(document.querySelectorAll('#profileName').length, 0)
  await app.whenSaved()
  app.storage.close()
  dom.window.close()
})
test('wall edits that strand an existing opening clear all stale fabrication output', async () => {
  const dom = setup(),
    data = structuredClone(saved)
  data.walls[0].openings = [{ start: 6, width: 36, bottom: 0, height: 84 }]
  localStorage.setItem(OLD_PROJECT_KEY, JSON.stringify(data))
  const app = await initApp()
  document.querySelector('[data-project]').click()
  document.querySelector('[data-wall]').click()
  assert.ok($('cutList').innerHTML)
  click('editWallBtn')
  $('wallHeight').value = "6'"
  save()
  assert.equal($('cutList').innerHTML, '')
  assert.equal($('wallSvg').innerHTML, '')
  assert.match($('drawingEmpty').textContent, /roofline/)
  assert.ok(document.querySelector('[data-edit-opening]'))
  assert.ok($('printBtn').disabled)
  click('undoBtn')
  assert.ok($('cutList').innerHTML)
  await app.whenSaved()
  app.storage.close()
  dom.window.close()
})
test('legacy auto-share hash cannot replace the four-wall saved project', async () => {
  const payload = { details: saved.details, profile: saved.profile, wall: saved.walls[0] },
    hash = '#' + btoa(JSON.stringify(payload)),
    dom = setup(new IDBFactory(), hash)
  localStorage.setItem(OLD_PROJECT_KEY, JSON.stringify(saved))
  const app = await initApp()
  assert.equal(app.getWorkspace().projects.length, 1)
  assert.equal(app.getWorkspace().projects[0].walls.length, 4)
  assert.equal(location.hash, '')
  await app.whenSaved()
  app.storage.close()
  dom.window.close()
})
test('new project, duplicate, archive, restore and incoming shares preserve existing jobs', async () => {
  const dom = setup()
  localStorage.setItem(OLD_PROJECT_KEY, JSON.stringify(saved))
  const app = await initApp()
  click('newProjectBtn')
  $('jobName').value = 'Second shop'
  save()
  assert.equal(app.getWorkspace().projects.length, 2)
  click('duplicateProjectBtn')
  assert.equal(app.getWorkspace().projects.length, 3)
  click('archiveProjectBtn')
  assert.equal(document.querySelectorAll('[data-project]').length, 2)
  $('showArchived').checked = true
  $('showArchived').dispatchEvent(new Event('change'))
  assert.equal(document.querySelectorAll('[data-project]').length, 1)
  document.querySelector('[data-project]').click()
  click('archiveProjectBtn')
  assert.equal(app.getWorkspace().projects.filter((p) => p.archived).length, 0)
  await app.whenSaved()
  app.storage.close()
  dom.window.close()
})

test('corrupt old storage is preserved and temporary edits never overwrite it', async () => {
  const dom = setup()
  localStorage.setItem(OLD_PROJECT_KEY, '{corrupt')
  const app = await initApp()
  assert.equal($('saveStatus').dataset.failed, 'true')
  assert.match($('errorBox').textContent, /left intact/)
  click('newProjectBtn')
  $('jobName').value = 'Temporary job'
  save()
  await app.whenSaved()
  assert.equal(localStorage.getItem(OLD_PROJECT_KEY), '{corrupt')
  assert.equal($('saveStatus').dataset.failed, 'true')
  app.storage.close()
  dom.window.close()
})

test('single slope is available in both wall selectors, renders without a ridge and survives reload', async () => {
  const db = new IDBFactory(),
    dom = setup(db)
  localStorage.setItem(OLD_PROJECT_KEY, JSON.stringify(saved))
  const app = await initApp()
  document.querySelector('[data-project]').click()
  click('addWallBtn')
  assert.ok(document.querySelector('#newWallType option[value="singleSlope"]'))
  click('cancelEditorBtn')
  document.querySelector('[data-wall]').click()
  click('editWallBtn')
  $('wallType').value = 'singleSlope'
  $('wallType').dispatchEvent(new Event('change'))
  assert.ok($('gableFields').classList.contains('hidden'))
  assert.ok($('sidewallFields').classList.contains('hidden'))
  assert.ok(!$('slopedFields').classList.contains('hidden'))
  assert.ok($('ridgePanelStopHeight').closest('.field-group').classList.contains('hidden'))
  $('wallLength').value = "50'"
  $('leftEaveHeight').value = '21\' 4"'
  $('rightEaveHeight').value = "13'"
  $('ridgeHeight').value = 'potato'
  save()
  assert.equal(app.getWorkspace().projects[0].walls[0].wallType, 'singleSlope')
  assert.match($('wallMeta').textContent, /2:12/)
  assert.equal(document.querySelectorAll('.cut-row').length, 17)
  assert.equal(document.querySelectorAll('.ridge-label').length, 0)
  assert.equal(document.querySelectorAll('.svg-hit[data-panel]').length, 17)
  await app.whenSaved()
  app.storage.close()
  dom.window.close()
  const reopened = setup(db),
    reloaded = await initApp()
  document.querySelector('[data-project]').click()
  assert.match($('wallCards').textContent, /SINGLE SLOPE/)
  document.querySelector('[data-wall]').click()
  assert.equal(document.querySelectorAll('.cut-row').length, 17)
  await reloaded.whenSaved()
  reloaded.storage.close()
  reopened.window.close()
})
