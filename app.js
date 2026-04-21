import { generateLayout }      from "./js/core/layoutEngine.js"
import { renderWall }          from "./js/renderer/wallRenderer.js"
import { renderOpeningReport } from "./js/renderer/openingReportRenderer.js"
import { renderSummary }       from "./js/renderer/summaryRenderer.js"
import { parseMeasurement }    from "./js/utils/measurementParser.js"
import { formatToField }       from "./js/utils/formatter.js"
import { buildTextSummary }    from "./js/utils/textExport.js"

/* ================================================================
   PROJECT STATE — single source of truth
================================================================ */

const STORAGE_KEY = "layout_cr27_project_v1"
const LEGACY_STORAGE_KEY = "layout_cr27_v2"

const DEFAULT_WALL = (id = 1, name = "Wall 1") => ({
  id,
  name,
  wallType: "sidewall",
  wallLength: "",
  wallHeight: "",
  panelStopHeight: "",
  startOffset: '0"',
  leftEaveHeight: "",
  leftPanelStopHeight: "",
  ridgeHeight: "",
  ridgePanelStopHeight: "",
  ridgePosition: "",
  rightEaveHeight: "",
  rightPanelStopHeight: "",
  openings: []
})

const DEFAULT_PROJECT = {
  details: {
    jobName: "",
    location: "",
    dateStart: "",
    dateEnd: ""
  },

  profile: {
    name: "PBR",
    panelCoverage: '36"',
    ribSpacing: '12"'
  },

  activeWallId: 1,
  walls: [DEFAULT_WALL(1, "Wall 1")]
}

let project = structuredClone(DEFAULT_PROJECT)
let lastModel = null
let renderTimer = null
let activeInput = null
let editingOpeningIndex = null

const WALL_INPUT_IDS = [
  "wallLength",
  "wallHeight",
  "panelStopHeight",
  "startOffset",
  "leftEaveHeight",
  "leftPanelStopHeight",
  "ridgeHeight",
  "ridgePanelStopHeight",
  "ridgePosition",
  "rightEaveHeight",
  "rightPanelStopHeight"
]

const PROJECT_DETAIL_INPUT_IDS = [
  "jobName",
  "location",
  "dateStart",
  "dateEnd"
]

const PROFILE_INPUT_IDS = [
  "profileName",
  "panelCoverage",
  "ribSpacing"
]

/* ================================================================
   WALL / PROJECT HELPERS
================================================================ */

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

function updateProfileField(field, value) {
  if (field === "profileName") {
    project.profile.name = value
  } else {
    project.profile[field] = value
  }
}

function addWall() {
  const nextIndex = project.walls.length + 1
  const wall = DEFAULT_WALL(Date.now(), `Wall ${nextIndex}`)

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

function setActiveWall(id) {
  const numericId = Number(id)
  const exists = project.walls.some(w => w.id === numericId)
  if (!exists) return

  project.activeWallId = numericId
  persistState()
  populateInputs()
  scheduleRender(true)
}

function renderWallSelector() {
  const select = document.getElementById("wallSelect")
  const profileNameEl = document.getElementById("profileName")
  if (!select) return

  select.innerHTML = ""

  project.walls.forEach((wall, index) => {
    const option = document.createElement("option")
    option.value = String(wall.id)
    option.textContent = wall.name?.trim() || `Wall ${index + 1}`
    if (wall.id === project.activeWallId) option.selected = true
    select.appendChild(option)
  })

  if (profileNameEl) {
    profileNameEl.value = project.profile.Name || "PBR"
  }
}

/* ================================================================
   PERSISTENCE — localStorage + URL hash
================================================================ */

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
  } catch (_) {}

  updateHash()
}

function updateHash() {
  try {
    const activeWall = getActiveWall()
    if (!activeWall) return

    const sharePayload = {
      details: project.details,
      profile: project.profile,
      wall: activeWall
}

    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(sharePayload))))
    history.replaceState(null, "", "#" + encoded)
  } catch (_) {}
}

