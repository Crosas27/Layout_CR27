import { createProject, normalizeProject } from './projectModel.js'
import { createWall } from '../walls/wallModel.js'
export const STORAGE_KEY = 'layout_cr27_workspace_v2'
export const OLD_PROJECT_KEY = 'layout_cr27_project_v1'
const LEGACY_KEY = 'layout_cr27_v2'
/* LOAD SAVED PROJECTS — previous storage is read, never deleted. */
export function loadWorkspace(storage) {
  const saved = storage.getItem(STORAGE_KEY)
  if (saved !== null) {
    const data = JSON.parse(saved)
    if (!Array.isArray(data.projects) || !data.projects.length)
      throw new Error('Saved workspace is incomplete.')
    const projects = data.projects.map(normalizeProject)
    return {
      projects,
      activeProjectId: projects.some((p) => p.id === data.activeProjectId)
        ? data.activeProjectId
        : projects[0].id,
    }
  }
  const old = storage.getItem(OLD_PROJECT_KEY)
  let project
  if (old !== null) project = normalizeProject(JSON.parse(old))
  else {
    const legacy = storage.getItem(LEGACY_KEY)
    if (legacy !== null) {
      const flat = JSON.parse(legacy),
        wall = { ...createWall(), ...flat }
      project = normalizeProject({
        ...createProject(),
        profile: {
          name: 'PBR',
          panelCoverage: flat.panelCoverage || '36"',
          ribSpacing: flat.ribSpacing || '12"',
        },
        walls: [wall],
      })
    } else project = createProject()
  }
  return { projects: [project], activeProjectId: project.id }
}
/* SAVE ALL PROJECTS — failure propagates to the visible save status. */
export function saveWorkspace(storage, workspace) {
  storage.setItem(STORAGE_KEY, JSON.stringify(workspace))
}

/* INDEXEDDB — transactional project storage; localStorage is migration/fallback. */
export async function openProjectStorage({ indexedDB, localStorage }) {
  if (!indexedDB)
    return {
      mode: 'local',
      load: async () => loadWorkspace(localStorage),
      save: async (w) => saveWorkspace(localStorage, w),
    }
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('cr27-projects', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('workspace')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () =>
      reject(new Error('Close older CR27 tabs to finish opening project storage.'))
  })
  db.onversionchange = () => db.close()
  const read = () =>
    new Promise((resolve, reject) => {
      const tx = db.transaction('workspace', 'readonly'),
        request = tx.objectStore('workspace').get('current')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  let revision = 0
  return {
    mode: 'indexedDB',
    async load() {
      const data = await read()
      if (!data) return loadWorkspace(localStorage)
      revision = data.revision || 0
      if (!Array.isArray(data.projects) || !data.projects.length)
        throw new Error('Saved project database is incomplete.')
      const projects = data.projects.map(normalizeProject)
      return {
        projects,
        activeProjectId: projects.some((p) => p.id === data.activeProjectId)
          ? data.activeProjectId
          : projects[0].id,
      }
    },
    save(workspace) {
      return new Promise((resolve, reject) => {
        const tx = db.transaction('workspace', 'readwrite')
        const store = tx.objectStore('workspace'),
          read = store.get('current')
        let conflict = false
        read.onsuccess = () => {
          if ((read.result?.revision || 0) !== revision) {
            conflict = true
            tx.abort()
            return
          }
          store.put({ ...workspace, revision: revision + 1 }, 'current')
        }
        tx.oncomplete = () => {
          revision += 1
          resolve()
        }
        tx.onabort = tx.onerror = () =>
          reject(
            conflict
              ? new Error(
                  'Another tab changed these projects. Export your edits, then reload before saving again.',
                )
              : tx.error || new Error('Save transaction failed.'),
          )
      })
    },
    close: () => db.close(),
  }
}
