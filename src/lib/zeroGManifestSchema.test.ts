import { describe, expect, it } from 'vitest'
import {
  ROOT_HASH_HEX_RE,
  cdnAssetUrl,
  normalizeRootHex,
  validateManifestEntriesFor0g,
} from './zeroGManifestSchema'

const GOOD = '0x' + 'ab'.repeat(32)

describe('normalizeRootHex', () => {
  it('adds 0x prefix when missing', () => {
    expect(normalizeRootHex('AB'.repeat(32))).toBe('0x' + 'ab'.repeat(32))
  })
  it('lowercases', () => {
    expect(normalizeRootHex('0x' + 'CD'.repeat(32))).toBe('0x' + 'cd'.repeat(32))
  })
})

describe('ROOT_HASH_HEX_RE', () => {
  it('accepts 66-char root', () => {
    expect(ROOT_HASH_HEX_RE.test(GOOD)).toBe(true)
  })
  it('rejects short hex', () => {
    expect(ROOT_HASH_HEX_RE.test('0xabcd')).toBe(false)
  })
})

describe('cdnAssetUrl', () => {
  it('joins base and path and encodes segments', () => {
    expect(cdnAssetUrl('https://cdn.example.com/game/', 'Build/Game.data')).toBe(
      'https://cdn.example.com/game/Build/Game.data',
    )
    expect(cdnAssetUrl('https://cdn.example.com', 'a b/c')).toBe('https://cdn.example.com/a%20b/c')
  })
})

describe('validateManifestEntriesFor0g', () => {
  it('accepts valid minimal entry', () => {
    const r = validateManifestEntriesFor0g([
      { relative_path: 'Build/Game.loader.js', root_hash: GOOD, size_bytes: 100 },
    ])
    expect(r.valid).toBe(true)
  })
  it('rejects bad root_hash', () => {
    const r = validateManifestEntriesFor0g([
      { relative_path: 'Build/x.js', root_hash: '0x12', size_bytes: 1 },
    ])
    expect(r.valid).toBe(false)
    if (!r.valid) expect(r.errors.some((e) => e.includes('root_hash'))).toBe(true)
  })
  it('rejects duplicate root_hash', () => {
    const r = validateManifestEntriesFor0g([
      { relative_path: 'a', root_hash: GOOD },
      { relative_path: 'b', root_hash: GOOD },
    ])
    expect(r.valid).toBe(false)
  })
})
