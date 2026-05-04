/**
 * Load WebGL build: manifest from backend (GET /api/game/webgl-manifest) with static fallback;
 * bytes prefer Cloudflare CDN (manifest.cdnBaseUrl), with 0G indexer touched + full download fallback.
 */
import 'ethers'
import { Blob as ZgStorageBlob, Indexer } from '@0gfoundation/0g-ts-sdk'
import { API_BASE } from './api'
import { cdnAssetUrl, normalizeRootHex, validateManifestEntriesFor0g } from './zeroGManifestSchema'

/** Filter DevTools console with: `ZGP:0g` */
const LOG = '[ZGP:0g-build]'

export type BuildManifestEntry = {
  relative_path: string
  root_hash: string
  size_bytes?: number
}

export type BuildManifest = {
  indexerUrl?: string
  /** Cloudflare (or any HTTPS) base URL where paths match `relative_path` (e.g. https://cdn.example.com/game). */
  cdnBaseUrl?: string
  /** SHA-256 hex of raw manifest JSON from API (when present). */
  manifestContentSha256?: string
  entries: BuildManifestEntry[]
}

const DB_NAME = 'zerogpool-webgl-0g'
const STORE = 'blobs'
const DB_VERSION = 1

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'root_hash' })
      }
    }
  })
  return dbPromise
}

async function idbGet(rootHash: string): Promise<{ blob: Blob; relative_path: string } | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const st = tx.objectStore(STORE)
    const r = st.get(rootHash)
    r.onerror = () => reject(r.error)
    r.onsuccess = () => {
      const v = r.result as { root_hash: string; relative_path: string; blob: Blob } | undefined
      if (!v?.blob) resolve(null)
      else resolve({ blob: v.blob, relative_path: v.relative_path })
    }
  })
}

async function idbPut(entry: BuildManifestEntry, blob: Blob): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const st = tx.objectStore(STORE)
    st.put({
      root_hash: entry.root_hash,
      relative_path: entry.relative_path,
      size_bytes: entry.size_bytes ?? blob.size,
      blob,
    })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

function normalizeManifest(raw: unknown): BuildManifest {
  const j = raw as Partial<BuildManifest>
  if (!Array.isArray(j.entries) || j.entries.length === 0) {
    throw new Error('manifest: missing entries')
  }
  const cdnRaw = j.cdnBaseUrl != null ? String(j.cdnBaseUrl).trim().replace(/\/+$/, '') : ''
  const entries = j.entries.map((e) => ({
    relative_path: String((e as BuildManifestEntry).relative_path).trim(),
    root_hash: String((e as BuildManifestEntry).root_hash).trim(),
    size_bytes: (e as BuildManifestEntry).size_bytes,
  }))
  const vr = validateManifestEntriesFor0g(entries)
  if (!vr.valid) {
    throw new Error(`manifest: ${vr.errors.join('; ')}`)
  }
  const shaRaw = (j as { manifestContentSha256?: unknown }).manifestContentSha256
  const manifestContentSha256 =
    typeof shaRaw === 'string' && /^[a-fA-F0-9]{64}$/.test(shaRaw.trim()) ? shaRaw.trim().toLowerCase() : undefined
  const env = (import.meta as any).env || {}
  const envCdnRaw = String(env.VITE_ZG_WEBGL_CDN_BASE_URL || '')
    .trim()
    .replace(/\/+$/, '')
  const unityUrlRaw = String(env.VITE_UNITY_GAME_URL || '').trim()
  const unityCdnRaw = unityUrlRaw
    ? unityUrlRaw.replace(/\/index\.html$/i, '').replace(/\/+$/, '')
    : ''
  const effectiveCdn = cdnRaw || envCdnRaw || unityCdnRaw

  return {
    indexerUrl: j.indexerUrl,
    entries,
    ...(effectiveCdn ? { cdnBaseUrl: effectiveCdn } : {}),
    ...(manifestContentSha256 ? { manifestContentSha256 } : {}),
  }
}

