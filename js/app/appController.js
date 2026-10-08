import { createProject } from '../project/projectModel.js'
import { openProjectStorage } from '../project/projectStorage.js'
import { exportProject, importProject, download } from '../project/projectImportExport.js'
import { decodeShare, shareURL } from '../project/projectShare.js'
import { createHistory } from './appState.js'
import { addWall, duplicateWall, deleteWall } from '../walls/wallManager.js'
import { wallConfig } from '../walls/wallModel.js'
import { validateWallConfig } from '../walls/wallValidation.js'
import { saveOpening, deleteOpening } from '../openings/openingManager.js'
import { projectEditor } from '../ui/projectDetailsUI.js'
import { wallEditor, wallChoiceEditor } from '../ui/wallManagerUI.js'
import { openingEditor } from '../ui/openingsUI.js'
import { createEditor } from '../ui/editor.js'
import { setupMeasurementKeyboard } from '../ui/measurementKeyboard.js'
import {
  renderProjects,
  renderProject,
  renderWorkspace,
  setView,
  setTab,
} from '../ui/workspaceUI.js'
import { $, show } from '../ui/dom.js'
import { panelDetails } from '../render/cutListRenderer.js'
import { buildTextSummary } from '../utils/textExport.js'
import { parseMeasurement } from '../utils/measurementParser.js'

