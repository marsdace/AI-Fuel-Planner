<p align="center">
  <img src="banner.png" alt="Trail Lab · Trail Run Fuel Planner — trail running fueling planner" width="100%" />
</p>

<h1 align="center">🏔️ Trail Lab · Trail Run Fuel Planner</h1>

<p align="center">
  <strong>Trail running fueling planner</strong> ·
  <em>.FIT activity data (Garmin / Coros etc.) + rule engine · optional AI explainer</em>
</p>

<p align="center">
  <a href="https://marsdace.github.io/trail-run-fuel-planner/"><img src="https://img.shields.io/badge/🚀-Live%20Demo-FF7A00?style=for-the-badge" alt="Live Demo" /></a>
  <a href="https://github.com/marsdace/trail-run-fuel-planner"><img src="https://img.shields.io/github/stars/marsdace/trail-run-fuel-planner?style=for-the-badge&color=FF7A00" alt="GitHub stars" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-1F3D2E?style=for-the-badge" alt="License MIT" /></a>
  <a href="README.md"><img src="https://img.shields.io/badge/🌐-中文-2f6b49?style=for-the-badge" alt="中文" /></a>
</p>

<p align="center">
  <b>Trail Lab Experiment #001</b> — verifying whether technology is worth taking outdoors.<br/>
  <em>Explore the wilderness with technology — making the outdoors more fun, efficient, and safe.</em>
</p>

---

## 🚀 Try it live (GitHub Pages)

> No install, no server needed — open it in your browser, upload your own watch's `.fit` file (Garmin / Coros and other major brands). Parsed locally, data never uploaded.

### 👉 https://marsdace.github.io/trail-run-fuel-planner/

**5-step fueling workflow**: upload historical FIT → calibrate ability profile → set target route → confirm elevation/aid stations → rule engine fueling timeline (optional AI explainer).

---

## ✨ What is this?

**Trail Run Fuel Planner** is a trail-running fueling planner that answers one concrete question for runners and hikers: *how to turn historical activity data into a fueling decision for the next outing.*

Upload a historical activity file (`.fit`) from your watch (Garmin / Coros etc.), set the target route (distance, ascent, aid stations, weather), and a **sports-nutrition rule engine** computes carbohydrate / fluid / sodium intake, a per-point fueling timeline and a take-along checklist — all locally. AI is not the core feature: it is an optional experiment that only translates the engine's output into natural-language advice.

**Core design principle — the rule engine computes, AI only explains (optional)**:

```
Upload Garmin .FIT file
      ↓  (parsed locally in the browser, no upload)
Rule engine computes fueling (carbs / fluid / sodium / points)   ← core feature
      ↓  (deterministic: same input → same output)
Fueling timeline / take-along checklist / export
(optional) AI explainer: restates results, never computes
```

> The program does all the math; the core planning works fully even if you never use AI.

---

## 🎯 Who is it for?

- 🏃 Trail runners / hikers / endurance athletes
- ⌚ Garmin, Coros, Apple Watch users (FIT format)
- 📊 Data-driven athletes who trust verification over marketing
- 🧪 Runners interested in sports nutrition (carbs, electrolytes, fueling rhythm)

---

## ⚡ Key features

- **5-step guided flow**: activity history (FIT/GPX upload or manual profile) → user profile (6-dimension score) → route params → elevation/aid-station overview (with in-station supply menu) → rule-engine fueling timeline (editable, exportable)
- **In-browser parsing**: Garmin's official `@garmin/fitsdk` is loaded on demand and `.fit` is decoded locally; steps 1 & 3 also accept `.gpx` — **raw activity data never leaves your machine**
- **6-dimension ability score**: climb / descent / aerobic / endurance / GI sensitivity / carb tolerance, with an SVG radar, data cards and explanations (heart-rate drift, ITRA, measured field tests)
- **Route modeling**: official aid stations + climb/descent segments (configurable threshold, default 50 m) + course-difficulty factor (fast/standard/technical/alpine) + auto-extract CPs and segments from a GPX/FIT route file
- **Step-4 in-station supply menu**: per aid station you can add/remove in-station real food & drinks, including **custom in-station items** (name + carb content etc.) that feed the engine's station-food allocation
- **Fueling-timeline editor**: add/delete/insert rows; editing distance auto-re-sorts and recomputes segment distance/climb; each point gives one instruction — "electrolyte X ml + plain water Y ml + salt tab N", with at least 1/3 plain water per point
- **Whole-item carry-forward allocation**: indivisible gels / salt tabs are allocated across the whole plan by cumulative deficit so per-point rounding cannot stack into hourly overshoot
- **Fine-tune in-station food / extras**: every item on the timeline (including custom in-station food) can be adjusted with −/＋ and totals recalculate live
- **Carry check + one-click fix**: start carry and each official station's "takeout" must cover the self-point consumption in its segment; shortages are topped up in one click
- **Departure checklist**: supplies + gear groups, asymmetric stepping, and suggested-limit warnings (no hard truncation)
- **Supply/gear icons**: synced with the mini-program `09_wxxcx` (37 icons), consistent across UI and the exported poster
- **Multiple exports**: copy plan text / Excel (`xlsx`, with embedded route chart + checklist) / poster PNG (landscape) / FIT / GPX route files
- **Bilingual · local-first · AI optional**: Chinese/English one-click switch; AI (DeepSeek/OpenAI/Gemini/mock) only explains the engine's output, never computes

