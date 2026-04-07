import { generateLayout } from "./js/core/layoutEngine.js"
import { renderWall } from "./js/renderer/wallRenderer.js"
import { renderOpeningReport } from "./js/renderer/openingReportRenderer.js"
import { renderSummary } from "./js/renderer/summaryRenderer.js"
import { parseMeasurement } from "./js/utils/measurementParser.js"
import { formatToField } from "./js/utils/formatter.js"
import { buildTextSummary } from "./js/utils/textExport.js"

/* ================================================================
   STATE — single source of truth
================================================================ */

const STORAGE_KEY = "layout_cr27_v2"

const DEFAULT_STATE = {
  wallType: "sidewall",
  wallLength: "",
  wallHeight: "",
  panelStopHeight: "",
  panelCoverage: '36"',
  ribSpacing: '12"',
  startOffset: '0"',
  leftEaveHeight: "",
  leftPanelStopHeight: "",
  ridgeHeight: "",
  ridgePanelStopHeight: "",
  ridgePosition: "",
  rightEaveHeight: "",
  rightPanelStopHeight: "",
  openings: []
}

let state = { ...DEFAULT_STATE }
let lastModel = null
let renderTimer = null

const CONFIG_INPUT_IDS = [
  "wallLength", "wallHeight", "panelStopHeight", "panelCoverage",
  "ribSpacing", "startOffset",
  "leftEaveHeight", "leftPanelStopHeight",
  "ridgeHeight", "ridgePanelStopHeight",
  "ridgePosition", "rightEaveHeight", "rightPanelStopHeight"
]

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
  const { openings, ...config } = state
  try {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(config))))
    history.replaceState(null, "", "#" + encoded)
  } catch (_) {}
}

function loadState() {
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
  updateAllMeasureHelpers()
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
      updateMeasureHelper(el)
      persistState()
      scheduleRender()
    })
  })
}

/* ================================================================
   RENDER SCHEDULING
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
    wallType: state.wallType,
    wallLength,
    wallHeight: parseMeasurement(state.wallHeight),
    panelStopHeight: parseMeasurement(state.panelStopHeight),
    panelCoverage: parseMeasurement(state.panelCoverage) || 36,
    ribSpacing: parseMeasurement(state.ribSpacing) || 12,
    startOffset: parseMeasurement(state.startOffset) || 0,
    openings: state.openings
  }

  if (state.wallType === "gable") {
    Object.assign(config, {
      leftEaveHeight: parseMeasurement(state.leftEaveHeight),
      leftPanelStopHeight: parseMeasurement(state.leftPanelStopHeight),
      ridgeHeight: parseMeasurement(state.ridgeHeight),
      ridgePanelStopHeight: parseMeasurement(state.ridgePanelStopHeight),
      ridgePosition: parseMeasurement(state.ridgePosition),
      rightEaveHeight: parseMeasurement(state.rightEaveHeight),
      rightPanelStopHeight: parseMeasurement(state.rightPanelStopHeight)
    })
  }

  lastModel = generateLayout(config)

  renderWall(lastModel)
  renderOpeningReport(lastModel)
  renderSummary(lastModel)
}

function clearOutputs() {
  const svg = document.getElementById("wallSvg")
  const summary = document.getElementById("panelSummary")
  const report = document.getElementById("openingReport")
  if (svg) svg.innerHTML = ""
  if (summary) summary.innerHTML = ""
  if (report) report.innerHTML = ""
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
  if (!startEl || !widthEl) return

  const start = parseMeasurement(startEl.value)
  const width = parseMeasurement(widthEl.value)

  if (!width || width <= 0) {
    showError("Opening width is required.")
    return
  }

  if (start < 0) {
    showError("Opening start cannot be negative.")
    return
  }

  const wallLength = parseMeasurement(state.wallLength)
  if (wallLength > 0 && start + width > wallLength) {
    showError(
      `Opening end (${formatToField(start + width)}) exceeds wall length (${formatToField(wallLength)}).`
    )
    return
  }

  clearError()
  state.openings = [...state.openings, { start, width }]
  persistState()
  renderOpeningsList()
  scheduleRender(true)

  startEl.value = ""
  widthEl.value = ""
}

function renderOpeningsList() {
  const list = document.getElementById("openingsList")
  if (!list) return

  list.innerHTML = ""

  state.openings.forEach((op, index) => {
    const div = document.createElement("div")
    div.className = "opening-item"

    const label = document.createElement("span")
    label.textContent = formatToField(op.start) + "  →  " + formatToField(op.start + op.width)

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
   MODE UI
================================================================ */

