/* PARSE FEET / INCHES — NaN means invalid; zero remains a real measurement. */
export function parseMeasurement(input) {
  if (typeof input === 'number') return Number.isFinite(input) ? input : NaN
  if (input == null) return NaN
  let text = String(input).trim().replace(/[′’]/g, "'").replace(/[″”]/g, '"').replace(/\s+/g, ' ')
  if (!text) return NaN
  // Read old CR27 field strings such as 3' (36") without accepting junk.
  const old = text.match(/^(.*?)\s*\(([^()]*)\)$/)
  if (old) {
    const a = parseMeasurement(old[1]),
      b = parseMeasurement(old[2])
    return Number.isFinite(a) && Math.abs(a - b) < 0.001 ? a : NaN
  }
  const sign = text.startsWith('-') ? -1 : 1
  if (sign < 0) text = text.slice(1)
  if (/^\d+(?:\.\d+)?"?$/.test(text)) return sign * Number(text.replace('"', ''))
  const feet = text.match(/^(\d+(?:\.\d+)?)'\s*(.*)$/)
  if (feet) {
    const rest = feet[2] ? inches(feet[2]) : 0
    return sign * (Number(feet[1]) * 12 + rest)
  }
  // Jobsite notation: 10-6 or 10-6-1/2.
  const dashed = text.match(/^(\d+)-(\d+)(?:-(\d+\/\d+))?$/)
  if (dashed) return sign * (Number(dashed[1]) * 12 + Number(dashed[2]) + fraction(dashed[3]))
  return sign * inches(text)
}
function fraction(v) {
  if (!v) return 0
  const [n, d] = v.split('/').map(Number)
  return d > 0 ? n / d : NaN
}
function inches(t) {
  if (/^\d+(?:\.\d+)?"?$/.test(t)) return Number(t.replace('"', ''))
  const mixed = t.match(/^(\d+)\s*(?:"\s*|\s+|-)(\d+\/\d+)"?$/)
  if (mixed) return Number(mixed[1]) + fraction(mixed[2])
  const f = t.match(/^(\d+\/\d+)"?$/)
  return f ? fraction(f[1]) : NaN
}
