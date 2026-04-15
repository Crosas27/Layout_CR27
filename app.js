import { generateLayout }      from "./js/core/layoutEngine.js"
import { renderWall }          from "./js/renderer/wallRenderer.js"
import { renderOpeningReport } from "./js/renderer/openingReportRenderer.js"
import { renderSummary }       from "./js/renderer/summaryRenderer.js"
import { parseMeasurement }    from "./js/utils/measurementParser.js"
import { formatToField }       from "./js/utils/formatter.js"
import { buildTextSummary }    from "./js/utils/textExport.js"

/* ================================================================
   STATE — single source of truth
   All mutations go through direct assignment + persistState().
   Layout auto-renders 300ms after any change (debounced).
================================================================ */

const STORAGE_KEY = "layout_cr27_v2"

const DEFAULT_STATE = {
  wallType:             "sidewall",
  wallLength:           "",
  wallHeight:           "",
  panelStopHeight:      "",
  panelCoverage:        '36"',
  ribSpacing:           '12"',
  startOffset:          '0"',
  leftEaveHeight:       "",
  leftPanelStopHeight:  "",
  ridgeHeight:          "",
  ridgePanelStopHeight: "",
  ridgePosition:        "",
  rightEaveHeight:      "",
  rightPanelStopHeight: "",
  openings:             []
}

let state       = { ...DEFAULT_STATE }
let lastModel   = null
let renderTimer = null

const CONFIG_INPUT_IDS = [
  "wallLength", "wallHeight", "panelStopHeight", "panelCoverage",
  "ribSpacing", "startOffset",
  "leftEaveHeight", "leftPanelStopHeight",
  "ridgeHeight", "ridgePanelStopHeight",
  "ridgePosition", "rightEaveHeight", "rightPanelStopHeight"
]

function getActiveWall() {
  let wall = project.walls.find(w => w.id === project.activeWallId)

  if (!wall && project.walls.length) {
    wall = project.walls[0]
    project.activeWallId = wall.id
  }

  return wall || null
}

function updateActiveWallField(field, value) {
  const wall = getActiveWall()
  if (!wall) return
  wall[field] = value
}

function updateProjectField(field, value) {
  project[field] = value
}

function addWall() {
  const nextIndex = project.walls.length + 1
  const wall = {
    ...DEFAULT_WALL(),
    id: Date.now(),
    name: `Wall ${nextIndex}`
  }

  project.walls.push(wall)
  project.activeWallId = wall.id

  persistState()
  populateInputs()
  scheduleRender(true)
}

function duplicateWall(id = project.activeWallId) {
  const source = project.walls.find(w => w.id === id)
  if (!source) return

  const clone = {
    ...structuredClone(source),
    id: Date.now(),
    name: `${source.name} Copy`
  }

  project.walls.push(clone)
  project.activeWallId = clone.id

  persistState()
  populateInputs()
  scheduleRender(true)
}

function deleteWall(id = project.activeWallId) {
  if (project.walls.length <= 1) return

  const idx = project.walls.findIndex(w => w.id === id)
  if (idx < 0) return

  project.walls.splice(idx, 1)

  const nextWall = project.walls[Math.max(0, idx - 1)] || project.walls[0]
  project.activeWallId = nextWall.id

  persistState()
  populateInputs()
  scheduleRender(true)
}

/* ================================================================
   PERSISTENCE — localStorage + URL hash
================================================================ */

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (_) {}
  updateHash()
}

function updateHash() {
  // Only encode config fields — openings can be too long for a URL
  const { openings, ...config } = state
  try {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(config))))
    history.replaceState(null, "", "#" + encoded)
  } catch (_) {}
}

function loadState() {
  // URL hash first (shared links)
  if (location.hash.length > 1) {
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(1)))))
      if (decoded && typeof decoded === "object") {
        state = { ...DEFAULT_STATE, ...decoded, openings: [] }
        populateInputs()
        return
      }
    } catch (_) {}
  }

  // Fall back to localStorage
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (saved && typeof saved === "object") {
      state = { ...DEFAULT_STATE, ...saved }
      populateInputs()
    }
  } catch (_) {}
}