/* APPLICATION CONTROLLER — connects state, domain actions and named UI modules. */
export async function initApp() {
  let storage,
    workspace,
    saveAllowed = true,
    saving = Promise.resolve()
  let view = 'projects',
    model = null
  const history = createHistory(),
    editor = createEditor()
  setupMeasurementKeyboard()
  const error = (message) => {
    $('errorBox').textContent = message
    show($('errorBox'), true)
  }
  const toast = (message) => {
    $('toast').textContent = message
    show($('toast'), true)
  }
  try {
    try {
      storage = await openProjectStorage({
        indexedDB: window.indexedDB,
        localStorage: window.localStorage,
      })
    } catch (err) {
      storage = await openProjectStorage({ localStorage: window.localStorage })
      toast('Project database unavailable. Using browser storage on this device.')
    }
    workspace = await storage.load()
  } catch (err) {
    saveAllowed = false
    workspace = { projects: [createProject()], activeProjectId: null }
    workspace.activeProjectId = workspace.projects[0].id
    error(
      `Saved projects could not be read: ${err.message} Existing storage has been left intact. New edits are temporary; export JSON before leaving.`,
    )
  }
  const project = () =>
    workspace.projects.find((p) => p.id === workspace.activeProjectId) || workspace.projects[0]
  const wall = () =>
    project().walls.find((w) => w.id === project().activeWallId) || project().walls[0]
  const persist = () => {
    if (!saveAllowed) {
      $('saveStatus').textContent = 'Temporary · export JSON'
      $('saveStatus').dataset.failed = 'true'
      return saving
    }
    const snapshot = structuredClone(workspace)
    $('saveStatus').textContent = 'Saving…'
    saving = saving
      .then(() => storage.save(snapshot))
      .then(() => {
        $('saveStatus').textContent = 'Saved on this device'
        $('saveStatus').dataset.failed = 'false'
      })
      .catch((err) => {
        $('saveStatus').textContent = 'Not saved · export JSON'
        $('saveStatus').dataset.failed = 'true'
        error(
          `Could not save projects: ${err.message} Your edits remain in this tab. Export JSON for a backup.`,
        )
      })
    return saving
  }
  const render = () => {
    setView(view)
    if (view === 'projects') renderProjects(workspace)
    else if (view === 'project') renderProject(project())
    else model = renderWorkspace(project(), wall(), history)
  }
  const navigate = (next) => {
    view = next
    render()
    window.scrollTo?.({ top: 0, behavior: 'instant' })
  }
  const change = (fn) => {
    const before = structuredClone(project())
    try {
      fn()
    } catch (err) {
      workspace.projects[workspace.projects.findIndex((p) => p.id === before.id)] = before
      throw err
    }
    history.record(before)
    project().updatedAt = new Date().toISOString()
    persist()
    render()
  }
  const guard =
    (fn) =>
    (...args) => {
      try {
        fn(...args)
      } catch (err) {
        error(err.message)
      }
    }
  const openWallEditor = () =>
    editor(
      wallEditor(wall(), (next) => {
        const config = wallConfig(next, project().profile),
          errors = validateWallConfig(config)
        if (errors.length) throw new Error(errors.join(' '))
        // Geometry edits may invalidate an existing opening. Keep it editable, suppress cuts.
        change(() => {
          Object.assign(wall(), next)
        })
      }),
    )
  const openOpeningEditor = (id) => {
    const opening = id ? wall().openings.find((o) => o.id === id) : null
    editor(
      openingEditor(opening, (next) => {
        const config = wallConfig(wall(), project().profile),
          errors = validateWallConfig(config)
        if (errors.length) throw new Error('Set valid wall dimensions before adding an opening.')
        change(() => saveOpening(wall(), next, config, id))
      }),
    )
  }
  const openProjectEditor = () =>
    editor(
      projectEditor(project(), (next) => {
        const coverage = parseMeasurement(next.profile.panelCoverage),
          spacing = parseMeasurement(next.profile.ribSpacing)
        if (
          !Number.isFinite(coverage) ||
          !Number.isFinite(spacing) ||
          coverage <= 0 ||
          spacing <= 0 ||
          spacing > coverage ||
          coverage / spacing > 100
        )
          throw new Error(
            'Enter positive coverage and rib spacing; spacing cannot exceed coverage.',
          )
        change(() => Object.assign(project(), next))
      }),
    )
  const inspectPanel = (number) => {
    if (!model) return
    const p = (model.gableCuts || model.panelCuts).find((p) => p.panel === Number(number))
    if (!p) return
    $('inspectorTitle').textContent = `Panel ${String(p.panel).padStart(2, '0')}`
    $('inspectorBody').innerHTML = panelDetails(p)
    $('inspectorDialog').showModal()
  }
  const clipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      toast('Copied to clipboard.')
    } catch {
      window.prompt('Copy this text:', text)
    }
  }

  /* OPEN INCOMING SHARES — add a project; never replace saved projects. */
  if (location.hash.length > 1) {
    try {
      const shared = decodeShare(location.hash)
      const incomingWall = shared.walls[0]
      const sameWall = (w) =>
        [
          'wallType',
          'wallLength',
          'wallHeight',
          'startOffset',
          'ridgeHeight',
          'ridgePosition',
          'leftEaveHeight',
          'rightEaveHeight',
        ].every((k) => String(w[k]) === String(incomingWall[k])) &&
        JSON.stringify(w.openings.map((o) => [o.start, o.width, o.bottom, o.height])) ===
          JSON.stringify(incomingWall.openings.map((o) => [o.start, o.width, o.bottom, o.height]))
      const matched =
        shared.walls.length === 1 &&
        workspace.projects.find(
          (p) =>
            p.details.jobName === shared.details.jobName &&
            p.profile.panelCoverage === shared.profile.panelCoverage &&
            p.walls.some(sameWall),
        )
      if (matched) {
        workspace.activeProjectId = matched.id
        toast('Loaded the full saved project matching this legacy wall link.')
      } else {
        shared.id = crypto.randomUUID()
        workspace.projects.push(shared)
        workspace.activeProjectId = shared.id
        toast('Shared project added. Your saved projects are still here.')
      }
      window.history.replaceState(null, '', location.pathname + location.search)
      view = 'project'
    } catch (err) {
      error(`Could not open shared layout: ${err.message}`)
    }
  }

  /* PROJECT NAVIGATION / ACTIONS */
  $('homeBtn').onclick = $('backProjectsBtn').onclick = () => navigate('projects')
  $('backProjectBtn').onclick = () => navigate('project')
  $('projectSearch').oninput = $('showArchived').onchange = render
  $('newProjectBtn').onclick = () => {
    const p = createProject()
    workspace.projects.push(p)
    workspace.activeProjectId = p.id
    history.reset()
    persist()
    navigate('project')
    openProjectEditor()
  }
  $('projectSettingsBtn').onclick = openProjectEditor
  $('exportProjectBtn').onclick = () => exportProject(project())
  $('importProjectBtn').onclick = () => $('importProjectInput').click()
  $('importProjectInput').onchange = async () => {
    const file = $('importProjectInput').files?.[0]
    if (!file) return
    try {
      const imported = await importProject(file)
      workspace.projects.push(imported)
      workspace.activeProjectId = imported.id
      history.reset()
      await persist()
      navigate('project')
      toast('Project imported as a separate job.')
    } catch (err) {
      error(`Import failed: ${err.message}`)
    }
    $('importProjectInput').value = ''
  }
  $('duplicateProjectBtn').onclick = () => {
    const copy = structuredClone(project())
    copy.id = crypto.randomUUID()
    copy.details.jobName += ' copy'
    copy.archived = false
    copy.updatedAt = new Date().toISOString()
    workspace.projects.push(copy)
    workspace.activeProjectId = copy.id
    history.reset()
    persist()
    render()
  }
  $('archiveProjectBtn').onclick = () => {
    change(() => {
      project().archived = !project().archived
    })
    navigate('projects')
  }
  $('shareProjectBtn').onclick = () => {
    const url = shareURL(project(), location.href)
    if (url.length > 16000) {
      exportProject(project())
      toast('This project is too large for a dependable share link. Share the exported JSON file.')
      return
    }
    clipboard(url)
  }

  /* WALL / OPENING ACTIONS */
  $('addWallBtn').onclick = () =>
    editor(
      wallChoiceEditor((type) => {
        change(() => addWall(project(), type))
        navigate('wall')
        setTab('layout')
        setTimeout(openWallEditor, 0)
      }),
    )
  $('editWallBtn').onclick = openWallEditor
  $('duplicateWallBtn').onclick = () => change(() => duplicateWall(project(), wall().id))
  $('deleteWallBtn').onclick = guard(() => {
    change(() => deleteWall(project(), wall().id))
    navigate('project')
    toast('Wall deleted. Open a wall and Undo to restore it.')
  })
  $('addOpeningBtn').onclick = () => openOpeningEditor(null)
  $('undoBtn').onclick = () => {
    const previous = history.undo(project())
    if (!previous) return
    workspace.projects[workspace.projects.findIndex((p) => p.id === previous.id)] = previous
    persist()
    render()
  }
  $('redoBtn').onclick = () => {
    const next = history.redo(project())
    if (!next) return
    workspace.projects[workspace.projects.findIndex((p) => p.id === next.id)] = next
    persist()
    render()
  }
  $('closeInspectorBtn').onclick = () => $('inspectorDialog').close()
  document.addEventListener(
    'click',
    guard((e) => {
      const target = e.target.closest(
        '[data-project],[data-wall],[data-tab],[data-panel],[data-opening-index],[data-edit-opening],[data-delete-opening]',
      )
      if (!target) return
      if (target.dataset.project) {
        workspace.activeProjectId = target.dataset.project
        history.reset()
        persist()
        navigate('project')
      } else if (target.dataset.wall) {
        project().activeWallId = target.dataset.wall
        persist()
        navigate('wall')
        setTab('layout')
      } else if (target.dataset.tab) setTab(target.dataset.tab)
      else if (target.dataset.panel) inspectPanel(target.dataset.panel)
      else if (target.dataset.openingIndex != null)
        openOpeningEditor(wall().openings[Number(target.dataset.openingIndex)].id)
      else if (target.dataset.editOpening) openOpeningEditor(target.dataset.editOpening)
      else if (target.dataset.deleteOpening) {
        change(() => deleteOpening(wall(), target.dataset.deleteOpening))
        toast('Opening deleted. Undo is available above the drawing.')
      }
    }),
  )
  $('wallSvg').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const target = e.target.closest('[role="button"]')
      if (target) {
        e.preventDefault()
        target.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      }
    }
  })

  /* FABRICATION EXPORTS */
  const cutsText = () =>
    model ? buildTextSummary(model, project().details.jobName, wall().name) : ''
  $('copyTextBtn').onclick = () => model && clipboard(cutsText())
  $('downloadCutsBtn').onclick = () =>
    model && download(new Blob([cutsText()], { type: 'text/plain' }), 'CR27_cut_sheet.txt')
  $('printBtn').onclick = () => model && window.print()

  /* FIELD THEME / CONNECTION / OFFLINE STATUS */
  try {
    document.documentElement.dataset.theme = localStorage.getItem('cr27_theme') || 'light'
  } catch {}
  $('themeBtn').onclick = () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('cr27_theme', theme)
    } catch {}
  }
  const connection = () => {
    $('connectionStatus').textContent = navigator.onLine ? 'Online' : 'Offline · local calculations'
  }
  window.addEventListener('online', connection)
  window.addEventListener('offline', connection)
  connection()
  document.querySelector('.tabs').addEventListener('keydown', (e) => {
    const tabs = [...document.querySelectorAll('[data-tab]')],
      index = tabs.indexOf(document.activeElement)
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) || index < 0) return
    e.preventDefault()
    const next =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? tabs.length - 1
          : (index + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length
    setTab(tabs[next].dataset.tab)
    tabs[next].focus()
  })
  setTab('layout')
  render()
  await persist()
  return {
    getWorkspace: () => structuredClone(workspace),
    whenSaved: () => saving,
    navigate,
    storage,
  }
}
