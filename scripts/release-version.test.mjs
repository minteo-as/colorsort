import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { checkRelease, highestVersion, parseVersion } from './release-version.mjs'

describe('versionsnumre ved release', () => {
  for (const tag of ['v0.1.1', 'v0.2.0', 'v1.0.0']) {
    it(`0.1.0 -> ${tag} er lovlig`, () => {
      assert.equal(checkRelease(tag, '0.1.0'), null)
    })
  }

  for (const tag of ['v0.1.0', 'v0.1.2', 'v0.3.0', 'v0.2.1', 'v2.0.0', 'v1.0.1', 'v1.1.0', 'v0.0.9']) {
    it(`0.1.0 -> ${tag} afvises`, () => {
      assert.match(checkRelease(tag, '0.1.0'), /følger ikke efter 0\.1\.0/)
    })
  }

  it('første release efter 0.0.0', () => {
    assert.equal(checkRelease('v0.1.0', '0.0.0'), null)
  })

  it('fortæller hvilke versioner der er lovlige', () => {
    assert.match(checkRelease('v0.5.0', '0.1.0'), /v0\.1\.1, v0\.2\.0, v1\.0\.0/)
  })

  for (const tag of ['0.2.0', 'v0.2', 'v0.2.0-beta', 'v01.2.0', 'version1']) {
    it(`tagget "${tag}" har forkert form`, () => {
      assert.match(checkRelease(tag, '0.1.0'), /formen vX\.Y\.Z/)
    })
  }

  it('finder højeste version blandt tags (numerisk, ikke alfabetisk)', () => {
    assert.deepEqual(highestVersion(['v0.9.0', 'v0.10.0', 'v0.2.3', 'ikke-et-tag']), [0, 10, 0])
    assert.equal(highestVersion([]), null)
  })

  it('læser versioner med og uden v', () => {
    assert.deepEqual(parseVersion('v1.2.3'), [1, 2, 3])
    assert.deepEqual(parseVersion('1.2.3'), [1, 2, 3])
  })
})
