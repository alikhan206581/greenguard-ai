# GreenGuard AI — frontend-compatible backend

A new Python/FastAPI backend written against the provided frontend's `src/lib/api.ts` and `types.ts`. This is NOT a repair or inspection of the inaccessible teammate's backend.zip. It implements all API routes used by the provided frontend. Intended for local development and honest hackathon demonstrations, not unattended lending decisions or public hosting.

## Windows: run without activating a virtual environment

Create a new `backend` folder beside `frontend`, put `main.py` and `requirements.txt` into it, then open PowerShell in that folder. Use Python 3.12 (3.11+ is required):

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

If `py -3.12` is unavailable, run `py -0p` to list installed Python versions; install Python 3.12 if needed. Do not reuse a virtual environment copied from another PC. An execution-policy change is unnecessary because these commands call the venv Python executable directly.

- Health: http://127.0.0.1:8000/health
- Interactive API docs: http://127.0.0.1:8000/docs
- Leave this terminal running. Open a second terminal in `frontend` and run `npm run dev`.
- The SQLite database is created automatically in `data/audits.sqlite3`. No database installation is necessary.

## Frontend connection

Your newer same-origin rewrite setup can remain as it is. In frontend `.env.local`:

```env
BACKEND_URL=http://127.0.0.1:8000
```

Remove an obsolete `NEXT_PUBLIC_API_URL` override if you want requests to use Next.js rewrites. Restart Next.js after changing environment variables. The backend serves `/health`, `/api/health` and `/api/v1/*`.

If still using the older frontend client that calls the backend directly, set instead:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Direct calls from localhost:3000 and localhost:3001 are allowed by CORS. Additional origins can be configured in the backend `.env`.

## Routes implemented

| Method | Route | Purpose |
|---|---|---|
| GET | /health, /api/health | Service and DB check |
| GET | /api/v1/cases | Three synthetic electricity benchmark cases |
| POST | /api/v1/verify | JSON preset request or multipart report_pdf, meter_csv, llm_provider |
| GET | /api/v1/history | Latest 500 electricity reviews, persisted in SQLite |
| GET | /api/v1/verify/{id} | Saved electricity result |
| GET | /api/v1/verify/{id}/export-pdf | Full result PDF |
| GET | /api/v1/solar/cases | Three explicitly synthetic solar scenarios |
| POST | /api/v1/solar/verify | JSON solar_case_id or multipart solar_inverter_csv, optional solar_report_pdf, city, region, installed_capacity_kw |
| GET | /api/v1/solar/{id} | Saved solar result |
| GET | /api/v1/solar/{id}/export-pdf | Solar PDF |
| GET | /api/v1/fairness/audit | Computed synthetic benchmark subgroup statistics |
| GET | /api/v1/fairness/export-csv | Labelled benchmark metrics CSV |
| GET | /api/v1/fairness/adversarial-audit | Source-recheck perturbation experiment; perturbation_pct=0..10 |
| GET | /api/v1/samples/{filename} | Valid sample PDFs and CSVs |

JSON errors use a string `detail` so the existing frontend can display them. Multipart request names match the supplied frontend client exactly. Raw PDFs/CSVs are processed in memory and are not retained; extracted evidence and input hashes are saved in SQLite. Checksums detect accidental stored payload changes but are NOT authenticated signatures or tamper-proof audit logs.

## First successful demo

Select **Deterministic** and choose a case from the frontend. All three electricity cases and three solar scenarios work without cloud services. They are labelled **SYNTHETIC**. Download actual example files to test the upload path:

- http://127.0.0.1:8000/api/v1/samples/case_1_supported.pdf
- http://127.0.0.1:8000/api/v1/samples/case_1_supported.csv
- http://127.0.0.1:8000/api/v1/samples/case_2_overclaim.pdf
- http://127.0.0.1:8000/api/v1/samples/case_2_overclaim.csv
- http://127.0.0.1:8000/api/v1/samples/case_3_incomplete.pdf
- http://127.0.0.1:8000/api/v1/samples/case_3_incomplete.csv
- http://127.0.0.1:8000/api/v1/samples/solar.csv