function populateInputs() {
  const wallTypeEl = document.getElementById("wallType")
  if (wallTypeEl) wallTypeEl.value = state.wallType

  CONFIG_INPUT_IDS.forEach(id => {
    const el = document.getElementById(id)
    if (el && state[id] !== undefined) el.value = state[id]
  })

  syncModeUI()
  renderOpeningsList()
}

/* ================================================================
   INPUT BINDING — auto-sync on every keystroke
================================================================ */

function bindInputs() {
  const wallTypeEl = document.getElementById("wallType")
  if (wallTypeEl) {
    wallTypeEl.addEventListener("change", () => {
      state.wallType = wallTypeEl.value
      syncModeUI()
      persistState()
      scheduleRender()
    })
  }

  CONFIG_INPUT_IDS.forEach(id => {
    const el = document.getElementById(id)
    if (!el) return
    el.addEventListener("input", () => {
      state[id] = el.value
      persistState()
      scheduleRender()
    })
  })
}

/* ================================================================
   RENDER SCHEDULING — 300ms debounce, or immediate
================================================================ */

function scheduleRender(immediate = false) {
  clearTimeout(renderTimer)
  if (immediate) {
    updateLayout()
  } else {
    renderTimer = setTimeout(updateLayout, 300)
  }
}

/* ================================================================
   LAYOUT UPDATE
================================================================ */

function updateLayout() {
  clearError()

  const wallLength = parseMeasurement(state.wallLength)
  if (!wallLength || wallLength <= 0) {
    clearOutputs()
    return
  }

  const config = {
    wallType:        state.wallType,
    wallLength,
    wallHeight:      parseMeasurement(state.wallHeight),
    panelStopHeight: parseMeasurement(state.panelStopHeight),
    panelCoverage:   parseMeasurement(state.panelCoverage) || 36,
    ribSpacing:      parseMeasurement(state.ribSpacing)    || 12,
    startOffset:     parseMeasurement(state.startOffset)   || 0,
    openings:        state.openings
  }

  if (state.wallType === "gable") {
    Object.assign(config, {
      leftEaveHeight:       parseMeasurement(state.leftEaveHeight),
      leftPanelStopHeight:  parseMeasurement(state.leftPanelStopHeight),
      ridgeHeight:          parseMeasurement(state.ridgeHeight),
      ridgePanelStopHeight: parseMeasurement(state.ridgePanelStopHeight),
      ridgePosition:        parseMeasurement(state.ridgePosition),
      rightEaveHeight:      parseMeasurement(state.rightEaveHeight),
      rightPanelStopHeight: parseMeasurement(state.rightPanelStopHeight)
    })
  }

  lastModel = generateLayout(config)

  renderWall(lastModel)
  renderOpeningReport(lastModel)
  renderSummary(lastModel)
}

function clearOutputs() {
  const svg     = document.getElementById("wallSvg")
  const summary = document.getElementById("panelSummary")
  const report  = document.getElementById("openingReport")
  if (svg)     svg.innerHTML     = ""
  if (summary) summary.innerHTML = ""
  if (report)  report.innerHTML  = ""
}

/* ================================================================
   ERROR DISPLAY
================================================================ */

function showError(msg) {
  const box = document.getElementById("errorBox")
  if (!box) return
  box.textContent = msg
  box.classList.remove("hidden")
}

function clearError() {
  const box = document.getElementById("errorBox")
  if (box) box.classList.add("hidden")
}

/* ================================================================
   OPENINGS MANAGEMENT
================================================================ */

