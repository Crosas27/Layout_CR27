import test from 'node:test'
import assert from 'node:assert/strict'
import { generateLayout, getGableHeightAtX } from '../js/layout/layoutEngine.js'
import { calculatePanels } from '../js/layout/panelLayout.js'
import { calculateRibs } from '../js/layout/ribLayout.js'
import { validateOpening, openingOverlaps } from '../js/openings/openingValidation.js'
import { wallConfig, createWall } from '../js/walls/wallModel.js'
import { parseMeasurement as parse } from '../js/utils/measurementParser.js'
import { formatToField as fmt } from '../js/utils/formatter.js'
import { buildTextSummary } from '../js/utils/textExport.js'
const profile = { panelCoverage: '36"', ribSpacing: '12"' }
const side = (overrides = {}) =>
  wallConfig({ ...createWall(), wallLength: "60'", wallHeight: "16'", ...overrides }, profile)
const gable = (overrides = {}) =>
  wallConfig(
    {
      ...createWall(),
      wallType: 'gable',
      wallLength: "40'",
      leftEaveHeight: "14'",
      rightEaveHeight: "14'",
      ridgeHeight: "20'",
      ...overrides,
    },
    profile,
  )
test('36 inch panels cover the wall continuously; 50 feet needs 17', () => {
  assert.equal(generateLayout(side()).panels.length, 20)
  const m = generateLayout(side({ wallLength: "50'" }))
  assert.equal(m.panels.length, 17)
  assert.equal(m.panels.at(-1).width, 24)
})
test('offset sheets and rib centers agree for positive, negative and wrapped offsets', () => {
  for (const offset of [0, 5, 12, 17, 35, -5, 41, 72]) {
    const panels = calculatePanels(121, 36, offset),
      ribs = calculateRibs(121, 12, offset, 36)
    assert.equal(
      panels.reduce((n, p) => n + p.width, 0),
      121,
    )
    for (const rib of ribs)
      assert.ok(
        panels.some((p) =>
          [0, 12, 24, 36].some((r) => Math.abs(p.rawStart + r - rib.position) < 0.001),
        ),
      )
    assert.equal(panels[0].start, 0)
    assert.equal(panels.at(-1).end, 121)
  }
  assert.deepEqual(
    calculateRibs(36, 12, 5).map((r) => r.position),
    [7, 19, 31],
  )
  assert.deepEqual(
    calculateRibs(65, 12, 5, 30).map((r) => r.position),
    [7, 19, 25, 37, 49, 55],
  )
})
test('exactly 6 inch jamb clearance is allowed; 5.5 inches warns', () => {
  const c = side()
  c.openings = [{ start: 6, width: 36, bottom: 0, height: 84 }]
  assert.deepEqual(generateLayout(c).openingAnalysis[0].warnings, [])
  c.openings[0].start = 5.5
  assert.ok(generateLayout(c).openingAnalysis[0].warnings.length)
  c.openings[0].start = 12
  assert.ok(generateLayout(c).openingAnalysis[0].leftEdgeHits.includes(12))
})
test('gable interpolation, off-center ridge and ridge-crossing fabrication', () => {
  assert.equal(getGableHeightAtX(120, 480, 168, 240, 240, 168), 204)
  const m = generateLayout(gable({ ridgePosition: '239"' })),
    ridge = m.gableCuts.find((p) => p.ridgePanel)
  assert.equal(ridge.segments.length, 2)
  assert.equal(ridge.segments[0].rightStopHeight, 240)
  assert.equal(ridge.segments[0].width + ridge.segments[1].width, ridge.width)
  assert.match(buildTextSummary(m), /peak 20'/)
})
test('single slope works with ridge at left edge (2:12 across 50 feet)', () => {
  const m = generateLayout(
    gable({
      wallLength: "50'",
      leftEaveHeight: '21\' 4"',
      ridgeHeight: '21\' 4"',
      rightEaveHeight: "13'",
      ridgePosition: '0',
    }),
  )
  assert.equal(m.panels.length, 17)
  assert.equal(m.gableCuts[0].leftHeight, 256)
  assert.equal(m.gableCuts.at(-1).rightHeight, 156)
})
test('gable and sidewall openings reject above-roof cuts without clipping', () => {
  const o = { start: 0, width: 36, bottom: 100, height: 84 }
  assert.match(validateOpening(o, gable()).join(' '), /roofline/)
  assert.throws(() => generateLayout({ ...gable(), openings: [o] }), /roofline/)
  assert.throws(() => generateLayout({ ...side(), openings: [{ ...o, height: 100 }] }), /roofline/)
})
test('opening cuts split exactly across panel edges', () => {
  const m = generateLayout({
    ...side(),
    openings: [{ start: 30, width: 48, bottom: 48, height: 36 }],
  })
  const cuts = m.openingAnalysis[0].intersectingPanels
  assert.deepEqual(
    cuts.map((c) => c.cutWidth),
    [6, 36, 6],
  )
  assert.deepEqual(
    cuts.map((c) => c.cutFromLeft),
    [30, 0, 0],
  )
  assert.equal(
    cuts.reduce((n, c) => n + c.cutWidth, 0),
    48,
  )
})
test('blank panel stops default to roof heights; invalid values never default', () => {
  assert.equal(generateLayout(side()).panelStopHeight, 192)
  assert.equal(generateLayout(gable()).ridgePanelStopHeight, 240)
  assert.throws(() => generateLayout(side({ panelStopHeight: 'potato' })))
  assert.throws(() => generateLayout(side({ startOffset: 'potato' })))
  assert.throws(() => generateLayout(side({ wallHeight: '' })))
})
test('measurement formats round-trip and malformed input remains distinguishable', () => {
  for (const value of [0, 0.125, 6.5, 84, 126.5, -126.5, 255.875, 720])
    assert.equal(parse(fmt(value)), value)
  assert.equal(parse('10-6-1/2'), 126.5)
  assert.equal(parse('10\'6"1/2'), 126.5)
  assert.equal(parse('3\' (36")'), 36)
  for (const bad of ['', null, 'potato', '1/0', '6 1/0', '3\' (99")', "3' junk"])
    assert.ok(Number.isNaN(parse(bad)), String(bad))
  assert.equal(parse('0'), 0)
})
test('intentional overlapping openings stay allowed and flagged', () => {
  const a = { start: 0, width: 36, bottom: 0, height: 84 },
    b = { start: 30, width: 36, bottom: 0, height: 84 }
  assert.ok(openingOverlaps(a, [b]))
  assert.ok(generateLayout({ ...side(), openings: [a, b] }))
})
test('a quarter inch inset is an interior cut, not a full-width cut', () => {
  const m = generateLayout({
    ...side(),
    openings: [{ start: 0.25, width: 35.5, bottom: 0, height: 84 }],
  })
  assert.equal(m.openingAnalysis[0].intersectingPanels[0].cutType, 'interior-notch')
})
test('openings above a shorter panel stop block unreliable fabrication output', () => {
  assert.throws(
    () =>
      generateLayout({
        ...side({ panelStopHeight: "6'" }),
        openings: [{ start: 6, width: 36, bottom: 0, height: 84 }],
      }),
    /panel stop/,
  )
})

test('explicit single-slope walls rise or fall using endpoint heights without ridge fields', () => {
  for (const [left, right] of [
    [256, 156],
    [156, 256],
  ]) {
    const model = generateLayout({
      wallType: 'singleSlope',
      wallLength: 600,
      leftEaveHeight: left,
      rightEaveHeight: right,
    })
    assert.equal(model.wallType, 'singleSlope')
    assert.equal(model.panels.length, 17)
    assert.equal(model.gableCuts[0].leftStopHeight, left)
    assert.equal(model.gableCuts.at(-1).rightStopHeight, right)
    assert.ok(model.gableCuts.every((p) => !p.ridgePanel && p.segments.length === 1))
    assert.match(buildTextSummary(model), /SINGLE SLOPE/)
    assert.doesNotMatch(buildTextSummary(model), /RIDGE/)
  }
})
test('single slopes ignore old hidden ridge values and validate the actual roofline and stops', () => {
  const config = wallConfig(
    {
      ...createWall(),
      wallType: 'singleSlope',
      wallLength: "50'",
      leftEaveHeight: '21\' 4"',
      rightEaveHeight: "13'",
      ridgeHeight: 'potato',
      ridgePosition: 'potato',
      ridgePanelStopHeight: 'potato',
    },
    profile,
  )
  assert.equal(generateLayout(config).gableCuts.at(-1).rightStopHeight, 156)
  assert.throws(
    () =>
      generateLayout({ ...config, openings: [{ start: 564, width: 36, bottom: 100, height: 80 }] }),
    /roofline/,
  )
  assert.throws(
    () =>
      generateLayout({
        ...config,
        leftPanelStopHeight: 200,
        rightPanelStopHeight: 120,
        openings: [{ start: 564, width: 36, bottom: 48, height: 84 }],
      }),
    /panel stop/,
  )
})