export async function fetchBuildManifest(): Promise<BuildManifest> {
  const apiUrl = `${API_BASE}/game/webgl-manifest`
  try {
    const res = await fetch(apiUrl, { cache: 'no-store' })
    if (res.ok) {
      const raw = await res.json()
      if (raw && Array.isArray(raw.entries) && raw.entries.length) {
        const m = normalizeManifest(raw)
        const probe = (raw as { storageIndexerProbe?: unknown }).storageIndexerProbe
        const manifestSource = (raw as { manifestSource?: string }).manifestSource
        console.info(`${LOG} manifest from API`, {
          entries: m.entries.length,
          manifestSource: manifestSource || '(unknown)',
          indexerUrl: m.indexerUrl || '(env or default)',
          cdnBaseUrl: m.cdnBaseUrl || '(none — 0G bytes only)',
          cdnSource: (raw as { cdnBaseUrl?: string }).cdnBaseUrl
            ? 'manifest'
            : (import.meta as any).env?.VITE_ZG_WEBGL_CDN_BASE_URL
              ? 'frontend_env_fallback'
              : (import.meta as any).env?.VITE_UNITY_GAME_URL
                ? 'unity_game_url_fallback'
              : 'none',
          ...(m.manifestContentSha256 ? { manifestContentSha256: m.manifestContentSha256 } : {}),
          ...(probe ? { storageIndexerProbe: probe } : {}),
        })
        return m
      }
    } else {
      console.warn(`${LOG} manifest API HTTP ${res.status}`, apiUrl)
    }
  } catch (e) {
    console.warn(`${LOG} manifest API unreachable`, e)
  }

  const url = `${import.meta.env.BASE_URL}manifest.json`
  console.info(`${LOG} fetching manifest (static fallback)`, url)
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`manifest.json HTTP ${res.status}`)
  const m = normalizeManifest(await res.json())
  console.info(`${LOG} manifest OK (static)`, {
    entries: m.entries.length,
    indexerUrl: m.indexerUrl || '(use env or default)',
  })
  return m
}

export function resolveIndexerUrl(manifestIndexer?: string): string {
  const env = String((import.meta as any).env?.VITE_ZG_STORAGE_INDEXER_URL || '').trim()
  if (env) return env
  const m = String(manifestIndexer || '').trim()
  if (m) return m
  return 'https://indexer-storage-turbo.0g.ai'
}

function shouldVerifyCdnRootAgainstManifest(): boolean {
  const v = String((import.meta as any).env?.VITE_ZG_STORAGE_VERIFY_CDN_ROOT ?? '1')
    .trim()
    .toLowerCase()
  return v !== '0' && v !== 'false'
}

/**
 * Recompute 0G Storage Merkle root from bytes (same pipeline as upload) and compare to manifest `root_hash`.
 * Catches CDN corruption, wrong object, or stale CDN file.
 */
async function verifyCdnBlobMatches0gRoot(expectedRoot: string, data: Blob): Promise<boolean> {
  try {
    // SDK types expect `File`; CDN `fetch().blob()` is a `Blob` — same runtime shape for Merkle.
    const zg = new ZgStorageBlob(data as unknown as File)
    const [tree, err] = await zg.merkleTree()
    if (err != null || !tree) {
      console.warn(`${LOG} CDN Merkle tree build failed`, err)
      return false
    }
    const rh = tree.rootHash()
    if (rh == null || rh === '') return false
    const ok = normalizeRootHex(rh) === normalizeRootHex(expectedRoot)
    if (!ok) {
      console.warn(`${LOG} CDN Merkle root mismatch`, normalizeRootHex(expectedRoot), 'vs', normalizeRootHex(String(rh)))
    }
    return ok
  } catch (e) {
    console.warn(`${LOG} CDN Merkle verify error`, e)
    return false
  }
}

/**
 * CDN-first runtime bytes. This frontend no longer falls back to 0G downloadToBlob.
 * `root_hash` is still used for optional integrity verification.
 */
