# Trail Lab · AI Fuel Planner — Technical Doc 04 — Fueling Engine Implementation (Core)

> Audience: developers who want to study or reuse this program's numeric core. **This is the most important of the four documents.**
> Code location: `09_wxxcx/utils/engine.js` (mini-program) and the rule engine in `app.js` (Web) share the same source.
> Full spec: `02_PRD/PRD_Trail_Lab_Engine_v2.0.md`.

---

## 0. What the engine is, in one sentence

`TrailLabRuleEngine` is a **deterministic numeric computation core (a pure function)**: it takes two "profiles" (user + race) and outputs a **numeric contract JSON**. It does not touch UI, does not call AI, does not read/write storage — the same input always yields the same output.

```
compute(userProfile, raceProfile, weightKg) → contract JSON
```

The engine computes in a fixed order: **finish time → carbs → fluid → sodium → caffeine → fueling points**, and every output carries `evidence` (citation chain) and `confidence`.

---

## 1. Inputs: two profiles

### 1.1 UserProfileBuilder

Built from FIT data + manual input. Key fields:

```js
{
  ability_score,        // display-only summary; not used in V2 computation
  fatigue_risk,         // HRV 5 tiers → low/medium/high/severe
  terrain_speed,        // {climbVamMh, descentVamMh, flatPaceMinKm} — 3 independent speed params
  vo2max, itra_points,  // ability signals B/C (used as fallback)
  physiological_max_hr, // manually entered physiological max HR (key fix)
  verified_cho_max,     // verified carb cap (gut constraint core)
  sweat_rate, sweat_sodium,  // measured inputs
  caffeine_habit, bmi, ...
}
```

**Key design — ability split**: V1 collapsed "ability score" into one number; V2 splits it into three independent speed parameters (flat pace / uphill VAM / downhill VAM), extracted from a single representative FIT file by gradient buckets (climb ≥ +2% / descent ≤ −2% / else flat). They are **not merged** and go straight into segment-based computation.

**HRV status**: ordinary activity FIT files do not contain RR intervals / HRV status data, so it is entered manually in five tiers (balanced / unbalanced / low / poor / no status), mapped to `fatigue_risk`. Fatigue only corrects **the day's performance**, never pollutes ability.

### 1.2 RaceProfileBuilder

Contains only race data, no user ability. Key fields:

```js
{
  distance_km, ascent_m, descent_m,
  aid_stations_km,       // official CPs (cutoff times → pace cap + carry lower bound)
  climb_segments,        // [distanceKm, ascentM] segments (explicit or normalized fallback)
  steep_segments,        // segments with gradient ≥ 80 m/km → pre-climb fueling points
  supplemental_points_km,// climb triggers + steep pre-fueling
  climb_trigger_m,       // cumulative-ascent trigger (default 250 m)
  max_interval_min,      // max intake interval (default 30 min)
  expected_finish_time_h,// user-entered expected finish (highest priority)
  weather_temp_c, humidity_pct,
}
```

**Segment normalization**: if the user provides no explicit segments, `normalizeSegments` splits by fixed ratios (35% / 35% / 30%) so later computation always has segments, flagged as a fallback.

---

## 2. Core computation: finish time (four-tier layered estimate)

This is the engine's first and most critical computation. Priority:

```
user-entered expected time (user_input — highest priority)
   ↓ if absent
① terrain segment decomposition (terrain)   — ascent÷VAM + descent÷VAM + flat÷pace
   ↓ if terrain incomplete
② ITRA conservative fallback (itra_fallback)
   ↓ if no ITRA
③ VO2max rough fallback (vo2max_fallback)
   ↓ if no VO2max
④ extremely conservative fallback (conservative)
```

### ① Terrain segment decomposition

```js
// VAM already includes horizontal progress; do NOT add flat-equivalent distance (avoids double counting)
t_climb   = total ascent / uphill VAM
t_descent = total descent / downhill VAM
t_flat    = flat distance / speed from flat pace
```

**Terrain completeness check** `terrainCompleteness`: when ascent/descent > 50 m and average gradient > 3%, if the matching VAM is missing → do not silently drop that time; degrade to fallback. Same for missing flat pace.

### ② ITRA conservative fallback

```js
// ITRA km-effort convention: 100 m ascent ≈ 1 km flat
effectiveKm = distance_km + ascent_m / 100
// PI → effective speed linear mapping (PI 300→7.0, 1000→10.5 km/h)
speedKmh = 7.0 + (PI - 300) * 0.005
est = effectiveKm / speedKmh
// conservative: recommendation ×1.08, range [est, est×1.2] (take the slow side)
```

