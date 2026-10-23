import { calculatePanels } from './panelLayout.js'
import { buildSummary } from './layoutSummary.js'
import { EPS } from './layoutMath.js'
import { parseMeasurement } from '../utils/measurementParser.js'

/* QUICK LAYOUT — width-only scratch calculation, independent of project state. */
export function calculateQuickLayout(length, coverage, offset = '') {
  const wallLength = parseMeasurement(length)
  const panelCoverage = parseMeasurement(coverage)
  const startOffset = String(offset).trim() === '' ? 0 : parseMeasurement(offset)
  if (!Number.isFinite(wallLength) || wallLength <= EPS)
    throw new Error('Enter a wall length greater than zero.')
  if (!Number.isFinite(panelCoverage) || panelCoverage <= EPS)
    throw new Error('Enter a panel coverage greater than zero.')
  if (!Number.isFinite(startOffset) || startOffset < 0 || startOffset >= panelCoverage)
    throw new Error('Start offset must be zero or positive and less than the panel coverage.')
  if ([wallLength, panelCoverage, startOffset].some((n) => n > Number.MAX_SAFE_INTEGER / 8))
    throw new Error('Measurements are too large to calculate accurately.')
  // Bound work before entering the shared panel loop, including extreme pasted inputs.
  if (Math.ceil((wallLength + startOffset) / panelCoverage) > 5000)
    throw new Error('This layout exceeds 5,000 panels. Check the wall length and coverage.')
  const panels = calculatePanels(wallLength, panelCoverage, startOffset)
  const summary = buildSummary(wallLength, panelCoverage, panels)
  return {
    ...summary,
    startOffset,
    panels,
    rippedPanels: panels.length - summary.fullPanels,
  }
}
