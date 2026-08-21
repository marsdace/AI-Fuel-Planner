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

  global.TrailGpx = { parseGpx, parseWaypoints, haversineKm };
})(typeof window !== "undefined" ? window : globalThis);
