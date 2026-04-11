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

// ---- Defs: crisp rendering + legend styles ----

function svgDefs() {
  return `<style>
    line, rect, polygon { shape-rendering: crispEdges; }
    text { shape-rendering: geometricPrecision; }
  </style>`
}

// ---- Legend block ----

function buildLegend(parts, x, y) {
  const sw = 14
  const gap = 6
  let cx = x

  parts.push(rect(cx, y, sw, sw, "panel-full"))
  cx += sw + gap
  parts.push(text(cx, y + 12, "Full Panel", "legend-text", "start"))
  cx += 68

  parts.push(rect(cx, y, sw, sw, "panel-cut"))
  cx += sw + gap
  parts.push(text(cx, y + 12, "Cut Panel", "legend-text", "start"))
  cx += 62

  parts.push(rect(cx, y, sw, sw, "opening-box"))
  cx += sw + gap
  parts.push(text(cx, y + 12, "Opening", "legend-text", "start"))
}

// ---- Direction indicator ----

function buildDirectionArrow(parts, wallX, wallRight, y) {
  const mid = (wallX + wallRight) / 2
  const arrowLen = Math.min((wallRight - wallX) * 0.3, 80)
  const aLeft  = mid - arrowLen / 2
  const aRight = mid + arrowLen / 2

  parts.push(line(aLeft, y, aRight, y, "direction-arrow"))
  // Arrowhead
  parts.push(`<polygon points="${f(aRight)},${f(y)} ${f(aRight - 6)},${f(y - 4)} ${f(aRight - 6)},${f(y + 4)}" class="direction-arrow-head"/>`)

  parts.push(text(aLeft - 4, y + 4, "START", "direction-text", "end"))
  parts.push(text(aRight + 4, y + 4, "END", "direction-text", "start"))
}

// ---- Public entry point ----

export function renderWall(model) {
  const svg = document.getElementById("wallSvg")
  if (!svg || !model.wallLength) return

  const width = svg.clientWidth || 900
  const parts = []

  if (model.wallType === "gable") {
    const height = 500
    parts.push(svgDefs())
    buildGable(parts, model, width, height)
    buildLegend(parts, 24, height - 24)
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`)
    svg.setAttribute("width", "100%")
    svg.setAttribute("height", height)
  } else {
    const height = 340
    parts.push(svgDefs())
    buildSidewall(parts, model, width, height)
    buildLegend(parts, 24, height - 24)
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`)
    svg.setAttribute("width", "100%")
    svg.setAttribute("height", height)
  }

  svg.innerHTML = parts.join("")
}

// ---- Sidewall ----

