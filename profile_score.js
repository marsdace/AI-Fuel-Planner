// Trail Lab Web 版用户能力评分（六维）
// 移植自 09_wxxcx/utils/profile_score.js（2026-08-28），适配 Web 端字段（snake_case）。
// 六维：爬升 / 下坡 / 有氧 / 耐力 / 肠胃敏感度 / 碳水耐受。
// 依赖全局 firstField / safeFloat / clamp（app.js 已定义）。
"use strict";

function tlClampValue(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 漂移 → 基础耐力分（分级映射，对单次训练强度噪声更鲁棒）
function tlDriftToBaseScore(driftPct) {
  const d = Math.max(0, driftPct);
  if (d < 3) return 80;
  if (d < 6) return 65;
  if (d < 10) return 45;
  if (d < 15) return 30;
  return 20;
}

// 耐力能力 · ITRA 等级映射（替代简单 ITRA/10 数值；与小程序端一致）
function tlItraEnduranceLevel(itra) {
  if (itra == null) return null;
  if (itra >= 750) return { level: "优秀", score: 92 };
  if (itra >= 600) return { level: "良好", score: 75 };
  if (itra >= 500) return { level: "中等", score: 58 };
  if (itra >= 400) return { level: "一般", score: 42 };
  return { level: "偏弱", score: 26 };
}

// 耐力：心率漂移 / 同配速心率稳定性
// 取配速在中位数 ±15% 窗口内的记录（排除前 5 分钟热身），
// 比较前半程与后半程平均心率：漂移越小 = 耐力越好。
function tlComputeHrDrift(decoded) {
  const records = (decoded && decoded.record_mesgs || [])
    .filter((r) => r && r.timestamp)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const pts = [];
  for (const r of records) {
    const hr = firstField(r, "heart_rate");
    const speed = firstField(r, "enhanced_speed", "speed");
    const t = r.timestamp ? new Date(r.timestamp).getTime() : null;
    if (hr == null || speed == null || !t) continue;
    const pace = speed > 0 ? 60 / (speed * 3.6) : null;
    if (pace == null || pace < 2 || pace > 15) continue;
    const alt = firstField(r, "enhanced_altitude", "altitude");
    const dist = firstField(r, "distance");
    pts.push({ t, hr, pace, alt, dist });
  }
  if (pts.length < 30) return null;
  const t0 = pts[0].t;
  const warm = pts.filter((p) => p.t - t0 >= 5 * 60 * 1000);
  const pool = warm.length >= 10 ? warm : pts;
  if (pool.length < 20) return null;

  // 越野路线"同配速≠同强度"：有海拔/里程时先按坡度分桶（上/平/下），
  // 在每个桶内用桶内中位配速 ±15% 建窗，选样本最多的达标桶计算漂移
  let windowed = null;
  let bucketUsed = "";
  const hasGrade = pool.every((p) => p.alt != null && p.dist != null);
  if (hasGrade && pool.length >= 40) {
    const buckets = { up: [], flat: [], down: [] };
    for (let i = 1; i < pool.length; i += 1) {
      const prev = pool[i - 1];
      const cur = pool[i];
      const dDist = cur.dist - prev.dist;
      const grade = dDist > 0 ? ((cur.alt - prev.alt) / dDist) * 100 : 0;
      const key = grade > 2 ? "up" : grade < -2 ? "down" : "flat";
      buckets[key].push(cur);
    }
    // 平路桶优先：同配速心率稳定性在同一坡度下比较才有意义。
    let bestBucket = null;
    for (const key of ["up", "flat", "down"]) {
      const ptsB = buckets[key];
      if (ptsB.length < 20) continue;
      const sortedB = ptsB.map((p) => p.pace).sort((a, b) => a - b);
      const medB = sortedB[Math.floor(sortedB.length / 2)];
      const win = ptsB.filter((p) => p.pace >= medB * 0.85 && p.pace <= medB * 1.15);
      if (win.length >= 20) {
        bestBucket = { key, win };
        if (key === "flat") break;
      }
    }
    if (bestBucket) {
      windowed = bestBucket.win;
      bucketUsed = bestBucket.key;
    }
  }
  if (!windowed) {
    const sorted = pool.map((p) => p.pace).sort((a, b) => a - b);
    const med = sorted[Math.floor(sorted.length / 2)];
    windowed = pool.filter((p) => p.pace >= med * 0.85 && p.pace <= med * 1.15);
  }
  const spanH = windowed.length ? (windowed[windowed.length - 1].t - windowed[0].t) / 3600000 : 0;
  if (windowed.length < 20 || spanH < 0.5) return null;
  const mid = windowed[0].t + (windowed[windowed.length - 1].t - windowed[0].t) / 2;
  const early = windowed.filter((p) => p.t <= mid);
  const late = windowed.filter((p) => p.t > mid);
  if (early.length < 8 || late.length < 8) return null;
  const avg = (arr) => arr.reduce((s, p) => s + p.hr, 0) / arr.length;
  const hrEarly = avg(early);
  const hrLate = avg(late);
  if (!hrEarly) return null;
  const drift = ((hrLate - hrEarly) / hrEarly) * 100;
  const hrSpan = Math.abs(hrLate - hrEarly);
  const abnormal = hrSpan > 30 || Math.abs(drift) > 20;
  return { drift, hrEarly, hrLate, n: windowed.length, spanH, bucketUsed, hrSpan, abnormal };
}

// 用户能力画像评分（六维 + 综合）
function tlComputeProfileScore(decoded, profile) {
  const session = (decoded && decoded.session_mesgs && decoded.session_mesgs[0]) || {};
  let terrain = (profile && profile.terrain_speed) || {};
  let terrainHrFallback = false;
  if (decoded) {
    const zoneMesg = decoded.time_in_zone_mesgs && decoded.time_in_zone_mesgs[0];
    const thresholdHr = zoneMesg ? firstField(zoneMesg, "threshold_heart_rate") : null;
    const maxHr = profile.physiological_max_hr;
    const zone = thresholdHr != null
      ? { lo: thresholdHr * 0.9, hi: thresholdHr * 1.05 }
      : maxHr != null ? { lo: maxHr * 0.8, hi: maxHr * 0.95 } : null;
    if (zone) {
      const zoned = extractTerrainSpeedInHrZone(decoded, zone);
      if (zoned && (zoned.samples.climb || zoned.samples.descent || zoned.samples.flat)) {
        terrain = {
          climbVamMh: zoned.climbVamMh != null ? zoned.climbVamMh : (terrain && terrain.climbVamMh) || null,
          descentVamMh: zoned.descentVamMh != null ? zoned.descentVamMh : (terrain && terrain.descentVamMh) || null,
          flatPaceMinKm: zoned.flatPaceMinKm != null ? zoned.flatPaceMinKm : (terrain && terrain.flatPaceMinKm) || null,
          samples: {
            climb: (zoned.climbVamMh != null ? zoned.climbVamMh : terrain && terrain.climbVamMh) != null,
            descent: (zoned.descentVamMh != null ? zoned.descentVamMh : terrain && terrain.descentVamMh) != null,
            flat: (zoned.flatPaceMinKm != null ? zoned.flatPaceMinKm : terrain && terrain.flatPaceMinKm) != null,
          },
          usedHrFallback: Boolean(zoned.usedHrFallback),
        };
        terrainHrFallback = Boolean(zoned.usedHrFallback);
      }
    }
  }
  const flatPace = terrain.flatPaceMinKm != null ? terrain.flatPaceMinKm : null;
  const climbVam = terrain.climbVamMh != null ? terrain.climbVamMh : null;
  const descentVam = terrain.descentVamMh != null ? terrain.descentVamMh : null;
  const vo2 = profile.vo2max;
  const itra = profile.itra_points;
  const hrv = profile.hrv_status;
  const gi = profile.gi_sensitivity;
  const verifiedChoMax = profile.verified_cho_max;

  const score = (v, fn) => (v == null ? 0 : tlClampValue(fn(v), 5, 95));
  const durationH = (firstField(session, "total_timer_time") || 0) / 3600;
  const distanceKm = (firstField(session, "total_distance") || 0) / 1000;
  const avgSpeedKmh = durationH > 0.01 ? distanceKm / durationH : 0;
  const paceScore = avgSpeedKmh > 0 ? tlClampValue((avgSpeedKmh - 3) / 7 * 100, 5, 95) : 0;
  const shortFile = durationH > 0 && durationH < 0.5;

  const vamAbnormal = (climbVam != null && climbVam > 1200) || (descentVam != null && descentVam > 1600);
  const climbCap = terrainHrFallback || shortFile ? 60 : 95;
  const descentCap = terrainHrFallback || shortFile ? 60 : 95;
  const climb = climbVam != null ? tlClampValue(Math.round(score(climbVam, (x) => x / 10) * 10) / 10, 5, climbCap) : 0;
  const descent = descentVam != null ? tlClampValue(Math.round(score(descentVam, (x) => x / 14) * 10) / 10, 5, descentCap) : 0;
  const climbFinal = vamAbnormal && climbVam > 1200 ? Math.min(climb, 60) : climb;
  const descentFinal = vamAbnormal && descentVam > 1600 ? Math.min(descent, 60) : descent;

  const drift = decoded ? tlComputeHrDrift(decoded) : null;
  let endurance = 0;
  let enduranceMiss = true;
  let enduranceSource = "";
  let driftInfo = null;
  let enduranceBlended = false;
  let enduranceLevel = null;
  const itraLevel = tlItraEnduranceLevel(itra);
  if (durationH > 6) {
    const curve = 50 + 50 * Math.log(durationH / 6) / Math.log(20 / 6);
    endurance = Math.min(curve, Math.max(paceScore * 1.2, 30));
    enduranceMiss = false;
    enduranceSource = "duration_curve";
    driftInfo = drift;
  } else if (drift && !drift.abnormal) {
    const effDrift = Math.max(0, drift.drift);
    let driftScore = tlDriftToBaseScore(effDrift);
    if (drift.drift < -3) driftScore = Math.min(driftScore, 70);
    const durationFactor = tlClampValue(drift.spanH / 2, 0.5, 1);
    endurance = Math.max(20, driftScore * durationFactor);
    enduranceMiss = false;
    enduranceSource = "hr_drift";
    driftInfo = drift;
  } else if (drift && drift.abnormal) {
    endurance = itraLevel ? itraLevel.score : 30;
    enduranceMiss = false;
    enduranceSource = "drift_abnormal";
    if (itraLevel) enduranceLevel = itraLevel.level;
    driftInfo = drift;
  } else if (itraLevel) {
    endurance = itraLevel.score;
    enduranceMiss = false;
    enduranceSource = "itra";
    enduranceLevel = itraLevel.level;
  }
  if (enduranceSource === "duration_curve" && paceScore > endurance && paceScore > 0) {
    endurance = paceScore;
    enduranceBlended = true;
  } else if (enduranceSource === "hr_drift" && endurance > 60 && paceScore > 0) {
    endurance = 0.5 * endurance + 0.5 * paceScore;
    enduranceBlended = true;
  }
  endurance = tlClampValue(Math.round(endurance * 10) / 10, 5, 100);

  const scores = {
    climb: climbFinal,
    descent: descentFinal,
    vo2: score(vo2, (x) => (x - 30) * 2.2),
    endurance,
    gi: gi === "low" ? 85 : gi === "medium" ? 55 : gi === "high" ? 25 : 0,
    carb: score(verifiedChoMax, (x) => x / 1.2),
  };
  const misses = {
    climb: climbVam == null || climbFinal <= 5,
    descent: descentVam == null || descentFinal <= 5,
    vo2: vo2 == null,
    endurance: enduranceMiss,
    gi: !gi,
    carb: verifiedChoMax == null,
  };

  const desc = [];
  if (flatPace != null || climbVam != null || descentVam != null) {
    const parts = [];
    if (flatPace != null) parts.push(`平路配速 ${flatPace} min/km`);
    if (climbVam != null) parts.push(`上坡 VAM ${climbVam} m/h`);
    if (descentVam != null) parts.push(`下坡 VAM ${descentVam} m/h`);
    desc.push(`越野速度：${parts.join("；")}。`);
    if (terrainHrFallback) {
      desc.push("速度能力说明：文件心率未达到阈值心率区间，已按最接近心率区间的记录测算（置信度较低，该项评分上限 60）。");
    } else {
      desc.push("速度能力说明：按阈值心率区间内的记录测算（代表接近比赛强度下的能力）。");
    }
    if (shortFile) {
      desc.push("运动时长较短（<30 分钟），热身/冷却占比高，速度能力评分置信度较低（上限 60）。");
    }
    if (vamAbnormal) {
      desc.push("爬升/下降 VAM 异常偏高，可能为短促片段或数据伪影，该项评分上限 60。");
    }
  } else {
    desc.push("无法从上传文件解读出爬升/下坡/平路速度（缺海拔、心率或样本不足），该项评分偏低；建议更换代表性运动文件。");
  }
  if (vo2 != null) desc.push(`有氧基础：最大摄氧量 ${vo2} ml/kg/min。`);
  if (itra != null) desc.push(`比赛验证：ITRA 积分 ${itra}。`);
  if (enduranceSource === "duration_curve") {
    const curveConservative = durationH > 6 && avgSpeedKmh < 4.5;
    desc.push(
      `耐力能力：运动时间 ${durationH.toFixed(1)} 小时（6h=50、20h=100 曲线拟合${curveConservative ? `，平均速度 ${avgSpeedKmh.toFixed(1)} km/h 偏低，已保守折算` : ""}${enduranceBlended ? `，综合平均速度 ${avgSpeedKmh.toFixed(1)} km/h` : ""}，耐力分 ${endurance}）。`
    );
  } else if (enduranceSource === "hr_drift" && driftInfo) {
    const bucketText = driftInfo.bucketUsed ? `，坡度分桶(${driftInfo.bucketUsed})` : "";
    const negativeNote = driftInfo.drift < -3 ? "，显著负漂移按低置信度保守折算" : "";
    desc.push(
      `耐力能力：心率漂移 ${driftInfo.drift.toFixed(1)}%（有效同配速窗口 ${driftInfo.spanH.toFixed(1)}h${bucketText}，按漂移+时长折算${negativeNote}；${driftInfo.hrEarly.toFixed(0)} → ${driftInfo.hrLate.toFixed(0)} bpm${enduranceBlended ? `，综合平均速度 ${avgSpeedKmh.toFixed(1)} km/h` : ""}，耐力分 ${endurance}）。`
    );
  } else if (enduranceSource === "drift_abnormal" && driftInfo) {
    desc.push(
      `耐力能力：心率漂移数据异常（HR 跨度 ${driftInfo.hrSpan.toFixed(0)} bpm，漂移 ${driftInfo.drift.toFixed(1)}%），可能为坡度伪影或强度切换，未采信漂移${itra != null ? `，回退 ITRA 积分（${itra}）评估，耐力等级：${enduranceLevel || "—"}` : "，给保守分"}。`
    );
  } else if (enduranceSource === "itra" && itra != null) {
    desc.push(`耐力能力：基于 ITRA 积分（${itra}）评估，耐力等级：${enduranceLevel || "—"}。`);
  }
  if (hrv) {
    const hrvText = hrv === "balanced" ? "恢复状态良好" : hrv === "unbalanced" ? "恢复状态一般" : hrv === "low" ? "恢复状态偏低" : hrv === "poor" ? "恢复状态极差" : "恢复状态未知";
    desc.push(`当前状态：${hrvText}（HRV ${hrv}）。`);
  }
  if (gi) {
    const giText = gi === "low" ? "低（较少肠胃不适）" : gi === "medium" ? "中（偶尔不适）" : "高（经常不适）";
    desc.push(`肠胃敏感度：${giText}。`);
  }
  if (verifiedChoMax != null) {
    desc.push(`碳水耐受：已验证上限 ${verifiedChoMax} g/h。`);
  }
  const dimLabels = [
    ["爬升能力", scores.climb, misses.climb],
    ["下坡能力", scores.descent, misses.descent],
    ["有氧能力", scores.vo2, misses.vo2],
    ["耐力能力", scores.endurance, misses.endurance],
    ["肠胃敏感度", scores.gi, misses.gi],
    ["碳水耐受", scores.carb, misses.carb],
  ].filter((d) => !d[2]);
  if (dimLabels.length >= 2) {
    dimLabels.sort((a, b) => b[1] - a[1]);
    desc.push(`相对强弱：${dimLabels[0][0]}相对突出，${dimLabels[dimLabels.length - 1][0]}相对偏弱。`);
  }
  if (flatPace == null && vo2 == null && itra == null && !hrv && !gi && verifiedChoMax == null) {
    desc.push("数据较少，画像置信度低；建议补充 ITRA / VO2max / HRV 或上传代表性运动文件。");
  }

  return {
    scores,
    misses,
    descLines: desc,
    flatPace,
    climbVam,
    descentVam,
    vo2max: vo2,
    itra,
    hrv,
    giSensitivity: gi,
    verifiedChoMax,
    enduranceSource,
    enduranceLevel,
    hasTerrain: !!(flatPace != null || climbVam != null || descentVam != null),
    terrainHrFallback,
    driftInfo,
  };
}

// 渲染 SVG 雷达图（六维）到容器
function tlRenderRadarSvg(container, result, language = "zh") {
  const levelEn = { "优秀": "Elite", "良好": "Good", "中等": "Medium", "一般": "Fair", "偏弱": "Weak" };
  const dims = [
    { label: language === "en" ? "Aerobic" : "有氧能力", score: result.scores.vo2, miss: result.misses.vo2 },
    { label: language === "en" ? "Descent" : "下坡能力", score: result.scores.descent, miss: result.misses.descent },
    {
      label: language === "en" ? "Endurance" : "耐力能力",
      score: result.scores.endurance,
      miss: result.misses.endurance,
      // 基于 ITRA 时展示等级描述，不展示简单数值
      text: result.enduranceLevel
        ? (language === "en" ? levelEn[result.enduranceLevel] || result.enduranceLevel : result.enduranceLevel)
        : null,
    },
    { label: language === "en" ? "GI" : "肠胃敏感度", score: result.scores.gi, miss: result.misses.gi },
    { label: language === "en" ? "Carbs" : "碳水耐受", score: result.scores.carb, miss: result.misses.carb },
    { label: language === "en" ? "Climb" : "爬升能力", score: result.scores.climb, miss: result.misses.climb },
  ];
  const W = 420;
  const H = 380;
  const cx = W / 2;
  const cy = H / 2 + 8;
  const R = 130;
  const angle = (i) => -Math.PI / 2 + (Math.PI / 3) * i;
  const pt = (i, r) => [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];
  const displayScore = (d) => (d.miss ? 10 : d.score);
  const rings = [];
  for (let ring = 1; ring <= 5; ring += 1) {
    const r = (R / 5) * ring;
    const points = dims.map((_, i) => pt(i, r));
    rings.push(`<polygon points="${points.map((p) => p.join(",")).join(" ")}" fill="none" stroke="rgba(171,219,189,0.22)" stroke-width="1"/>`);
  }
  const spokes = dims.map((_, i) => {
    const [x, y] = pt(i, R);
    return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(171,219,189,0.3)" stroke-width="1"/>`;
  });
  const dataPts = dims.map((d, i) => pt(i, (R / 100) * displayScore(d)));
  const dataPoly = `<polygon points="${dataPts.map((p) => p.join(",")).join(" ")}" fill="rgba(255,138,31,0.2)" stroke="#ff7a00" stroke-width="2" stroke-linejoin="round"/>`;
  const vertexes = dims.map((d, i) => {
    const [x, y] = pt(i, (R / 100) * displayScore(d));
    const fill = d.miss ? "#4ade80" : "#ff9a3c";
    return `<circle cx="${x}" cy="${y}" r="4" fill="${fill}"/>`;
  });
  const labels = dims.map((d, i) => {
    const [x, y] = pt(i, R + 24);
    const missTxt = d.text || (d.miss ? (language === "en" ? "n/a" : "未填") : String(Number(d.score.toFixed(1))));
    const missColor = d.miss ? "#4ade80" : "#ff9a3c";
    return `
      <text x="${x}" y="${y}" text-anchor="middle" font-size="13" fill="rgba(233,243,236,0.88)">${escapeHtml(d.label)}</text>
      <text x="${x}" y="${y + 15}" text-anchor="middle" font-size="11" fill="${missColor}">${escapeHtml(missTxt)}</text>`;
  });
  container.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="${language === "en" ? "Ability radar" : "能力雷达图"}">
      ${rings.join("")}${spokes.join("")}${dataPoly}${vertexes.join("")}${labels.join("")}
    </svg>`;
}
