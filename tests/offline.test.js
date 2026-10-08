import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
const source = await readFile(new URL('../sw.js', import.meta.url), 'utf8')
function workerHarness() {
  const handlers = {},
    stores = new Map(),
    calls = { network: 0, activated: 0, claimed: 0 }
  const base = 'https://example.com/cr27/'
  const key = (req, ignoreSearch = false) => {
    const u = new URL(typeof req === 'string' ? req : req.url, base)
    if (ignoreSearch) u.search = ''
    return u.href
  }
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map())
      const store = stores.get(name)
      return {
        async addAll(paths) {
          for (const p of paths) store.set(key(p), { body: p })
        },
        async match(request, options = {}) {
          return [...store.entries()].find(
            ([url]) => key(url, options.ignoreSearch) === key(request, options.ignoreSearch),
          )?.[1]
        },
      }
    },
    async keys() {
      return [...stores.keys()]
    },
    async delete(name) {
      return stores.delete(name)
    },
  }
  const self = {
    location: new URL(base + 'sw.js'),
    addEventListener: (name, fn) => (handlers[name] = fn),
    skipWaiting: () => calls.activated++,
    clients: { claim: async () => calls.claimed++ },
  }
  vm.runInNewContext(source, {
    self,
    caches,
    URL,
    fetch: async () => {
      calls.network++
      throw new Error('offline')
    },
  })
  const lifecycle = async (name) => {
    let promise
    handlers[name]({ waitUntil: (p) => (promise = p) })
    await promise
  }
  const fetch = async (path, mode = 'cors') => {
    let response
    handlers.fetch({
      request: { url: new URL(path, base).href, method: 'GET', mode },
      respondWith: (p) => (response = p),
    })
    return await response
  }
  return { lifecycle, fetch, caches, handlers, calls, stores }
}
test('offline install caches the entire local shell and serves navigation/modules without network', async () => {
  const w = workerHarness()
  await w.lifecycle('install')
  assert.equal((await w.fetch('./?from=home', 'navigate')).body, './index.html')
  assert.equal((await w.fetch('./js/layout/layoutEngine.js')).body, './js/layout/layoutEngine.js')
  assert.equal((await w.fetch('./assets/icon-192.png')).body, './assets/icon-192.png')
  assert.equal(w.calls.network, 0)
})
test('new versions wait for explicit activation and remove only CR27 caches', async () => {
  const w = workerHarness()
  await w.caches.open('unrelated-app')
  await w.caches.open('cr27-old')
  await w.lifecycle('install')
  assert.equal(w.calls.activated, 0)
  w.handlers.message({ data: { type: 'ACTIVATE_UPDATE' } })
  assert.equal(w.calls.activated, 1)
  await w.lifecycle('activate')
  assert.ok(w.stores.has('unrelated-app'))
  assert.ok(!w.stores.has('cr27-old'))
  assert.equal(w.calls.claimed, 1)
})
