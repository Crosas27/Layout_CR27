/* SINGLE SLOPE — one straight roofline from left height to right height.
   Reuse the linear gable geometry with its join at the left boundary.
   Hidden ridge fields never affect a single-slope wall. */
export function singleSlopeGeometry(config) {
  if (config.wallType !== 'singleSlope') return config
  return {
    ...config,
    ridgePosition: 0,
    ridgeHeight: config.leftEaveHeight,
    ridgePanelStopHeight: config.leftPanelStopHeight ?? config.leftEaveHeight,
  }
}
