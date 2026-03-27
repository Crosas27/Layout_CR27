export function parseMeasurement(input) {
  if (input === null || input === undefined) return 0

  const raw = String(input).trim()

  if (!raw) return 0

  // Normalize curly quotes and whitespace
  const text = raw
    .replace(/[′’]/g, "'")
    .replace(/[″”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()

  // If it's just a plain number, treat it as inches
  if (/^-?\d+(\.\d+)?$/.test(text)) {
    return Number(text) || 0
  }

  let feet = 0
  let inches = 0

  // Parse feet portion if present
  const feetMatch = text.match(/(-?\d+(?:\.\d+)?)\s*'/)
  if (feetMatch) {
    feet = Number(feetMatch[1]) || 0
  }

  // Everything after feet marker is treated as inch text
  let inchText = text
  if (feetMatch) {
    const feetIndex = text.indexOf("'")
    inchText = text.slice(feetIndex + 1).replace(/"/g, "").trim()
  } else {
    inchText = text.replace(/"/g, "").trim()
  }

  if (inchText) {
    inches = parseInchPortion(inchText)
  }

  return feet * 12 + inches
}

function parseInchPortion(text) {
  const cleaned = text.trim()
  if (!cleaned) return 0

  // Decimal inches
  if (/^-?\d+(\.\d+)?$/.test(cleaned)) {
    return Number(cleaned) || 0
  }

  // Whole + fraction, e.g. 4 1/2
  const wholeFractionMatch = cleaned.match(/^(-?\d+)\s+(\d+)\/(\d+)$/)
  if (wholeFractionMatch) {
    const whole = Number(wholeFractionMatch[1]) || 0
    const num = Number(wholeFractionMatch[2]) || 0
    const den = Number(wholeFractionMatch[3]) || 1
    return whole + num / den
  }

  // Fraction only, e.g. 1/2
  const fractionMatch = cleaned.match(/^(-?\d+)\/(\d+)$/)
  if (fractionMatch) {
    const num = Number(fractionMatch[1]) || 0
    const den = Number(fractionMatch[2]) || 1
    return num / den
  }

  // Mixed tokens like "4 1/2" without perfect formatting fallback
  const parts = cleaned.split(" ")
  if (parts.length === 2 && parts[1].includes("/")) {
    const whole = Number(parts[0]) || 0
    const fraction = parseInchPortion(parts[1])
    return whole + fraction
  }

  // Last resort
  return Number(cleaned) || 0
}