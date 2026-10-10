/* Service worker: spillet kan spilles uden forbindelse, når det har været åbnet én gang med forbindelse.
   På iPhone har et spil på hjemmeskærmen sit eget lager, adskilt fra Safari, så det er første gang,
   det åbnes DERFRA, der tæller. Derfor hentes og gemmes alt, spillet skal bruge, allerede ved
   installationen – også three.js og skrifttypen, som ligger hos andre.

   Listen herunder skal passe med adresserne i index.html (scripts/offline.test.mjs tjekker det).
   Ændres den, så giv lageret et nyt navn: det gamle lager slettes, når den nye worker tager over. */
const CACHE = 'vandsortering-1'
const LOCAL = ['./', 'manifest.webmanifest', 'icons/favicon.svg', 'icons/favicon-32.png', 'icons/apple-touch-icon.png']
const THREE = 'https://cdn.jsdelivr.net/npm/three@0.186.1/'
const REMOTE = [
  THREE + 'build/three.module.min.js',
  THREE + 'build/three.core.min.js',
  THREE + 'examples/jsm/environments/RoomEnvironment.js',
]
const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600&display=swap'

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      await cache.addAll([...LOCAL, ...REMOTE])
      // Skrifttypen er pynt: kan den ikke hentes, virker spillet stadig med systemets skrift.
      // Stilarket peger på selve skriftfilerne, som også gemmes.
      try {
        const css = await fetch(FONT_CSS)
        if (!css.ok) throw new Error(css.status)
        await cache.put(FONT_CSS, css.clone())
        // Samme fil bruges til flere skriftvægte, og addAll afviser gentagelser.
        const files = new Set([...(await css.text()).matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]))
        await cache.addAll([...files])
      } catch (e) {}
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) if (name !== CACHE) await caches.delete(name)
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const local = new URL(request.url).origin === self.location.origin
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      if (local) {
        // Sidens egne filer: altid nyeste udgave, når der er forbindelse, ellers den gemte.
        try {
          const fresh = await fetch(request)
          if (fresh.ok) cache.put(request, fresh.clone())
          return fresh
        } catch (e) {
          const saved = (await cache.match(request)) || (request.mode === 'navigate' && (await cache.match('./')))
          if (saved) return saved
          throw e
        }
      }
      // three.js og skrifttypen: adresserne indeholder versionen, så det gemte er altid det rigtige.
      // index.html peger three.core.js om til den minificerede kerne med en importmap. Gør browseren
      // ikke det, får den her den samme minificerede kerne, så spillet også dér virker uden forbindelse.
      const url = request.url === THREE + 'build/three.core.js' ? THREE + 'build/three.core.min.js' : request
      const saved = await cache.match(url, { ignoreVary: true })
      if (saved) return saved
      const fresh = await fetch(request)
      if (fresh.ok || fresh.type === 'opaque') cache.put(request, fresh.clone())
      return fresh
    })(),
  )
})
