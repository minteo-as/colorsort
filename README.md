# colorsort

Et vandsorteringsspil i browseren, bygget med Vue 3. Hæld farverne mellem rørene, indtil hvert rør kun indeholder én farve.

## Kør spillet

Åbn `index.html` i en browser. Der er intet build-step: Vue 3 hentes fra cdnjs og skrifttypen fra Google Fonts.

## Opbygning

Alt ligger i `index.html`:

- **Spillogik** (ren JavaScript, uafhængig af Vue): `canPour`, `pour`, `isSolved`.
- **Solver**: dybde-først-søgning med besøgte tilstande. Bruges til at sikre, at nye baner kan løses, og til Tip-knappen.
- **To lag af tilstand**: `state` er den logiske bane og opdateres med det samme; `tubes` er det, der vises, og indhentes af animationerne.
- **Animationskø pr. rør**: at hælde ud kræver eneret over røret, mens flere rør kan hælde ned i samme rør samtidig (en læse/skrive-lås).
- **Lyd**: syntetiseret med Web Audio API, uden lydfiler. Hældelyden er filtreret brun støj med stigende frekvens, og boblerne er korte stigende sinustoner.

## Funktioner

Fortryd, start forfra, ekstra rør, tip, valg af antal farver (3–10), 12 baner med stigende sværhedsgrad, lys/mørk tilstand og respekt for reduceret bevægelse.

Banen og antallet af farver gemmes i `localStorage` (nøglen `vandsortering`), så man fortsætter, hvor man slap. Efter bane 12 starter spillet forfra fra bane 1.
