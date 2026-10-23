import { createWall } from '../walls/wallModel.js'
/* NEW PROJECT DEFAULTS */
export function createProject(name = 'Untitled project') {
  const wall = createWall('Front wall')
  return {
    schemaVersion: 2,
    id: crypto.randomUUID(),
    details: { jobName: name, location: '', dateStart: '', dateEnd: '' },
    profile: { name: 'PBR', panelCoverage: '36"', ribSpacing: '12"' },
    activeWallId: wall.id,
    walls: [wall],
    notes: '',
    archived: false,
    updatedAt: new Date().toISOString(),
  }
}
/* IMPORT / MIGRATE — retain measurements, wall IDs, openings and future fields. */
export function normalizeProject(data) {
  if (
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data) ||
    !Array.isArray(data.walls) ||
    !data.walls.length
  )
    throw new Error('Expected a CR27 project with walls.')
  const defaults = createProject()
  const seen = new Set()
  const walls = data.walls.map((w, i) => {
    if (!w || typeof w !== 'object' || Array.isArray(w)) throw new Error('Invalid wall.')
    let id = w.id == null ? crypto.randomUUID() : String(w.id)
    if (seen.has(id)) id = crypto.randomUUID()
    seen.add(id)
    const openings = (Array.isArray(w.openings) ? w.openings : []).map((o) => {
      if (!o || typeof o !== 'object') throw new Error('Invalid opening.')
      const opening = {
        ...o,
        id: o.id || crypto.randomUUID(),
        name: String(o.name || 'Opening'),
        bottom: o.bottom ?? 0,
      }
      for (const k of ['start', 'width', 'bottom', 'height']) {
        if (typeof opening[k] !== 'number' || !Number.isFinite(opening[k]))
          throw new Error(`Invalid opening ${k}.`)
      }
      return opening
    })
    return { ...createWall(), ...w, id, name: String(w.name || `Wall ${i + 1}`), openings }
  })
  return {
    ...defaults,
    ...data,
    schemaVersion: 2,
    id: String(data.id || defaults.id),
    details: { ...defaults.details, ...data.details },
    profile: { ...defaults.profile, ...data.profile },
    walls,
    activeWallId: walls.some((w) => w.id === String(data.activeWallId))
      ? String(data.activeWallId)
      : walls[0].id,
  }
}
