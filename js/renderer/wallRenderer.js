import { formatToField } from "../utils/formatter.js"
import { getGableHeightAtX } from "../core/layoutEngine.js"

// ---- SVG element builders (template literal approach) ----

const f = n => Math.round(n * 100) / 100

function rect(x, y, w, h, cls) {
  return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" class="${cls}"/>`
}

function line(x1, y1, x2, y2, cls) {
  return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" class="${cls}"/>`
}

function text(x, y, content, cls, anchor = "middle") {
  const safe = String(content).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  return `<text x="${f(x)}" y="${f(y)}" text-anchor="${anchor}" class="${cls}">${safe}</text>`
}

function polygon(points, cls) {
  const pts = points.map(([x, y]) => `${f(x)},${f(y)}`).join(" ")
  return `<polygon points="${pts}" class="${cls}"/>`
}

// ---- Public entry point ----

export function renderWall(model) {
  const svg = document.getElementById("wallSvg")
  if (!svg || !model.wallLength) return

  const width  = svg.clientWidth || 900
  const parts  = []
  const height = model.wallType === "gable" ? 460 : 300

  if (model.wallType === "gable") {
    buildGable(parts, model, width, height)
  } else {
    buildSidewall(parts, model, width, height)
  }

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`)
  svg.setAttribute("width", "100%")
  svg.setAttribute("height", height)
  svg.innerHTML = parts.join("")
}

// ---- Sidewall ----

function buildSidewall(parts, model, width, height) {
  const padX      = 24
  const drawWidth = width - padX * 2
  const scale     = drawWidth / model.wallLength
  const wallX     = padX
  const wallY     = 100
  const wallH     = 62
  const wallW     = model.wallLength * scale
  const wallRight = wallX + wallW
  const markLineY = 54
  const totalLineY = wallY + wallH + 42

  // Wall outline
  parts.push(rect(wallX, wallY, wallW, wallH, "wall-outline"))

  // Panels
  model.panels.forEach((panel, i) => {
    const x  = wallX + panel.start * scale
    const w  = (panel.end - panel.start) * scale
    const cut = Math.abs(panel.width - model.panelCoverage) > 0.001
    parts.push(rect(x, wallY, w, wallH, cut ? "panel-cut" : "panel-full"))
    if (w >= 22) {
      parts.push(text(x + w / 2, wallY + wallH / 2 + 4, String(i + 1), "panel-label"))
    }
  })

  // Seams
  model.seams.forEach(pos => {
    const x = wallX + pos * scale
    parts.push(line(x, wallY, x, wallY + wallH, "panel-seam"))
  })

  // Ribs
  model.ribs.forEach(rib => {
    const x = wallX + rib.position * scale
    parts.push(line(x, wallY, x, wallY + wallH, "rib-line"))
  })

  // Openings
  if (Array.isArray(model.openings)) {
    model.openings.forEach(op => {
      const x = wallX + op.start * scale
      const w = op.width * scale
      parts.push(rect(x, wallY, w, wallH, "opening-box"))
    })
  }

  // Top dimension line
  parts.push(line(wallX, markLineY, wallRight, markLineY, "dimension-line"))
  model.seams.forEach(pos => {
    const x = wallX + pos * scale
    parts.push(line(x, markLineY - 6, x, markLineY + 6, "tick"))
  })
  buildTopLabels(parts, model, wallX, wallRight, markLineY, scale)

  // Bottom total line
  parts.push(line(wallX, totalLineY, wallRight, totalLineY, "dimension-line"))
  parts.push(text(wallX + wallW / 2, totalLineY - 8, formatToField(model.wallLength), "dimension-text total-text"))
}

// ---- Gable ----

function buildGable(parts, model, width, height) {
  const padX     = 24
  const topPad   = 70
  const botPad   = 60
  const drawWidth  = width - padX * 2
  const drawHeight = height - topPad - botPad

  const maxH = Math.max(
    model.leftEaveHeight  || 0,
    model.ridgeHeight     || 0,
    model.rightEaveHeight || 0
  )
  if (!maxH) return

  const scaleX   = drawWidth / model.wallLength
  const scaleY   = drawHeight / maxH
  const scale    = Math.min(scaleX, scaleY)

  const wallX      = padX
  const baseY      = height - botPad
  const wallRight  = wallX + model.wallLength * scale
  const leftEaveY  = baseY - model.leftEaveHeight  * scale
  const ridgeX     = wallX + model.ridgePosition   * scale
  const ridgeY     = baseY - model.ridgeHeight      * scale
  const rightEaveY = baseY - model.rightEaveHeight  * scale
  const markLineY  = 54

  // Top dimension line
  parts.push(line(wallX, markLineY, wallRight, markLineY, "dimension-line"))
  model.seams.forEach(pos => {
    const x = wallX + pos * scale
    parts.push(line(x, markLineY - 6, x, markLineY + 6, "tick"))
  })
  buildTopLabels(parts, model, wallX, wallRight, markLineY, scale)

  // Ground line
  parts.push(line(wallX, baseY, wallRight, baseY, "dimension-line"))

  // Gable outline
  parts.push(line(wallX,     baseY,    wallX,     leftEaveY, "panel-seam"))
  parts.push(line(wallX,     leftEaveY, ridgeX,   ridgeY,    "panel-seam"))
  parts.push(line(ridgeX,    ridgeY,    wallRight, rightEaveY, "panel-seam"))
  parts.push(line(wallRight, rightEaveY, wallRight, baseY,    "panel-seam"))

  // Panels (accurate trapezoid polygons)
  model.gableCuts.forEach(panel => {
    const x  = wallX + panel.start * scale
    const xr = wallX + panel.end   * scale
    const lY = baseY - panel.leftHeight  * scale
    const rY = baseY - panel.rightHeight * scale
    const cls = panel.ridgePanel ? "panel-cut" : "panel-full"
    parts.push(polygon([[x, baseY], [xr, baseY], [xr, rY], [x, lY]], cls))
  })

  // Seams (vertical lines at each seam position up to gable height)
  model.seams.forEach(pos => {
    const x  = wallX + pos * scale
    const ht = getGableHeightAtX(pos, model.wallLength, model.leftEaveHeight, model.ridgeHeight, model.ridgePosition, model.rightEaveHeight)
    const topY = baseY - ht * scale
    parts.push(line(x, baseY, x, topY, "panel-seam"))
  })

  // Panel numbers
  model.gableCuts.forEach(panel => {
    const x = wallX + (panel.start + panel.width / 2) * scale
    const w = panel.width * scale
    if (w >= 22) {
      parts.push(text(x, baseY - 14, String(panel.panel), "panel-label"))
    }
  })

  // Ribs (clipped to gable outline)
  model.ribs.forEach(rib => {
    const x  = wallX + rib.position * scale
    const ht = getGableHeightAtX(rib.position, model.wallLength, model.leftEaveHeight, model.ridgeHeight, model.ridgePosition, model.rightEaveHeight)
    parts.push(line(x, baseY, x, baseY - ht * scale, "rib-line"))
  })

  // Openings
  if (Array.isArray(model.openings)) {
    model.openings.forEach(op => {
      const x  = wallX + op.start  * scale
      const w  = op.width * scale
      const ht = getGableHeightAtX(op.start + op.width / 2, model.wallLength, model.leftEaveHeight, model.ridgeHeight, model.ridgePosition, model.rightEaveHeight)
      const oh = Math.min(ht * scale, baseY - ridgeY)
      parts.push(rect(x, baseY - oh, w, oh, "opening-box"))
    })
  }

  // Ridge callout
  parts.push(line(ridgeX, ridgeY - 4, ridgeX, ridgeY - 24, "tick"))
  parts.push(text(ridgeX, ridgeY - 34, `RIDGE  ${formatToField(model.ridgeHeight)}`, "dimension-text ridge-label"))

  // Eave height labels
  parts.push(text(wallX - 4, leftEaveY,  formatToField(model.leftEaveHeight),  "dimension-text", "end"))
  parts.push(text(wallRight + 4, rightEaveY, formatToField(model.rightEaveHeight), "dimension-text", "start"))

  // Panel height labels (every other panel to avoid clutter)
  model.gableCuts.forEach((panel, i) => {
    if (!panel.ridgePanel && i % 2 !== 0) return
    const midX  = wallX + (panel.start + panel.width / 2) * scale
    const highH = Math.max(panel.leftHeight, panel.rightHeight)
    const topY  = baseY - highH * scale
    const offset = panel.ridgePanel ? 30 : 16
    const label = `${formatToField(panel.leftHeight)} → ${formatToField(panel.rightHeight)}`
    parts.push(text(midX, topY - offset, label, "dimension-text"))
  })

  // Total width line at bottom
  parts.push(line(wallX, baseY + 28, wallRight, baseY + 28, "dimension-line"))
  parts.push(text(wallX + (wallRight - wallX) / 2, baseY + 18, formatToField(model.wallLength), "dimension-text total-text"))
}

// ---- Shared: top label row ----

function buildTopLabels(parts, model, wallX, wallRight, markLineY, scale) {
  const labeled = []
  for (let pos = 0; pos <= model.wallLength; pos += model.panelCoverage) {
    labeled.push(pos)
  }
  if (labeled[labeled.length - 1] !== model.wallLength) {
    labeled.push(model.wallLength)
  }

  const minSpacing = 54
  let lastX = -Infinity

  labeled.forEach(pos => {
    const x       = wallX + pos * scale
    const isStart = pos === 0
    const isEnd   = pos === model.wallLength

    if (!isStart && !isEnd) {
      if (x - lastX < minSpacing) return
      if (wallRight - x < minSpacing) return
    }

    parts.push(text(x, markLineY - 10, `${Math.round(pos)}"`, "dimension-text"))
    lastX = x
  })
}
