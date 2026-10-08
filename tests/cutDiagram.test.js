import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { generateLayout } from '../js/layout/layoutEngine.js'
import { panelCutDiagram } from '../js/render/panelCutDiagram.js'
import { panelDetails } from '../js/render/cutListRenderer.js'

const layout = (openings, extra = {}) =>
  generateLayout({
    wallType: 'sidewall',
    wallLength: 108,
    wallHeight: 192,
    openings,
    ...extra,
  })
const documentFor = (html) => new JSDOM(html).window.document

test('diagram measures an interior cut from the finished panel edge, including eighths', () => {
  const panel = layout([{ start: 8.5, width: 20, bottom: 48, height: 36 }]).panelCuts[0]
  const doc = documentFor(panelCutDiagram(panel, panel.openingCuts[0]))
  const description = doc.querySelector('desc').textContent
  assert.match(description, /left edge 8 1\/2"/)
  assert.match(description, /cut width 20"/)
  assert.match(description, /remaining right 7 1\/2"/)
  assert.match(description, /Sill 48", cut height 36", top 84"/)
  const rect = doc.querySelector('.cut-diagram-cut')
  assert.ok(Math.abs(Number(rect.getAttribute('width')) / 200 - 20 / 36) < 0.00001)
  assert.ok(Math.abs(Number(rect.getAttribute('height')) / 300 - 36 / 192) < 0.00001)
})

test('an opening spanning three panels shows only each panel’s cut portion', () => {
  const panels = layout([{ start: 30, width: 48, bottom: 0, height: 84 }]).panelCuts
  const docs = panels.map((p) => documentFor(panelCutDiagram(p, p.openingCuts[0])))
  assert.match(
    docs[0].querySelector('desc').textContent,
    /left edge 30", cut width 6", remaining right 0"/,
  )
  assert.match(
    docs[1].querySelector('desc').textContent,
    /left edge 0", cut width 36", remaining right 0"/,
  )
  assert.match(
    docs[2].querySelector('desc').textContent,
    /left edge 0", cut width 6", remaining right 30"/,
  )
  assert.equal(Number(docs[1].querySelector('.cut-diagram-cut').getAttribute('width')), 200)
})

test('ripped first panels use their finished width and do not add the sheet offset to cut marks', () => {
  const panel = layout([{ start: 6, width: 12, bottom: 24, height: 48 }], { startOffset: 5 })
    .panelCuts[0]
  const doc = documentFor(panelCutDiagram(panel, panel.openingCuts[0]))
  assert.match(
    doc.querySelector('desc').textContent,
    /Finished width 31". From finished left edge 6", cut width 12", remaining right 13"/,
  )
})

test('ridge shapes retain their peak and multiple opening diagrams have independent labels', () => {
  const model = generateLayout({
    wallType: 'gable',
    wallLength: 60,
    leftEaveHeight: 120,
    rightEaveHeight: 120,
    ridgeHeight: 180,
    ridgePosition: 30,
    openings: [
      { start: 6, width: 12, bottom: 24, height: 24 },
      { start: 6, width: 12, bottom: 60, height: 24 },
    ],
  })
  const panel = model.gableCuts[0],
    doc = documentFor(panelDetails(panel))
  assert.equal(doc.querySelectorAll('figure.cut-diagram').length, 2)
  const ids = [...doc.querySelectorAll('[id]')].map((n) => n.id)
  assert.equal(new Set(ids).size, ids.length)
  assert.equal(doc.querySelectorAll('.cut-diagram-other').length, 2)
  const points = doc
    .querySelector('.cut-diagram-panel')
    .getAttribute('points')
    .split(' ')
    .map((p) => p.split(',').map(Number))
  assert.equal(points.length, 5)
  assert.equal(Math.min(...points.map((p) => p[1])), 42)
  assert.equal(doc.querySelectorAll('.cut-diagram-cut').length, 2)
})
