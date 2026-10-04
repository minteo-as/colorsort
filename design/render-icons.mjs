/**
 * Laver PNG-ikonerne ud fra design/ikon.svg og icons/favicon.svg.
 * Køres i hånden, når ikonet ændres (Playwright/Chromium skal være installeret):
 *   node design/render-icons.mjs
 * PNG'erne bruges, fordi iOS og Android ikke bruger SVG-ikoner til hjemmeskærmen.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const playwright = await import(process.env.PLAYWRIGHT ?? 'playwright')
const { chromium } = playwright.default ?? playwright
const root = fileURLToPath(new URL('..', import.meta.url))
const icon = readFileSync(`${root}design/ikon.svg`, 'utf8')
const favicon = readFileSync(`${root}icons/favicon.svg`, 'utf8')

/**
 * Android beskærer "maskable" ikoner til en cirkel eller en anden form. Alt vigtigt skal
 * derfor ligge inden for den midterste cirkel (radius 40 %): baggrunden fylder det hele,
 * og resten skaleres ned omkring midten.
 */
function maskable(svg, scale = 0.72) {
  const [, open, defs = '', background, rest] =
    /^(<svg[^>]*>)\s*(<defs>[\s\S]*?<\/defs>)?\s*(<rect[^>]*\/>)([\s\S]*)<\/svg>\s*$/.exec(svg)
  return `${open}${defs}${background}<g transform="translate(256 256) scale(${scale}) translate(-256 -256)">${rest}</g></svg>`
}

const targets = [
  // Hjemmeskærm på iPhone (iOS runder selv hjørnerne – billedet skal være helt firkantet).
  { svg: icon, size: 180, out: 'icons/apple-touch-icon.png' },
  // Installeret app på Android/Chrome (manifest.webmanifest).
  { svg: icon, size: 192, out: 'icons/icon-192.png' },
  { svg: icon, size: 512, out: 'icons/icon-512.png' },
  { svg: maskable(icon), size: 512, out: 'icons/icon-maskable-512.png' },
  // Browserfanen i browsere, der ikke kan vise SVG-ikoner.
  { svg: favicon, size: 32, out: 'icons/favicon-32.png', transparent: true },
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 512, height: 512 } })
for (const t of targets) {
  const svg = t.svg.replace(/width="512" height="512"/, `width="${t.size}" height="${t.size}"`)
  await page.setContent(`<body style="margin:0;background:transparent">${svg}</body>`)
  await page.screenshot({
    path: `${root}${t.out}`,
    clip: { x: 0, y: 0, width: t.size, height: t.size },
    omitBackground: t.transparent ?? false,
  })
  console.log(t.out)
}
await browser.close()
