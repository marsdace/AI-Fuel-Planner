# 📚 Trail Lab · AI Fuel Planner — Technical Documentation

A four-part documentation series to help you understand how this program works, or reuse it in your own projects. Adapted from the project's four published articles into open-source software documentation style.

## Contents

| # | Document | Topic | Source Article |
| --- | --- | --- | --- |
| 01 | [Why an Engine: Lessons from the First Experiment](01-Why-an-Engine-Lessons-from-the-First-Experiment.md) | Design motivation, problems exposed by the experiment, V2 principles | Issue 01 · Failure Postmortem |
| 02 | [FIT File Parsing: The Data Layer](02-FIT-File-Parsing-The-Data-Layer.md) | FIT format, three-part structure, parsing pitfalls, extracted metrics | Issue 02 · FIT Deep Dive |
| 03 | [Nutrition Science Baseline](03-Nutrition-Science-Baseline.md) | Theoretical basis for carbs / fluid / sodium / caffeine / protein / gut | Issue 03 · Fueling Baseline |
| 04 | [Fueling Engine Implementation](04-Fueling-Engine-Implementation.md) | ⭐ Numeric core implementation: finish time / carbs / fluid / sodium / caffeine / scheduling / contract / Golden Cases | Issue 04 · Engine v2 |

## How to read

- **Just want the algorithm**: read Part 04 (Fueling Engine Implementation) directly.
- **Follow the data flow from the start**: read 01 → 02 → 03 → 04 in order.

## Related code

- `app.js` — Web version (FIT parsing / profiles / rule engine / charts / AI explanation)
- `09_wxxcx/utils/engine.js` — Mini-program rule engine (same source as Web)
- `09_wxxcx/utils/fit.js` — FIT decoding
- `02_PRD/PRD_Trail_Lab_Engine_v2.0.md` — Full spec (contract / validation / Golden Cases)

> This is an open-source research project (not a commercial product). All numbers are for fueling-algorithm research only and do not constitute medical or sports-nutrition advice; engineering-derived coefficients are marked "pending field calibration".
>
> **[中文版](../zh/README.md)**