### ③ VO2max rough fallback

```js
vVo2Kmh = 3.5 + 0.3 × VO2max   // theoretical value
sustainKmh = vVo2Kmh × 0.6     // long-distance sustain ≈ 60%
base = (distance / sustainKmh) × climb penalty
// very conservative: recommendation ×1.8, range [×1.4, ×2.1]
```

### ④ Extremely conservative fallback

```js
// generic trail moving band 3.5–5.0 km/h, recommendation on the slow side 3.8
hours = distance / 3.8, range [d/5.0, d/3.5]
```

### Cross-check (when user enters a time)

When the user enters an expected time, the engine cross-checks against the ability-based estimate:

```js
ratio = expected time / ability estimate
ratio < 0.8   → warn "may be too aggressive"
ratio > 1.25  → hint "total is generous"
no warning when estimate confidence is low (avoid the conservative fallback misleading)
```

### Fatigue correction

```js
fatigue_risk  low→×0.96 / medium→×1.0 / high→×1.12 / severe→×1.18
// only applies to high/medium-confidence estimates; low-confidence fallback stays conservative
```

---

## 3. Core computation: carbohydrates

```js
// tier by duration (choTierBand)
< 45min → 0 / 45-75min → 0-30 / 1-2.5h → 30-60 / 2.5-3h → 60-90 / >3h → 60-90

// cap (GI constraint)
ceiling = min(90, verified_cho_max != null ? verified_cho_max : 60)
carbsPerHour = min(tier mid, ceiling)
dualSugar = carbsPerHour >= 60   // ≥60 forces dual sugar
totalCarbs = carbsPerHour × finish time
```

---

## 4. Core computation: fluid & sodium

### Fluid (measured sweat rate first)

```js
if (measured sweat rate sr > 0) {
  range = [0.65×sr, min(1.0×sr, 1.2)] L/h   // capped at 1.2 L/h
  recommendation = range midpoint
} else {
  // environment estimate (low confidence)
  550 + max(0, temp−15)×18 + max(0, humidity−55)×3, clamped to [450, 1100]
}
```

### Sodium (two metrics: concentration × volume)

```js
if (measured sweat sodium) {
  loss(mg/h) = sweat sodium × intake(L/h)
  drink concentration = clamp(loss / intake, 400, 1000) mg/L
}
sodium intake(mg/h) = concentration × intake
// multi-source total capped at 1000 mg/h (warns when exceeded)
```

---

## 5. Core computation: caffeine

```js
budget = body weight × [3, 6] mg
caffeineTier: finishTime < 4h → "optional" / 4-6h → "late" / ≥6h → "staged"
// independent module: only budget + tier; the exact timing is arranged by the AI
```

---

## 6. Core computation: fueling-point scheduling

Fueling points = **CP ∪ climb triggers ∪ steep pre-fueling ∪ time fallback**:

```js
// climb trigger: one point every cumulative climb_trigger_m (default 250 m)
// time fallback: one point every max_interval_min (default 30 min)
// time-window merge: points ≤15 min apart are treated as one fueling moment
//   (no meaningful intake within 15 min) → when merging, keep the real CP (physical point)
// per-point allocation: totals / number of effective points (carbs/fluid/sodium each)
```

Example fueling point:

```js
{ km: 12.0, time_h: 1.42, carbs_g: 61.0, fluid_ml: 340, sodium_mg: 120, source: "cp+time_fallback" }
```

---

## 7. Output: the numeric contract JSON

The engine outputs a contract with `contract_version = "trail_lab_rule_contract_v2"`, four content blocks plus trace data:

```jsonc
{
  "contract_version": "trail_lab_rule_contract_v2",
  "engine_version": "2.0.0",
  "user_profile": { /* profile (incl. confidence) */ },
  "race_profile": { /* race (incl. segments) */ },
  "engine_outputs": {
    "estimated_finish_time_h": 6.5,
    "finish_time_range": [5.9, 7.2],
    "finish_time_source": "user_input | engine_estimate",
    "debug_trace": {
      "finish_time_branch": "terrain | itra_fallback | ...",
      "terrain_completeness": { "ok": false, "missing": ["descent"] },
      "finish_breakdown": { "climb_h": 2.1, "descent_h": 0, "flat_h": 4.4 },
      "cho": { "ceiling": 75, "tier_range": [60, 90] }
    },
    "carbs_per_hour_g": 75, "carb_range_g": [60, 90],
    "fluid_per_hour_ml": 680, "fluid_range_ml": [550, 850],
    "sodium_mg_l": 600, "sodium_per_hour_mg": 480,
    "caffeine_budget_mg": [210, 420],
    "total_carbs_g": 487.5, "total_fluid_ml": 4420, "total_sodium_mg": 3120,
    "fueling_points": [ /* array of fueling points */ ],
    "evidence": { "carbs": ["B5","A7"], "fluid": ["A5"], "sodium": ["A4","A2"], "caffeine": ["A8"] },
    "confidence": { "carbs": "high", "fluid": "high", "sodium": "low", "finish_time": "medium" },
    "warnings": [ "Sodium is a conservative range; measure sweat sodium to raise confidence", ... ]
  }
}
```

