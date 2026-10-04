# colorsort

Et vandsorteringsspil i browseren, bygget med Vue 3. Hæld farverne mellem rørene, indtil hvert rør kun indeholder én farve.

## Kør spillet

Åbn `index.html` i en browser. Der er intet build-step: Vue 3 hentes fra cdnjs og skrifttypen fra Google Fonts.

`npm run build` samler filerne til webserveren i `dist/` og skriver versionsnummeret ind i `index.html`. `npm test` kører testene. Begge kræver kun Node 22 – der er ingen afhængigheder at installere.

## Opbygning

Alt ligger i `index.html`:

- **Spillogik** (ren JavaScript, uafhængig af Vue): `canPour`, `pour`, `isSolved`.
- **Solver**: dybde-først-søgning med besøgte tilstande. Bruges til at sikre, at nye baner kan løses, og til Tip-knappen.
- **To lag af tilstand**: `state` er den logiske bane og opdateres med det samme; `tubes` er det, der vises, og indhentes af animationerne.
- **Animationskø pr. rør**: at hælde ud kræver eneret over røret, mens flere rør kan hælde ned i samme rør samtidig (en læse/skrive-lås).
- **Lyd**: syntetiseret med Web Audio API, uden lydfiler. Hældelyden er filtreret brun støj med stigende frekvens, og boblerne er korte stigende sinustoner.

## Funktioner

Fortryd, start forfra, ekstra rør, tip, valg af antal farver (3–10), stigende sværhedsgrad, lys/mørk tilstand og respekt for reduceret bevægelse.

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

Zip-filen pakkes ud direkte på webserveren. Den indeholder `index.html` og `.htaccess` (cache-regler til Apache).

Tags, der pushes fra kommandolinjen, laver ikke en release.
