import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const root = new URL('..', import.meta.url)
const html = readFileSync(new URL('index.html', root), 'utf8')
const sw = readFileSync(new URL('sw.js', root), 'utf8')

// Adresserne i sw.js, som de bliver, når THREE + '...' er sat sammen.
const base = /const THREE = '([^']+)'/.exec(sw)[1]
const saved = [...sw.matchAll(/THREE \+ '([^']+)'/g)].map((m) => base + m[1])
saved.push(/const FONT_CSS = '([^']+)'/.exec(sw)[1])

test('spillet uden forbindelse: sw.js gemmer alt, index.html henter udefra', () => {
  const { imports } = JSON.parse(/<script type="importmap">([\s\S]*?)<\/script>/.exec(html)[1])
  const needed = new Set()
  for (const [name, url] of Object.entries(imports)) if (!name.endsWith('/')) needed.add(url)
  // import ... from 'three/addons/...' slås op gennem importmap'ens præfiks.
  for (const [, path] of html.matchAll(/from 'three\/addons\/([^']+)'/g)) needed.add(imports['three/addons/'] + path)
  for (const [, url] of html.matchAll(/<link[^>]+href="(https:\/\/[^"]+)"[^>]*rel="stylesheet"/g)) needed.add(url)
  assert.ok(needed.size >= 4, 'fandt ikke adresserne i index.html')
  for (const url of needed) assert.ok(saved.includes(url), `sw.js gemmer ikke ${url}`)
})

test('sw.js kommer med i dist/ og registreres af spillet', () => {
  assert.match(readFileSync(new URL('scripts/build.mjs', root), 'utf8'), /FILES = \[[^\]]*'sw\.js'/)
  assert.match(html, /serviceWorker\.register\('sw\.js'\)/)
})
