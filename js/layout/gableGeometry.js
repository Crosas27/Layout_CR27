import { EPS, clampNum } from './layoutMath.js'
export function getGableHeightAtX(
  x,
  wallLength,
  leftEaveHeight,
  ridgeHeight,
  ridgePosition,
  rightEaveHeight,
) {
  if (wallLength <= 0) return 0

  const clampedX = clampNum(x, 0, wallLength)
  const clampedRidge = clampNum(ridgePosition, 0, wallLength)

  if (clampedX <= clampedRidge) {
    if (clampedRidge <= EPS) return ridgeHeight
    return leftEaveHeight + (ridgeHeight - leftEaveHeight) * (clampedX / clampedRidge)
  }

  const rightRun = wallLength - clampedRidge
  if (rightRun <= EPS) return ridgeHeight

  return ridgeHeight - (ridgeHeight - rightEaveHeight) * ((clampedX - clampedRidge) / rightRun)
}
