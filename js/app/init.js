import { initApp } from './appController.js'
import { setupOffline } from './offline.js'
/* START APPLICATION */
export async function init() {
  const app = await initApp()
  setupOffline(app.whenSaved)
  return app
}