### `debug_trace`: why this number

The engine doesn't just return results — it writes **how it computed them** into the contract:
- `finish_time_branch`: which estimation branch the finish time used
- `terrain_completeness`: terrain data completeness (what's missing)
- `finish_breakdown`: hours for climb / descent / flat
- `cho.ceiling`: which verified value capped the carbs

When the AI explains "why this number", it cites `debug_trace` directly; users can verify every step — **no need to trust what happens inside the engine**.

---

## 8. Golden Cases: must pass every version

Fixed inputs verify that outputs match expectations, preventing regressions. G1–G12:

| # | Case | Expected output |
| --- | --- | --- |
| G1 | 55km/3500m/6.5h/verified 75 | Total carbs 487.5g, 20-30min points |
| G2 | 600mg/L × 0.8/1.2 L/h | 480/720 mg/h (two metrics) |
| G3 | measured sweat rate 1.08 L/h | outputs range, no weight-gain cap trigger |
| G4 | 65kg caffeine | budget 195-390mg, tiered by race |
| G5 | no sweat rate / no sweat sodium | conservative range + low + calibrate hint |
| G6 | CP cutoff earlier than estimated arrival | cutoff warning + carry hint |
| G7 | pace far above VO2max theoretical range | "may overestimate" warning; confidence → medium |
| G8 | terrain classification (steep/flat/downhill) | correct bucketing by gradient; climb uses VAM |
| G9 | hrvStatus = poor | fatigue_risk=severe; range widened ±15% |
| G10 | ordinary training file, no HR | no rejection: quantile anchor, medium |
| G11 | BMI < 16 or > 35 | warnings health risk; numbers unaffected |
| G12 | measured vs ITRA estimate diff > 15% | use measured; hint ITRA may lag |

---

## 9. How to call

```js
// Mini-program version
const { TrailLabRuleEngine, UserProfileBuilder, RaceProfileBuilder } = require("./utils/engine.js");
const engine = new TrailLabRuleEngine();
const user = new UserProfileBuilder().build(decodedFit, inputForm);
const race = new RaceProfileBuilder().build(inputForm);
const contract = engine.compute(user, race, weightKg);
```

---

## 10. Engineering coefficient list (all "pending field calibration")

| Coefficient | Value | Purpose |
| --- | --- | --- |
| Climb penalty | `1 + clamp((climb rate −30)/120, 0, 0.6)` | finish-time climb penalty |
| ITRA speed mapping | `7.0 + (PI−300)×0.005` | ITRA fallback |
| ITRA conservatism | rec ×1.08, range [×1, ×1.2] | ITRA fallback slow side |
| VO2max sustain ratio | 0.6, conservative ×1.8 | VO2max fallback |
| Flat-equivalent q | 8 m flat / 1 m vertical | flat distance conversion |
| Fluid cap | min(1.0×sweat, 1.2 L/h) | fluid clamp |
| Temperature correction | +18 mL/h/°C (>15°C) | environment estimate |
| Humidity correction | +3 mL/h/% (>55%) | environment estimate |
| Fueling merge window | ≤15 min | fueling-point merge |

> ⚠️ All of the above are engineering-derived coefficients that need gradual field calibration in real races; before calibration they are marked "pending field calibration" in the contract.

---

## 11. Limitations

- Current implementation focuses on ≤70 km / ≤5000 m; the 100 km+ tactical branch is only a reserved interface
- VO2max and ITRA depend on manual input (activity FIT files don't contain them)
- Sweat rate and sweat sodium have high measurement barriers
- The current version does not store user data by default; the calibration loop is limited to the session

---

## References

- Spec: `02_PRD/PRD_Trail_Lab_Engine_v2.0.md`
- Code: `09_wxxcx/utils/engine.js`, `03_Code/app.js`
- Theory baseline: Doc 03 in this series (Nutrition Science Baseline)
- Data layer: Doc 02 in this series (FIT File Parsing)

---
**[中文版](../zh/04-补给引擎实现.md)**
