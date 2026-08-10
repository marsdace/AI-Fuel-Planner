<p align="center">
  <img src="banner.png" alt="Trail Lab · AI Fuel Planner — AI-powered trail running fueling planner" width="100%" />
</p>

<h1 align="center">🏔️ Trail Lab · AI Fuel Planner</h1>

<p align="center">
  <strong>AI-powered trail running fueling planner</strong> ·
  <em>Garmin .FIT data + rule engine + AI fueling timeline</em>
</p>

<p align="center">
  <a href="https://marsdace.github.io/AI-Fuel-Planner/"><img src="https://img.shields.io/badge/🚀-Live%20Demo-FF7A00?style=for-the-badge" alt="Live Demo" /></a>
  <a href="https://github.com/marsdace/AI-Fuel-Planner"><img src="https://img.shields.io/github/stars/marsdace/AI-Fuel-Planner?style=for-the-badge&color=FF7A00" alt="GitHub stars" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-1F3D2E?style=for-the-badge" alt="License MIT" /></a>
  <a href="README.md"><img src="https://img.shields.io/badge/🌐-中文-2f6b49?style=for-the-badge" alt="中文" /></a>
</p>

<p align="center">
  <b>Trail Lab Experiment #001</b> — verifying whether technology is worth taking outdoors.<br/>
  <em>Explore the wilderness with technology — making the outdoors more fun, efficient, and safe.</em>
</p>

---

## 🚀 Try it live (GitHub Pages)

> No install, no server needed — open it in your browser, upload your own Garmin `.fit` file. Parsed locally, data never uploaded.

### 👉 https://marsdace.github.io/AI-Fuel-Planner/

**5-step fueling workflow**: upload historical FIT → calibrate ability profile → set target route → confirm elevation/aid stations → rule engine + AI fueling timeline.

---

## ✨ What is this?

**AI Fuel Planner** solves a concrete problem for trail runners and hikers: *how to turn historical activity data into a fueling decision for the next outing.*

Upload your Garmin watch's historical activity file (`.fit`), set the target route (distance, ascent, aid stations, weather), and the program computes **carbohydrate / fluid / sodium intake and a fueling timeline** using a sports-nutrition rule engine, then an **AI generates an actionable natural-language explanation**.

**Core design principle — data first, AI second**:

```
Upload Garmin .FIT file
      ↓  (parsed locally in the browser, no upload)
Rule engine computes fueling (carbs / fluid / sodium / points)
      ↓  (deterministic — the program's job)
AI generates the natural-language explanation (optional — explain only)
```

> The program does all the math; AI only translates the results into actionable advice — AI is forbidden from inventing numbers.

---

## 🎯 Who is it for?

- 🏃 Trail runners / hikers / endurance athletes
- ⌚ Garmin, Coros, Apple Watch users (FIT format)
- 📊 Data-driven athletes who trust verification over marketing
- 🧪 Runners interested in sports nutrition (carbs, electrolytes, fueling rhythm)

---

## ⚡ Key features

- **In-browser Garmin FIT parsing**: decodes via the official `@garmin/fitsdk`; runs from `file://` or any static server — **raw activity data never leaves your machine**
- **5-step guided flow**: activity history → user profile → route params → elevation/fuel overview → rule engine + AI
- **Climb/descent segment modeling**: segmented by gradient with a configurable threshold (default 50 m) to tune fueling density
- **Fuel-point planning**: official CP input + automatic equivalence splitting + climb triggers + time fallback
- **Rule-contract JSON**: every number comes from the rule engine as a fixed contract; AI only explains, never fabricates
- **Bilingual**: Chinese / English one-click switch
- **Zero-dependency deploy**: native ES2020+, no framework, no build step
- **Swappable AI**: DeepSeek / OpenAI / Gemini / mock

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

1. **Step 1** — Upload your historical activity file (Garmin `.fit`), or choose "manual profile entry"
2. **Step 2** — Calibrate your ability profile (HR zones, weight, resting HR, ITRA/UTMB points)
3. **Step 3** — Set the target route: distance, ascent, weather, official aid stations, climb/descent segments (with threshold)
4. **Step 4** — Confirm the route elevation overview (elevation profile + aid-station layout + segment bands)
5. **Step 5** — Pick an AI provider (start with `mock` to validate), click "Run engine and generate explanation"

---

## 📁 Project structure

```
AI-Fuel-Planner/                 # Repo root = the 03_Code folder
├── index.html                   # ★ Main app (pure JS static web app)
├── app.js                       #   Logic: FIT parsing / profile / rule engine / chart / AI
├── styles.css                   #   Page styles (forest-green × ember theme)
├── bg.js                        #   Forest-night animated background
├── logo.png                     #   Trail Lab brand avatar
├── banner.png                   #   README banner
├── LICENSE                      #   MIT license
├── PROTOCOL_ZH.md / _EN.md      #   Usage agreement & license notices (EN/中文)
├── THIRD_PARTY_NOTICES.md       #   Third-party licenses
├── README.md / README_EN.md     #   Documentation (this file)
└── python_legacy/               # ⚠️ Deprecated Python prototype (archived)
```

---

## 🧰 Tech stack

- **Frontend**: native JavaScript (ES2020+), HTML5, CSS3 — no framework, no build
- **FIT parsing**: official Garmin JS SDK `@garmin/fitsdk` (via esm.sh CDN, decoded locally in-browser)
- **AI explanation**: optional providers (DeepSeek / OpenAI / Gemini / mock), called directly from the browser
- **Architecture**: `app.js` business logic / `bg.js` animation, modular separation of concerns

---

## ⚠️ Known limitations

- Trail Running sport mode only
- Browser-side calls to third-party AI models may be blocked by CORS; use `mock` first to validate the full flow
- `physiological_max_hr` is optional; a hint is shown when omitted
- `.fit` files are personal activity data and are not committed by default (see `.gitignore`)

---

## 📦 All changes since Commit `7c4403b`

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

- Issues and PRs are welcome: [Issues](https://github.com/marsdace/AI-Fuel-Planner/issues) · [Pull requests](https://github.com/marsdace/AI-Fuel-Planner/pulls)
- Contributors agree by default to release their contributions under the MIT License
- Share your fueling data and heart-rate-drift samples in [GitHub Discussions](https://github.com/marsdace/AI-Fuel-Planner/discussions)

---

<p align="center">
  <sub><b>Trail Lab · 山野实验室</b> — verifying with real experiments whether technology is worth taking outdoors.</sub><br/>
  <sub>One failed experiment is worth more than ten paper plans.</sub>
</p>
