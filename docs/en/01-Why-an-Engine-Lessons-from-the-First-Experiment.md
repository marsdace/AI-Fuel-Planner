# Trail Lab · AI Fuel Planner — Technical Doc 01 — Why an Engine: Lessons from the First Experiment

> Audience: developers and runners who want to understand how this program works, or reuse it in their own projects.
> This is the first of four documents. It answers a fundamental question: **why does this program exist, and what problem does it solve?**

---

## 1. Background: how this program came to be

AI Fuel Planner is a tool built by Trail Lab (山野实验室) for Experiment #001. Its core claim is one sentence:

> **The program does the math. The AI only explains.**

This claim was not invented in a vacuum — it came from a failed real-world experiment.

On July 26, 2026, the team carried a 2.5 kg pack to the start of a 32 km trail course with 1500 m of cumulative climb. Two AIs (DeepSeek + Gemini) each generated a fueling plan; the merged plan was tested in the mountains. The experiment ended after 65 minutes (the road was closed), but it brought back two conclusions more valuable than "finishing the course."

---

## 2. Four problems exposed by the experiment

### 2.1 The AI fabricated aid stations that don't exist

DeepSeek wrote "assume an aid station every 10 km" and built a complete staged fueling plan around those **3 fictitious aid stations**. But this course has **no aid stations at all**.

If you followed it without checking — carrying minimal supplies and expecting to "resupply at stations" — you would run out of water and food on a 32 km course.

> **Lesson: the more professional an AI's output looks, the more the program must back it up.**

### 2.2 The AIs hallucinated the course profile

Both models made assumptions about the course's elevation profile (DeepSeek estimated 5–6 h, Gemini 4.5–5.5 h), but neither had the real route data. They weren't analyzing the course — they were describing the course they imagined, with confident tones.

### 2.3 Misuse of the max-heart-rate field

The program used to read `max_heart_rate` directly from the FIT session summary and treat it as **physiological max heart rate**. But that field means "this session's peak" — the baseline file's peak was 178 bpm, yet a low-intensity test reached 185, and a previous 29.7 km activity recorded 198.

With a baseline 7–20 bpm too low, the heart-rate zones shifted down, the AI misread "near-limit" as "moderate-high intensity", and the fueling plan was built on wrong intensity assumptions.

> **One misused field polluted every downstream calculation.**

### 2.4 Load was never modeled

2.5 kg ≈ 3.3% of body weight. Using the empirical coefficient "each 1% load ≈ +2–3 bpm on climbs", the heart rate silently jumped 7–10 bpm on ascents. V1 never modeled "how heavy the supplies are at different stages, and what carrying them costs."

---

## 3. V2 design principles (what this repository implements today)

The failure directly determined V2's architecture principles — the constraints behind this codebase:

| # | Principle | Where it lives in code |
| --- | --- | --- |
| 1 | Heart-rate baseline must be explicit and manually calibratable | `UserProfileBuilder` reads `physiologicalMaxHr`; never inferred from session summary |
| 2 | AI must not output numbers the program didn't compute | The rule engine outputs a structured JSON contract; AI only reads it and explains |
| 3 | Missing data degrades explicitly, never silently assumed | Every field may be null; missing → conservative range + low confidence |
| 4 | Program and AI are decoupled by contract | Numeric layer (engine) and strategy layer (AI explanation) are separated by the contract |

> Implementation: `app.js` (Web) and `09_wxxcx/utils/engine.js` (mini-program) share the same engine.

---

## 4. Quick mental model: how data flows

```
Garmin .FIT file
   ↓  parsed locally in the browser (data never uploaded)
Rule engine (deterministic numeric computation)
   ↓  outputs a numeric contract JSON (evidence chain + confidence + warnings)
AI strategy layer (reads contract only, generates natural-language explanation)
```

---

## 5. Conclusion

This program exists not to be "smarter", but to be **verifiable, reproducible, and hallucination-free**. This first document is the complete archive of that motivation.

Next document covers how the FIT file is understood (the data layer).

---
**[中文版](../zh/01-为什么需要引擎-第一次实验的教训.md)**
