import { normalizeProject, createProject } from './projectModel.js'
import { createWall } from '../walls/wallModel.js'
/* SHARE A FULL PROJECT — never modify the working browser URL. */
export function encodeShare(project) {
  const bytes = new TextEncoder().encode(JSON.stringify(project))
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
}
export function decodeShare(hash) {
  const bytes = Uint8Array.from(atob(hash.replace(/^#/, '')), (c) => c.charCodeAt(0))
  const data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  if (data.walls) return normalizeProject(data)
  if (data.wall)
    return normalizeProject({
      ...createProject(),
      details: data.details,
      profile: data.profile,
      walls: [data.wall],
    })
  if (!('wallLength' in data)) throw new Error('Invalid shared layout.')
  return normalizeProject({
    ...createProject(),
    profile: {
      name: 'PBR',
      panelCoverage: data.panelCoverage || '36"',
      ribSpacing: data.ribSpacing || '12"',
    },
    walls: [{ ...createWall(), ...data }],
  })
}
export function shareURL(project, href) {
  const url = new URL(href)
  url.hash = encodeShare(project)
  return url.href
}
