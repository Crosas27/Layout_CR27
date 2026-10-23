import { $, field, textArea, escapeHTML as esc } from './dom.js'
/* PROJECT DETAILS / PROFILE / NOTES */
export function projectEditor(project, apply) {
  return {
    title: 'Project settings',
    fields: `<div class="field-grid">${field('jobName', 'Job name', project.details.jobName, { full: true })}${field('location', 'Location', project.details.location, { full: true })}${field('dateStart', 'Start date', project.details.dateStart, { type: 'date' })}${field('dateEnd', 'End date', project.details.dateEnd, { type: 'date' })}${textArea('projectNoteField', 'Job notes', project.notes)}</div><details><summary>Panel profile · ${esc(project.profile.name)}</summary><p class="muted">Changing the profile recalculates every wall.</p><div class="field-grid">${field('profileName', 'Profile name', project.profile.name, { full: true })}${field('panelCoverage', 'Coverage', project.profile.panelCoverage, { measure: true })}${field('ribSpacing', 'Rib centers', project.profile.ribSpacing, { measure: true })}</div><button id="pbrPresetBtn" type="button">Use PBR · 36″ / 12″</button></details>`,
    ready() {
      $('pbrPresetBtn').onclick = () => {
        $('profileName').value = 'PBR'
        $('panelCoverage').value = '36"'
        $('ribSpacing').value = '12"'
      }
    },
    save(data) {
      apply({
        details: Object.fromEntries(
          ['jobName', 'location', 'dateStart', 'dateEnd'].map((k) => [k, data.get(k)]),
        ),
        profile: {
          name: data.get('profileName'),
          panelCoverage: data.get('panelCoverage'),
          ribSpacing: data.get('ribSpacing'),
        },
        notes: data.get('projectNoteField'),
      })
    },
  }
}