async function fetchBlobForEntry(
  _indexer: Indexer,
  e: BuildManifestEntry,
  cdnBaseUrl: string | undefined,
  label: string,
): Promise<Blob> {
  const cdn = String(cdnBaseUrl || '').trim()
  if (!cdn) {
    throw new Error(`CDN base URL missing for ${e.relative_path} (set cdnBaseUrl / VITE_UNITY_GAME_URL)`)
  }
  const url = cdnAssetUrl(cdn, e.relative_path)
  const t0 = performance.now()
  const res = await fetch(url, { mode: 'cors', cache: 'default' })
  if (!res.ok) {
    throw new Error(`CDN HTTP ${res.status} for ${e.relative_path}`)
  }
  const blob = await res.blob()
  if (!blob.size) {
    throw new Error(`CDN empty body for ${e.relative_path}`)
  }
  const expected = e.size_bytes
  if (expected != null && expected > 0 && blob.size !== expected) {
    throw new Error(`CDN size mismatch for ${e.relative_path}: ${blob.size} vs ${expected}`)
  }

  const verifyRoot = shouldVerifyCdnRootAgainstManifest()
  if (verifyRoot) {
    const ok = await verifyCdnBlobMatches0gRoot(e.root_hash, blob)
    if (!ok) throw new Error(`CDN root_hash mismatch for ${e.relative_path}`)
  }
  console.info(
    `${LOG} CDN`,
    label,
    e.relative_path,
    `${blob.size}b`,
    verifyRoot ? 'verified_root' : 'root_verify_off',
    `${Math.round(performance.now() - t0)}ms`,
  )
  return blob
}

/** Prefer core build first, then StreamingAssets, then the rest. */
export function sortPrefetchOrder(entries: BuildManifestEntry[]): BuildManifestEntry[] {
  const score = (p: string) => {
    if (p.startsWith('Build/')) return 0
    if (p.startsWith('StreamingAssets/')) return 1
    return 2
  }
  return [...entries].sort((a, b) => {
    const d = score(a.relative_path) - score(b.relative_path)
    return d !== 0 ? d : a.relative_path.localeCompare(b.relative_path)
  })
}

function isCoreUnityArtifact(rel: string): boolean {
  return /^Build\/Game\.(data|wasm|framework\.js|loader\.js)$/.test(rel)
}

export function getCoreEntries(manifest: BuildManifest): BuildManifestEntry[] {
  return manifest.entries.filter((e) => isCoreUnityArtifact(e.relative_path))
}

type BridgeFn = (...args: never[]) => unknown
type WindowBridgeBackup = Record<string, BridgeFn | undefined>

/**
 * Unity jslib expects the same globals as `downloadGameR2/Game/index.html`.
 * Must be installed before the loader script runs.
 */
function installUnityBrowserBridge(wallet: string, jwt: string | null): () => void {
  const w = window as unknown as WindowBridgeBackup
  const keys = ['GetWalletAddress', 'GetJWTToken', 'SetWalletAddress', 'SetJWTToken', 'HasWalletAddress'] as const
  const prev: WindowBridgeBackup = {}
  for (const k of keys) prev[k] = w[k] as BridgeFn | undefined

  const resolvedWallet = String(wallet || '').trim()

  w.GetWalletAddress = function (): string {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const urlWallet = urlParams.get('wallet')
      if (urlWallet) return urlWallet
      const stored = localStorage.getItem('walletAddress')
      if (stored) return stored
      return resolvedWallet
    } catch {
      return resolvedWallet
    }
  }

  w.GetJWTToken = function (): string {
    try {
      return localStorage.getItem('jwt_token') || jwt || ''
    } catch {
      return jwt || ''
    }
  }

  w.SetWalletAddress = function (address: string): boolean {
    try {
      localStorage.setItem('walletAddress', address)
      return true
    } catch {
      return false
    }
  }

  w.SetJWTToken = function (token: string): boolean {
    try {
      localStorage.setItem('jwt_token', token)
      return true
    } catch {
      return false
    }
  }

  w.HasWalletAddress = function (): boolean {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('wallet')) return true
      const s = localStorage.getItem('walletAddress')
      return Boolean(s && String(s).trim()) || Boolean(resolvedWallet)
    } catch {
      return Boolean(resolvedWallet)
    }
  }

  console.info(`${LOG} bridge: installed GetWalletAddress / GetJWTToken (Unity WebGL)`)

  return function restoreUnityBrowserBridge() {
    const win = window as unknown as WindowBridgeBackup
    for (const k of keys) {
      const v = prev[k]
      if (v === undefined) delete win[k]
      else win[k] = v
    }
    console.info(`${LOG} bridge: removed (restored previous window hooks if any)`)
  }
}