function addOpening() {
  const startEl = document.getElementById("openingStart")
  const widthEl = document.getElementById("openingWidth")
  const bottomEl = document.getElementById("openingBottom")
  const heightEl = document.getElementById("openingHeight")

  if (!startEl || !widthEl || !bottomEl || !heightEl) return

  const start = parseMeasurement(startEl.value)
  const width = parseMeasurement(widthEl.value)
  const bottom = parseMeasurement(bottomEl.value)
  const height = parseMeasurement(heightEl.value)

  if (!Number.isFinite(start) || start < 0) {
    showError("Opening start is required and cannot be negative.")
    return
  }

  if (!Number.isFinite(width) || width <= 0) {
    showError("Opening width is required.")
    return
  }

  if (!Number.isFinite(bottom) || bottom < 0) {
    showError("Opening bottom height is required and cannot be negative.")
    return
  }

  if (!Number.isFinite(height) || height <= 0) {
    showError("Opening height is required.")
    return
  }

  const wallLength = parseMeasurement(state.wallLength)
  if (Number.isFinite(wallLength) && start + width > wallLength) {
    showError(
      `Opening end (${formatToField(start + width)}) exceeds wall width (${formatToField(wallLength)}).`
    )
    return
  }

  if (state.wallType === "sidewall") {
    const wallHeight = parseMeasurement(state.wallHeight)
    if (Number.isFinite(wallHeight) && bottom + height > wallHeight) {
      showError(
        `Opening top (${formatToField(bottom + height)}) exceeds wall height (${formatToField(wallHeight)}).`
      )
      return
    }
  }

  clearError()

  state.openings = [
    ...state.openings,
    { start, width, bottom, height }
  ]

  persistState()
  renderOpeningsList()
  scheduleRender(true)

  startEl.value = ""
  widthEl.value = ""
  bottomEl.value = ""
  heightEl.value = ""
}

function renderOpeningsList() {
  const list = document.getElementById("openingsList")
  if (!list) return

  list.innerHTML = ""

  state.openings.forEach((op, index) => {
    const div = document.createElement("div")
    div.className = "opening-item"

    const label = document.createElement("span")
    label.textContent =
      `${formatToField(op.start)} → ${formatToField(op.start + op.width)} • ` +
      `bottom ${formatToField(op.bottom || 0)} • ` +
      `height ${formatToField(op.height || 0)}`

    const btn = document.createElement("button")
    btn.textContent = "✕"
    btn.className = "delete-btn"
    btn.onclick = () => {
      state.openings = state.openings.filter((_, i) => i !== index)
      persistState()
      renderOpeningsList()
      scheduleRender(true)
    }

    div.appendChild(label)
    div.appendChild(btn)
    list.appendChild(div)
  })
}

/* ================================================================
   MODE UI — show/hide gable vs sidewall fields
================================================================ */

function syncModeUI() {
  const isGable     = state.wallType === "gable"
  const gableFields = document.getElementById("gableFields")
  const sideFields  = document.getElementById("sidewallFields")

  if (gableFields) gableFields.style.display = isGable ? "block" : "none"
  if (sideFields)  sideFields.style.display  = isGable ? "none"  : "block"
}

/* ================================================================
   SHARE BUTTON — copies URL with encoded state to clipboard
================================================================ */

function setupShareButton() {
  const btn = document.getElementById("shareBtn")
  if (!btn) return

  btn.addEventListener("click", () => {
    updateHash()
    const url = location.href

    const copy = () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
          btn.textContent = "Link Copied!"
          setTimeout(() => { btn.textContent = "Share Layout" }, 2500)
        }).catch(() => prompt("Copy this link:", url))
      } else {
        prompt("Copy this link:", url)
      }
    }
    copy()
  })
}

/* ================================================================
   COPY CUT LIST — plain-text summary to clipboard
================================================================ */