function loadState() {
  // 1) Shared hash first
  if (location.hash.length > 1) {
    try {
      const decoded = JSON.parse(
        decodeURIComponent(escape(atob(location.hash.slice(1))))
      )

      if (decoded && typeof decoded === "object") {
        // New share format
        if (decoded.wall) {
          const wall = {
            ...DEFAULT_WALL(decoded.wall.id || 1, decoded.wall.name || "Wall 1"),
            ...decoded.wall,
            openings: Array.isArray(decoded.wall.openings) ? decoded.wall.openings : []
          }

  project = {
            ...structuredClone(DEFAULT_PROJECT),
  details: {
    ...structuredClone(DEFAULT_PROJECT.details),
    ...(decoded.details || {})
  },
  profile: {
    ...structuredClone(DEFAULT_PROJECT.profile),
    ...(decoded.profile || {})
  },
  activeWallId: wall.id,
  walls: [wall]
}

          populateInputs()
          return
        }

        // Legacy share format: flat config with no openings
        const wall = {
          ...DEFAULT_WALL(1, "Wall 1"),
          ...decoded,
          openings: []
        }

        project = {
          ...structuredClone(DEFAULT_PROJECT),
          activeWallId: wall.id,
          walls: [wall]
        }

        populateInputs()
        return
      }
    } catch (_) {}
  }

  // 2) New project storage
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
  if (saved && typeof saved === "object") {
    project = {
      ...structuredClone(DEFAULT_PROJECT),
      ...saved,
      details: {
        ...structuredClone(DEFAULT_PROJECT.details),
        ...(saved.details || {})
      },
      profile: {
        ...structuredClone(DEFAULT_PROJECT.profile),
        ...(saved.profile || {})
      },
      walls: Array.isArray(saved.walls) && saved.walls.length
        ? saved.walls.map((wall, i) => ({
            ...DEFAULT_WALL(wall.id || i + 1, wall.name || `Wall ${i + 1}`),
            ...wall,
            openings: Array.isArray(wall.openings) ? wall.openings : []
          }))
        : [DEFAULT_WALL(1, "Wall 1")]
    }

    if (!project.walls.some(w => w.id === project.activeWallId)) {
      project.activeWallId = project.walls[0].id
    }

    populateInputs()
    return
  }
} catch (_) {}

  // 3) Legacy single-wall storage fallback
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY))
    if (legacy && typeof legacy === "object") {
      const wall = {
        ...DEFAULT_WALL(1, "Wall 1"),
        ...legacy,
        openings: Array.isArray(legacy.openings) ? legacy.openings : []
      }

      project = {
        ...structuredClone(DEFAULT_PROJECT),
        activeWallId: wall.id,
        walls: [wall]
      }

      populateInputs()
    }
  } catch (_) {}
}

