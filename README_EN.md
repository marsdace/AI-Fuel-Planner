# 🏔️ Trail Lab · AI Fuel Planner

<p align="right">
  <a href="README.md"><img src="https://img.shields.io/badge/%E4%B8%AD%E6%96%87-%E7%89%88%E6%9C%AC-2f6b49?style=for-the-badge" alt="Switch to 中文" /></a>
</p>

> Experiment #001 — Trail-running AI fuel planner.
> Upload Garmin activity data, set a target route, get a quantified fueling plan and an AI-generated, actionable explanation.

**Current release**: pure JavaScript static web app (`web/`) — no framework, no build step, runs directly in the browser.

---

## ✨ About the new JS version

The previous Python + Streamlit prototype is **deprecated and archived** (see `python_legacy/`). The current release is a fully static, client-side web app:

- **Zero-dependency deployment**: vanilla ES2020+, no build step; run from `file://` or any static server
- **In-browser Garmin FIT parsing**: decodes FIT files locally via `@garmin/fitsdk` (esm.sh CDN) — raw data never leaves your machine
- **5-step guided flow**: Historical activity → User profile → Route parameters → Elevation/fuel overview → Rule engine + AI explanation
- **Bilingual**: 中文 / English toggle
- **Animated background**: forest-night sky (`bg.js`)
- **AI explains, code computes**: the rule engine does all calculations; AI only translates results into plain language (data over AI)

### The 5 steps

| Step | What it does |
|------|--------------|
| 1️⃣ Historical activity | Upload a Garmin `.fit` file, or choose "manual profile entry" to skip parsing |
| 2️⃣ User profile | Calibrate HR zones, weight, resting HR, ITRA/UTMB points, etc. |
| 3️⃣ Route parameters | Manual input or read a target activity file; set distance, ascent, weather, official aid stations, and **climb/descent segments (with threshold)** |
| 4️⃣ Route overview | Elevation profile + aid-station layout + climb/descent segment bands for visual confirmation |
| 5️⃣ Rule engine + AI | Generate rule-contract JSON, quantified fueling output, and an AI execution timeline |

### Key new features

- **Unified climb/descent segment input**: set each segment in distance order (type: climb/descent), with a configurable **climb/descent threshold (default 50 m)** — only segments above the threshold count; smaller ones are treated as flat
- **Monotonic elevation curve**: each climb rises linearly from start to end, **its end being that segment's highest point**; descents fall monotonically
- **Auto-extract segments from a target FIT**: climbs/descents are derived from the real elevation track (threshold-filtered) and can be edited manually
- **Full aid-station info cards**: name / distance / D+ climb / D- descent / cutoff, with collision avoidance
- **Chart matches page theme**: forest-green × ember-orange palette, ember line + gradient area; 4-digit altitudes fully visible

---

## 🚀 Quick start

```bash
cd web
# Either:
open index.html                 # open directly (modern browser)
# Or a local static server:
python3 -m http.server 8080
# Then visit http://localhost:8080
```

> Tip: if the FIT SDK (esm.sh) fails to load from `file://`, use the local static server instead.

### A full planning flow

1. **Step 1** — Upload your historical activity file (Garmin `.fit`) and click "Confirm & parse", or click "manual profile entry"
2. **Step 2** — Review/adjust your profile (HR zones, weight, etc.), click "Confirm activity"
3. **Step 3** — Choose "Manual input" or "Read target activity file":
   - Enter distance, total ascent, expected finish time, weather, route notes
   - Set official aid stations (distance/name/cutoff/segment climb/segment descent)
   - Set **climb/descent segments** (type/start/end/height) and the **climb/descent threshold**
4. **Step 4** — Confirm the route elevation overview (segment bands + aid-station info cards)
5. **Step 5** — Pick an AI Provider (start with `mock` to validate), click "Run engine and generate explanation"

---

## 📁 Project structure

```
AI-Fuel-Planner/                 # Repo root = the 03_Code folder
├── README.md / README_EN.md     # Documentation (this file, shown on repo entry)
├── .gitignore
├── .devcontainer/               # VS Code Dev Container config
├── web/                         # ★ Current release: pure JS static web app
│   ├── index.html               #   Page structure (incl. ?v= cache busting)
│   ├── app.js                   #   Logic: FIT parsing / profile / rule engine / chart / AI
│   ├── styles.css               #   Page styles (forest-green × ember theme)
│   ├── bg.js                    #   Forest-night animated background
│   └── README.md                #   Detailed web app docs
└── python_legacy/               # ⚠️ Deprecated Python prototype (archived, unmaintained)
```