async function prefetchOne(
  indexer: Indexer,
  e: BuildManifestEntry,
  idx: number,
  total: number,
  cdnBaseUrl: string | undefined,
): Promise<void> {
  const hit = await idbGet(e.root_hash)
  if (hit?.blob?.size) {
    console.info(`${LOG} prefetch [${idx + 1}/${total}] SKIP (IndexedDB)`, e.relative_path, `${hit.blob.size} bytes`)
    return
  }
  const t0 = performance.now()
  console.info(`${LOG} prefetch [${idx + 1}/${total}] FETCH`, e.relative_path, e.root_hash.slice(0, 14) + '…')
  const blob = await fetchBlobForEntry(indexer, e, cdnBaseUrl, 'prefetch')
  await idbPut(e, blob)
  console.info(
    `${LOG} prefetch [${idx + 1}/${total}] STORED`,
    e.relative_path,
    `${blob.size} bytes`,
    `${Math.round(performance.now() - t0)}ms`,
  )
}

/** Resolves when all manifest entries are cached (or were already cached). */
let prefetchDonePromise: Promise<void> | null = null

export type PrefetchProgress = { done: number; total: number; path: string }

let lastProgress: PrefetchProgress = { done: 0, total: 0, path: '' }

export function getBuildPrefetchProgress(): PrefetchProgress {
  return { ...lastProgress }
}

/**
 * Sequential download: skip entries already in IndexedDB.
 * Reuses the same resolved promise after the first successful full pass.
 */
export function startBuildPrefetchFromManifest(): Promise<void> {
  if (prefetchDonePromise) {
    const p = lastProgress
    if (p.total > 0 && p.done === p.total) {
      console.info(`${LOG} prefetch: reuse — already complete (${p.total} file(s) in IndexedDB)`)
    } else if (p.total > 0) {
      console.info(`${LOG} prefetch: reuse — still running (${p.done}/${p.total})`)
    } else {
      console.info(`${LOG} prefetch: reuse — in-flight (wait for per-file logs)`)
    }
    return prefetchDonePromise
  }
  console.info(`${LOG} prefetch: starting (Build/* in parallel, then rest sequentially)`)
  const runStarted = performance.now()
  prefetchDonePromise = (async () => {
    const manifest = await fetchBuildManifest()
    const indexerUrl = resolveIndexerUrl(manifest.indexerUrl)
    console.info(`${LOG} prefetch: indexer`, indexerUrl, manifest.cdnBaseUrl ? `cdn=${manifest.cdnBaseUrl}` : '')
    const indexer = new Indexer(indexerUrl)
    const cdnBaseUrl = manifest.cdnBaseUrl
    const order = sortPrefetchOrder(manifest.entries)
    lastProgress = { done: 0, total: order.length, path: '' }
    const build = order.filter((e) => e.relative_path.startsWith('Build/'))
    const rest = order.filter((e) => !e.relative_path.startsWith('Build/'))
    console.info(
      `${LOG} prefetch: ${order.length} file(s) — ${build.length} under Build/ (parallel), ${rest.length} other (sequential)`,
    )

    if (build.length) {
      lastProgress = { done: 0, total: order.length, path: 'Build/* (parallel)' }
      await Promise.all(
        build.map((e) => prefetchOne(indexer, e, order.indexOf(e), order.length, cdnBaseUrl)),
      )
    }

    let done = build.length
    for (const e of rest) {
      lastProgress = { done, total: order.length, path: e.relative_path }
      await prefetchOne(indexer, e, done, order.length, cdnBaseUrl)
      done += 1
    }

    lastProgress = { done: order.length, total: order.length, path: '' }
    console.info(`${LOG} prefetch: COMPLETE`, `${order.length} file(s)`, `${Math.round(performance.now() - runStarted)}ms total`)
  })()
  prefetchDonePromise.catch((err) => {
    console.warn(`${LOG} prefetch FAILED`, err)
    prefetchDonePromise = null
  })
  return prefetchDonePromise
}