function populateInputs() {
  const activeWall = getActiveWall()
  if (!activeWall) return

  renderWallSelector()

  const profileNameEl = document.getElementById("profileName")
  if (profileNameEl) profileNameEl.value = project.profile.name || "PBR"

  PROJECT_DETAIL_INPUT_IDS.forEach(id => {
    const el = document.getElementById(id)
    if (!el) return
    if (project.details[id] !== undefined) el.value = project.details[id]
  })

  PROFILE_INPUT_IDS.forEach(id => {
    const el = document.getElementById(id)
    if (!el) return

    if (id === "profileName") {
      el.value = project.profile.name || ""
    } else if (project.profile[id] !== undefined) {
      el.value = project.profile[id]
    }
  })

  const wallNameEl = document.getElementById("wallName")
  if (wallNameEl) wallNameEl.value = activeWall.name || ""

  const wallTypeEl = document.getElementById("wallType")
  if (wallTypeEl) wallTypeEl.value = activeWall.wallType

  WALL_INPUT_IDS.forEach(id => {
    const el = document.getElementById(id)
    if (el && activeWall[id] !== undefined) el.value = activeWall[id]
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
      updateActiveWallField("wallType", wallTypeEl.value)
      syncModeUI()
      persistState()
      scheduleRender()
    })
  }

  PROJECT_DETAIL_INPUT_IDS.forEach(id => {
    const el = document.getElementById(id)
    if (!el) return

    el.addEventListener("input", () => {
      updateProjectDetailField(id, el.value)
      persistState()
    })
  })

  PROFILE_INPUT_IDS.forEach(id => {
    const el = document.getElementById(id)
    if (!el) return

    el.addEventListener("input", () => {
      updateProfileField(id, el.value)
      updateMeasureHelper(el)
      persistState()
      scheduleRender()
      renderWallSelector()
    })
  })

  WALL_INPUT_IDS.forEach(id => {
    const el = document.getElementById(id)
    if (!el) return

    el.addEventListener("input", () => {
      updateActiveWallField(id, el.value)
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

  const activeWall = getActiveWall()
  if (!activeWall) {
    clearOutputs()
    return
  }

  const wallLength = parseMeasurement(activeWall.wallLength)
  if (!wallLength || wallLength <= 0) {
    clearOutputs()
    return
  }

  const config = {
    wallType: activeWall.wallType,
    wallLength,
    wallHeight: parseMeasurement(activeWall.wallHeight),
    panelStopHeight: parseMeasurement(activeWall.panelStopHeight),
    panelCoverage: parseMeasurement(project.profile.panelCoverage) || 36,
    ribSpacing: parseMeasurement(project.profile.ribSpacing) || 12,
    startOffset: parseMeasurement(activeWall.startOffset) || 0,
    openings: activeWall.openings
  }

  if (activeWall.wallType === "gable") {
    Object.assign(config, {
      leftEaveHeight: parseMeasurement(activeWall.leftEaveHeight),
      leftPanelStopHeight: parseMeasurement(activeWall.leftPanelStopHeight),
      ridgeHeight: parseMeasurement(activeWall.ridgeHeight),
      ridgePanelStopHeight: parseMeasurement(activeWall.ridgePanelStopHeight),
      ridgePosition: parseMeasurement(activeWall.ridgePosition),
      rightEaveHeight: parseMeasurement(activeWall.rightEaveHeight),
      rightPanelStopHeight: parseMeasurement(activeWall.rightPanelStopHeight)
    })
  }

  lastModel = generateLayout(config)

  renderWall(lastModel)
  renderOpeningReport(lastModel)
  renderSummary(lastModel)
}

function clearOutputs() {
  const svg = document.getElementById("wallSvg")
  if (svg) svg.innerHTML = ""

  const summary = document.getElementById("panelSummary")
  if (summary) summary.innerHTML = ""

  const report = document.getElementById("openingReport")
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
function beginEditOpening(index) {
  const activeWall = getActiveWall()
  if (!activeWall) return

  const opening = activeWall.openings[index]
  if (!opening) return

  editingOpeningIndex = index

  const startEl = document.getElementById("openingStart")
  const widthEl = document.getElementById("openingWidth")
  const bottomEl = document.getElementById("openingBottom")
  const heightEl = document.getElementById("openingHeight")
  const addBtn = document.getElementById("addOpeningBtn")
  const cancelBtn = document.getElementById("cancelOpeningEditBtn")

  if (startEl) startEl.value = formatToField(opening.start)
  if (widthEl) widthEl.value = formatToField(opening.width)
  if (bottomEl) bottomEl.value = formatToField(opening.bottom || 0)
  if (heightEl) heightEl.value = formatToField(opening.height || 0)

  updateAllMeasureHelpers()

  if (addBtn) addBtn.textContent = "Update Opening"
  if (cancelBtn) cancelBtn.classList.remove("hidden")
}

function cancelEditOpening() {
  editingOpeningIndex = null

  const startEl = document.getElementById("openingStart")
  const widthEl = document.getElementById("openingWidth")
  const bottomEl = document.getElementById("openingBottom")
  const heightEl = document.getElementById("openingHeight")
  const addBtn = document.getElementById("addOpeningBtn")
  const cancelBtn = document.getElementById("cancelOpeningEditBtn")

  if (startEl) startEl.value = ""
  if (widthEl) widthEl.value = ""
  if (bottomEl) bottomEl.value = ""
  if (heightEl) heightEl.value = ""

  updateAllMeasureHelpers()

  if (addBtn) addBtn.textContent = "Add Opening"
  if (cancelBtn) cancelBtn.classList.add("hidden")
}

function addOpening() {
  const activeWall = getActiveWall()
  if (!activeWall) return

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

  const wallLength = parseMeasurement(activeWall.wallLength)
  if (Number.isFinite(wallLength) && start + width > wallLength) {
    showError(
      `Opening end (${formatToField(start + width)}) exceeds wall width (${formatToField(wallLength)}).`
    )
    return
  }

  if (activeWall.wallType === "sidewall") {
    const wallHeight = parseMeasurement(activeWall.wallHeight)
    if (Number.isFinite(wallHeight) && bottom + height > wallHeight) {
      showError(
        `Opening top (${formatToField(bottom + height)}) exceeds wall height (${formatToField(wallHeight)}).`
      )
      return
    }
  }

  clearError()

  const nextOpening = { start, width, bottom, height }

  if (editingOpeningIndex !== null) {
    activeWall.openings[editingOpeningIndex] = nextOpening
  } else {
    activeWall.openings = [...activeWall.openings, nextOpening]
  }

  persistState()
  renderOpeningsList()
  scheduleRender(true)

  cancelEditOpening()
}

function renderOpeningsList() {
  const list = document.getElementById("openingsList")
  if (!list) return

  const activeWall = getActiveWall()
  if (!activeWall) {
    list.innerHTML = ""
    return
  }

  list.innerHTML = ""

  activeWall.openings.forEach((op, index) => {
    const div = document.createElement("div")
    div.className = "opening-item"

    if (editingOpeningIndex === index) {
      div.classList.add("editing")
    }

    const label = document.createElement("span")
    label.textContent =
      `${formatToField(op.start)} → ${formatToField(op.start + op.width)} • ` +
      `bottom ${formatToField(op.bottom || 0)} • ` +
      `height ${formatToField(op.height || 0)}`

    label.style.cursor = "pointer"
    label.onclick = () => {
      beginEditOpening(index)
      renderOpeningsList()
    }

    const actions = document.createElement("div")
    actions.style.display = "flex"
    actions.style.gap = "8px"
    actions.style.flexShrink = "0"

    const editBtn = document.createElement("button")
    editBtn.textContent = "Edit"
    editBtn.className = "btn-secondary"
    editBtn.style.width = "auto"
    editBtn.onclick = () => {
      beginEditOpening(index)
      renderOpeningsList()
    }

    const btn = document.createElement("button")
    btn.textContent = "✕"
    btn.className = "delete-btn"
    btn.onclick = () => {
      activeWall.openings = activeWall.openings.filter((_, i) => i !== index)

      if (editingOpeningIndex === index) {
        cancelEditOpening()
      } else if (editingOpeningIndex !== null && editingOpeningIndex > index) {
        editingOpeningIndex -= 1
      }

      persistState()
      renderOpeningsList()
      scheduleRender(true)
    }

    actions.appendChild(editBtn)
    actions.appendChild(btn)

    div.appendChild(label)
    div.appendChild(actions)
    list.appendChild(div)
  })
}

/* ================================================================
   MODE UI
================================================================ */

function syncModeUI() {
  const activeWall = getActiveWall()
  const isGable = activeWall?.wallType === "gable"

  const gableFields = document.getElementById("gableFields")
  const sideFields = document.getElementById("sidewallFields")

  if (gableFields) {
    gableFields.style.display = isGable ? "" : "none"
  }

  if (sideFields) {
    sideFields.style.display = isGable ? "none" : ""
  }
}


/*--WALL SELECTOR--*/
function setupWallManager() {
  const wallSelect = document.getElementById("wallSelect")
  const addWallBtn = document.getElementById("addWallBtn")
  const duplicateWallBtn = document.getElementById("duplicateWallBtn")
  const deleteWallBtn = document.getElementById("deleteWallBtn")

  if (wallSelect) {
    wallSelect.addEventListener("change", () => {
      setActiveWall(wallSelect.value)
    })
  }

  if (addWallBtn) {
    addWallBtn.addEventListener("click", () => {
      addWall()
    })
  }

  if (duplicateWallBtn) {
    duplicateWallBtn.addEventListener("click", () => {
      duplicateWall()
    })
  }

  if (deleteWallBtn) {
    deleteWallBtn.addEventListener("click", () => {
      deleteWall()
    })
  }
}

function setupWallRename() {
  const wallNameEl = document.getElementById("wallName")
  if (!wallNameEl) return

  wallNameEl.addEventListener("input", () => {
    const activeWall = getActiveWall()
    if (!activeWall) return

    activeWall.name = wallNameEl.value.trim() || "Unnamed Wall"
    persistState()
    renderWallSelector()
  })
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
   MEASUREMENT HELPERS
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

function updateMeasurementDisplay() {
  const rawEl = document.getElementById("measurementRaw")
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

  const id = activeInput.id

  if (PROJECT_DETAIL_INPUT_IDS.includes(id)) {
    updateProjectDetailField(id, activeInput.value)
    persistState()
  } else if (PROFILE_INPUT_IDS.includes(id)) {
    updateProfileField(id, activeInput.value)
    persistState()
    scheduleRender()
    renderWallSelector()
  } else if (WALL_INPUT_IDS.includes(id)) {
    updateActiveWallField(id, activeInput.value)
    persistState()
    scheduleRender()
  }

  activeInput.dispatchEvent(new Event("input", { bubbles: true }))
}

function insertAtCursor(char) {
  if (!activeInput) return

  const s = activeInput.selectionStart ?? activeInput.value.length
  const e = activeInput.selectionEnd ?? activeInput.value.length

  activeInput.value =
    activeInput.value.slice(0, s) +
    char +
    activeInput.value.slice(e)

  const pos = s + char.length
  activeInput.setSelectionRange(pos, pos)
  activeInput.focus()
}

function handleBackspace() {
  if (!activeInput) return

  const s = activeInput.selectionStart ?? activeInput.value.length
  const e = activeInput.selectionEnd ?? activeInput.value.length

  if (s !== e) {
    activeInput.value =
      activeInput.value.slice(0, s) +
      activeInput.value.slice(e)

    activeInput.setSelectionRange(s, s)
  } else if (s > 0) {
    activeInput.value =
      activeInput.value.slice(0, s - 1) +
      activeInput.value.slice(e)

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
  initMeasurementHelpers()
  setupMeasurementKeyboard()
  setupShareButton()
  setupCopyTextButton()
  setupWallManager()
  setupWallRename()

  const addBtn = document.getElementById("addOpeningBtn")
  if (addBtn) addBtn.addEventListener("click", addOpening)

   const cancelOpeningEditBtn = document.getElementById("cancelOpeningEditBtn")
if (cancelOpeningEditBtn) {
  cancelOpeningEditBtn.addEventListener("click", () => {
    cancelEditOpening()
    renderOpeningsList()
  })
}

  document.querySelectorAll(".collapsible .card-header").forEach(header => {
    header.addEventListener("click", () => {
      header.closest(".collapsible").classList.toggle("open")
    })
  })

  syncModeUI()
  scheduleRender(true)
})
