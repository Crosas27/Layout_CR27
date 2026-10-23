import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateQuickLayout } from '../js/layout/quickLayout.js'

test('quick 50-foot wall uses 16 full panels and one 24-inch rip', () => {
  const result = calculateQuickLayout("50'", '36"')
  assert.equal(result.totalPanels, 17)
  assert.equal(result.fullPanels, 16)
  assert.equal(result.rippedPanels, 1)
  assert.equal(result.panels.at(-1).width, 24)
  assert.equal(result.panels.at(-1).start, 576)
  assert.equal(result.panels.at(-1).end, 600)
})

test('exact multiples, shorter-than-panel walls, and fractional custom coverage', () => {
  const exact = calculateQuickLayout("60'", '24"')
  assert.equal(exact.totalPanels, 30)
  assert.equal(exact.rippedPanels, 0)
  const single = calculateQuickLayout('18"', '36"')
  assert.equal(single.totalPanels, 1)
  assert.equal(single.rippedPanels, 1) // One panel, not two end rips.
  const fractional = calculateQuickLayout('10\' 1/8"', '30 1/2"')
  assert.equal(fractional.totalPanels, 4)
  assert.equal(fractional.panels.at(-1).width, 28.625)
  const over = calculateQuickLayout('6\' 1/8"', '36"')
  assert.equal(over.totalPanels, 3)
  assert.equal(over.panels.at(-1).width, 0.125)
})

test('offsets shift the same seam grid as saved walls and can add a panel', () => {
  const result = calculateQuickLayout("6'", '36"', '6"')
  assert.equal(result.totalPanels, 3)
  assert.equal(result.fullPanels, 1)
  assert.equal(result.rippedPanels, 2)
  assert.deepEqual(
    result.panels.map((p) => p.width),
    [30, 36, 6],
  )
  assert.deepEqual(
    result.panels.map((p) => [p.start, p.end]),
    [
      [0, 30],
      [30, 66],
      [66, 72],
    ],
  )
  assert.equal(result.panels[0].leftTrim, 6)
  assert.equal(calculateQuickLayout("6'", '36"', '').totalPanels, 2)
})

test('quick layout rejects invalid, zero, negative and excessively large input before calculating', () => {
  for (const value of ['', 'nope', '0', '-1', '1/0', Infinity]) {
    assert.throws(() => calculateQuickLayout(value, '36"'), /wall length/)
    assert.throws(() => calculateQuickLayout("50'", value), /coverage/)
  }
  for (const offset of ['nope', '-1', '36', '72', Infinity])
    assert.throws(() => calculateQuickLayout("50'", '36', offset), /offset/)
  assert.throws(() => calculateQuickLayout("5001'", '12'), /5,000/)
  assert.throws(() => calculateQuickLayout("5000'", '12', '1'), /5,000/)
  assert.throws(() => calculateQuickLayout(1e100, 1e100), /too large/)
})
