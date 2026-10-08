import { normalizeProject } from './projectModel.js'
/* DOWNLOAD PROJECT JSON */
export function exportProject(project) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
  download(
    blob,
    `${String(project.details.jobName || 'CR27_Project').replace(/[^\w-]+/g, '_')}.json`,
  )
}
export function download(blob, filename) {
  const url = URL.createObjectURL(blob),
    a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
/* IMPORT AS A NEW PROJECT — the existing job stays in the project library. */
export async function importProject(file) {
  if (file.size > 5 * 1024 * 1024) throw new Error('Project file is larger than 5 MB.')
  const project = normalizeProject(JSON.parse(await file.text()))
  project.id = crypto.randomUUID()
  return project
}
