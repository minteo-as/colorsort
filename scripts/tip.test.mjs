import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { pathToFileURL } from 'node:url'

// Spillogikken står i index.html. Den klippes ud mellem de to overskrifter og hentes som et modul.
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const logic = html.slice(html.indexOf('/* ---------- Spillogik'), html.indexOf('/* ---------- Lyd:'))
const file = join(mkdtempSync(join(tmpdir(), 'colorsort-')), 'logic.mjs')
writeFileSync(file, logic + '\nexport { CAP, pour, isSolved, solve, generate, clone, planFor, planRest }\n')
const { CAP, pour, isSolved, solve, generate, clone, planFor, planRest } = await import(pathToFileURL(file))

// Faste "tilfældige" tal, så testen laver de samme baner hver gang.
function seeded(seed, fn) {
  const random = Math.random
  Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  try {
    return fn()
  } finally {
    Math.random = random
  }
}
const key = (ts) => ts.map((t) => t.join(',')).join('|')

test('at følge tippet trin for trin løser banen uden at gå i ring', () => {
  for (const colors of [3, 6, 9, 12]) {
    const boards = seeded(colors, () => Array.from({ length: 15 }, () => generate(colors)))
    for (const board of boards) {
      const ts = clone(board)
      const seen = new Set([key(ts)])
      let plan = planFor(null, ts)
      const steps = plan.path.length
      for (let step = 0; !isSolved(ts); step++) {
        assert.ok(step < steps, `flere trin end planens ${steps}`)
        plan = planFor(plan, ts)
        const [a, b] = plan.path[0]
        const rest = planRest(plan, ts, a, b)
        pour(ts, a, b)
        plan = { state: clone(ts), path: rest }
        assert.ok(!seen.has(key(ts)), `tippet førte tilbage til en bane, vi har været i (${colors} farver)`)
        seen.add(key(ts))
      }
    }
  }
})

test('en plan bruges kun til den bane og det træk, den passer til', () => {
  const board = seeded(1, () => generate(5))
  const plan = planFor(null, board)
  const [a, b] = plan.path[0]
  assert.equal(planFor(plan, board), plan)
  assert.deepEqual(planRest(plan, board, a, b), plan.path.slice(1))
  assert.equal(planRest(plan, board, b, a), null)
  const other = clone(board)
  pour(other, a, b)
  assert.equal(planRest(plan, other, a, b), null)
  assert.notEqual(planFor(plan, other), plan)
})

test('løseren bruger kun delvise træk som sidste udvej', () => {
  // Brugerens eksempel: 3 gule kan ikke alle være i røret med plads til 2. Det træk kan hældes
  // lige tilbage igen, så det må ikke være det første, løseren foreslår, når der er et tomt rør.
  const [G, Y, R] = [0, 1, 2]
  const board = [[G, Y], [R, Y, Y, Y], [G, G, R, R], [G, R], []]
  const path = solve(board)
  assert.ok(path && path.length)
  const ts = clone(board)
  for (const [a, b] of path) {
    let run = 0
    for (let i = ts[a].length - 1; i >= 0 && ts[a][i] === ts[a][ts[a].length - 1]; i--) run++
    assert.ok(run <= CAP - ts[b].length, `delvist træk ${a} → ${b} i en bane, der kan løses uden`)
    pour(ts, a, b)
  }
  assert.ok(isSolved(ts))
})
