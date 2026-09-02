// GPX 路线解析器（Web 版，无第三方依赖；与小程序 utils/gpx.js 逻辑一致）
//  - 解析 <trkpt lat lon> 与 <ele>，计算累计距离（Haversine）
//  - 计算总爬升 / 总下降
//  - 解析 <wpt> 航点（官方补给点/CP），按经纬度吸附到最近的轨迹里程
//  - 输出海拔剖面点 [{ km, altitude }]，供分段提取与海拔图使用
(function (global) {
  function haversineKm(a, b) {
    const R = 6371;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const sinLat = Math.sin(dLat / 2);
    const sinLon = Math.sin(dLon / 2);
    const h =
      sinLat * sinLat +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLon * sinLon;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  // 航点吸附阈值：与轨迹最近点超过该距离视为不在线路上，丢弃（km）
  const MAX_WAYPOINT_SNAP_KM = 0.5;

  function parseWaypoints(text, trackPoints) {
    const waypoints = [];
    const wptRe = /<([\w:]*wpt)\b[^>]*>([\s\S]*?)<\/\1>/gi;
    let match = null;
    while ((match = wptRe.exec(text)) !== null) {
      const tag = match[0];
      const latMatch = /lat="([^"]+)"/i.exec(tag);
      const lonMatch = /lon="([^"]+)"/i.exec(tag);
      if (!latMatch || !lonMatch) continue;
      const lat = parseFloat(latMatch[1]);
      const lon = parseFloat(lonMatch[1]);
      if (Number.isNaN(lat) || Number.isNaN(lon)) continue;
      const inner = match[2].replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "");
      const nameMatch = /<name>\s*([^<]+?)\s*<\/name>/i.exec(inner);
      let name = nameMatch ? nameMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
      if (!name) name = "补给点";
      const eleMatch = /<ele>\s*([^<]+?)\s*<\/ele>/i.exec(inner);
      const alt = eleMatch ? parseFloat(eleMatch[1]) : null;
      let nearestKm = null;
      let nearestDistKm = Infinity;
      for (const p of trackPoints) {
        const d = haversineKm({ lat, lon }, { lat: p.lat, lon: p.lon });
        if (d < nearestDistKm) {
          nearestDistKm = d;
          nearestKm = p.km;
        }
      }
      if (nearestKm === null || nearestDistKm > MAX_WAYPOINT_SNAP_KM) continue;
      waypoints.push({
        name,
        km: Number(nearestKm.toFixed(2)),
        lat,
        lon,
        altitude: alt != null && !Number.isNaN(alt) ? Number(alt.toFixed(1)) : null,
      });
    }
    return waypoints;
  }

  function parseGpx(xml) {
    const text = String(xml == null ? "" : xml);
    const rawPoints = [];
    const trkptRe = /<trkpt\b[^>]*>([\s\S]*?)<\/trkpt>/gi;
    let match = null;
    while ((match = trkptRe.exec(text)) !== null) {
      const tag = match[0];
      const latMatch = /lat="([^"]+)"/i.exec(tag);
      const lonMatch = /lon="([^"]+)"/i.exec(tag);
      if (!latMatch || !lonMatch) continue;
      const lat = parseFloat(latMatch[1]);
      const lon = parseFloat(lonMatch[1]);
      if (Number.isNaN(lat) || Number.isNaN(lon)) continue;
      const eleMatch = /<ele>\s*([^<]+?)\s*<\/ele>/i.exec(match[1]);
      const alt = eleMatch ? parseFloat(eleMatch[1]) : null;
      rawPoints.push({ lat, lon, alt: Number.isNaN(alt) ? null : alt });
    }
    if (rawPoints.length < 2) {
      throw new Error("GPX 文件中未找到有效轨迹点");
    }

    const points = [];
    let cumulativeKm = 0;
    for (let i = 0; i < rawPoints.length; i += 1) {
      if (i > 0) cumulativeKm += haversineKm(rawPoints[i - 1], rawPoints[i]);
      points.push({
        km: Number(cumulativeKm.toFixed(3)),
        altitude: rawPoints[i].alt == null ? 0 : Number(rawPoints[i].alt.toFixed(1)),
        lat: rawPoints[i].lat,
        lon: rawPoints[i].lon,
      });
    }

    let ascent = 0;
    let descent = 0;
    for (let i = 1; i < points.length; i += 1) {
      const delta = points[i].altitude - points[i - 1].altitude;
      if (delta > 0) ascent += delta;
      else descent += -delta;
    }

    return {
      points,
      waypoints: parseWaypoints(text, points),
      distanceKm: Number(cumulativeKm.toFixed(2)),
      ascentM: Math.round(ascent),
      descentM: Math.round(descent),
    };
  }

  // 构建 GPX 路线文件（轨迹 + 补给点航点 + metadata 距离/爬升/下降）
  // 与 09_wxxcx/utils/gpx.js buildGpx 保持一致（2026-09-01 同步）
  function buildGpx(track, waypoints) {
    const esc = (s) =>
      String(s == null ? "" : s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    const lines = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push('<gpx version="1.1" creator="Trail Lab 山野实验室" xmlns="http://www.topografix.com/GPX/1/1">');
    let distKm = 0;
    let ascent = 0;
    let descent = 0;
    for (let i = 1; i < track.length; i += 1) {
      const a = track[i - 1];
      const b = track[i];
      if (a.km != null && b.km != null) distKm = b.km;
      if (a.altitude != null && b.altitude != null) {
        const d = Number(b.altitude) - Number(a.altitude);
        if (d > 0) ascent += d;
        else descent += -d;
      }
    }
    lines.push(
      `  <metadata><name>山野实验室补给路线</name><desc>距离 ${distKm.toFixed(1)} km · 爬升 ${Math.round(ascent)} m · 下降 ${Math.round(descent)} m</desc></metadata>`
    );
    lines.push("  <trk>");
    lines.push("    <name>山野实验室补给路线</name>");
    lines.push("    <trkseg>");
    for (const p of track) {
      if (p.lat == null || p.lon == null) continue;
      const ele = p.altitude != null ? `\n      <ele>${p.altitude}</ele>` : "";
      lines.push(`      <trkpt lat="${p.lat}" lon="${p.lon}">${ele}\n      </trkpt>`);
    }
    lines.push("    </trkseg>");
    lines.push("  </trk>");
    for (const w of waypoints) {
      if (w.lat == null || w.lon == null) continue;
      const ele = w.altitude != null ? `\n      <ele>${w.altitude}</ele>` : "";
      lines.push(
        `  <wpt lat="${w.lat}" lon="${w.lon}">\n      <name>${esc(w.name)}</name>${ele}\n      <type>补给点</type>\n  </wpt>`
      );
    }
    lines.push("</gpx>");
    return lines.join("\n");
  }

  // ---------- 历史运动 GPX 解码（Step1 用户画像复用；与小程序 utils/gpx.js 一致） ----------
  function safeFloat(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  function haversineMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(a));
  }
  function parseGpxTime(str) {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|([+-])(\d{2}):?(\d{2}))?/.exec(String(str || "").trim());
    if (!m) return null;
    let ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6]));
    if (m[7]) {
      const off = (Number(m[8]) * 60 + Number(m[9])) * 60000;
      ms += m[7] === "+" ? -off : off;
    }
    return new Date(ms);
  }
  function parseTrkPoints(text) {
    if (!/<trkpt\b/i.test(text)) {
      throw new Error("未在文件中找到轨迹点（trkpt），文件可能不是标准 GPX 或已损坏");
    }
    const points = [];
    const trkRe = /<trkpt\b[^>]*>([\s\S]*?)<\/trkpt>/gi;
    let m;
    while ((m = trkRe.exec(text)) !== null) {
      const attrs = m[0];
      const inner = m[1];
      const latM = /lat="([^"]*)"/i.exec(attrs);
      const lonM = /lon="([^"]*)"/i.exec(attrs);
      const eleM = /<ele\b[^>]*>\s*([^<]+?)\s*<\/ele>/i.exec(inner);
      const timeM = /<time\b[^>]*>\s*([^<]+?)\s*<\/time>/i.exec(inner);
      const hrM = /<(?:\w+:)?hr\b[^>]*>\s*([^<]+?)\s*<\/(?:\w+:)?hr>/i.exec(inner);
      points.push({
        lat: latM ? safeFloat(latM[1]) : null,
        lon: lonM ? safeFloat(lonM[1]) : null,
        altitude: eleM ? safeFloat(eleM[1]) : null,
        time: timeM ? parseGpxTime(timeM[1]) : null,
        heart_rate: hrM ? Math.round(safeFloat(hrM[1])) : null,
      });
    }
    if (points.length < 2) {
      throw new Error("GPX 轨迹点不足（至少需要 2 个点），文件可能不是活动记录或已损坏");
    }
    return points;
  }
  function cumulativeMeters(points) {
    const out = [0];
    let cumM = 0;
    for (let i = 1; i < points.length; i += 1) {
      const p = points[i];
      const q = points[i - 1];
      if (p.lat != null && p.lon != null && q.lat != null && q.lon != null) {
        const d = haversineMeters(q.lat, q.lon, p.lat, p.lon);
        if (Number.isFinite(d) && d >= 0 && d <= 500) cumM += d;
      }
      out.push(cumM);
    }
    return out;
  }
  function sampleProfile(points) {
    const step = 0.05;
    const sampled = [];
    let bucket = null;
    let sumAlt = 0;
    let count = 0;
    const flush = () => {
      if (bucket !== null && count) sampled.push({ km: bucket, alt: sumAlt / count });
      bucket = null;
      sumAlt = 0;
      count = 0;
    };
    for (const p of points) {
      if (p.km == null || p.altitude == null) continue;
      const b = Math.floor(p.km / step) * step;
      if (bucket === null) bucket = b;
      if (b > bucket) flush();
      if (bucket === null) bucket = b;
      sumAlt += p.altitude;
      count += 1;
    }
    flush();
    return sampled;
  }
  function profileAscentDescent(points) {
    const sampled = sampleProfile(points);
    let ascent = 0;
    let descent = 0;
    for (let i = 1; i < sampled.length; i += 1) {
      const d = sampled[i].alt - sampled[i - 1].alt;
      if (d > 0) ascent += d;
      else descent += -d;
    }
    return { ascent: Math.round(ascent), descent: Math.round(descent) };
  }

  // 历史运动 GPX → FIT 兼容 decoded（Step1 用户画像用）
  function decodeGpx(xml) {
    const text = String(xml == null ? "" : xml);
    const points = parseTrkPoints(text);
    const record_mesgs = [];
    const kmAt = cumulativeMeters(points);
    const summary = profileAscentDescent(points.map((p, i) => ({ km: kmAt[i] / 1000, altitude: p.altitude })));
    let cumM = 0;
    let movingSec = 0;
    let hrSum = 0;
    let hrCount = 0;
    let hrMax = 0;
    let firstTs = null;
    let lastTs = null;
    let hasTime = false;
    for (let i = 0; i < points.length; i += 1) {
      const p = points[i];
      const prev = points[i - 1] || null;
      let d = 0;
      let dt = 0;
      if (prev && p.lat != null && p.lon != null && prev.lat != null && prev.lon != null) {
        d = haversineMeters(prev.lat, prev.lon, p.lat, p.lon);
        if (!Number.isFinite(d) || d < 0 || d > 500) d = 0;
      }
      if (prev && p.time && prev.time) {
        hasTime = true;
        dt = Math.max(0, (p.time.getTime() - prev.time.getTime()) / 1000);
        if (dt > 3600) dt = 0;
      }
      cumM += d;
      movingSec += dt;
      if (p.time) {
        if (firstTs === null) firstTs = p.time.getTime();
        lastTs = p.time.getTime();
      }
      if (p.heart_rate != null) {
        hrSum += p.heart_rate;
        hrCount += 1;
        hrMax = Math.max(hrMax, p.heart_rate);
      }
      const speed = dt > 0 && d > 0 ? d / dt : null;
      const rec = { timestamp: p.time };
      if (cumM > 0) rec.distance = Math.round(cumM);
      if (p.altitude != null) {
        rec.altitude = Math.round(p.altitude * 5) / 5;
        rec.enhanced_altitude = rec.altitude;
      }
      if (speed != null) {
        rec.speed = Math.round(speed * 1000) / 1000;
        rec.enhanced_speed = rec.speed;
      }
      if (p.heart_rate != null) rec.heart_rate = p.heart_rate;
      record_mesgs.push(rec);
    }
    const elapsed = firstTs != null && lastTs != null ? (lastTs - firstTs) / 1000 : movingSec;
    const session_mesgs = [
      {
        sport: 1,
        sub_sport: 0,
        sport_profile_name: "GPX 轨迹（按跑步解析）",
        total_distance: Math.round(cumM),
        total_elapsed_time: Math.round(elapsed),
        total_timer_time: Math.round(movingSec),
        total_ascent: Math.round(summary.ascent),
        total_descent: Math.round(summary.descent),
        enhanced_avg_speed: movingSec > 0 ? Number((cumM / movingSec).toFixed(3)) : 0,
        avg_speed: movingSec > 0 ? Number((cumM / movingSec).toFixed(3)) : 0,
      },
    ];
    if (hrCount) {
      session_mesgs[0].avg_heart_rate = Math.round(hrSum / hrCount);
      session_mesgs[0].max_heart_rate = hrMax;
    }
    return {
      source: "gpx",
      file_id_mesgs: [],
      user_profile_mesgs: [],
      zones_target_mesgs: [],
      sport_mesgs: [],
      session_mesgs,
      lap_mesgs: [],
      record_mesgs,
      course_point_mesgs: [],
      time_in_zone_mesgs: [],
      gpx: { pointCount: points.length, hasHeartRate: hrCount > 0, hasElevation: points.some((p) => p.altitude != null), hasTime },
    };
  }

  // GPX 活动校验（数据有效性 + 质量；GPX 无 CRC）
  function validateGpx(decoded, opts) {
    const errors = [];
    const warnings = [];
    opts = opts || {};
    const sizeMB = (opts.fileSizeBytes || 0) / 1024 / 1024;
    if (sizeMB > 20) errors.push(`文件过大（${sizeMB.toFixed(0)} MB），请上传运动手表导出的 GPX 活动文件`);
    const records = (decoded && decoded.record_mesgs || []).filter((r) => r && r.timestamp);
    if (records.length < 10) errors.push("GPX 轨迹点过少（至少 10 个），可能不是活动记录或文件损坏");
    const gpx = (decoded && decoded.gpx) || {};
    if (!gpx.hasTime) errors.push("GPX 轨迹缺少时间字段（<time>），无法计算配速与速度能力");
    const session = (decoded && decoded.session_mesgs && decoded.session_mesgs[0]) || {};
    const distKm = (safeFloat(session.total_distance) || 0) / 1000;
    const durS = safeFloat(session.total_elapsed_time) || 0;
    if (distKm < 0.5) errors.push("GPX 距离过短（<0.5km），请上传完整的跑步活动文件");
    if (durS > 0 && durS < 60) errors.push("GPX 活动时间过短（<1 分钟）");
    if (durS > 0 && distKm / Math.max(durS / 3600, 0.01) > 30) {
      errors.push(`GPX 平均速度异常（约 ${(distKm / Math.max(durS / 3600, 0.01)).toFixed(1)} km/h），可能不是跑步活动或数据异常`);
    }
    if (!gpx.hasHeartRate) {
      warnings.push("GPX 未包含心率数据（扩展字段缺失），心率区间相关能力（耐力/有氧）无法计算，建议上传含心率的手表 FIT 文件");
    }
    warnings.push("GPX 无标准运动类型字段，已按跑步活动解析；如非跑步活动（骑行/滑雪等）请勿用于用户画像");
    return { ok: errors.length === 0, errors, warnings };
  }

  global.TrailGpx = { parseGpx, parseWaypoints, haversineKm, decodeGpx, validateGpx, buildGpx };
})(typeof window !== "undefined" ? window : globalThis);