function mimeForPath(relativePath: string): string {
  if (relativePath.endsWith('.wasm')) return 'application/wasm'
  if (relativePath.endsWith('.js')) return 'application/javascript'
  return 'application/octet-stream'
}

async function blobUrlForEntry(
  indexer: Indexer,
  e: BuildManifestEntry,
  label: string,
  cdnBaseUrl: string | undefined,
): Promise<string> {
  let blob: Blob | null = (await idbGet(e.root_hash))?.blob ?? null
  if (!blob?.size) {
    console.info(`${LOG} mount: ${label} not in IDB, fetching`, e.relative_path)
    const t0 = performance.now()
    const b = await fetchBlobForEntry(indexer, e, cdnBaseUrl, label)
    await idbPut(e, b)
    blob = b
    console.info(`${LOG} mount: ${label} stored`, `${b.size}b`, `${Math.round(performance.now() - t0)}ms`)
  } else {
    console.info(`${LOG} mount: ${label} from IndexedDB`, e.relative_path, `${blob.size}b`)
  }
  const buf = await blob.arrayBuffer()
  const url = URL.createObjectURL(new Blob([buf], { type: mimeForPath(e.relative_path) }))
  console.info(`${LOG} mount: ${label} blob URL ready`, url.slice(0, 48) + '…')
  return url
}

function pickCore(entries: BuildManifestEntry[]) {
  const loader = entries.find((f) => f.relative_path.endsWith('.loader.js'))
  const data = entries.find((f) => f.relative_path.endsWith('.data'))
  const fw = entries.find((f) => f.relative_path.endsWith('.framework.js'))
  const wasm = entries.find((f) => f.relative_path.endsWith('.wasm'))
  if (!loader || !data || !fw || !wasm) throw new Error('manifest_missing_core_four')
  return { loader, data, fw, wasm }
}

function removeUnityScripts() {
  document.querySelectorAll('script[data-zgp-unity-inline]').forEach((s) => s.remove())
}

function withWallet(u: string, wallet: string): string {
  if (!wallet || u.startsWith('blob:')) return u
  const sep = u.includes('?') ? '&' : '?'
  return `${u}${sep}wallet=${encodeURIComponent(wallet)}`
}

/**
 * Mount Unity on `canvas` using 0G-cached blobs (IndexedDB or live indexer).
 * Revoke returned blob URLs when tearing down.
 */