---

## 🚀 Quick start

```bash
# Option 1: open directly (modern browser)
open index.html

# Option 2: local static server
python3 -m http.server 8080
# visit http://localhost:8080
```

> Tip: if the FIT SDK (esm.sh) fails to load from `file://`, use the local static server instead.

### A full planning flow

1. **Step 1** — Upload your historical activity file (Garmin / Coros etc. `.fit` or `.gpx`), or choose "manual profile entry"
2. **Step 2** — Calibrate your ability profile: weight / max HR / VO2max / ITRA etc. The "ability score" radar below updates live (with heart-rate-drift endurance analysis)
3. **Step 3** — Set the target route: distance, ascent/descent, weather, course difficulty, official aid stations, climb/descent segments (with threshold); or "read target route FIT/GPX" to auto-fill CPs and segments
4. **Step 4** — Confirm the route elevation overview (elevation profile + aid-station layout + climb/descent bands; click for a wide view). In "in-station supply detail", add/remove real food & drinks per aid station, or add a **custom in-station item**
5. **Step 5** — The rule engine generates the plan directly: summary cards → departure checklist → fueling-timeline editor (add/insert/remove rows, −/＋ fine-tune in-station food & extras, one-click carry fix) → execution reminders. Hit "Export" for text / Excel / poster image / FIT / GPX. Optional: open the bottom AI panel (start with `mock`) to generate an AI explanation

---

## 📁 Project structure

```
trail-run-fuel-planner/         # Repo root = the 03_Code folder
├── index.html                   # ★ Main app (pure JS static web app, loads modules below)
├── app.js                       #   Logic: FIT/GPX parsing / profile / rule engine / chart / Step-4 station supply
├── plan_editor.js               #   Step-5 fueling timeline editor (rows / carry check / supply library / custom)
├── poster.js                    #   Landscape poster export (overrides the legacy portrait export)
├── profile_score.js             #   6-dimension ability score + SVG radar (synced with mini-program)
├── gpx.js                       #   GPX route/activity parser (steps 1 & 3 read .gpx)
├── xlsx.js                      #   Minimal .xlsx generator (Excel export with embedded route chart, zero-dep)
├── icons_data.js + icons/       #   Supply/gear icon dataURLs & PNGs (synced with 09_wxxcx)
├── bg.js                        #   Forest-night animated background
├── styles.css                   #   Page styles (forest-green × ember theme)
├── logo.png / banner.png        #   Brand avatar / README banner
├── qr_miniprogram.jpg           #   Mini-program QR on the poster
├── LICENSE / PROTOCOL_ZH.md / PROTOCOL_EN.md / THIRD_PARTY_NOTICES.md
├── README.md / README_EN.md     #   Documentation (this file)
├── docs/                        # 📚 Technical docs (en/ English · zh/ 中文, 4-part series)
└── python_legacy/               # ⚠️ Deprecated Python prototype (archived)
```

---

## 📚 Technical documentation (docs/)

