import { singleSlopeGeometry } from '../layout/singleSlopeGeometry.js'
import { parseMeasurement } from '../utils/measurementParser.js'
/* NEW WALL DEFAULTS */
export const createWall = (name = 'New wall') => ({
  id: crypto.randomUUID(),
  name,
  wallType: 'sidewall',
  wallLength: '',
  wallHeight: '',
  panelStopHeight: '',
  startOffset: '0"',
  leftEaveHeight: '',
  rightEaveHeight: '',
  ridgeHeight: '',
  ridgePosition: '',
  leftPanelStopHeight: '',
  rightPanelStopHeight: '',
  ridgePanelStopHeight: '',
  notes: '',
  openings: [],
})
/* WALL FIELDS → ENGINE CONFIG — only blank optional values get defaults. */
export function wallConfig(wall, profile) {
  const measure = (v, fallback) =>
    v == null || String(v).trim() === '' ? fallback : parseMeasurement(v)
  const c = {
    ...wall,
    wallLength: parseMeasurement(wall.wallLength),
    panelCoverage: parseMeasurement(profile.panelCoverage),
    ribSpacing: parseMeasurement(profile.ribSpacing),
    startOffset: measure(wall.startOffset, 0),
    wallHeight: parseMeasurement(wall.wallHeight),
  }
  c.panelStopHeight = measure(wall.panelStopHeight, c.wallHeight)
  for (const k of ['leftEaveHeight', 'rightEaveHeight', 'ridgeHeight'])
    c[k] = parseMeasurement(wall[k])
  c.ridgePosition = measure(wall.ridgePosition, c.wallLength / 2)
  for (const [k, top] of [
    ['leftPanelStopHeight', 'leftEaveHeight'],
    ['rightPanelStopHeight', 'rightEaveHeight'],
    ['ridgePanelStopHeight', 'ridgeHeight'],
  ])
    c[k] = measure(wall[k], c[top])
  return singleSlopeGeometry(c)
}
