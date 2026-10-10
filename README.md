# colorsort

Et vandsorteringsspil i browseren, tegnet i 3D med [three.js](https://threejs.org). Hæld farverne mellem rørene, indtil hvert rør kun indeholder én farve.

## Kør spillet

Åbn `index.html` i en browser. Der er intet build-step: three.js hentes fra jsDelivr og skrifttypen fra Google Fonts.

Til udvikling (Node 22):

```bash
npm install
npm test               # tests
npm run build          # filerne til webserveren i dist/, med versionsnummeret skrevet ind i index.html
npm run format         # formatér koden med Prettier (CI tjekker med npm run format:check)
```

Den eneste afhængighed er Prettier. Spillet selv har intet build-step.

## Opbygning

Spillet ligger i `index.html`, og `sw.js` gør, at det kan spilles uden forbindelse.

- **Spillogik** (ren JavaScript, uafhængig af visningen): `canPour`, `pour`, `isSolved`.
- **Solver**: dybde-først-søgning med besøgte tilstande. Bruges til at sikre, at nye baner kan løses, og til Tip-knappen.
- **To lag af tilstand**: `state` er den logiske bane og opdateres med det samme; `shown` er det, der vises, og indhentes af animationerne.
- **Animationskø pr. rør**: at hælde ud kræver eneret over røret. Flere rør kan hælde samtidig; hælder to i samme rør, venter det andet, til strålen fra det første er stoppet.
- **Glas**: `MeshPhysicalMaterial` med `transmission` bryder lyset, og spejlingerne kommer fra three.js' indbyggede `RoomEnvironment` – ingen billedfiler.
- **Væske med fysik**: overfladen er altid vandret. Røret vippes, til væsken når mundingen, og vinklen regnes ud fra rumfanget, så netop det øverste farvelag løber ud. Rumfang måles med faste prøvepunkter i rørets indre, og hvert farvelag tegnes som rørets indre klippet mellem to vandrette planer.
- **Hældningen**: røret trækkes frem foran sin række, flyttes hen foran målet og hælder skråt forfra, så det aldrig går gennem de andre rør.
- **Kamera**: smalt synsfelt på lang afstand, så alle rækker ses fra næsten samme vinkel. Scenen kan drejes lidt med fingeren og glider tilbage. Den tegnes kun, når noget bevæger sig, så spillet ikke bruger strøm, mens man tænker.
- **Lyd**: syntetiseret med Web Audio API, uden lydfiler. Hældelyden er en regn af bobler efter van den Doels fysiske model af væskelyde: hver boble er en kort sinustone, der dør hurtigt ud og stiger lidt i tone, og tonen afhænger af boblens størrelse. Tonen stiger, mens røret fyldes, og en kort efterklang får det til at lyde, som om vandet er inde i røret.
- **Tastatur og skærmlæser**: oven på hvert rør ligger en usynlig knap, som kan vælges med tastaturet, og som læser rørets indhold op ("Rør 3, fra toppen: blå, lyserød, orange").
- **Reduceret bevægelse**: rørene flyver ikke hen og hælder; portionerne flyttes bare, og der er ingen konfetti.

## Funktioner

Fortryd, start forfra, ekstra rør, tip, 10 niveauer med stigende sværhedsgrad, lys/mørk tilstand, respekt for reduceret bevægelse, og spillet kan lægges på hjemmeskærmen og spilles uden forbindelse.

## Niveauer

- Niveau 1–10 har én farve mere pr. niveau: niveau 1 har 3 farver, niveau 10 har 12.
- Efter 3 løste baner på et niveau går man automatisk op på næste. Tællingen starter forfra, når spillet åbnes, og når man selv vælger et niveau.
- På niveau 10 fortsætter man med nye baner, så længe man vil.
- Niveauet gemmes i `localStorage` (nøglen `vandsortering`), så man fortsætter på samme niveau næste gang.
- Der er højst 7 rør i bredden og 3 rækker. Antallet af rækker vælges, så rørene bliver størst muligt på skærmen, og siden kan ikke scrolle. Med et ekstra rør på niveau 10 er der 15 rør.

## Uden forbindelse

`sw.js` er en service worker, der gemmer spillets filer, første gang det åbnes med forbindelse: siden selv, manifestet, ikonerne, three.js fra jsDelivr og skrifttypen fra Google Fonts. Derefter kan spillet åbnes og spilles uden forbindelse.

- På iPhone har et spil på hjemmeskærmen sit eget lager, adskilt fra Safari. Spillet skal derfor åbnes én gang **fra hjemmeskærmen** med forbindelse, før det virker uden.
- Sidens egne filer hentes altid fra serveren, når der er forbindelse, så en ny version slår igennem med det samme. Det gemte bruges kun, når serveren ikke kan nås.
- Adresserne på three.js og skrifttypen står både i `index.html` og i `sw.js`. `scripts/offline.test.mjs` tjekker, at de passer sammen. Ændres listen i `sw.js`, skal lageret have et nyt navn (`CACHE`).
- Service workeren virker ikke, når `index.html` åbnes direkte som fil; spillet virker stadig, men kun med forbindelse.

## Versioner og releases

`package.json` indeholder altid **seneste udgivne version**. Workflowen retter den selv efter hver release, så den skal ikke rettes i hånden.

Versionsnummeret vises nederst på siden:

- En **release** viser sit tag, fx `Version 0.2.0`.
- **Andre builds** (`npm run build`) viser seneste versions-tag plus commit-id, fx `Version 0.2.0+c344353`.
- Åbnes `index.html` direkte, vises der ingen version.

Releases laves **kun på GitHub**:

1. _Releases → Draft a new release_.
2. Skriv et nyt tag, fx `v0.2.0`, og vælg `main` som _target_.
3. Tryk evt. _Generate release notes_ og derefter _Publish release_.

Det starter `.github/workflows/release.yml`. Først tjekker den:

- at versionen følger lige efter seneste udgivne release (eller `package.json`, hvis der ikke er nogen endnu). Fra `0.1.0` er kun `v0.1.1`, `v0.2.0` og `v1.0.0` tilladt. Den første release er `v0.1.0` (eller `v0.0.1`/`v1.0.0`), fordi `package.json` starter på `0.0.0`,
- at tagget peger på en commit på `main`, og at det ikke er en pre-release.

Derefter:

- kører den testene og bygger med tagget som version,
- lægger den `colorsort-vX.Y.Z.zip` på releasen,
- committer den den nye version i `package.json` til `main`.

Fejler noget, før zip-filen er lagt op, sættes releasen tilbage til **kladde** (draft), og fejlen står i workflow-kørslen. Ret fejlen, og udgiv kladden igen (eventuelt med et andet tag).

Zip-filen pakkes ud direkte på webserveren. Den indeholder `index.html`, `sw.js`, `manifest.webmanifest`, `icons/` og `.htaccess` (cache-regler til Apache).

## Ikon

```
design/ikon.svg         Ikonet (kilde): det venstre rør hælder ned i det midterste.
icons/favicon.svg       Forenklet ikon til browserfanen (to rør, tykke streger).
icons/*.png             Laves ud fra de to SVG'er med: node design/render-icons.mjs
manifest.webmanifest    Navn og ikoner, når spillet lægges på hjemmeskærmen.
```

`render-icons.mjs` kræver Playwright med Chromium. Sti til Playwright kan angives med `PLAYWRIGHT=/sti/til/playwright`.

Tags, der pushes fra kommandolinjen, laver ikke en release.

## CI

`.github/workflows/ci.yml` kører ved hver push til `main` og ved hver pull request: den tjekker formateringen (Prettier), kører testene og `npm run build`. Den byggede `dist/` gemmes som en zip-fil på workflow-kørslen i 30 dage (`colorsort-dist-<commit>`), så man kan hente og afprøve en bestemt version uden at lave en release.
