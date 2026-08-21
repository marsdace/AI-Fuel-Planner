# Trail Lab · AI Fuel Planner — Technical Doc 02 — FIT File Parsing: The Data Layer

> Audience: developers who want to understand how this program handles Garmin data.
> The previous document explained why the engine is needed. This one covers **where the data comes from**: how a `.fit` file is understood, and the pitfalls to watch out for.

---

## 1. What is FIT

`.fit` (Flexible and Interoperable Data Transfer) is Garmin's watch data format — a **binary protocol** designed for small-memory, low-power watches.

Key trait: **the file is full of "numbers", not "names"**. Which byte is heart rate, and how many bytes it occupies, is interpreted by an external dictionary (the Garmin Profile).

A 65-minute activity with 3915 record points compresses into just **389 KB** — smaller than a phone photo. The same activity is hundreds of KB to several MB in GPX / TCX.

---

## 2. Three-part file structure

A real measured file here is 398,762 bytes, structured as:

```
┌─────────────────────────────────────────────┐
│ Header  14 bytes (Profile version 212.01)    │
├─────────────────────────────────────────────┤
│ Data record area  398,746 bytes              │
│   definition messages + data messages,       │
│   interleaved                                │
├─────────────────────────────────────────────┤
│ File CRC-16  2 bytes = 0xA647                │
└─────────────────────────────────────────────┘
     14 + 398746 + 2 = 398762 bytes (checksum matches)
```

- **Header**: declares "I am FIT, this new, this long"
- **Record area**: the body — definition and data messages alternate
- **Trailer CRC**: tamper-proof checksum for the whole file

---

## 3. Why a parser "can't understand" the file

Parsing a file with a stock library may produce statistics like:

| Message | Count |
|------|------|
| record (one point per second) | 3915 |
| gps_metadata | 3920 |
| **unknown_233 (unrecognized new message)** | **3919** |

`unknown_233` means: **the watch's firmware is newer than the parser's dictionary**. It emits one unrecognized message per second.

> **The watch did record it — the dictionary just can't keep up with the firmware.** This explains why "the watch recorded a lot, but the program only reads part of it."

This program implements FIT decoding in `utils/fit.js` and explicitly handles "skip unknown messages, extract known ones precisely" — it never crashes on unrecognized messages.

---

## 4. Pitfalls when parsing (things we hit in real code)

### 4.1 Missing fields are the norm

Different watches and sport modes have different field sets. Power meters, ClimbPro, heart-rate straps — **when absent, degrade, don't crash**.

Code rule: **treat every field as possibly null**. The program wraps all numeric reads with `safeFloat()`, returning null (not 0 or NaN) for missing values.

### 4.2 Invalid value ≠ 0

`0xFF` for heart rate means "not recorded", not the value 255. Reading it as 255 would inject phantom "peaks" into the HR curve.

### 4.3 Compressed timestamp headers

High-frequency records use 2-byte compressed timestamp headers. A self-written parser must implement this, or record timestamps will be scrambled.

### 4.4 Developer fields

Data from professional devices (Stryd power, CORE temperature) travels in self-describing developer-field messages. The program reads third-party device data here; ordinary users can ignore it.

### 4.5 The max-heart-rate semantic trap

**FIT's `max_heart_rate` is "this session's peak", not your physiological maximum.** Using it as your max pollutes every heart-rate-zone calculation. This program never infers max HR automatically — it uses the user-entered `physiologicalMaxHr`.

---

## 5. What the program extracts from FIT

The program extracts and aggregates these metrics from `.fit` (see `extractFitMetrics` in `utils/fit.js`):

- **Basics**: heart rate (avg/max/zones), pace, ascent, descent, duration, distance
- **Terrain ability**: bucket by gradient (climb ≥ +2% / descent ≤ −2% / else flat) to extract flat pace, uphill VAM, downhill VAM (`extractTerrainSpeed`)
- **HRV status**: note — ordinary activity FIT files **do not contain RR intervals or HRV status data** (requires a heart-rate strap + specific file). So HRV status is entered manually in five tiers (balanced / unbalanced / low / poor / no status)

---

## 6. Conclusion

Understanding FIT is the prerequisite for "data before AI". If you can't read the format, you can only hand the raw data to the AI — and get led astray by its fabricated aid stations.

Next document enters the core: how the fueling rule engine computes.

---
**[中文版](../zh/02-FIT文件解析-数据层.md)**
