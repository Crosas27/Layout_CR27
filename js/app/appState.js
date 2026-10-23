/* UNDO / REDO — project snapshots, one per committed action. */
export function createHistory(limit = 40) {
  let past = [],
    future = []
  return {
    record(project) {
      past.push(structuredClone(project))
      past = past.slice(-limit)
      future = []
    },
    undo(project) {
      if (!past.length) return null
      future.push(structuredClone(project))
      return past.pop()
    },
    redo(project) {
      if (!future.length) return null
      past.push(structuredClone(project))
      return future.pop()
    },
    reset() {
      past = []
      future = []
    },
    get canUndo() {
      return !!past.length
    },
    get canRedo() {
      return !!future.length
    },
  }
}
