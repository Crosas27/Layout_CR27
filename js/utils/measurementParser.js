export function parseMeasurement(input) {
  if (input === null || input === undefined) return 0

  const raw = String(input).trim()
  if (!raw) return 0

  const text = raw
    .replace(/[′’]/g, "'")
    .replace(/[″”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()

  // Plain decimal inches
  if (/^-?\d+(\.\d+)?$/.test(text)) {
    return Number(text) || 0
  }

  // Feet-inches-fraction
  // Accept:
  // 10-6-1/2
  // 10'6"1/2
  // 10' 6" 1/2
  // 10' 6 1/2"
  let match = text.match(/^(-?\d+)\s*(?:'|-)\s*(\d+)?\s*(?:"|-)?\s*(\d+\/\d+)?\s*"?$/)
  if (match) {
    const feet = Number(match[1]) || 0
    const inches = Number(match[2]) || 0
    const fraction = parseFraction(match[3])
    return feet * 12 + inches + fraction
  }

  // Inches + fraction
  // Accept:
  // 6 1/4
  // 6-1/4
  // 6"1/4
  // 6" 1/4
  match = text.match(/^(-?\d+)\s*(?:"|-|\s)\s*(\d+\/\d+)\s*"?$/)
  if (match) {
    const inches = Number(match[1]) || 0
    const fraction = parseFraction(match[2])
    return inches + fraction
  }

  // Fraction only
  if (/^-?\d+\/\d+$/.test(text)) {
    return parseFraction(text)
  }

  // Feet only
  match = text.match(/^(-?\d+)\s*'$/)
  if (match) {
    return (Number(match[1]) || 0) * 12
  }

  // Inches only
  match = text.match(/^(-?\d+)\s*"$/)
  if (match) {
    return Number(match[1]) || 0
  }

  return 0
}

function parseFraction(value) {
  if (!value) return 0
  const parts = value.split("/")
  if (parts.length !== 2) return 0

  const num = Number(parts[0]) || 0
  const den = Number(parts[1]) || 1

  if (den === 0) return 0
  return num / den
}