The supported case claims 20% and has 20% metered savings. The overclaim case claims 40% against 20%. The incomplete case omits two reporting months and returns insufficient evidence.

## Electricity CSV and PDF contract

UTF-8 CSV, exact column names:

```csv
facility_id,facility_name,month,period,grid_kwh,solar_kwh,total_kwh
DEMO-01,Demo facility,2024-01,baseline,1000,0,1000
DEMO-01,Demo facility,2025-01,reporting,700,100,800
```

The snippet illustrates two rows only. A conclusive result requires 12 contiguous months in each period, baseline before reporting, a single facility and no duplicate dates. `total_kwh = grid_kwh + solar_kwh`; here solar_kwh means solar consumed onsite, not gross generation including exports. Net-metering belongs in the solar workspace. Incomplete coverage remains visible but produces insufficient evidence rather than a misleading supported verdict.

Deterministic extraction supports a text PDF with these labels, each on its own line (download the sample for a working PDF):

```text
Company name: DemoWeave
Facility name: Demo facility
Region: Sindh
Business size: Medium
Baseline period: 2024-01 to 2024-12
Reporting period: 2025-01 to 2025-12
Claim boundary: TOTAL_CONSUMPTION_REDUCTION
Claim type: Electricity consumption reduction
Claimed baseline kWh: 12000
Claimed reporting kWh: 9600
Claimed reduction kWh: 2400
Claimed reduction percent: 20
Stated intervention: Equipment efficiency programme
```

Company, facility, periods, boundary and claimed percentage are necessary for a conclusive result. Optional numeric energy claims are also checked when supplied. Unknown/ambiguous values are `null`, NEVER silently replaced with zero. Period strings must use `YYYY-MM to YYYY-MM`. Conflicting duplicate labels are treated as ambiguous. GRID_PURCHASE_ONLY is supported as a separate claim boundary; no total-consumption conclusion should be inferred from it.

Tolerance is 2 percentage points for the claimed saving and max(1 kWh, 1%) for supplied energy claims. These are prototype policy choices, not an international certification. Decimal arithmetic is used for electricity totals; output is rounded to six decimals.

## Optional LLM extraction

- `deterministic`: anchored label extraction. No AI model or vector embeddings involved.
- `ollama`: calls local `/api/chat`; configure `OLLAMA_URL` and `OLLAMA_MODEL` in `.env`. Install/run Ollama and pull the configured model separately.
- `auto`: attempts local Ollama; on service failure falls back to label extraction. Never silently uses a cloud model.
- `openai`: requires OPENAI_API_KEY and configured OPENAI_MODEL in backend `.env`. Explicitly choosing this mode sends report text to the cloud provider. Key stays server-side.

LLM values are accepted only with a matching source quote/page and a value appearing in that quote. This checks grounding, not semantic correctness. All verdict calculations remain deterministic. Scanned PDFs require OCR beforehand. Limit: 10 MB/file, 100 PDF pages, 300k extracted characters, 60k LLM prompt characters. PDF solar-claim extraction is not implemented: optional solar PDF is validated and hashed; claimed solar output comes from the CSV.

## Solar CSV contract

```csv
facility_name,month,grid_import_kwh,solar_generated_kwh,grid_export_kwh,baseline_consumption_kwh,target_consumption_kwh,claimed_solar_kwh
Example site,2024-01,40000,50000,5000,110000,90000,50000
```

Required fields: month, grid_import_kwh, solar_generated_kwh, grid_export_kwh, baseline_consumption_kwh, target_consumption_kwh. Optional: facility_name, claimed_solar_kwh. Values are monthly energy, not cumulative meter registers. Upload one facility, unique completed months, up to 36 months over a maximum three-year window. Targets must be greater than zero. Battery energy flows are not supported.

The old frontend's minimal solar example CSV lacks baseline/target columns. Use this backend's `/api/v1/samples/solar.csv` instead. Do not invent a consumption target: supply and document a justified target for real audits.