function setupCopyTextButton() {
  const btn = document.getElementById("copyTextBtn")
  if (!btn) return

  btn.addEventListener("click", () => {
    if (!lastModel) {
      showError("Generate a layout first.")
      return
    }

    const text = buildTextSummary(lastModel)

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = "Copied!"
        setTimeout(() => { btn.textContent = "Copy Cut List" }, 2500)
      }).catch(() => prompt("Copy cut list:", text))
    } else {
      prompt("Copy cut list:", text)
    }
  })
}

/* ================================================================
   MEASUREMENT KEYBOARD
================================================================ */

let activeInput = null

function updateMeasurementDisplay() {
  const rawEl  = document.getElementById("measurementRaw")
  const dispEl = document.getElementById("measurementDisplay")
  if (!rawEl || !dispEl) return

  const raw = activeInput ? activeInput.value : ""
  rawEl.textContent = raw

  if (!raw.trim()) {
    dispEl.textContent = ""
    return
  }
  const inches = parseMeasurement(raw)
  dispEl.textContent = inches > 0 ? formatToField(inches) : ""
}

function setupMeasurementKeyboard() {
  const keyboard = document.getElementById("measurementKeyboard")
  if (!keyboard) return

  document.querySelectorAll(".measure-input").forEach(input => {
    input.addEventListener("focus", () => {
      activeInput = input
      keyboard.classList.remove("hidden")
      updateMeasurementDisplay()
    })
    input.addEventListener("click", () => {
      activeInput = input
      keyboard.classList.remove("hidden")
      updateMeasurementDisplay()
    })
  })

  keyboard.addEventListener("click", e => {
    const target = e.target
    if (!(target instanceof HTMLElement)) return

    if (target.dataset.action === "backspace") {
      handleBackspace()
      fireStateSync()
      updateMeasurementDisplay()
      return
    }
    if (target.dataset.action === "confirm") {
      keyboard.classList.add("hidden")
      activeInput = null
      scheduleRender(true)
      return
    }
    if (target.dataset.key) {
      insertAtCursor(target.dataset.key)
      fireStateSync()
      updateMeasurementDisplay()
    }
  })

  document.addEventListener("click", e => {
    const t = e.target
    if (!(t instanceof Element)) return
    if (!t.closest(".measure-input") && !t.closest("#measurementKeyboard")) {
      keyboard.classList.add("hidden")
      activeInput = null
    }
  })
}

function fireStateSync() {
  if (!activeInput) return
  activeInput.dispatchEvent(new Event("input", { bubbles: true }))
}

function insertAtCursor(char) {
  if (!activeInput) return
  const s = activeInput.selectionStart ?? activeInput.value.length
  const e = activeInput.selectionEnd   ?? activeInput.value.length
  activeInput.value = activeInput.value.slice(0, s) + char + activeInput.value.slice(e)
  const pos = s + char.length
  activeInput.setSelectionRange(pos, pos)
  activeInput.focus()
}

function handleBackspace() {
  if (!activeInput) return
  const s = activeInput.selectionStart ?? activeInput.value.length
  const e = activeInput.selectionEnd   ?? activeInput.value.length

  if (s !== e) {
    activeInput.value = activeInput.value.slice(0, s) + activeInput.value.slice(e)
    activeInput.setSelectionRange(s, s)
  } else if (s > 0) {
    activeInput.value = activeInput.value.slice(0, s - 1) + activeInput.value.slice(e)
    activeInput.setSelectionRange(s - 1, s - 1)
  }
  activeInput.focus()
}

/* ================================================================
   INIT
================================================================ */

document.addEventListener("DOMContentLoaded", () => {
  loadState()
  bindInputs()
  setupMeasurementKeyboard()
  setupShareButton()
  setupCopyTextButton()

  const addBtn = document.getElementById("addOpeningBtn")
  if (addBtn) addBtn.addEventListener("click", addOpening)

  document.querySelectorAll(".collapsible .card-header").forEach(header => {
    header.addEventListener("click", () => {
      header.closest(".collapsible").classList.toggle("open")
    })
  })

  syncModeUI()
  scheduleRender(true)
})
