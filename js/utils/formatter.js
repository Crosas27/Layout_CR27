/* DISPLAY / EDIT MEASUREMENTS — all surfaces use the same eighth-inch rounding. */
const fractions = ['', '1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8']
export function formatInches(value) {
  if (!Number.isFinite(value)) return '—'
  const ticks = Math.round(Math.abs(value) * 8)
  const whole = Math.floor(ticks / 8),
    frac = fractions[ticks % 8]
  return `${value < 0 ? '-' : ''}${whole || !frac ? whole : ''}${whole && frac ? ' ' : ''}${frac}"`
}
export function formatToField(value) {
  if (!Number.isFinite(value)) return '—'
  const rounded = Math.round(Math.abs(value) * 8) / 8
  const feet = Math.floor(rounded / 12),
    remainder = rounded % 12
  const sign = value < 0 ? '-' : ''
  return feet
    ? `${sign}${feet}'${remainder ? ' ' + formatInches(remainder) : ''}`
    : sign + formatInches(remainder)
}
