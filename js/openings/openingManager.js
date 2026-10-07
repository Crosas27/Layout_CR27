import { validateOpening } from './openingValidation.js'
/* ADD / EDIT OPENING */
export function saveOpening(wall, opening, config, id = null) {
  const errors = validateOpening(opening, config)
  if (errors.length) throw new Error(errors.join(' '))
  const next = { ...opening, id: id || crypto.randomUUID() }
  if (id) {
    const index = wall.openings.findIndex((o) => o.id === id)
    if (index < 0) throw new Error('Opening not found.')
    wall.openings[index] = next
  } else wall.openings.push(next)
  return next
}
/* DELETE OPENING — undo is handled by appState. */
export function deleteOpening(wall, id) {
  wall.openings = wall.openings.filter((o) => o.id !== id)
}
