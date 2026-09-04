// Trail Lab Web 版补给总览海报（横版，对齐小程序 exportImage 最终版 2026-09-01）
// 覆盖 TrailLabPlanEditor.exportImage；数据经 getState() 获取，图标用色块表示（Web 无 PNG 图标资源）。
"use strict";

(function (global) {
  const QR_SRC = "./qr_miniprogram.jpg";
  const EXTRA_COLORS = {
    banana: "#FFC94D", bar: "#B07B45", bread: "#E8C996", cookie: "#C98A6B",
    raisins: "#6B4D8A", gummies: "#FF8AB5", honey: "#D9A441", nuts: "#8A6B4D",
    cola: "#4D2B2B", soup: "#B0743A", orange: "#FF9F43",
    add_carbs: "#FF7A00", add_elec: "#4D96FF", add_water: "#6BCB77", add_salt: "#9B59B6", add_caff: "#5B8A72",
  };

  // 海报图标缓存（dataURL，规避 file:// 污染；exportImage 预载后绘制）
  const _iconImgs = {};
  function iconImg(key) {
    if (!key) return null;
    const im = _iconImgs[key];
    return im && im.complete && im.naturalWidth > 0 ? im : null;
  }

  const sf = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const fmtHM = (h) => {
    const total = Math.round((sf(h) || 0) * 60);
    const p = (n) => (n < 10 ? "0" + n : "" + n);
    return p(Math.floor(total / 60)) + ":" + p(total % 60);
  };
  const fmtQty = (n) => {
    const v = sf(n) || 0;
    return String(Math.round(v * 10) / 10);
  };
  const roundRect = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  // 与小程序 itemViews 口径一致：件/瓶/粒/份
  function rowItemViews(r) {
    const items = [];
    const gels = sf(r.gels) || 0;
    const elec = sf(r.electrolyte_ml) || 0;
    const plain = sf(r.plain_ml) || 0;
    const salt = sf(r.salt_tabs) || 0;
    const caff = sf(r.caffeine_mg) || 0;
    if (gels > 0) items.push({ key: "gels", label: "能量胶", qty: gels, unit: "件", color: "#FF7A00" });
    if (elec > 0) items.push({ key: "electrolyte_ml", label: "电解质水", qty: Math.round((elec / 500) * 10) / 10, unit: "瓶", color: "#4D96FF" });
    if (plain > 0) items.push({ key: "plain_ml", label: "白水", qty: Math.round((plain / 500) * 10) / 10, unit: "瓶", color: "#6BCB77" });
    if (salt > 0) items.push({ key: "salt_tabs", label: "盐丸", qty: salt, unit: "粒", color: "#9B59B6" });
    if (caff > 0) items.push({ key: "caffeine_mg", label: "咖啡因", qty: Math.round((caff / 100) * 10) / 10, unit: "份", color: "#5B8A72" });
    const extra = r.extra || {};
    for (const key of Object.keys(extra)) {
      const n = sf(extra[key]) || 0;
      if (n > 0) {
        // extra 只存数量不存名称；先用补给库元数据解析中文名/颜色，
        // 自定义站内真食（不在补给库）回退 r.stationFoods 元数据，避免图例显示原始 key（如 banana / custom_xxx）
        let meta =
          global.TrailLabIcons && typeof global.TrailLabIcons.describeItem === "function"
            ? global.TrailLabIcons.describeItem(key)
            : null;
        if (!meta) {
          const sf = (r.stationFoods || []).find((s) => s && s.key === key);
          if (sf) meta = { label: sf.label || key, color: "#D9A441" };
        }
        items.push({
          key,
          label: (meta && meta.label) || key,
          qty: n,
          unit: "",
          color: (meta && meta.color) || EXTRA_COLORS[key] || "#9BA8B4",
          extraKey: true,
        });
      }
    }
    return items;
  }

  function drawPoster(ctx, W, H, state, qrImg, en) {
    const out = state.ruleOutput;
    const rp = state.raceProfile;
    if (!out || !rp) return;
    const pad = 56;
    const padR = 56;
    const QR_SIZE = 100;
    const L = (zh, enTxt) => (en ? enTxt : zh);

    // 背景：深林绿渐变 + 装饰性山脊
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, "#14271d");
    bgGrad.addColorStop(1, "#0b1410");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255,138,31,0.06)";
    ctx.lineWidth = 2;
    for (let layer = 0; layer < 3; layer += 1) {
      const baseY = 300 + layer * 240;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 40) {
        const y = baseY - Math.sin((x / W) * Math.PI * (2 + layer) + layer * 2.2) * 70 - layer * 22;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255,122,0,0.5)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(28, 74);
    ctx.lineTo(28, 28);
    ctx.lineTo(74, 28);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W - 74, H - 28);
    ctx.lineTo(W - 28, H - 28);
    ctx.lineTo(W - 28, H - 74);
    ctx.stroke();

    // ---- 头部：品牌 + slogan + 路线/目标摘要 + 安全提示 ----
    ctx.fillStyle = "#ff7a00";
    ctx.fillRect(pad, 46, 24, 24);
    ctx.fillStyle = "#e9f3ec";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = "bold 46px sans-serif";
    ctx.fillText("TRAIL LAB", pad + 36, 62);
    ctx.font = "17px sans-serif";
    ctx.fillStyle = "rgba(233,243,236,0.55)";
    const sloganTxt = en ? "  Explore the wild with tech — more fun, more efficient, safer" : "  用科技探索山野，让户外更有趣、更高效、更安全";
    const sloganW = ctx.measureText(sloganTxt).width;
    const sloganX = pad + 24;
    ctx.fillText(sloganTxt, sloganX, 84);

    const confLabel = out.confidence && out.confidence.finish_time === "high" ? L("高", "High") : out.confidence && out.confidence.finish_time === "low" ? L("低", "Low") : L("中", "Medium");
    ctx.textAlign = "right";
    ctx.font = "bold 34px sans-serif";
    const distTxt = rp.distance_km + " km · " + L("爬升", "ascent") + " " + rp.ascent_m + " m · " + L("下降", "descent") + " " + rp.descent_m + " m";
    const distW = ctx.measureText(distTxt).width;
    ctx.font = "25px sans-serif";
    const timeTxt = L("预计", "Est.") + " " + fmtHM(out.estimated_finish_time_h) + "（" + fmtHM(out.finish_time_range[0]) + "–" + fmtHM(out.finish_time_range[1]) + "）· " + L("置信度", "conf") + " " + confLabel;
    const timeW = ctx.measureText(timeTxt).width;
    const rightDataLeft = W - padR - Math.max(distW, timeW);
    const qrX = Math.max(pad + 24, rightDataLeft - QR_SIZE - 24);
    const qrY = 30;

    ctx.font = "bold 34px sans-serif";
    ctx.fillStyle = "#f7b054";
    ctx.fillText(distTxt, W - padR, 62);
    ctx.font = "25px sans-serif";
    ctx.fillStyle = "rgba(233,243,236,0.85)";
    ctx.fillText(timeTxt, W - padR, 104);

    // 小程序码：深色圆角卡片 + 圆角裁剪，放在“路线总数据”左侧
    if (qrImg && qrImg.complete && qrImg.naturalWidth > 0) {
      ctx.save();
      ctx.fillStyle = "rgba(6,16,11,0.9)";
      roundRect(ctx, qrX - 12, qrY - 12, QR_SIZE + 24, QR_SIZE + 24, 16);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,138,31,0.45)";
      ctx.lineWidth = 2;
      roundRect(ctx, qrX - 12, qrY - 12, QR_SIZE + 24, QR_SIZE + 24, 16);
      ctx.stroke();
      ctx.beginPath();
      roundRect(ctx, qrX, qrY, QR_SIZE, QR_SIZE, 10);
      ctx.clip();
      ctx.drawImage(qrImg, qrX, qrY, QR_SIZE, QR_SIZE);
      ctx.restore();
    }

    // 安全提示：预计完赛时间下方，右侧两行
    ctx.textAlign = "right";
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "rgba(255,196,196,0.82)";
    ctx.fillText(L("安全提示：通用规则估算，非医疗建议；", "Safety: general rule estimate, not medical advice;"), W - padR, 130);
    ctx.fillText(L("请结合自身体能、天气与肠胃耐受量力而行；使用者自行承担风险。", "Adjust by your fitness, weather and GI tolerance; use at your own risk."), W - padR, 148);
    ctx.textAlign = "left";

    // ---- 出门携带清单：slogan 与小程序码之间 ----
    // 分组与 plan_editor 的 renderChecklist 一致：用 c.class（supply / gear），非 c.kind
    const chkS = (state.checklist || []).filter((c) => c.class === "supply");
    const chkG = (state.checklist || []).filter((c) => c.class === "gear");
    ctx.textAlign = "left";
    ctx.fillStyle = "#FFB65C";
    ctx.font = "bold 20px sans-serif";
    const chkX0 = sloganX + sloganW + 20;
    ctx.fillText(L("出门携带清单", "Departure checklist"), chkX0 + 10, 44);
    const ckRowH = 30;
    const ckStartY = 72;
    let ckY = ckStartY;
    let ckOverflow = 0;
    const ckMaxX = qrX - 24;
    const ckMaxRows = 3;
    const checkItems = [];
    const buildCheckLayout = (items) => {
      let cx = chkX0;
      let rowY = ckY;
      for (const c of items) {
        let txt = (c.label || "") + " " + fmtQty(c.count) + (c.unit || "");
        const maxItemW = ckMaxX - chkX0;
        while (ctx.measureText(txt).width + 34 + 26 > maxItemW && txt.length > 4) {
          txt = txt.slice(0, -2) + "…";
        }
        const tw = ctx.measureText(txt).width + 34 + 26;
        if (cx + tw > ckMaxX) {
          cx = chkX0;
          rowY += ckRowH;
        }
        if (rowY > ckStartY + (ckMaxRows - 1) * ckRowH) {
          ckOverflow += 1;
          continue;
        }
        checkItems.push({ key: c.key, color: c.color || "#9BA8B4", txt, x: cx, y: rowY });
        cx += tw;
      }
      ckY = rowY;
    };
    if (chkS.length) buildCheckLayout(chkS);
    if (chkG.length) {
      ckY += ckRowH;
      buildCheckLayout(chkG);
    }
    const ckBoxX0 = chkX0 - 16;
    const ckBoxX1 = ckMaxX + 10;
    const ckBoxY0 = 18;
    const ckBoxY1 = ckY + 10;
    ctx.save();
    ctx.fillStyle = "rgba(255,182,92,0.05)";
    roundRect(ctx, ckBoxX0, ckBoxY0, ckBoxX1 - ckBoxX0, ckBoxY1 - ckBoxY0, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,182,92,0.35)";
    ctx.lineWidth = 2;
    roundRect(ctx, ckBoxX0, ckBoxY0, ckBoxX1 - ckBoxX0, ckBoxY1 - ckBoxY0, 16);
    ctx.stroke();
    ctx.restore();
    ctx.font = "17px sans-serif";
    for (const it of checkItems) {
      const ic = iconImg(it.key);
      if (ic) {
        ctx.drawImage(ic, it.x, it.y - 18, 18, 18);
      } else {
        ctx.fillStyle = it.color;
        roundRect(ctx, it.x, it.y - 20, 18, 18, 4);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(233,243,236,0.92)";
      ctx.fillText(it.txt, it.x + 26, it.y);
    }
    if (ckOverflow > 0) {
      ctx.fillStyle = "rgba(255,182,92,0.9)";
      ctx.textAlign = "right";
      ctx.fillText("+" + ckOverflow + " " + L("项", "items"), ckMaxX, ckY);
      ctx.textAlign = "left";
    }
    const checklistBottom = ckY + 18;
    ctx.strokeStyle = "rgba(255,138,31,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, checklistBottom + 8);
    ctx.lineTo(W - padR, checklistBottom + 8);
    ctx.stroke();

    // ---- 路线海拔剖面：横轴刻度 = 补给点位置 ----
    const fitPoints = state.routeFitPoints || [];
    const pathPoints = fitPoints.length >= 2 ? fitPoints : (typeof buildSimulatedElevation === "function" ? buildSimulatedElevation(rp) : []);
    const climbSegs = typeof getRouteSegmentsToDraw === "function" ? getRouteSegmentsToDraw(rp, "climb") : [];
    const descentSegs = typeof getRouteSegmentsToDraw === "function" ? getRouteSegmentsToDraw(rp, "descent") : [];
    const minAlt = pathPoints.reduce((m, p) => Math.min(m, p.altitude), Infinity);
    const maxAlt = pathPoints.reduce((m, p) => Math.max(m, p.altitude), -Infinity);
    const altRange = Math.max(maxAlt - minAlt, 1);

    const chartH = Math.round(H * 0.38);
    const chartTop = checklistBottom + 12;
    const padL = 120;
    const plotPadT = 52;
    const plotPadB = 54;
    const plotTop = chartTop + plotPadT;
    const plotBot = chartTop + chartH - plotPadB;
    const plotW = W - padL - padR;
    const plotH = plotBot - plotTop;
    const xForKm = (km) => padL + (km / Math.max(rp.distance_km, 1)) * plotW;
    const yForAlt = (alt) => plotTop + (1 - (alt - minAlt) / altRange) * plotH;

    ctx.strokeStyle = "rgba(171,219,189,0.18)";
    ctx.lineWidth = 1;
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "rgba(171,219,189,0.75)";
    const yTicks = 4;
    for (let i = 0; i <= yTicks; i += 1) {
      const alt = minAlt + (altRange / yTicks) * i;
      const y = yForAlt(alt);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
      ctx.textAlign = "right";
      ctx.fillText(Math.round(alt) + "m", padL - 14, y + 6);
    }
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(233,243,236,0.82)";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(L("路线海拔剖面", "Elevation profile"), pad, plotTop - 28);
    const profileTitleW = ctx.measureText(L("路线海拔剖面", "Elevation profile")).width;
    const legend = [
      ["#f7b054", L("海拔", "elevation")],
      ["#ffb65c", L("官方补给点", "aid station")],
      ["#34d399", L("自补点", "self point")],
      ["rgba(255,79,126,0.9)", L("爬坡", "climb")],
      ["rgba(79,156,240,0.9)", L("下降", "descent")],
    ];
    ctx.font = "18px sans-serif";
    let lx = pad + profileTitleW + 60;
    for (const item of legend) {
      ctx.fillStyle = item[0];
      ctx.fillRect(lx, plotTop - 34, 14, 14);
      ctx.fillStyle = "rgba(233,243,236,0.7)";
      ctx.textAlign = "left";
      ctx.fillText(item[1], lx + 20, plotTop - 23);
      lx += ctx.measureText(item[1]).width + 50;
    }

    const drawBands = (segs, color, textColor, prefix) => {
      let lane = 0;
      ctx.font = "20px sans-serif";
      for (const seg of segs) {
        const x1 = xForKm(seg.start);
        const x2 = xForKm(seg.end);
        ctx.fillStyle = color;
        ctx.fillRect(x1, plotTop, Math.max(x2 - x1, 2), plotH);
        const label = prefix + seg.height + "m";
        const tw = ctx.measureText(label).width + 16;
        if (x2 - x1 < tw) continue;
        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        ctx.fillText(label, (x1 + x2) / 2, lane === 0 ? plotTop + 26 : plotBot - 18);
        lane = 1 - lane;
      }
    };
    drawBands(climbSegs, "rgba(255,79,126,0.12)", "#ff8fa8", "↑");
    drawBands(descentSegs, "rgba(79,156,240,0.12)", "#9cc6f5", "↓");

    ctx.beginPath();
    pathPoints.forEach((p, i) => {
      const x = xForKm(p.km);
      const y = yForAlt(p.altitude);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    const grad = ctx.createLinearGradient(0, plotTop, 0, plotBot);
    grad.addColorStop(0, "rgba(240,136,40,0.30)");
    grad.addColorStop(1, "rgba(240,136,40,0.04)");
    ctx.lineTo(xForKm(rp.distance_km), plotBot);
    ctx.lineTo(pad, plotBot);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.beginPath();
    pathPoints.forEach((p, i) => {
      const x = xForKm(p.km);
      const y = yForAlt(p.altitude);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#f7b054";
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    const rows = (state.planRows || [])
      .filter((r) => !r.kmInvalid && sf(r.km) != null)
      .map((r) => Object.assign({}, r, { kmNum: sf(r.km) || 0 }))
      .sort((a, b) => a.kmNum - b.kmNum);
    const nCols = Math.max(rows.length, 1);
    const colW = Math.max(84, Math.min(260, Math.floor(plotW / nCols)));
    const verticalMode = colW < 150;
    const colCenters = rows.map((r) =>
      Math.max(padL + colW / 2, Math.min(xForKm(r.kmNum), padL + plotW - colW / 2))
    );
    let prevTickX = -1e9;
    let prevTickRow = 0;
    ctx.font = "20px sans-serif";
    for (let ri = 0; ri < rows.length; ri += 1) {
      const r = rows[ri];
      const cx = colCenters[ri];
      ctx.strokeStyle = "rgba(247,176,84,0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, plotBot);
      ctx.lineTo(cx, plotBot + 8);
      ctx.stroke();
      let row = 0;
      if (cx - prevTickX < 56) row = 1 - prevTickRow;
      prevTickX = cx;
      prevTickRow = row;
      ctx.fillStyle = "rgba(247,176,84,0.95)";
      ctx.textAlign = "center";
      ctx.fillText(String(Math.round(r.kmNum * 10) / 10), cx, plotBot + 28 + row * 22);
      const alt = typeof interpolateAltitude === "function" ? interpolateAltitude(pathPoints, r.kmNum) : 0;
      const py = yForAlt(alt);
      const isCp = Number(r.typeIndex) === 0;
      ctx.beginPath();
      ctx.arc(cx, py, isCp ? 8 : 6, 0, Math.PI * 2);
      ctx.fillStyle = isCp ? "#ffb65c" : "#34d399";
      ctx.fill();
      ctx.strokeStyle = "rgba(6,16,11,0.9)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // 官方补给点名称（车道式防重叠）
    let cpInfo = [];
    try {
      const parsed = JSON.parse(state.raceProfileForm.officialCp || "[]");
      if (Array.isArray(parsed)) cpInfo = parsed;
    } catch (err) {
      // 忽略解析失败
    }
    const cpLanes = { above: -1e9, below: -1e9 };
    ctx.font = "bold 18px sans-serif";
    for (let ri = 0; ri < rows.length; ri += 1) {
      const r = rows[ri];
      if (Number(r.typeIndex) !== 0) continue;
      const km = r.kmNum;
      const cx = colCenters[ri];
      const alt = typeof interpolateAltitude === "function" ? interpolateAltitude(pathPoints, km) : 0;
      const py = yForAlt(alt);
      const cp = cpInfo.find((c) => Math.abs(Number(c.distance) - km) < 0.05);
      const name = (cp && cp.name) || "CP";
      const label = name + " · " + Math.round(km) + "km";
      const tw = ctx.measureText(label).width + 22;
      const labelX = Math.max(padL + tw / 2 + 10, Math.min(cx, padL + plotW - tw / 2 - 10));
      let lane = "above";
      if (labelX - tw / 2 < cpLanes.above) lane = "below";
      if (lane === "below" && labelX - tw / 2 < cpLanes.below) lane = "above";
      cpLanes[lane] = labelX + tw / 2;
      const chipH = 34;
      let bgY = lane === "above" ? py - chipH - 14 : py + 14;
      bgY = Math.max(plotTop, Math.min(bgY, plotBot - chipH));
      const leaderY = bgY + (lane === "above" ? chipH : 0);
      ctx.strokeStyle = "rgba(255,182,92,0.75)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, py);
      ctx.lineTo(labelX, leaderY);
      ctx.stroke();
      ctx.fillStyle = "rgba(6,16,11,0.92)";
      roundRect(ctx, labelX - tw / 2, bgY, tw, chipH, 16);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,182,92,0.55)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#ffb65c";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, labelX, bgY + chipH / 2 + 1);
      ctx.textBaseline = "alphabetic";
    }
    if (!rows.some((r) => Math.abs(r.kmNum - rp.distance_km) < 0.2)) {
      const endX = xForKm(rp.distance_km);
      ctx.strokeStyle = "rgba(233,243,236,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(endX, plotBot);
      ctx.lineTo(endX, plotBot + 8);
      ctx.stroke();
      ctx.fillStyle = "rgba(233,243,236,0.6)";
      ctx.textAlign = "center";
      ctx.fillText(L("终点", "finish"), endX, plotBot + 28);
    }
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(233,243,236,0.55)";
    ctx.font = "20px sans-serif";
    ctx.fillText(L("距离 (km)", "distance (km)"), padL + plotW, plotTop - 28);

    // ---- 补给点明细：每个刻度下方，从上到下排布色块与数量 ----
    const itemTop = chartTop + chartH + 8;
    const legendTop = H - 130;
    const laneTop = itemTop + 14;
    const laneH = legendTop - laneTop - 10;
    ctx.save();
    ctx.translate(pad + 14, laneTop + laneH / 2 - 36);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = "#FFB65C";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(L("补给点 · 对应补给明细", "Per-point fueling details"), 0, 0);
    ctx.restore();
    const rowH = verticalMode ? 44 : 34;
    const iyStart = laneTop + (verticalMode ? 56 : 38);

    for (let ri = 0; ri < rows.length; ri += 1) {
      const r = rows[ri];
      const isCp = Number(r.typeIndex) === 0;
      const takeouts = (r.takeout || []).filter((t) => sf(t.count) > 0);
      const maxItems = Math.max(1, Math.floor((laneH - 10 - (verticalMode ? 56 : 38)) / rowH));
      const cx = colCenters[ri];
      const x0 = cx - colW / 2;

      ctx.strokeStyle = "rgba(52,211,153,0.28)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(cx, plotBot + 14);
      ctx.lineTo(cx, laneTop + 6);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = isCp ? "#ffb65c" : "#8fe3b4";
      ctx.font = verticalMode ? "15px sans-serif" : "18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(r.timeHM || fmtHM(r.time_h), cx, laneTop + (verticalMode ? 18 : 16));

      let iy = iyStart;
      const items = rowItemViews(r).filter((it) => it.qty > 0);
      let drawn = 0;
      const drawItemRow = (it, iyPos, color) => {
        const qty = fmtQty(it.qty) + (it.unit || "");
        const ic = iconImg(it.key);
        if (verticalMode) {
          if (ic) {
            ctx.drawImage(ic, cx - 14, iyPos - 29, 28, 28);
          } else {
            ctx.fillStyle = color;
            roundRect(ctx, cx - 14, iyPos - 30, 28, 28, 6);
            ctx.fill();
          }
          ctx.fillStyle = "#CDEADD";
          ctx.font = "16px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(qty, cx, iyPos + 14);
        } else {
          const icW = 26;
          const gap = 8;
          const txtW = ctx.measureText(qty).width;
          const startX = cx - (icW + gap + txtW) / 2;
          if (ic) {
            ctx.drawImage(ic, startX, iyPos - 21, icW, icW);
          } else {
            ctx.fillStyle = color;
            roundRect(ctx, startX, iyPos - 21, 26, 26, 6);
            ctx.fill();
          }
          ctx.fillStyle = "#CDEADD";
          ctx.font = "18px sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(qty, startX + icW + gap, iyPos);
        }
      };
      for (const it of items) {
        if (drawn >= maxItems) break;
        drawItemRow(it, iy, it.color);
        drawn += 1;
        iy += rowH;
      }
      if (items.length > maxItems) {
        ctx.fillStyle = "rgba(255,182,92,0.9)";
        ctx.font = "15px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("+" + (items.length - maxItems) + " " + L("项", "items"), cx, iy + 6);
        iy += 22;
      }
      if (isCp && takeouts.length && iy + 28 <= laneTop + laneH) {
        const maxTake = Math.max(0, Math.floor((laneTop + laneH - iy - 6) / rowH));
        let drawnTake = 0;
        for (const t of takeouts) {
          if (drawnTake >= maxTake) break;
          drawItemRow({ key: t.key, qty: t.count, unit: t.unit || "" }, iy, t.color || "#FFB65C");
          drawnTake += 1;
          iy += rowH;
        }
        if (takeouts.length > drawnTake) {
          ctx.fillStyle = "rgba(255,182,92,0.9)";
          ctx.font = "15px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("+" + (takeouts.length - drawnTake) + " " + L("项", "items"), cx, iy + 6);
          iy += 22;
        }
      }
    }

    // ---- 底部图标说明 ----
    const legendEntries = [];
    const addLegend = (label, color, unit, iconKey) => {
      if (!label) return;
      const key = label + "|" + color;
      if (legendEntries.some((e) => e.key === key)) return;
      legendEntries.push({ key, iconKey, label: label + (unit && label.indexOf("（") < 0 && label.indexOf("(") < 0 ? "（" + unit + "）" : ""), color: color || "#9BA8B4" });
    };
    (state.planRows || []).forEach((r) => {
      rowItemViews(r).filter((it) => it.qty > 0).forEach((it) => addLegend(it.label, it.color, it.unit, it.key));
      (r.takeout || []).filter((t) => sf(t.count) > 0).forEach((t) => addLegend(t.label, t.color || "#FFB65C", t.unit || "", t.key));
    });
    (state.checklist || []).forEach((c) => addLegend(c.label, c.color || "#9BA8B4", c.unit || "", c.key));
    ctx.fillStyle = "#FFB65C";
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(L("图标说明", "Icon legend"), pad, legendTop + 16);
    ctx.textAlign = "right";
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "rgba(233,243,236,0.4)";
    ctx.fillText(L("Trail Lab Engine v2.5 · 数据本地解析 · 仅供参考", "Trail Lab Engine v2.5 · local parsing · for reference only"), W - padR, legendTop + 16);
    const legendTopY = legendTop + 44;
    const legendBottom = H - 4;
    const simulateRows = (fontPx, iconSize) => {
      ctx.font = fontPx + "px sans-serif";
      let rowW = 0;
      let rowsN = 1;
      for (const e of legendEntries) {
        const tw = iconSize + ctx.measureText(e.label).width + 24;
        if (rowW + tw > W - padR - pad) {
          rowsN += 1;
          rowW = 0;
        }
        rowW += tw;
      }
      return rowsN;
    };
    let legendFontPx = 16;
    let legendIconSize = 22;
    let legendRows = simulateRows(legendFontPx, legendIconSize);
    const legendAvail = legendBottom - legendTopY;
    if (legendRows * 34 > legendAvail) {
      legendFontPx = 12;
      legendIconSize = 16;
      legendRows = simulateRows(legendFontPx, legendIconSize);
    }
    const legendRowStep = Math.max(16, Math.min(34, Math.floor(legendAvail / Math.max(legendRows, 1))));
    ctx.font = legendFontPx + "px sans-serif";
    ctx.textAlign = "left";
    let ly = legendTopY;
    let lcx = pad;
    for (const e of legendEntries) {
      const tw = ctx.measureText(e.label).width + legendIconSize + 24;
      if (lcx + tw > W - padR) {
        lcx = pad;
        ly += legendRowStep;
      }
      const lic = iconImg(e.iconKey);
      if (lic) {
        ctx.drawImage(lic, lcx, ly - legendIconSize - 4, legendIconSize, legendIconSize);
      } else {
        ctx.fillStyle = e.color;
        roundRect(ctx, lcx, ly - legendIconSize - 2, legendIconSize, legendIconSize, 5);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(233,243,236,0.85)";
      ctx.fillText(e.label, lcx + legendIconSize + 6, ly);
      lcx += tw;
    }
  }

  function exportImage() {
    const editor = global.TrailLabPlanEditor;
    if (!editor) return;
    const state = editor.getState();
    const out = state.ruleOutput;
    const rp = state.raceProfile;
    if (!out || !rp) {
      if (global.__peToast) global.__peToast("请先生成方案 / Please generate first");
      return;
    }
    const en = state.language === "en";
    const W = 2200;
    const H = Math.max(1100, Math.round((W * 390) / 844));
    // 统一取 blob：toBlob 优先，缺失/返回空时回退 dataURL（最大化兼容）
    const canvasToBlobSafe = (canvas, onDone) => {
      const fromDataUrl = () => {
        try {
          const dataUrl = canvas.toDataURL("image/png");
          const bin = atob(dataUrl.split(",")[1]);
          const buf = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i += 1) buf[i] = bin.charCodeAt(i);
          onDone(new Blob([buf], { type: "image/png" }));
        } catch (e) {
          onDone(null);
        }
      };
      try {
        if (typeof canvas.toBlob === "function") {
          canvas.toBlob((blob) => {
            if (blob) onDone(blob);
            else fromDataUrl();
          }, "image/png");
        } else {
          fromDataUrl();
        }
      } catch (e) {
        onDone(null);
      }
    };
    // 预览弹层：保证图片一定可见可保存（右键另存 / 点"保存图片"按钮，用户手势下载最可靠）
    const showPosterPreview = (url) => {
      const overlay = document.createElement("div");
      overlay.className = "pe-overlay pe-poster-overlay";
      overlay.id = "pePosterOverlay";
      overlay.innerHTML = `
        <div class="pe-modal pe-poster-modal">
          <div class="pe-modal-head"><h3>${en ? "Poster preview" : "海报预览"}</h3><button type="button" class="pe-modal-close" data-close="1">×</button></div>
          <div class="pe-modal-body">
            <img class="pe-poster-img" src="${url}" alt="trail_lab_fuel_plan_poster" />
            <p class="pe-poster-tip">${en ? "If the download did not start automatically, click \"Save image\" below, or right-click the image → Save image as…" : "如未自动下载：点击下方“保存图片”，或在图片上右键 → 另存为"}</p>
          </div>
          <div class="pe-confirm-actions">
            <button type="button" class="pe-confirm-cancel" data-close="1">${en ? "Close" : "关闭"}</button>
            <button type="button" class="pe-confirm-ok" data-save="1">${en ? "Save image" : "保存图片"}</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener("click", (e) => {
        if (e.target.closest("[data-save]")) {
          const a = document.createElement("a");
          a.href = url;
          a.download = "trail_lab_fuel_plan_poster.png";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          if (global.__peToast) global.__peToast(en ? "Poster exported" : "海报已导出");
          return;
        }
        if (e.target.closest("[data-close]") || e.target === overlay) {
          overlay.remove();
          setTimeout(() => URL.revokeObjectURL(url), 2000);
        }
      });
    };
    // 自动下载（延迟释放 URL，兼容各浏览器）+ 预览弹层双保险
    const finish = (blob) => {
      if (!blob) {
        if (global.__peToast) global.__peToast(en ? "Poster generation failed, please retry" : "海报生成失败，请重试");
        return;
      }
      let url;
      try {
        url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "trail_lab_fuel_plan_poster.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (global.__peToast) global.__peToast(en ? "Poster exported" : "海报已导出");
      } catch (e) {
        if (global.__peToast) global.__peToast((en ? "Auto-download failed, save from preview: " : "自动下载失败，请在预览中保存：") + String(e && e.message));
      }
      showPosterPreview(url);
    };
    const startExport = () => {
      let qrFallbackUsed = false;
      const renderOnce = (withQr, onBlob) => {
        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d");
        try {
          drawPoster(ctx, W, H, state, withQr ? qr : null, en);
        } catch (e) {
          onBlob(null);
          return;
        }
        canvasToBlobSafe(canvas, onBlob);
      };
      const finishBlob = (blob) => {
        if (blob) {
          finish(blob);
        } else if (!qrFallbackUsed) {
          qrFallbackUsed = true;
          renderOnce(false, finishBlob);
        } else {
          finish(null);
        }
      };
      const qr = new Image();
      qr.onload = () => { renderOnce(true, finishBlob); };
      qr.onerror = () => { qrFallbackUsed = true; renderOnce(false, finishBlob); };
      qr.src = QR_SRC;
    };
    // 预载补给/装备图标（dataURL，规避 file:// 污染）后开始导出，保证海报能画上图标
    const keys = new Set();
    (state.checklist || []).forEach((c) => keys.add(c.key));
    (state.planRows || []).forEach((r) => {
      ["gels", "electrolyte_ml", "plain_ml", "salt_tabs", "caffeine_mg"].forEach((k) => keys.add(k));
      Object.keys(r.extra || {}).forEach((k) => keys.add(k));
      (r.takeout || []).forEach((t) => keys.add(t.key));
    });
    const iconDataURL = (key) => (global.TrailLabIcons && typeof global.TrailLabIcons.iconData === "function") ? global.TrailLabIcons.iconData(key) : null;
    const pending = [];
    keys.forEach((k) => { if (iconDataURL(k)) pending.push(k); });
    if (!pending.length) {
      startExport();
    } else {
      let left = pending.length;
      pending.forEach((k) => {
        const im = new Image();
        im.onload = () => { _iconImgs[k] = im; if (--left <= 0) startExport(); };
        im.onerror = () => { if (--left <= 0) startExport(); };
        im.src = iconDataURL(k);
      });
    }
  }

  // 覆盖 plan_editor 的旧版竖版海报（旧实现保留但不再使用）
  if (global.TrailLabPlanEditor) {
    global.TrailLabPlanEditor.exportImage = exportImage;
  }
  global.TrailLabPoster = { exportImage };
})(typeof window !== "undefined" ? window : globalThis);
