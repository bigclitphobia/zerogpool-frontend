# ZeroGPool — Frontend

React + TypeScript frontend for ZeroGPool — a verifiable on-chain pool billiards game powered by the 0G stack.

The frontend loads the Unity WebGL game build directly from **0G Storage**, verifies every file against its on-chain Merkle root, and talks to the backend for player auth, stats, and 0G Compute-powered AI insights.

---

## Features

- **Wallet login** via Privy (embedded + external wallets)
- **Unity WebGL** game loaded from 0G Storage — Merkle-verified on every load, CDN-accelerated with fallback to 0G indexer
- **Profile page** — stats, player intelligence badges, AI coaching tips, difficulty recommendation, and performance insight (all TEE-verified via 0G Compute)
- **Leaderboard** with skill levels and AI commentary
- **Referral system**

---

## Quick Start

```bash
yarn install
cp .env.example .env   # fill in required keys
yarn dev
```

App runs at `http://localhost:5173` by default.

---

## Environment Variables

See `.env.example` for the full list.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_BACKEND_URL` | Yes | Backend API base URL (e.g. `https://zerogpoolgame.onrender.com/api`) |
| `VITE_PRIVY_APP_ID` | Yes | Privy application ID |
| `VITE_CHAIN_ID` | Yes | EVM chain ID (`16600` for 0G testnet) |
| `VITE_CHAIN_ID_HEX` | Yes | Hex chain ID (`0x40D8`) |
| `VITE_ALLOWED_RPC_URL` | Yes | RPC URL (`https://evmrpc.0g.ai`) |
| `VITE_UNITY_GAME_URL` | No | Override iframe URL for Unity game |
| `VITE_ZG_STORAGE_INDEXER_URL` | No | Override 0G storage indexer URL |
| `VITE_ZG_STORAGE_VERIFY_CDN_ROOT` | No | `1` (default) — verify CDN bytes match manifest Merkle root. Set `0` to skip (debug only) |
| `VITE_ZG_WEBGL_CDN_BASE_URL` | No | CDN origin for WebGL static files |

---

## Scripts

```bash
yarn dev        # Vite dev server with HMR
yarn build      # TypeScript check + Vite production build
yarn preview    # Preview production build locally
yarn test       # Vitest — manifest schema + unit tests
yarn lint       # ESLint
```

---

## 0G Storage — How Game Loading Works

1. Frontend calls `GET /api/game/webgl-manifest` to get file entries with `root_hash` and `indexerUrl`.
2. For each file: CDN fetch first (fast), then recomputes the **0G Merkle root** using `@0gfoundation/0g-ts-sdk` and compares against `root_hash` in the manifest.
3. Mismatch or CDN miss → falls back to `downloadToBlob` from the 0G indexer directly.
4. Files are cached in **IndexedDB** (`zerogpool-webgl-0g`) to avoid re-downloading unchanged builds.

Set `VITE_ZG_STORAGE_VERIFY_CDN_ROOT=0` to skip Merkle verification (not recommended in production).

---

## Profile Page — AI Insights

The profile page pulls data from three endpoints after the user clicks **"Get AI Insights"**:

| Endpoint | What it returns |
|----------|----------------|
| `GET /api/player/coaching` | 3 personalised shot coaching tips |
| `GET /api/player/insight` | One-sentence leaderboard performance insight |
| `GET /api/player/difficulty` | Difficulty recommendation + PvP readiness |

All three are rate-limited (20 req / 15 min per IP) and TEE-verified via 0G Compute. Player intelligence (skill level, play style, reaction speed) auto-loads from `GET /api/0g/player-memory/:wallet` on page mount — no rate limit.

---

## Project Structure

```
src/
├── assets/          # Images, icons, ball sprites
├── components/      # Layout, ProtectedRoute, BlockchainToast
├── context/         # BlockchainToastContext
├── lib/
│   ├── api.ts       # All backend API calls + auth token utilities
│   ├── zeroGGameBuild.ts     # 0G Storage game loader
│   └── zeroGManifestSchema.ts # Manifest validation schema
├── pages/
│   ├── HomePage.tsx
│   ├── GamePage.tsx
│   ├── ProfilePage.tsx   # Stats + intelligence + AI insights
│   ├── LeaderboardPage.tsx
│   ├── RulesPage.tsx
│   ├── NFTPage.tsx
│   └── AutoLogin.tsx
└── App.tsx          # Routes
```

---

## Production Notes

- Set `VITE_BACKEND_URL` to the deployed backend (no trailing slash).
- Ensure the backend `ALLOWED_ORIGINS` includes the deployed frontend domain.
- After every 0G Storage upload, sync the manifest: `yarn sync:webgl-0g-manifest` (run from this directory).
