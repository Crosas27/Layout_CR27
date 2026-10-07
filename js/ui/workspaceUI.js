import { $, show, escapeHTML as esc } from './dom.js'
import { wallConfig } from '../walls/wallModel.js'
import { generateLayout } from '../layout/layoutEngine.js'
import { formatToField as fmt } from '../utils/formatter.js'
import { parseMeasurement } from '../utils/measurementParser.js'
import { renderWall } from '../render/wallRenderer.js'
import { renderSummary } from '../render/summaryRenderer.js'
import { renderCutList } from '../render/cutListRenderer.js'
import { renderOpeningReport } from '../render/openingReportRenderer.js'
import { openingCards } from './openingsUI.js'
export function safeModel(wall, profile) {
  try {
    return { model: generateLayout(wallConfig(wall, profile)) }
  } catch (error) {
    return { model: null, error: error.message }
  }
}
/* PROJECT LIST */
export function renderProjects(workspace) {
  const q = $('projectSearch').value.trim().toLowerCase(),
    archived = $('showArchived').checked
  const projects = workspace.projects
    .filter(
      (p) =>
        !!p.archived === archived &&
        `${p.details.jobName} ${p.details.location}`.toLowerCase().includes(q),
    )
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
  $('projectCards').innerHTML =
    projects
      .map(
        (p) =>
          `<button class="object-card" data-project="${esc(p.id)}"><span class="card-content"><p class="eyebrow">${p.archived ? 'ARCHIVED' : 'PROJECT'}</p><h3>${esc(p.details.jobName || 'Untitled project')}</h3><p class="muted">${esc(p.details.location || 'Location not set')}</p><span class="card-bottom"><span>${p.walls.length} walls</span><span>${p.walls.reduce((n, w) => n + w.openings.length, 0)} openings</span><span>${new Date(p.updatedAt).toLocaleDateString()}</span></span></span><span class="card-arrow">›</span></button>`,
      )
      .join('') || '<div class="empty-state">No matching projects.</div>'
}
/* BUILDING / WALL CARDS */
export function renderProject(project) {
  $('projectTitle').textContent = project.details.jobName || 'Untitled project'
  $('projectLocation').textContent = project.details.location || 'Location not set'
  $('profileBadge').textContent =
    `${project.profile.name} · ${project.profile.panelCoverage} coverage · ${project.profile.ribSpacing} rib centers`
  const results = project.walls.map((w) => safeModel(w, project.profile))
  const panelTotal = results.reduce((n, r) => n + (r.model?.panels.length || 0), 0)
  const incomplete = results.some((r) => !r.model)
  $('projectTotals').textContent =
    `${project.walls.length} walls · ${panelTotal} panels${incomplete ? ' (valid walls only)' : ''}`
  $('wallCards').innerHTML = project.walls
    .map((w, i) => {
      const result = results[i],
        c = wallConfig(w, project.profile)
      const geometry =
        w.wallType === 'gable'
          ? `${fmt(c.wallLength)} · ridge ${fmt(c.ridgeHeight)}`
          : `${fmt(c.wallLength)} × ${fmt(c.wallHeight)}`
      return `<button class="object-card" data-wall="${esc(w.id)}"><span class="card-number">${String(i + 1).padStart(2, '0')}</span><span class="card-content"><p class="eyebrow">${w.wallType === 'gable' ? 'GABLE / ENDWALL' : 'SIDEWALL'}</p><h3>${esc(w.name)}</h3><p class="muted">${geometry}</p><span class="card-bottom"><span>${result.model ? result.model.panels.length + ' panels' : 'Review dimensions'}</span><span>${w.openings.length} openings</span></span></span><span class="card-arrow">›</span></button>`
    })
    .join('')
  $('archiveProjectBtn').textContent = project.archived ? 'Restore project' : 'Archive project'
  $('projectNotes').textContent = project.notes || ''
}
/* WALL WORKSPACE — never leave stale fabrication output after invalid edits. */
export function renderWorkspace(project, wall, history) {
  $('backProjectBtn').textContent = `‹ ${project.details.jobName || 'Project'}`
  $('wallTitle').textContent = wall.name
  $('wallTypeBadge').textContent = wall.wallType === 'gable' ? 'GABLE / ENDWALL' : 'SIDEWALL'
  const config = wallConfig(wall, project.profile),
    result = safeModel(wall, project.profile),
    model = result.model
  $('wallMeta').textContent =
    `${fmt(config.wallLength)} · ${project.profile.name} · ${project.profile.panelCoverage} coverage`
  $('openingCount').textContent = wall.openings.length
  $('undoBtn').disabled = !history.canUndo
  $('redoBtn').disabled = !history.canRedo
  $('deleteWallBtn').disabled = project.walls.length <= 1
  $('wallNotes').textContent = wall.notes || ''
  $('openingsList').innerHTML = openingCards(wall, config, model)
  for (const id of ['wallSvg', 'panelSummary', 'cutList', 'openingReport']) $(id).innerHTML = ''
  show($('drawingEmpty'), !model)
  $('drawingEmpty').textContent = result.error || 'Set wall dimensions to see your layout.'
  $('wallWarnings').innerHTML = ''
  show($('wallWarnings'), false)
  if (model) {
    renderWall(model)
    renderSummary(model)
    renderCutList(model)
    renderOpeningReport(model)
    const count = model.openingAnalysis.filter((o) => o.warnings.length).length
    const overlaps = wall.openings.some((o, i) =>
      wall.openings
        .slice(i + 1)
        .some(
          (b) =>
            o.start < b.start + b.width &&
            o.start + o.width > b.start &&
            o.bottom < b.bottom + b.height &&
            o.bottom + o.height > b.bottom,
        ),
    )
    if (count || overlaps) {
      $('wallWarnings').innerHTML =
        `<div class="warning">${count ? `${count} opening(s) need jamb clearance review.` : ''}${overlaps ? ' Overlapping openings: review combined cuts before fabrication.' : ''}</div>`
      show($('wallWarnings'), true)
    }
  }
  for (const id of ['copyTextBtn', 'downloadCutsBtn', 'printBtn']) $(id).disabled = !model
  return model
}
export function setView(view) {
  for (const name of ['projects', 'project', 'wall']) show($(name + 'View'), name === view)
}
export function setTab(tab) {
  for (const name of ['layout', 'openings', 'cuts']) show($(name + 'Tab'), name === tab)
  document.querySelectorAll('[data-tab]').forEach((button) => {
    button.setAttribute('aria-selected', String(button.dataset.tab === tab))
    button.tabIndex = button.dataset.tab === tab ? 0 : -1
  })
}
