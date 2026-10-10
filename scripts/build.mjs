/**
 * Samler spillet i dist/, klar til at lægge på webserveren:
 *   node scripts/build.mjs
 *
 * Spillet har intet egentligt build-step – filerne kopieres, og versionsnummeret
 * skrives ind i index.html (<meta name="app-version">), så det kan vises nederst på siden.
 *  - Release-build (RELEASE_VERSION sat af release-workflowen): tagget, fx "0.3.0".
 *  - Ellers: seneste versions-tag + commit-id, fx "0.2.0+c344353". Er commit'en
 *    selv tagget, vises kun versionen. Uden tags bruges versionen i package.json.
 */
import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = `${root}dist/`

// Alt, der skal med på webserveren, ud over index.html.
const FILES = ['.htaccess', 'manifest.webmanifest', 'sw.js', 'icons']

function git(args) {
  try {
    return execSync(`git ${args}`, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return ''
  }
}

function appVersion() {
  const release = process.env.RELEASE_VERSION
  if (release) return release.replace(/^v/, '')
  const described = git("describe --tags --long --abbrev=7 --match 'v[0-9]*'") // fx v0.2.0-3-gc344353
  const m = /^v(.+)-(\d+)-g([0-9a-f]+)$/.exec(described)
  if (m) return m[2] === '0' ? m[1] : `${m[1]}+${m[3]}`
  const { version } = JSON.parse(readFileSync(`${root}package.json`, 'utf8'))
  const commit = git('rev-parse --short=7 HEAD')
  return commit ? `${version}+${commit}` : version
}

// Med eller uden " />" til sidst (Prettier skriver " />").
const placeholder = /<meta name="app-version" content="" ?\/?>/
const html = readFileSync(`${root}index.html`, 'utf8')
if (!placeholder.test(html)) {
  console.error('index.html mangler <meta name="app-version" content="" />')
  process.exit(1)
}

const version = appVersion()
rmSync(dist, { recursive: true, force: true })
mkdirSync(dist)
writeFileSync(`${dist}index.html`, html.replace(placeholder, `<meta name="app-version" content="${version}" />`))
for (const file of FILES) {
  if (!existsSync(`${root}${file}`)) {
    console.error(`${file} mangler`)
    process.exit(1)
  }
  cpSync(`${root}${file}`, `${dist}${file}`, { recursive: true })
}
console.log(`dist/ bygget med version ${version}`)
