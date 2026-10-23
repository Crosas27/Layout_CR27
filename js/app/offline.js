import { $, show } from '../ui/dom.js'
/* OFFLINE SHELL / EXPLICIT UPDATE — install only on HTTPS or localhost. */
export async function setupOffline(whenSaved) {
  if (!('serviceWorker' in navigator)) return
  try {
    const registration = await navigator.serviceWorker.register('./sw.js')
    let worker = registration.waiting
    const ready = () => {
      show($('updateNotice'), true)
    }
    if (worker) ready()
    registration.addEventListener('updatefound', () => {
      const installing = registration.installing
      installing?.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          worker = registration.waiting
          ready()
        }
      })
    })
    $('updateBtn').onclick = async () => {
      if (document.querySelector('dialog[open]')) return
      await whenSaved()
      if ($('saveStatus').dataset.failed === 'true') return
      worker?.postMessage({ type: 'ACTIVATE_UPDATE' })
    }
    let reloading = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!reloading && worker) {
        reloading = true
        location.reload()
      }
    })
  } catch {
    $('connectionStatus').textContent = navigator.onLine
      ? 'Online · offline cache unavailable'
      : 'Offline cache unavailable'
  }
}
