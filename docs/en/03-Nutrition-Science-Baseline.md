# Trail Lab · AI Fuel Planner — Technical Doc 03 — Nutrition Science Baseline

> Audience: users and developers who want to understand "why the program computes this way".
> The previous document covered the data layer (FIT). This one explains the **nutritional basis behind the engine**: the theoretical baselines for carbs, fluid, sodium, caffeine, protein, and gut tolerance. These baselines are where the coefficients in `engine.js` come from.

> ⚠️ This program is an **open-source research project**. The content below is for fueling-algorithm research only and does not constitute medical or sports-nutrition advice; engineering-derived coefficients are marked "pending field calibration".

---

## 1. Carbohydrates: tiered by duration, main range 60–90 g/h

How much carb you need depends on **duration and intensity**, not body weight (Jeukendrup's ladder model):

| Duration | Carb target | Sugar source |
|---------|---------|------|
| < 45 min | No fueling needed | - |
| 45–75 min | Minimal, or rinse only | - |
| 1–2.5 h | 30–60 g/h | Single carbohydrate |
| 2.5–3 h | 60–90 g/h | Multiple-transporter (dual sugar) |
| > 3 h | 90–120 g/h (requires gut training) | Dual sugar |

**Why is 60 g/h the threshold?** Glucose is absorbed via SGLT1; single-source oxidation tops out around 60 g/h. Fructose uses the GLUT5 channel, so a glucose + fructose combination (~1:0.8) can exceed this ceiling.

**This program's cap rule** (`engine.js` CHO model):

```
target rate = min(tier value, 90, verified_cho_max)
no verified data → default cap 60 + low confidence
≥ 60 g/h → dual sugar forced
global cap = min(90, verified_cho_max)   # gut constraint
```

**Verified carb cap**: what you can eat in a race is the rate you have genuinely achieved in training without gut issues — not a number the model or AI invents.

---

## 2. Fluid: by individual sweat rate, not a fixed value

Sweat rate varies enormously between individuals — **0.5–4.0 L/h** — so a fixed refueling rate is invalid. You measure your own:

```
sweat rate = (pre-exercise weight − post-exercise weight + fluid intake − urine) ÷ duration
```

**This program's fluid model** (`engine.js` Fluid model):

```
recommended range = [0.65 × sweat rate, 1.0 × sweat rate]
cap: body weight must not increase during exercise
measured sweat rate → use it; otherwise estimate from environment + weight + intensity
       → output a conservative 400–800 mL/h range + low confidence + "please calibrate" hint
```

Goal: avoid weight loss beyond 2%; but **do not drink to weight gain** — overhydration risk outweighs mild dehydration.

---

## 3. Sodium: by "concentration × intake volume", not a single mg/h

Sweat sodium concentration varies enormously (10–100 mEq/L) — for the same sweat volume, sodium loss can differ by multiples. A fixed dose will underdose some and overdose others.

```
sodium intake (mg/h) = drink sodium concentration (mg/L) × intake volume (L/h)
                     + salt capsules (mg) + salty food (mg)
```

**Example**: 600 mg/L drink at 0.8 L/h → 480 mg/h; at 1.2 L/h → 720 mg/h. **Same concentration, very different intake — reporting only mg/h is incomplete.**

Reference ranges: ACSM suggests 300–600 mg/h, 600–1000 mg/h in hot/high-sweat conditions.

**This program's sodium model**: outputs "concentration + actual intake" as two metrics; uses conservative ranges when sweat sodium is unknown; caps multi-source total at 1000 mg/h.

---

## 4. Caffeine: modeled independently

```
caffeine budget = body weight (kg) × [3, 6] mg
```

- < 4 h: optional
- 4–6 h: use in the latter half
- > 6 h: staged use (sleep warning at night)
- Provides no energy — it "tricks" the brain's fatigue perception; individual response varies, so test a small dose before race day

---

## 5. Protein: matters above 50 km

- Fat is 1 g ≈ 9 kcal, more than double carbs; its contribution to fuel rises at low intensity
- Continuous downhill is eccentric work that damages muscle; a little protein during the race slows breakdown and lowers central fatigue
- Within 2 h after the race, take protein + carbs to start muscle repair and glycogen synthesis

**This program**: the protein model activates above 50 km (5–10 g/h during, protein + carbs within 2 h after).

---

## 6. Gut tolerance: the global cap

During running, blood flows to muscles and the gut is underperfused, so digestive capacity drops sharply. The cap = **the rate you have personally verified you can eat** — not a number the model or AI computes.

**This program**: global cap `min(90, verified_cho_max)`; if `verified_cho_max` is missing, default 60 + low confidence; the F4 tier (90–120) is only opened when measured ≥ 90 and flagged "gut-trained / historically verified".

---

## 7. Distance staging: theory is universal, execution is tiered

- **Underlying principles** apply to all single-stage ultramarathons (100 km, 168 km, UTMB-level) and multi-day races
- **Execution cannot be one-size-fits-all**: ≤70 km follows "performance-oriented" (fluid + gels); 100 km+ follows "tactical-oriented" (real food / hot fluids at night / protein frequency / caffeine rotation)
- The current version focuses on ≤70 km / ≤5000 m; the 100 km+ tactical branch is only a reserved interface

---

## 8. References (abridged)

- [A4] Sawka MN, et al. ACSM Position Stand: Exercise and Fluid Replacement. 2007. (fluid)
- [A5] McDermott BP, et al. NATA Position Statement: Fluid Replacement. 2017. (sweat rate)
- [A8] Guest NS, et al. ISSN Position Stand: Caffeine. 2021. (caffeine)
- [B5] Jeukendrup A. A Step Towards Personalized Sports Nutrition. 2014. (carb ladder)
- [B6] Rowlands DS, et al. Fructose-Glucose Composite CHO. 2015. (dual sugar)
- [B7] Jeukendrup AE. Training the Gut for Athletes. 2017. (gut training)

Next is the core: **the complete fueling rule engine implementation**.

---
**[中文版](../zh/03-补给科学基线.md)**