function buildSidewall(parts, model, width, height) {
  const padX = 24
  const topPad = 80
  const botPad = 80
  const drawWidth = width - padX * 2
  const drawHeight = height - topPad - botPad

  // Scale both axes proportionally so the wall height is accurate
  const eaveH = model.eaveHeight || model.wallHeight || 120
  const scaleX = drawWidth / model.wallLength
  const scaleY = drawHeight / eaveH
  const scale = Math.min(scaleX, scaleY)

  const wallX = padX
  const wallW = model.wallLength * scale
  const wallH = eaveH * scale
  const wallRight = wallX + wallW
  const baseY = height - botPad
  const wallY = baseY - wallH
  const markLineY = topPad - 26
  const totalLineY = baseY + 28

  // Direction indicator
  buildDirectionArrow(parts, wallX, wallRight, topPad - 56)

  // Wall outline
  parts.push(rect(wallX, wallY, wallW, wallH, "wall-outline"))

  // Panels
  model.panels.forEach((panel, i) => {
    const x = wallX + panel.start * scale
    const w = (panel.end - panel.start) * scale
    const cut = Math.abs(panel.width - model.panelCoverage) > 0.001

    parts.push(rect(x, wallY, w, wallH, cut ? "panel-cut" : "panel-full"))

    if (w >= 22) {
      parts.push(text(x + w / 2, wallY + wallH / 2, String(i + 1), "panel-label"))
      parts.push(
        text(
          x + w / 2,
          wallY + wallH / 2 + 14,
          formatToField(panel.width),
          "dimension-text panel-width"
        )
      )
    }
  })

  // Seams
  model.seams.forEach(pos => {
    const x = wallX + pos * scale
    parts.push(line(x, wallY, x, baseY, "panel-seam"))
  })

  // Ribs
  model.ribs.forEach(rib => {
    const x = wallX + rib.position * scale
    parts.push(line(x, wallY, x, baseY, "rib-line"))
  })

  // Openings (with actual bottom + height)
  if (Array.isArray(model.openings) && model.wallHeight > 0) {
    const openingScaleY = wallH / model.wallHeight

    model.openings.forEach(op => {
      const openingBottom = Number(op.bottom) || 0
      const openingHeight = Number(op.height) || 0
      const openingTop = openingBottom + openingHeight

      const x = wallX + op.start * scale
      const w = op.width * scale
      const h = openingHeight * openingScaleY
      const y = wallY + wallH - (openingTop * openingScaleY)

      if (w > 0 && h > 0) {
        parts.push(rect(x, y, w, h, "opening-box"))

        const label = `${formatToField(op.width)} × ${formatToField(openingHeight)}`
        parts.push(text(x + w / 2, y - 6, label, "dimension-text opening-label"))
      }
    })
  }

  // Top dimension line
  parts.push(line(wallX, markLineY, wallRight, markLineY, "dimension-line"))
  model.seams.forEach(pos => {
    const x = wallX + pos * scale
    parts.push(line(x, markLineY - 6, x, markLineY + 6, "tick"))
  })
  buildTopLabels(parts, model, wallX, wallRight, markLineY, scale)

  // Eave height label (left side)
  parts.push(line(wallX - 12, wallY, wallX - 12, baseY, "dimension-line"))
  parts.push(line(wallX - 18, wallY, wallX - 6, wallY, "tick"))
  parts.push(line(wallX - 18, baseY, wallX - 6, baseY, "tick"))
  parts.push(
    text(
      wallX - 16,
      wallY + wallH / 2 + 4,
      formatToField(eaveH),
      "dimension-text eave-label",
      "end"
    )
  )

  // Bottom total line
  parts.push(line(wallX, totalLineY, wallRight, totalLineY, "dimension-line"))
  parts.push(
    text(
      wallX + wallW / 2,
      totalLineY - 8,
      formatToField(model.wallLength),
      "dimension-text total-text"
    )
  )
}
// ---- Gable ----

