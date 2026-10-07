export function validateWallConfig(c) {
  if (!c || typeof c !== 'object') return ['Wall geometry is required.']
  const errors = []
  for (const key of ['wallLength', 'panelCoverage', 'ribSpacing']) {
    if (!Number.isFinite(c[key]) || c[key] <= 0) errors.push(`${key} must be greater than zero.`)
  }
  if (c.wallLength / c.panelCoverage > 5000 || c.panelCoverage / c.ribSpacing > 100)
    errors.push('Layout is too large to display safely.')
  if (c.ribSpacing > c.panelCoverage) errors.push('Rib spacing cannot exceed panel coverage.')
  if (!Number.isFinite(c.startOffset)) errors.push('Start offset must be a valid measurement.')
  if (c.wallType === 'gable') {
    for (const k of ['leftEaveHeight', 'ridgeHeight', 'rightEaveHeight']) {
      if (!Number.isFinite(c[k]) || c[k] <= 0) errors.push(`${k} must be greater than zero.`)
    }
    if (!Number.isFinite(c.ridgePosition) || c.ridgePosition < 0 || c.ridgePosition > c.wallLength)
      errors.push('Ridge position must lie within the wall.')
    for (const [stop, top] of [
      ['leftPanelStopHeight', 'leftEaveHeight'],
      ['ridgePanelStopHeight', 'ridgeHeight'],
      ['rightPanelStopHeight', 'rightEaveHeight'],
    ]) {
      if (!Number.isFinite(c[stop]) || c[stop] <= 0 || c[stop] > c[top])
        errors.push(`${stop} must lie between the floor and roofline.`)
    }
  } else {
    if (!Number.isFinite(c.wallHeight) || c.wallHeight <= 0)
      errors.push('Wall height must be greater than zero.')
    if (
      !Number.isFinite(c.panelStopHeight) ||
      c.panelStopHeight <= 0 ||
      c.panelStopHeight > c.wallHeight
    )
      errors.push('Panel stop height must lie between the floor and wall top.')
  }
  return errors
}