---

## 📦 All changes since Commit `7c4403b`

> Below are all **22 commits** between `7c4403b` and HEAD, grouped by topic.

### 🎯 Project direction

- `7654820` **Focused on the JS web app**: deprecated Python prototype archived to `python_legacy/`; the web app in `web/` is the official version
- `2e2d7be` / `4e1d6ef` **Restructured folders**: program files moved back into `03_Code/`; repo root holds docs

### 🧭 Terminology & file roles

- `ce65ca1` User-visible "race/赛事" wording unified to "route/路线" (for non-competition trail users)
- `02a0675` Distinguished the two FIT files: steps 1–2 = "historical activity file", steps 3–4 = "target activity file"; added a "manual profile entry" button in step 1

### ⚙️ Step 3 · Route parameters

- `0f47287` Step-3 polish: tooltip-only hints ("!"), aid-station top alignment, climb-height column, column widths, position validation
- `94a097f` Fixed invisible status bar on steps 2–5 (moved to `stepWorkspace`, sticky + error styling)
- `bd2b6ee` Constrained aid-station distance/climb positions and climb heights (≤ total distance/ascent) with reminders
- `02d5053` Removed the step-3 file-read preview; constrained aid-station segment climbs to total ascent
- `94d62b5` Enforced numeric input types/min/max across all steps
- `ce18fd7` **Auto-generate climb segments** from a target FIT (extracted from the elevation track, editable)
- `bcf6e0f` CP column widths (narrow cutoff, wider climb/descent); full CP info cards on the chart
- `507794e` Added **descent-segment input**; elevation curve now peaks **at each climb's end** (monotonic climb)
- `beb3214` **Merged climb/descent segments into one ordered list** (type/start/end/height) with a configurable **climb/descent threshold (default 50 m)** — only segments above the threshold count; FIT extraction filters by the same threshold

### 📈 Step 4 · Elevation & aid-station overview

- `6864a92` Chart drawn from step-3 confirmed route parameters (climb segments) instead of the raw race-FIT track
- `945bb2c` Restored FIT route display (FIT mode only); draws only step-3 data (removed engine-derived supplemental/climb-trigger markers); simulated baseline starts at 0
- `2f94183` Dynamic step-4 note (FIT real track vs simulated)
- `b4e7849` Show climb segments on the chart (translucent bands + height labels + legend)
- `f3b966e` Aid-station name markers
- `40a8715` Elevation curve drawn only from climb/descent segments (aid stations are markers only); CP info-card collision avoidance
- `98ed5fe` Chart palette matched to the page theme (ember line + gradient area, mint axes, blue CP markers); **fixed 4-digit altitude labels being clipped on the left**

### 📚 Docs & repo housekeeping

- `b53583e` **Docs & housekeeping**: added top-level README (zh/en) and detailed web-app docs; `.gitignore` now ignores personal experiment/content folders; removed the redundant nested `03_Code/.git`

---

## 🧰 Tech stack

- **Frontend**: vanilla JavaScript (ES2020+), HTML5, CSS3 — no framework, no build
- **FIT parsing**: Garmin official JS SDK `@garmin/fitsdk` via esm.sh CDN (local, in-browser)
- **AI explanation**: optional providers (e.g. DeepSeek / Gemini / mock), called from the browser (may hit CORS; use `mock` first)
- **Architecture**: `app.js` business logic / `bg.js` animation, modular separation of concerns

---

## ⚠️ Known limitations

- Trail Running is the only supported sport mode
- Browser-side AI calls may be blocked by CORS / provider security policies; validate the full flow with the `mock` provider first
- `physiological_max_hr` is optional (a warning is shown if missing)
- `.fit` files are personal activity data and are not committed (see `.gitignore`)

---

## 🔗 Related docs

- Web app details: [`web/README.md`](web/README.md)
- Deprecated Python docs: [`python_legacy/README_DEPRECATED.md`](python_legacy/README_DEPRECATED.md)
