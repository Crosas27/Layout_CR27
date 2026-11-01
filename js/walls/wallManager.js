import { createWall } from './wallModel.js'
/* ADD WALL */
export function addWall(project, type = 'sidewall') {
  const wall = createWall(`Wall ${project.walls.length + 1}`)
  wall.wallType = type
  project.walls.push(wall)
  project.activeWallId = wall.id
  return wall
}
/* DUPLICATE WALL */
export function duplicateWall(project, id) {
  const wall = structuredClone(project.walls.find((w) => w.id === id))
  if (!wall) throw new Error('Wall not found.')
  wall.id = crypto.randomUUID()
  wall.name += ' copy'
  wall.openings = wall.openings.map((o) => ({ ...o, id: crypto.randomUUID() }))
  project.walls.push(wall)
  project.activeWallId = wall.id
}
/* DELETE WALL — caller records undo; the last wall remains. */
export function deleteWall(project, id) {
  if (project.walls.length <= 1) throw new Error('Keep at least one wall in the project.')
  project.walls = project.walls.filter((w) => w.id !== id)
  if (!project.walls.some((w) => w.id === project.activeWallId))
    project.activeWallId = project.walls[0].id
}
