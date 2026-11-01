import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
async function walk(dir) {
  const out = []
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue
    const p = dir + '/' + e.name
    if (e.isDirectory()) out.push(...(await walk(p)))
    else out.push(p)
  }
  return out
}
const files = await walk('.')
for (const f of files.filter((f) => /\.(js|mjs)$/.test(f))) {
  const result = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' })
  if (result.status) throw new Error(result.stderr)
  const content = await readFile(f, 'utf8')
  for (const m of content.matchAll(/(?:from\s+|import\s*)['"](\.[^'"]+)['"]/g))
    await readFile(resolve(dirname(f), m[1]))
}
const html = await readFile('index.html', 'utf8'),
  ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1])
if (new Set(ids).size !== ids.length) throw new Error('Duplicate HTML IDs')
for (const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (!/^[a-z]+:/.test(m[1])) await readFile(m[1])
}
const sw = await readFile('sw.js', 'utf8')
for (const f of files.filter((f) => f.startsWith('./js/') || f.startsWith('./assets/')))
  if (!sw.includes(JSON.stringify(f))) throw new Error('Offline shell missing ' + f)
if (/https?:\/\//.test(html.replace('http://www.w3.org/2000/svg', '')))
  throw new Error('Unexpected external runtime dependency')
console.log('Syntax, imports, HTML IDs, local assets and offline shell checks passed.')

const shellFiles = [
  'index.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest',
  ...files.filter((f) => f.startsWith('./js/') || f.startsWith('./assets/')).map((f) => f.slice(2)),
].sort()
const hash = createHash('sha256')
for (const f of shellFiles) hash.update(await readFile(f))
if (!sw.includes('cr27-' + hash.digest('hex').slice(0, 12)))
  throw new Error('Offline version is stale. Run node scripts/update-cache.mjs.')
console.log('Offline version matches the current runtime files.')
