# GreenGuard AI — redesigned frontend

This is the complete existing Next.js frontend with an updated interface. The backend is not included. The uploaded project uses TypeScript (.tsx/.ts); that structure is retained so existing types and API integration continue to work.

## Start on Windows

1. Keep a backup of your current frontend folder.
2. Extract this archive. Open its `frontend` folder in VS Code.
3. Copy your existing `.env.local` into this frontend, or run `Copy-Item .env.example .env.local` in PowerShell and set your backend URL.
4. Run `npm ci`, then `npm run dev`.
5. Open http://localhost:3000 and start your partner's backend separately.

Use a Node.js release compatible with the installed Next.js 16 version (Node 22 LTS is a suitable choice). The dependency lockfile is included. Build with `npm run build`; run the production build with `npm start`.

## Connect your partner's backend

Set this in `.env.local`:

```ini
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Restart the frontend after changing these values. If the backend is on your partner's PC, replace localhost with that PC's reachable LAN IP, for example `http://192.168.1.20:8000`. Both computers must be able to reach each other, and the backend must listen on the network and allow your frontend's origin through CORS. If you open the frontend from another device, localhost refers to that device.

The original `src/lib/api.ts` is unchanged, including the upload field names, query parameters, preset requests and PDF download URLs. In particular, it retrieves audit details at `/api/v1/verify/{audit_id}`; the supplied architecture README instead lists `/api/v1/history/{audit_id}`. Confirm which route your partner implements. We preserved the existing frontend contract rather than guessing a replacement endpoint.

## What changed

- Forest-green navigation rail, responsive mobile navigation, persistent desktop toolbar and clearer engine selector.
- Rebuilt overview with workflow illustration, animated metrics, workspace cards and direct links to evidence upload.
- Animated audit counts, benchmark counts, electricity savings and solar values. No fabricated live audit totals; unavailable overview counts show a dash.
- Card lifts, hover treatments, entrance transitions, illustrated data-flow animation and animated meter bars.
- Keyboard-accessible file selection, drag-and-drop states, extension/empty-file checks, remove/replace actions and clear upload readiness.
- Shared upload controls for solar records and optional claim PDFs, plus solar capacity validation.
- Clear connection, loading, error and empty states. Audit history retains search, filters, inspection and export.
- Reduced-motion support, keyboard focus rings, skip link and accessible final counter values.
- Fixed the engine selector passing its previous value when re-running a selected preset. Engine selection is disabled while that request is running.
- Opening the dashboard no longer automatically creates a verification record. Users explicitly run a preset or upload evidence.
- Cleared previous electricity/solar results when a new verification starts so an unsuccessful request does not present the previous result as current.
- The source-quote display now says “Not verified” when the backend verification flag is false.

The hero's small bars are labelled as a workflow illustration, not audit data. Counts of 24 months and 3 workspaces describe the application's design, not a completed verification. Solar sample descriptions already bundled in the original application remain demonstration scenarios; real results still require the backend.

## Validation and remaining checks

- Production compilation, TypeScript checking and route generation completed successfully.
- Confirmed `src/lib/api.ts` is byte-for-byte identical to the uploaded version.
- Browser visual/interaction QA was unavailable: the provided preview launcher passes `--host`/`--strictPort`, which Next.js does not accept. No browser testing is claimed.
- The partner's backend was not provided. End-to-end verification, PDF downloads, engine execution and real solar/fairness responses must be checked against that running service.

Before your demo, test a benchmark and a PDF/CSV upload; switch the analysis engine and verify again; open an audit from history and download its PDF; run solar and fairness checks; check the interface on your phone. The API client retains all original export routes.

## Key files

- `src/app/globals.css`: theme, responsive layout, motion and hover styles.
- `src/components/Header.tsx`: navigation and toolbar.
- `src/components/GreenGuardDashboard.tsx`: overview, state and connection handling.
- `src/components/FileDropzone.tsx`: shared accessible upload controls.
- `src/components/AnimatedNumber.tsx`: reusable counter animation.
- `src/components/VerdictBanner.tsx`: animated electricity result metrics.
- `src/components/SolarVerificationWorkspace.tsx`: solar intake and result counters.
- `src/lib/api.ts`: preserved backend contract.

This archive excludes node_modules, build output and private environment files. Install dependencies locally and restore your environment configuration before running.
