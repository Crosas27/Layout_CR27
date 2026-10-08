import { readdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
async function walk(dir) {
  const files = []
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = dir + '/' + e.name
    if (e.isDirectory()) files.push(...(await walk(p)))
    else files.push(p)
  }
  return files
}
const files = [
  'index.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest',
  ...(await walk('js')),
  ...(await walk('assets')),
].sort()
const hash = createHash('sha256')
for (const f of files) hash.update(await readFile(f))
const version = 'cr27-' + hash.digest('hex').slice(0, 12)
await writeFile(
  'sw.js',
  `/* Generated with node scripts/update-cache.mjs after shell changes. */
const CACHE = ${JSON.stringify(version)}
const SHELL = ${JSON.stringify(
    files.map((f) => './' + f),
    null,
    2,
  )}
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
`,
)
console.log('Offline shell:', version, files.length, 'files')
