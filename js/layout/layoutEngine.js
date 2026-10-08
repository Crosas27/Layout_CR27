import { singleSlopeGeometry } from './singleSlopeGeometry.js'
import { generateSidewallLayout } from './sidewallLayout.js'
import { generateGableLayout } from './gableLayout.js'
import { validateWallConfig } from '../walls/wallValidation.js'
import { validateOpening } from '../openings/openingValidation.js'
export { getGableHeightAtX } from './gableGeometry.js'

/* GENERATE LAYOUT — reject geometry that would produce misleading cuts. */
export function generateLayout(input) {
  let config = { panelCoverage: 36, ribSpacing: 12, startOffset: 0, openings: [], ...input }
  config.panelStopHeight ??= config.wallHeight
  config.leftPanelStopHeight ??= config.leftEaveHeight
  config.rightPanelStopHeight ??= config.rightEaveHeight
  config.ridgePanelStopHeight ??= config.ridgeHeight
  config.ridgePosition ??= config.wallLength / 2
  config = singleSlopeGeometry(config)
  const errors = validateWallConfig(config)
  for (const [i, opening] of (config.openings || []).entries()) {
    errors.push(...validateOpening(opening, config).map((e) => `Opening ${i + 1}: ${e}`))
  }
  if (errors.length) throw new Error(errors.join(' '))
  return config.wallType === 'gable' || config.wallType === 'singleSlope'
    ? generateGableLayout(config)
    : generateSidewallLayout(config)
}