User-uploaded solar audits request NASA POWER daily GHI and ambient temperature for the selected city and historical dates. Missing or unavailable weather returns a clear 503 error; no invented fallback. Units are checked. Approximate expected output = capacity × monthly mean daily GHI × number of days × 0.8 × temperature factor. Temperature factor = max(0.5, 1 − 0.004 × max(ambient°C − 25, 0)). This is an approximation, not calibrated PV modelling: no explicit tilt, shading, clipping or cell-temperature simulation.

Synthetic solar presets use a clearly declared 5 kWh/m²/day and 30°C fixture and do not call NASA. Existing response field names `nasa_expected_solar_kwh` are retained for frontend compatibility, but `reference_source`, badge and verdict summary identify the synthetic source.

Total demand = grid import + solar generated − export. The target is supplied, not predicted by scikit-learn. A deficit below −8% triggers possible-fault inspection, not confirmed fault or fraud. High production deviations also require manual review. A near-zero electricity bill does not prove reduced energy consumption.

## Small frontend display corrections

Run the supplied optional compatibility script on your frontend:

```powershell
.\.venv\Scripts\python.exe patch_frontend.py "..\frontend"
```

It backs up changed files as `.backend-backup`, corrects unavailable-number display (`—` instead of zero), marks synthetic fairness evaluations, updates misleading hardcoded scikit-learn/NASA demo labels and points sample downloads at the backend's accepted samples. It does not alter routes, API credentials or overwrite your next.config.mjs. Review the printed list and run `npm run build` afterwards. Your latest frontend may differ; unmatched locations are reported rather than guessed.

## Fairness / robustness limitations

Fairness evaluates 3 synthetic cases repeated across 4 regions × 3 business sizes: 36 fixtures, only 12 genuinely supported cases. Reported FPR = supported truth incorrectly contradicted / supported truth; missing-evidence rate is separate. Wilson 95% intervals are computed. These replicated fixtures are too small/correlated to prove real-world fairness. COMPLIANT is retained for API compatibility and means only the configured benchmark disparity threshold passed, not legal/regulatory certification.

Robustness perturbs the extracted claim percentage around a decision boundary and compares a deliberately unprotected calculation with re-reading the unchanged source claim. It does not simulate forged PDF/meter evidence, adversarial prompts or general attack resistance. No fictitious clipping, winsorization or trained-model defenses are claimed.

Reviewer notes and future forecast snapshots remain browser-local, as in the frontend you already have. This backend saves electricity/solar audit results; it does not synchronize those browser-local notes. Current 7-day Open-Meteo weather stays in the frontend.

## Tests

```powershell
.\.venv\Scripts\python.exe -m unittest -v test_backend
```

Tests cover sample and multipart verification, missing evidence, invalid/duplicate/negative/NaN CSV inputs, period/facility mismatches, zero baselines, SQLite retrieval/checksums, PDF exports, solar scenario outcomes, weather-service failure, fairness and robustness calculations, and local-model fallback. External LLM tests are mocked; they do not require keys or send evidence externally. See verification notes supplied with this delivery for live-service results.

Sources used for integration:
- https://fastapi.tiangolo.com/tutorial/request-forms-and-files/
- https://power.larc.nasa.gov/docs/tutorials/service-data-request/api/
- https://power.larc.nasa.gov/docs/services/api/temporal/daily/
- https://github.com/ollama/ollama/blob/main/docs/api.md
- https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create

## Verification completed for this delivery

- 11 automated test methods passed (including parameterized invalid inputs, three electricity cases and three solar scenarios).
- Patched frontend production build and TypeScript check passed.
- Real HTTP server health, electricity verification, stored PDF export passed.
- Actual Next.js rewrite GET cases, POST verification and `/api/health` returned 200.
- NASA POWER live lookup for Karachi, January 2024 succeeded (monthly means about 4.34918 kWh/m²/day and 20.63258°C).
- Ollama/OpenAI service calls were mocked for automated fallback tests; no live model or cloud key was available. Their response grounding code requires real-service integration testing on your setup.
- User-uploaded solar endpoint was tested with a mocked weather response and weather-service failure; the separate real NASA lookup verifies its upstream parsing. A complete real-facility solar audit has not been validated against measured production.
- Browser visual/interaction QA was not performed. This is a local prototype; it has no user authentication or multi-tenant isolation.
