/**
 * Pure helpers for WebGL 0G manifest entries — shared contract for frontend + tests.
 * (Backend mirrors rules in `zerogpoolgame/src/utils/webglManifestValidate.js`.)
 */

/** 0G Storage root hash: 32-byte keccak Merkle root as 0x + 64 hex. */
export const ROOT_HASH_HEX_RE = /^0x[a-fA-F0-9]{64}$/

export function normalizeRootHex(h: string): string {
  const s = String(h).trim().toLowerCase()
  return s.startsWith('0x') ? s : `0x${s}`
}

export function cdnAssetUrl(cdnBaseUrl: string, relativePath: string): string {
  const base = cdnBaseUrl.replace(/\/+$/, '')
  const rel = relativePath
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/')
  return `${base}/${rel}`
}

export type ManifestValidationResult = { valid: true } | { valid: false; errors: string[] }

export function validateManifestEntriesFor0g(entries: unknown): ManifestValidationResult {
  const errors: string[] = []
  if (!Array.isArray(entries)) {
    return { valid: false, errors: ['entries must be an array'] }
  }
  if (entries.length === 0) {
    return { valid: false, errors: ['entries must be non-empty'] }
  }
  const seen = new Set<string>()
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i] as Record<string, unknown>
    if (!e || typeof e !== 'object') {
      errors.push(`entries[${i}]: not an object`)
      continue
    }
    const rp = e.relative_path
    const rh = e.root_hash
    const rpStr = typeof rp === 'string' ? rp.trim() : String(rp ?? '').trim()
    const rhStr = typeof rh === 'string' ? rh.trim() : String(rh ?? '').trim()
    if (!rpStr) {
      errors.push(`entries[${i}]: missing relative_path`)
    }
    if (!ROOT_HASH_HEX_RE.test(rhStr)) {
      errors.push(`entries[${i}]: invalid root_hash (expected 0x + 64 hex)`)
    }
    if (e.size_bytes !== undefined && e.size_bytes !== null) {
      const n = Number(e.size_bytes)
      if (!Number.isFinite(n) || n < 0) {
        errors.push(`entries[${i}]: size_bytes must be a non-negative number`)
      }
    }
    if (ROOT_HASH_HEX_RE.test(rhStr)) {
      const key = rhStr.toLowerCase()
      if (seen.has(key)) {
        errors.push(`entries[${i}]: duplicate root_hash ${key.slice(0, 14)}…`)
      }
      seen.add(key)
    }
  }
  return errors.length ? { valid: false, errors } : { valid: true }
}