export async function mountUnityFrom0gBuild(
  canvas: HTMLCanvasElement,
  wallet: string,
  jwt: string | null,
  status: (s: string) => void,
): Promise<{ instance: unknown; revoke: () => void }> {
  console.info(`${LOG} mountUnity: begin`)
  const removeBridge = installUnityBrowserBridge(wallet, jwt)
  let bridgeActive = true
  const tearDownBridge = () => {
    if (!bridgeActive) return
    bridgeActive = false
    removeBridge()
  }

  try {
    const manifest = await fetchBuildManifest()
    const indexer = new Indexer(resolveIndexerUrl(manifest.indexerUrl))
    const core = pickCore(getCoreEntries(manifest))
    console.info(`${LOG} mountUnity: core four`, {
      loader: core.loader.relative_path,
      data: core.data.relative_path,
      framework: core.fw.relative_path,
      wasm: core.wasm.relative_path,
    })

    status(manifest.cdnBaseUrl ? 'Loading build (CDN + 0G)…' : 'Loading build from 0G…')
    const cdnBaseUrl = manifest.cdnBaseUrl
    const tBlob = performance.now()
    const [loaderUrl, dataUrl, fwUrl, wasmUrl] = await Promise.all([
      blobUrlForEntry(indexer, core.loader, 'loader', cdnBaseUrl),
      blobUrlForEntry(indexer, core.data, 'data', cdnBaseUrl),
      blobUrlForEntry(indexer, core.fw, 'framework', cdnBaseUrl),
      blobUrlForEntry(indexer, core.wasm, 'wasm', cdnBaseUrl),
    ])
    console.info(`${LOG} mountUnity: all blob URLs in`, `${Math.round(performance.now() - tBlob)}ms`)

    const streamingBase = cdnBaseUrl
      ? `${cdnBaseUrl.replace(/\/+$/, '')}/StreamingAssets/`
      : `${window.location.origin}${import.meta.env.BASE_URL}StreamingAssets/`
    console.info(`${LOG} mountUnity: streamingAssetsUrl`, streamingBase)

    const revokeUrls = () => {
      ;[loaderUrl, dataUrl, fwUrl, wasmUrl].forEach((u) => {
        try {
          URL.revokeObjectURL(u)
        } catch {
          /* ignore */
        }
      })
    }

    const instance = await new Promise<unknown>((resolve, reject) => {
      removeUnityScripts()
      const script = document.createElement('script')
      script.async = true
      script.dataset.zgpUnityInline = '1'
      script.src = loaderUrl
      script.onload = () => {
        console.info(`${LOG} mountUnity: loader script executed, calling createUnityInstance`)
        void (async () => {
          try {
            const createUnityInstance = (window as unknown as { createUnityInstance?: unknown })
              .createUnityInstance as
              | ((
                  c: HTMLCanvasElement,
                  cfg: Record<string, unknown>,
                  onProgress?: (n: number) => void,
                ) => Promise<unknown>)
              | undefined
            if (typeof createUnityInstance !== 'function') {
              throw new Error('createUnityInstance_missing')
            }
            status('Unity starting…')
            const inst = await createUnityInstance(
              canvas,
              {
                arguments: [],
                dataUrl: withWallet(dataUrl, wallet),
                frameworkUrl: withWallet(fwUrl, wallet),
                codeUrl: withWallet(wasmUrl, wallet),
                streamingAssetsUrl: streamingBase,
                companyName: 'Kult Games',
                productName: 'ZeroGPool',
                productVersion: '8',
              },
              (p: number) => {
                status(`Loading… ${Math.round(p * 100)}%`)
              },
            )
            console.info(`${LOG} mountUnity: createUnityInstance resolved`)
            const send = (inst as { SendMessage?: (a: string, b: string, c?: string) => void }).SendMessage
            const w = String(wallet || '').trim()
            if (typeof send === 'function' && w) {
              try {
                send.call(inst, 'WebGLBridge', 'ReceiveWalletFromBrowser', w)
                console.info(`${LOG} mountUnity: SendMessage WebGLBridge.ReceiveWalletFromBrowser`, w.slice(0, 10) + '…')
              } catch (e) {
                console.warn(`${LOG} mountUnity: SendMessage wallet skipped`, e)
              }
            }
            resolve(inst)
          } catch (e) {
            console.warn(`${LOG} mountUnity: createUnityInstance error`, e)
            reject(e)
          }
        })()
      }
      script.onerror = () => {
        console.warn(`${LOG} mountUnity: loader script failed to load`, loaderUrl.slice(0, 64))
        reject(new Error('unity_loader_exec_failed'))
      }
      document.body.appendChild(script)
    })

    console.info(`${LOG} mountUnity: done (Unity instance ready)`)
    return {
      instance,
      revoke: () => {
        tearDownBridge()
        revokeUrls()
      },
    }
  } catch (e) {
    tearDownBridge()
    throw e
  }
}