function buildGable(parts, model, width, height) {
  const padX = 24
  const topPad = 90
  const botPad = 70
  const drawWidth = width - padX * 2
  const drawHeight = height - topPad - botPad

  const maxH = Math.max(
    model.leftEaveHeight || 0,
    model.ridgeHeight || 0,
    model.rightEaveHeight || 0
  )
  if (!maxH) return

  const scaleX = drawWidth / model.wallLength
  const scaleY = drawHeight / maxH
  const scale = Math.min(scaleX, scaleY)

  const wallX = padX
  const baseY = height - botPad
  const wallRight = wallX + model.wallLength * scale
  const leftEaveY = baseY - model.leftEaveHeight * scale
  const ridgeX = wallX + model.ridgePosition * scale
  const ridgeY = baseY - model.ridgeHeight * scale
  const rightEaveY = baseY - model.rightEaveHeight * scale
  const markLineY = topPad - 26

  buildDirectionArrow(parts, wallX, wallRight, topPad - 56)

  parts.push(line(wallX, markLineY, wallRight, markLineY, "dimension-line"))
  model.seams.forEach(pos => {
    const x = wallX + pos * scale
    parts.push(line(x, markLineY - 6, x, markLineY + 6, "tick"))
  })
  buildTopLabels(parts, model, wallX, wallRight, markLineY, scale)

  parts.push(line(wallX, baseY, wallRight, baseY, "dimension-line"))

  parts.push(line(wallX, baseY, wallX, leftEaveY, "gable-outline"))
  parts.push(line(wallX, leftEaveY, ridgeX, ridgeY, "gable-outline"))
  parts.push(line(ridgeX, ridgeY, wallRight, rightEaveY, "gable-outline"))
  parts.push(line(wallRight, rightEaveY, wallRight, baseY, "gable-outline"))

  model.gableCuts.forEach(panel => {
    const x = wallX + panel.start * scale
    const xr = wallX + panel.end * scale
    const lY = baseY - panel.leftHeight * scale
    const rY = baseY - panel.rightHeight * scale
    const cls = panel.ridgePanel ? "panel-cut" : "panel-full"

    parts.push(polygon([[x, baseY], [xr, baseY], [xr, rY], [x, lY]], cls))
  })

  model.seams.forEach(pos => {
    const x = wallX + pos * scale
    const ht = getGableHeightAtX(
      pos,
      model.wallLength,
      model.leftEaveHeight,
      model.ridgeHeight,
      model.ridgePosition,
      model.rightEaveHeight
    )
    const topY = baseY - ht * scale
    parts.push(line(x, baseY, x, topY, "panel-seam"))
  })

  model.gableCuts.forEach(panel => {
    const x = wallX + (panel.start + panel.width / 2) * scale
    const w = panel.width * scale

    if (w >= 22) {
      parts.push(text(x, baseY - 14, String(panel.panel), "panel-label"))
      parts.push(text(x, baseY - 2, formatToField(panel.width), "dimension-text panel-width"))
    }
  })

  model.ribs.forEach(rib => {
    const x = wallX + rib.position * scale
    const ht = getGableHeightAtX(
      rib.position,
      model.wallLength,
      model.leftEaveHeight,
      model.ridgeHeight,
      model.ridgePosition,
      model.rightEaveHeight
    )
    parts.push(line(x, baseY, x, baseY - ht * scale, "rib-line"))
  })

  if (Array.isArray(model.openings)) {
    model.openings.forEach(op => {
      const openingBottom = Number(op.bottom) || 0
      const openingHeight = Number(op.height) || 0

      const x = wallX + op.start * scale
      const w = op.width * scale

      const leftRoofHeight = getGableHeightAtX(
        op.start,
        model.wallLength,
        model.leftEaveHeight,
        model.ridgeHeight,
        model.ridgePosition,
        model.rightEaveHeight
      )

      const centerRoofHeight = getGableHeightAtX(
        op.start + op.width / 2,
        model.wallLength,
        model.leftEaveHeight,
        model.ridgeHeight,
        model.ridgePosition,
        model.rightEaveHeight
      )

      const rightRoofHeight = getGableHeightAtX(
        op.start + op.width,
        model.wallLength,
        model.leftEaveHeight,
        model.ridgeHeight,
        model.ridgePosition,
        model.rightEaveHeight
      )

      const allowableTop = Math.min(leftRoofHeight, centerRoofHeight, rightRoofHeight)
      const actualTop = Math.min(openingBottom + openingHeight, allowableTop)
      const actualHeight = Math.max(0, actualTop - openingBottom)

      if (w > 0 && actualHeight > 0) {
        const y = baseY - actualTop * scale
        const h = actualHeight * scale

        parts.push(rect(x, y, w, h, "opening-box"))

        const label = `${formatToField(op.width)} × ${formatToField(actualHeight)}`
        parts.push(text(x + w / 2, y - 6, label, "dimension-text opening-label"))
      }
    })
  }

  parts.push(line(ridgeX, ridgeY - 4, ridgeX, ridgeY - 24, "tick"))
  parts.push(
    text(
      ridgeX,
      ridgeY - 34,
      `RIDGE  ${formatToField(model.ridgeHeight)}`,
      "dimension-text ridge-label"
    )
  )

  parts.push(
    text(wallX - 4, leftEaveY, formatToField(model.leftEaveHeight), "dimension-text", "end")
  )
  parts.push(
    text(wallRight + 4, rightEaveY, formatToField(model.rightEaveHeight), "dimension-text", "start")
  )

  let lastLabelX = -Infinity
  model.gableCuts.forEach(panel => {
    const midX = wallX + (panel.start + panel.width / 2) * scale
    const highH = Math.max(panel.leftHeight, panel.rightHeight)
    const topY = baseY - highH * scale

    if (!panel.ridgePanel && midX - lastLabelX < 60) return

    const offset = panel.ridgePanel ? 30 : 16
    const label = `${formatToField(panel.leftHeight)} → ${formatToField(panel.rightHeight)}`
    parts.push(text(midX, topY - offset, label, "dimension-text"))
    lastLabelX = midX
  })

  parts.push(line(wallX, baseY + 28, wallRight, baseY + 28, "dimension-line"))
  parts.push(
    text(
      wallX + (wallRight - wallX) / 2,
      baseY + 18,
      formatToField(model.wallLength),
      "dimension-text total-text"
    )
  )
}
// ---- Shared: top label row (synced to actual seam positions) ----

function buildTopLabels(parts, model, wallX, wallRight, markLineY, scale) {
  // Use real positions: start, every seam, and end
  const positions = [0, ...model.seams, model.wallLength]

  const minSpacing = 54
  let lastX = -Infinity

  positions.forEach((pos, i) => {
    const x      = wallX + pos * scale
    const isEdge = i === 0 || i === positions.length - 1

    // Always label edges; skip interior labels that would collide
    if (!isEdge) {
      if (x - lastX < minSpacing) return
      if (wallRight - x < minSpacing) return
    }

    parts.push(text(x, markLineY - 10, formatToField(pos), "dimension-text"))
    lastX = x
  })
}