function syncModeUI() {
  const isGable = state.wallType === "gable"
  const gableFields = document.getElementById("gableFields")
  const sideFields = document.getElementById("sidewallFields")

  if (gableFields) {
    gableFields.style.display = isGable ? "" : "none"
  }

  if (sideFields) {
    sideFields.style.display = isGable ? "none" : ""
  }
}

/* ================================================================
   SHARE BUTTON
================================================================ */

function setupShareButton() {
  const btn = document.getElementById("shareBtn")
  if (!btn) return

  btn.addEventListener("click", () => {
    updateHash()
    const url = location.href

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        btn.textContent = "Link Copied!"
        setTimeout(() => { btn.textContent = "Share Layout" }, 2500)
      }).catch(() => prompt("Copy this link:", url))
    } else {
      prompt("Copy this link:", url)
    }
  })
}

/* ================================================================
   COPY CUT LIST
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
   MEASUREMENT HELPERS (inches-only under fields)
================================================================ */

function initMeasurementHelpers() {
  document.querySelectorAll(".measure-input").forEach(input => {
    let helper = input.nextElementSibling

    if (!helper || !helper.classList.contains("measure-helper")) {
      helper = document.createElement("div")
      helper.className = "measure-helper empty"
      input.insertAdjacentElement("afterend", helper)
    }

    updateMeasureHelper(input)
  })
}

function updateAllMeasureHelpers() {
  document.querySelectorAll(".measure-input").forEach(updateMeasureHelper)
}

function updateMeasureHelper(input) {
  if (!input) return

  const helper = input.nextElementSibling
  if (!helper || !helper.classList.contains("measure-helper")) return

  const raw = input.value ? input.value.trim() : ""
  if (!raw) {
    helper.textContent = ""
    helper.classList.add("empty")
    return
  }

  const inches = parseMeasurement(raw)

  if (Number.isFinite(inches) && inches > 0) {
    helper.textContent = formatTotalInches(inches)
    helper.classList.remove("empty")
  } else if (raw === "0" || raw === '0"' || raw === "0'") {
    helper.textContent = '0"'
    helper.classList.remove("empty")
  } else {
    helper.textContent = "..."
    helper.classList.remove("empty")
  }
}

function formatTotalInches(inches) {
  const rounded = Math.round(inches * 8) / 8
  const whole = Math.floor(rounded)
  const frac = rounded - whole

  const map = {
    0.125: "1/8",
    0.25: "1/4",
    0.375: "3/8",
    0.5: "1/2",
    0.625: "5/8",
    0.75: "3/4",
    0.875: "7/8"
  }

  const fracText = map[Number(frac.toFixed(3))] || ""

  if (fracText && whole > 0) return `${whole} ${fracText}"`
  if (fracText) return `${fracText}"`
  return `${whole}"`
}

/* ================================================================
   MEASUREMENT KEYBOARD
================================================================ */

/* ================================================================
   MEASUREMENT KEYBOARD
================================================================ */

let activeInput = null