Want to study how this program works, or reuse it? Start with these four parts (adapted from the project's four published articles):

| Doc | Question it answers |
| --- | --- |
| [01 · Why an Engine](docs/en/01-Why-an-Engine-Lessons-from-the-First-Experiment.md) | Why does this program exist? What did the first experiment expose? |
| [02 · FIT File Parsing](docs/en/02-FIT-File-Parsing-The-Data-Layer.md) | How is a `.fit` file understood? What are the parsing pitfalls? |
| [03 · Nutrition Science Baseline](docs/en/03-Nutrition-Science-Baseline.md) | Why does the engine compute this way? What is the nutritional basis? |
| [04 · Fueling Engine Implementation](docs/en/04-Fueling-Engine-Implementation.md) | ⭐ How is the numeric core implemented? Module-by-module walkthrough |

> Read in order 01 → 04; if you only care about the algorithm, jump straight to Part 04.
> **中文版见 [`docs/zh/`](docs/zh/README.md)**; each document has a language-switch link at the end.

---

## 🧰 Tech stack

- **Frontend**: native JavaScript (ES2020+), HTML5, CSS3 — no framework, no build
- **FIT parsing**: official Garmin JS SDK `@garmin/fitsdk` (via esm.sh CDN, decoded locally in-browser)
- **AI explanation**: optional providers (DeepSeek / OpenAI / Gemini / mock), called directly from the browser
- **Architecture**: `app.js` business logic / `bg.js` animation, modular separation of concerns

---

## ⚠️ Known limitations

- Trail Running sport mode only
- Step 1 rejects non-running FIT files (cycling / skiing etc. do not enter the ability profile)
- Browser-side calls to third-party AI models may be blocked by CORS; use `mock` first to validate the full flow
- `physiological_max_hr` is optional; a hint is shown when omitted
- `.fit` files are personal activity data and are not committed by default (see `.gitignore`)

---

## 📦 Latest updates (2026-09 · v2.1.0 / Engine v2.5)

> The web app is now fully synced with the WeChat mini-program `09_wxxcx` v2.1.0 (Engine v2.5). The repo was renamed to `trail-run-fuel-planner`; the GitHub Pages URL is unchanged.

### 🧮 Engine v2.5 (fueling strategy)

- **Autonomous legs + real-food-first + half-pack drink mix + single ledger**: in-station real food first covers each leg's carb gap; you only carry the remaining gap. Drink mix is rounded to half packs with the shortfall recorded explicitly
- **Effort-distance arrival times**: point arrival is based on "distance + cumulative ascent/100 m", with pace adjusting to difficulty
- **Whole-item carry-forward**: salt tabs / gels are allocated across the whole plan by cumulative deficit so per-point rounding can't stack; each point keeps at least 1/3 plain water
- **Total carry-weight check**: warns when dry goods + two bottles + gear exceed ≈ 8 kg

### 🛠 UI features synced with the mini-program

- **Step 2 · 6-dimension ability score**: radar + data cards + explanations (heart-rate-drift endurance analysis)
- **Step 3 · read GPX/FIT**: auto-generates official aid stations and climb/descent segments; 4 course-difficulty tiers
- **Step 4 · in-station supply detail**: add/remove real food & drinks per aid station, including **custom in-station items**; choices genuinely affect the Step-5 station-food allocation
- **Step 5 · fueling-timeline editor**: official-station takeout, −/＋ fine-tuning of extras & in-station food (custom items shown individually), carry check + one-click fix, supply/gear library & custom items
- **Supply/gear icons**: synced with the mini-program (37 icons), consistent across UI and the exported poster
- **Exports**: copy text / Excel (embedded route chart + checklist) / landscape poster PNG / FIT / GPX route

## 📦 Historical changelog (archive)

### 🥤 Fueling points: plain-water / electrolyte split + whole-item carry-forward

- **Single actionable instruction**: every point now states "electrolyte drink X ml + plain water Y ml + salt tab N" instead of two alternative scenarios ("electrolyte drink or plain water")
- **Plain-water floor**: electrolyte drink (≈ 500 mg/L, check your label) first covers the point's sodium target, but is capped at 2/3 of the fluid — **at least 1/3 plain water per point**, since concentrated electrolyte drinks can make you thirstier
- **Whole-item carry-forward allocation**: indivisible gels / salt tabs are allocated by cumulative deficit across the whole plan: total items = ⌈total target / item size⌉, and the running deficit never exceeds one item, so per-point rounding cannot stack into hourly overshoot
- **Clearer wording**: no more "top up 25 mg (≈ 1 tab)" style phrasing — everything is whole items
- **Carry list in sync**: self-carried fluid is split into "electrolyte + plain water", and gel / salt-tab counts come from the timeline allocation, matching the execution plan exactly

### 🤖 AI output: final answer only

- DeepSeek thinking mode is explicitly disabled (`thinking: disabled`); reasoning chains are never shown or mixed into the output
- An empty final answer is surfaced as a failure prompt instead of falling back to the reasoning chain

### 📄 Export & validation

- **CSV export**: new columns for gels (tabs), electrolyte water (ml), plain water (ml), and salt tabs — ready to use race-day
- **FIT validation**: step 1 validates the sport type and accepts running data only
- **GPX support**: step 3 reads `.gpx` route files and auto-extracts climb/descent segments and CP waypoints

---

### 📦 Commit-level history (since `7c4403b`, archived)

> Below are all **22 commits** between `7c4403b` and HEAD, grouped by topic.

### 🎯 Project direction

- `7654820` **Focused on the JS web app**: deprecated Python prototype archived to `python_legacy/`; the web app at the repo root is the official version
- `2e2d7be` / `4e1d6ef` **Restructured folders**: program files moved back into `03_Code/`; repo root holds docs

### 🧭 Terminology & file roles

- `ce65ca1` Renamed user-facing "race/赛事" wording to "route/路线" for non-competition trail users
- `02a0675` Distinguished the two FIT files (historical vs target activity); added a "manual profile entry" option to step 1

### ⚙️ Step 3 · Route parameters

- `0f47287` Step-3 polish: tooltip-only hints, aid-station top alignment, climb-height column, column widths, position validation
- `94a097f` Fixed status bar invisible outside step 1 (moved to `stepWorkspace`, sticky + error styling)
- `bd2b6ee` Constrained aid-station distance/climb positions to total distance/ascent with reminders
- `02d5053` Removed step-3 file-read preview info; constrained aid-station segment climbs to total ascent
- `94d62b5` Enforced numeric input types/min/max across steps
- `ce18fd7` Auto-generate climb segments from a target FIT (editable manually)
- `bcf6e0f` CP column widths (narrow cutoff, wide climb/descent); full CP info cards on chart
- `507794e` Added descent-segment input; climb end is that segment's peak on the elevation curve
- `beb3214` Merged climb/descent into one ordered list with a configurable threshold (default 50 m)

### 📈 Step 4 · Elevation & fueling overview

- `6864a92` Chart draws from step-3 confirmed route params (climb segments), not raw FIT track
- `945bb2c` Restored real FIT track display (FIT mode only); draws only step-3 data; simulated baseline starts at 0
- `2f94183` Dynamic step-4 notes (real FIT vs simulated)
- `b4e7849` Show climb segments as translucent bands with height labels + legend item
- `f3b966e` Aid-station name markers
- `40a8715` Elevation drawn only from climb/descent segments (CPs are markers only); CP-chip collision avoidance
- `98ed5fe` Chart matches page theme (ember line/area, mint axes, blue CP); fixed 4-digit altitude label clipping

### 📚 Docs & repo hygiene

- `b53583e` Added top-level README (zh/en) with full changelog; gitignore personal experiment/content folders; removed redundant nested `03_Code/.git`
- `efd8f6e` Rooted the git repo at the `03_Code` folder so the README shows on GitHub entry; moved personal `04_Data` out of the repo
- `41e314f` Placed the main program at the repo root (dropped `web/`); updated README structure & quick start

---

## 📜 License & Notices

This project is released under the **MIT License**. The full usage agreement, third-party license notices, data-privacy and disclaimer statements are available at:

- **Full agreement**: [`PROTOCOL_EN.md`](PROTOCOL_EN.md) (English) · [`PROTOCOL_ZH.md`](PROTOCOL_ZH.md) (中文)
- **Third-party licenses**: [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)
- **MIT license text**: [`LICENSE`](LICENSE)

**Copyright**: Copyright (c) 2026 Trail Lab (山野实验室) · marsdace

**Key points**:

- ✅ **MIT open source**: personal/commercial use, modification, distribution, and relicensing allowed; keep the copyright notice
- ✅ **Local-first**: `.fit` files are parsed locally in the browser; raw activity data is not uploaded by default
- ✅ **AI is optional**: only when you actively configure an AI provider are the required profile/route parameters sent to that provider
- ⚠️ **Disclaimer**: output is a general-rule estimate, not medical advice; consult a professional and act according to your own condition
- ℹ️ **Third-party**: Garmin FIT SDK (FIT Protocol License), Google Fonts (OFL), AI services (provider ToS), etc. — see `THIRD_PARTY_NOTICES.md`

---

## 🤝 Contributing

- Issues and PRs are welcome: [Issues](https://github.com/marsdace/trail-run-fuel-planner/issues) · [Pull requests](https://github.com/marsdace/trail-run-fuel-planner/pulls)
- Contributors agree to release their contributions under the MIT license
- Share your fueling data and heart-rate-drift samples in [GitHub Discussions](https://github.com/marsdace/trail-run-fuel-planner/discussions)

---

<p align="center">
  <sub><b>Trail Lab · 山野实验室</b> — verifying with real experiments whether technology is worth taking outdoors.</sub><br/>
  <sub>One failed experiment is worth more than ten paper plans.</sub>
</p>
