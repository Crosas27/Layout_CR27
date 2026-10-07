import test from 'node:test'
import assert from 'node:assert/strict'
import { IDBFactory } from 'fake-indexeddb'
import {
  loadWorkspace,
  saveWorkspace,
  openProjectStorage,
  OLD_PROJECT_KEY,
} from '../js/project/projectStorage.js'
import { createProject, normalizeProject } from '../js/project/projectModel.js'
import { createWall } from '../js/walls/wallModel.js'
import { encodeShare, decodeShare, shareURL } from '../js/project/projectShare.js'
import { createHistory } from '../js/app/appState.js'
const memoryStorage = () => {
  const map = new Map()
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) }
}
const job = () => {
  const p = createProject('Carlos · Taller 🛠')
  p.walls = [createWall('Front'), createWall('Back'), createWall('Left'), createWall('Right')]
  p.activeWallId = p.walls[2].id
  return p
}
test('migration retains every wall and old project storage', () => {
  const storage = memoryStorage(),
    p = job()
  storage.setItem(OLD_PROJECT_KEY, JSON.stringify(p))
  const loaded = loadWorkspace(storage)
  assert.equal(loaded.projects[0].walls.length, 4)
  assert.equal(loaded.projects[0].activeWallId, p.activeWallId)
  saveWorkspace(storage, loaded)
  assert.equal(loadWorkspace(storage).projects[0].walls.length, 4)
  assert.equal(storage.getItem(OLD_PROJECT_KEY), JSON.stringify(p))
})
test('full-project share round trip keeps unicode and all walls without changing href', () => {
  const p = job(),
    link = shareURL(p, 'https://example.com/cr27/?debug=1')
  const loaded = decodeShare(new URL(link).hash)
  assert.equal(loaded.walls.length, 4)
  assert.equal(loaded.details.jobName, p.details.jobName)
  assert.deepEqual(decodeShare(encodeShare(p)), normalizeProject(p))
})
test('JSON export/import round trip and numeric wall IDs from v1', () => {
  const p = job()
  p.walls[0].id = 1
  p.activeWallId = 1
  p.walls[0].openings = [{ start: 0, width: 36, bottom: 0, height: 84 }]
  const migrated = normalizeProject(JSON.parse(JSON.stringify(p)))
  assert.equal(migrated.activeWallId, '1')
  assert.equal(migrated.walls[0].openings[0].start, 0)
  assert.deepEqual(normalizeProject(JSON.parse(JSON.stringify(migrated))), migrated)
  assert.throws(() => normalizeProject({ walls: [] }))
  assert.throws(() => normalizeProject({ walls: [{ openings: [{ start: 'potato' }] }] }))
})
test('IndexedDB committed workspace survives closing and reopening', async () => {
  const indexedDB = new IDBFactory(),
    localStorage = memoryStorage(),
    p = job()
  localStorage.setItem(OLD_PROJECT_KEY, JSON.stringify(p))
  const repository = await openProjectStorage({ indexedDB, localStorage }),
    w = await repository.load()
  w.projects.push(job())
  await repository.save(w)
  repository.close()
  const reopened = await openProjectStorage({ indexedDB, localStorage }),
    reloaded = await reopened.load()
  assert.equal(reloaded.projects.length, 2)
  assert.equal(reloaded.projects[0].walls.length, 4)
  assert.equal(localStorage.getItem(OLD_PROJECT_KEY), JSON.stringify(p))
  reopened.close()
})
test('another tab cannot overwrite newly saved projects with a stale workspace', async () => {
  const indexedDB = new IDBFactory(),
    localStorage = memoryStorage(),
    a = await openProjectStorage({ indexedDB, localStorage }),
    b = await openProjectStorage({ indexedDB, localStorage })
  const wa = await a.load(),
    wb = await b.load()
  await a.save(wa)
  await assert.rejects(b.save(wb), /Another tab/)
  a.close()
  b.close()
})
test('save failures remain visible to callers', () => {
  assert.throws(
    () =>
      saveWorkspace(
        {
          setItem() {
            throw new Error('Quota exceeded')
          },
        },
        { projects: [job()] },
      ),
    /Quota/,
  )
  assert.throws(() =>
    loadWorkspace({
      getItem() {
        return '{broken'
      },
    }),
  )
})
test('undo restores a deleted wall; redo re-applies it', () => {
  const history = createHistory(),
    p = job()
  history.record(p)
  p.walls.pop()
  const old = history.undo(p)
  assert.equal(old.walls.length, 4)
  assert.equal(history.redo(old).walls.length, 3)
})