function setupMeasurementKeyboard() {
  const keyboard = document.getElementById("measurementKeyboard")
  if (!keyboard) return

  document.querySelectorAll(".measure-input").forEach(input => {
    input.addEventListener("focus", () => {
      activeInput = input
      keyboard.classList.remove("hidden")
      updateMeasurementKeyboardDisplay()
    })

    input.addEventListener("click", () => {
      activeInput = input
      keyboard.classList.remove("hidden")
      updateMeasurementKeyboardDisplay()
    })
  })

  // Prevent taps on keyboard from doing weird mobile browser nonsense
  keyboard.addEventListener("touchstart", e => {
    e.preventDefault()
  }, { passive: false })

  keyboard.addEventListener("mousedown", e => {
    e.preventDefault()
  })

  keyboard.addEventListener("click", e => {
    e.preventDefault()

    const target = e.target
    if (!(target instanceof Element)) return

    const key = target.closest(".key-btn")
    if (!(key instanceof HTMLElement)) return

    if (key.dataset.action === "backspace") {
      handleBackspace()
      fireStateSync()
      updateMeasurementKeyboardDisplay()
      return
    }

    if (key.dataset.action === "confirm") {
      keyboard.classList.add("hidden")
      activeInput = null
      scheduleRender(true)
      return
    }

    if (key.dataset.key) {
      insertAtCursor(key.dataset.key)
      fireStateSync()
      updateMeasurementKeyboardDisplay()
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

  const id = activeInput.id
  if (id && CONFIG_INPUT_IDS.includes(id)) {
    state[id] = activeInput.value
    persistState()
    scheduleRender()
  }

  activeInput.dispatchEvent(new Event("input", { bubbles: true }))
}

function insertAtCursor(char) {
  if (!activeInput) return

  activeInput.focus()

  const start = activeInput.selectionStart ?? activeInput.value.length
  const end = activeInput.selectionEnd ?? activeInput.value.length

  activeInput.value =
    activeInput.value.slice(0, start) +
    char +
    activeInput.value.slice(end)

  const pos = start + char.length

  try {
    activeInput.setSelectionRange(pos, pos)
  } catch {
    // some mobile browsers get weird here, ignore
  }

  activeInput.focus()
}

function handleBackspace() {
  if (!activeInput) return

  activeInput.focus()

  const start = activeInput.selectionStart ?? activeInput.value.length
  const end = activeInput.selectionEnd ?? activeInput.value.length

  if (start !== end) {
    activeInput.value =
      activeInput.value.slice(0, start) +
      activeInput.value.slice(end)

    try {
      activeInput.setSelectionRange(start, start)
    } catch {}
  } else if (start > 0) {
    activeInput.value =
      activeInput.value.slice(0, start - 1) +
      activeInput.value.slice(end)

    try {
      activeInput.setSelectionRange(start - 1, start - 1)
    } catch {}
  }

  activeInput.focus()
}
/* ================================================================
   COLLAPSIBLES
================================================================ */

function initCollapsibles() {
  document.querySelectorAll(".card-header").forEach(header => {
    header.addEventListener("click", event => {
      const target = event.target
      if (target instanceof Element && target.closest("button, input, select, textarea")) {
        return
      }

      const card = header.closest(".collapsible")
      if (!card) return

      card.classList.toggle("open")
    })
  })
}

/* ================================================================
   INIT
================================================================ */

document.addEventListener("DOMContentLoaded", () => {
  try {
    console.log("INIT start")

    loadState()
    console.log("loadState ok")

    bindInputs()
    console.log("bindInputs ok")

    initMeasurementHelpers()
    console.log("initMeasurementHelpers ok")

    setupMeasurementKeyboard()
    console.log("setupMeasurementKeyboard ok")

    setupShareButton()
    console.log("setupShareButton ok")

    setupCopyTextButton()
    console.log("setupCopyTextButton ok")

    initCollapsibles()
    console.log("initCollapsibles ok")

    const addBtn = document.getElementById("addOpeningBtn")
    if (addBtn) {
      addBtn.addEventListener("click", addOpening)
      console.log("addOpeningBtn listener ok")
    }

    syncModeUI()
    console.log("syncModeUI ok")

    scheduleRender(true)
    console.log("scheduleRender ok")

    console.log("INIT done")
  } catch (err) {
    console.error("INIT FAILED:", err)
  }
})
