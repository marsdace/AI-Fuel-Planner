# AI Fuel Planner · Usage Agreement & License Notices

> Version: v1.0 · Updated: 2026-08-10
> This document covers both (a) this project's own license terms and (b) the licenses of third-party components used by this project.

---

## Part 1: Project License (MIT License)

This project (AI Fuel Planner, the public code portion of Trail Lab Experiment #001) is released under the **MIT License**.

- **Copyright**: Copyright (c) 2026 Trail Lab (山野实验室) · marsdace
- **License text**: see the `LICENSE` file in the repository root.

### You may

- **Use**: personally or commercially, including integrating it into your own tools or event services
- **Modify**: freely modify the code to fit your needs
- **Distribute**: copy, publish, and redistribute
- **Relicense**: use or redistribute the code under other licenses in your own projects

### You must retain

- The copyright notice and the MIT license notice above (in a prominent place in any copy or substantial portion of the software)

### We do not provide

- **Any warranty**: the software is provided "AS IS", without warranty of any kind, express or implied
- **Any liability**: the authors and copyright holders are not liable for any claim, damages, or other liability arising from the use of this software

---

## Part 2: Using This Software (User Notice)

### 2.1 Data & Privacy

- **Local-first**: `.fit` files are parsed **locally in your browser** (via the Garmin FIT SDK). Your raw activity data by default **never leaves your device and is never uploaded**.
- **AI explanation is optional**: only when you **actively configure** and call an AI provider (DeepSeek / OpenAI / Gemini) are the user-profile and route parameters required to generate the explanation sent to that provider. That call is made directly from your browser; this project does not proxy or store those requests.
- **Your API keys belong to you**: any API key you enter stays in your browser's local storage only (plain text). This project does not collect or store it.
- **No database by default**: this project does not write `.fit` files or computed results into any database by default (see `.gitignore`).

### 2.2 Medical & Safety Disclaimer

- The tool's output — **carbohydrate, fluid, sodium, heart-rate zones** — is estimated from general sports-nutrition rules and your inputs. It is **not medical advice** and does not replace evaluation by a physician, sports nutritionist, or coach.
- High-intensity exercise carries risk. Consult a professional before starting any training or race, and act according to your own physical condition.
- The authors and copyright holders are not liable for any consequences of exercising/fueling based on this tool's output.

### 2.3 Data Accuracy

- The more accurate your inputs (weight, heart rate, route, weather, etc.), the more reliable the output. The program degrades gracefully on incomplete or abnormal input, but **does not guarantee** correctness under extreme conditions.

---

## Part 3: Third-Party Components Used by This Project

> Full list and license texts: see `THIRD_PARTY_NOTICES.md` in the repository root.

| Component | Purpose | License |
|-----------|---------|---------|
| `@garmin/fitsdk` (JS, v21.212.0) | In-browser FIT parsing | Garmin FIT SDK License |
| `garmin-fit-sdk` (Python, 21.208.0, deprecated) | Legacy FIT parsing | Garmin FIT SDK License |
| Google Fonts (Sora / Noto Sans SC / JetBrains Mono) | Page fonts | SIL OFL 1.1 |
| DeepSeek / OpenAI / Gemini API | Optional AI explanation | Respective provider ToS |
| streamlit / pytest (Python legacy, deprecated) | Legacy web / testing | Apache-2.0 / MIT |

> By using this project you agree to the license terms of the above third-party components and to each AI provider's terms of service.

---

## Part 4: Contributions & Derivatives

- PRs and issues are welcome; contributors agree by default to release their contributions under the MIT License.
- If you build a derivative tool based on this project, please retain the project copyright notice and attribute it as required by the MIT License.

---

*Trail Lab (山野实验室) · Explore the wilderness with technology.*
