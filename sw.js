/* Generated with node scripts/update-cache.mjs after shell changes. */
const CACHE = "cr27-4d01a4252fb8"
const SHELL = [
  "./app.js",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon.svg",
  "./index.html",
  "./js/app/appController.js",
  "./js/app/appState.js",
  "./js/app/init.js",
  "./js/app/offline.js",
  "./js/layout/gableGeometry.js",
  "./js/layout/gableLayout.js",
  "./js/layout/layoutEngine.js",
  "./js/layout/layoutMath.js",
  "./js/layout/layoutSummary.js",
  "./js/layout/panelLayout.js",
  "./js/layout/ribLayout.js",
  "./js/layout/sidewallLayout.js",
  "./js/layout/singleSlopeGeometry.js",
  "./js/openings/openingAnalysis.js",
  "./js/openings/openingManager.js",
  "./js/openings/openingValidation.js",
  "./js/project/projectImportExport.js",
  "./js/project/projectModel.js",
  "./js/project/projectShare.js",
  "./js/project/projectStorage.js",
  "./js/render/cutListRenderer.js",
  "./js/render/openingReportRenderer.js",
  "./js/render/panelCutDiagram.js",
  "./js/render/summaryRenderer.js",
  "./js/render/wallRenderer.js",
  "./js/ui/dom.js",
  "./js/ui/editor.js",
  "./js/ui/measurementKeyboard.js",
  "./js/ui/openingsUI.js",
  "./js/ui/projectDetailsUI.js",
  "./js/ui/wallManagerUI.js",
  "./js/ui/workspaceUI.js",
  "./js/utils/formatter.js",
  "./js/utils/measurementParser.js",
  "./js/utils/textExport.js",
  "./js/walls/wallManager.js",
  "./js/walls/wallModel.js",
  "./js/walls/wallValidation.js",
  "./manifest.webmanifest",
  "./styles.css"
]
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))))
self.addEventListener('message', event => { if (event.data?.type === 'ACTIVATE_UPDATE') self.skipWaiting() })
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k.startsWith('cr27-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())))
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return
  // Versioned shell stays coherent until the explicit update; cache no arbitrary data.
  event.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(event.request, { ignoreSearch: true })
    if (hit) return hit
    if (event.request.mode === 'navigate') return cache.match('./index.html')
    return fetch(event.request)
  }))
})
