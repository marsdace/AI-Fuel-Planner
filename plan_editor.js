// Trail Lab Web 版补给时间轴编辑器（Step 5）
// 移植自 09_wxxcx/pages/result/result.js（2026-08-28）：
//  - 补给时间轴全量手动编辑（增/删/插行、编辑距离触发重排、区间距离/区间爬升实时重算、km 校验）
//  - 官方补给点「带出」+ 携带校验 + 一键补齐
//  - 补给品/装备库 + 自定义（Web 端用色块/文字标识，无 PNG 图标资源）
//  - 合计实时重算 + xlsx/CSV/复制导出
// 依赖：window.TrailLabXlsx（xlsx.js）、全局 safeFloat/escapeHtml/escapeAttr（app.js）。
"use strict";

(function (global) {
  // ---------- 补给库（与小程序一致，Web 端用 color 色块替代 icon PNG） ----------
  const CUSTOM_COLORS = ["#FF6B6B", "#FF9F43", "#FFC94D", "#6BCB77", "#4D96FF", "#9B59B6", "#FF8AB5", "#5B8A72"];

  // 出发携带清单"建议上限"（不再强制截断，仅超量后提示）
  const CHECKLIST_LIMITS = {
    chk_carbs: 10,
    chk_salt: 10,
    chk_elec: 1,
    chk_water: 1,
    chk_caff: 1,
  };

  const SUPPLY_ITEMS = [
    { key: "banana", label: "香蕉", unit: "份", carbs_g: 25, sodium_mg: 0, caffeine_mg: 0, fluid_ml: 0, protein_g: 0, step: 1, cat: 1, sort: 1, color: "#FFC94D" },
    { key: "bar", label: "能量棒", unit: "份", carbs_g: 25, sodium_mg: 100, caffeine_mg: 0, fluid_ml: 0, protein_g: 5, step: 1, cat: 1, sort: 2, color: "#B07B45" },
    { key: "bread", label: "面包", unit: "份", carbs_g: 15, sodium_mg: 80, caffeine_mg: 0, fluid_ml: 0, protein_g: 0, step: 1, cat: 1, sort: 3, color: "#E8C996" },
    { key: "cookie", label: "饼干", unit: "份", carbs_g: 15, sodium_mg: 50, caffeine_mg: 0, fluid_ml: 0, protein_g: 0, step: 1, cat: 1, sort: 4, color: "#C98A6B" },
    { key: "raisins", label: "葡萄干", unit: "份", carbs_g: 20, sodium_mg: 0, caffeine_mg: 0, fluid_ml: 0, protein_g: 0, step: 1, cat: 1, sort: 5, color: "#6B4D8A" },
    { key: "gummies", label: "能量软糖", unit: "份", carbs_g: 25, sodium_mg: 40, caffeine_mg: 0, fluid_ml: 0, protein_g: 0, step: 1, cat: 1, sort: 6, color: "#FF8AB5" },
    { key: "honey", label: "蜂蜜", unit: "份", carbs_g: 15, sodium_mg: 0, caffeine_mg: 0, fluid_ml: 0, protein_g: 0, step: 1, cat: 1, sort: 7, color: "#D9A441" },
    { key: "nuts", label: "坚果", unit: "份", carbs_g: 5, sodium_mg: 0, caffeine_mg: 0, fluid_ml: 0, protein_g: 0, step: 1, cat: 1, sort: 8, color: "#8A6B4D" },
    { key: "cola", label: "可乐（罐）", unit: "份", carbs_g: 35, sodium_mg: 10, caffeine_mg: 32, fluid_ml: 330, protein_g: 0, step: 1, cat: 2, sort: 1, color: "#4D2B2B" },
    { key: "soup", label: "热汤", unit: "份", carbs_g: 10, sodium_mg: 300, caffeine_mg: 0, fluid_ml: 200, protein_g: 0, step: 1, cat: 2, sort: 2, color: "#B0743A" },
    { key: "orange", label: "橙子", unit: "份", carbs_g: 15, sodium_mg: 0, caffeine_mg: 0, fluid_ml: 50, protein_g: 0, step: 1, cat: 3, sort: 1, color: "#FF9F43" },
  ];

  const BASE_SUPPLY_FIVE = [
    { key: "add_carbs", label: "能量胶", unit: "件", carbs_g: 25, sodium_mg: 0, caffeine_mg: 0, fluid_ml: 0, protein_g: 0, step: 1, cat: 1, sort: 0, color: "#FF7A00" },
    { key: "add_elec", label: "电解质水", unit: "瓶", carbs_g: 0, sodium_mg: 250, caffeine_mg: 0, fluid_ml: 500, protein_g: 0, step: 1, cat: 2, sort: 0, color: "#4D96FF" },
    { key: "add_water", label: "白水", unit: "瓶", carbs_g: 0, sodium_mg: 0, caffeine_mg: 0, fluid_ml: 500, protein_g: 0, step: 1, cat: 2, sort: 1, color: "#6BCB77" },
    { key: "add_salt", label: "盐丸", unit: "粒", carbs_g: 0, sodium_mg: 200, caffeine_mg: 0, fluid_ml: 0, protein_g: 0, step: 1, cat: 4, sort: 0, color: "#9B59B6" },
    { key: "add_caff", label: "咖啡因", unit: "份", carbs_g: 0, sodium_mg: 0, caffeine_mg: 100, fluid_ml: 0, protein_g: 0, step: 1, cat: 5, sort: 0, color: "#5B8A72" },
  ];

  const TAKE_OUT_GEAR = [
    { key: "take_longsleeve", label: "长袖上衣", step: 1, cat: 1, sort: 1, color: "#4D96FF" },
    { key: "take_longpants", label: "长裤", step: 1, cat: 1, sort: 2, color: "#5B8A72" },
    { key: "take_jacket", label: "冲锋衣", step: 1, cat: 1, sort: 3, color: "#2B3A6B" },
    { key: "take_raincoat", label: "雨衣", step: 1, cat: 1, sort: 4, color: "#6B8A9B" },
    { key: "take_cap", label: "帽子", step: 1, cat: 1, sort: 5, color: "#C9825B" },
    { key: "take_gloves", label: "手套", step: 1, cat: 1, sort: 6, color: "#A85B5B" },
    { key: "take_shoes", label: "越野鞋", step: 1, cat: 2, sort: 1, color: "#FF6B6B" },
    { key: "take_backpack", label: "越野背包", step: 1, cat: 2, sort: 2, color: "#3D5B4D" },
    { key: "take_lamp", label: "头灯", step: 1, cat: 3, sort: 1, color: "#FFD166" },
    { key: "take_poles", label: "登山杖", step: 1, cat: 3, sort: 2, color: "#9BA8B4" },
    { key: "take_waterbottle", label: "水具", step: 1, cat: 3, sort: 3, color: "#6BCB77" },
    { key: "take_utensils", label: "便携餐具", step: 1, cat: 3, sort: 4, color: "#C9C9C9" },
    { key: "take_sunscreen", label: "防晒霜", step: 1, cat: 4, sort: 1, color: "#FFC94D" },
    { key: "take_blanket", label: "保温毯", step: 1, cat: 4, sort: 2, color: "#C9825B" },
    { key: "take_whistle", label: "救生口哨", step: 1, cat: 4, sort: 3, color: "#FF8A1F" },
    { key: "take_firstaid", label: "急救包", step: 1, cat: 4, sort: 4, color: "#FF6B6B" },
    { key: "take_phone", label: "手机/导航", step: 1, cat: 5, sort: 1, color: "#4D96FF" },
    { key: "take_powerbank", label: "充电宝", step: 1, cat: 5, sort: 2, color: "#6B8A4D" },
    { key: "take_sunglasses", label: "墨镜", step: 1, cat: 6, sort: 1, color: "#2B2B2B" },
  ];

  function formatNutri(it) {
    const parts = [];
    if (it.carbs_g) parts.push("碳水" + it.carbs_g + "g");
    if (it.fluid_ml) parts.push("水" + it.fluid_ml + "ml");
    if (it.sodium_mg) parts.push("钠" + it.sodium_mg + "mg");
    if (it.caffeine_mg) parts.push("咖啡因" + it.caffeine_mg + "mg");
    if (it.protein_g) parts.push("蛋白" + it.protein_g + "g");
    return parts.join(" · ") || "—";
  }

  // 统一补给口径
  function canonSupplyKey(key) {
    const map = {
      gels: "carbs", add_carbs: "carbs", chk_carbs: "carbs",
      electrolyte: "electrolyte", electrolyte_ml: "electrolyte", add_elec: "electrolyte", chk_elec: "electrolyte",
      plain_ml: "water", add_water: "water", chk_water: "water",
      salt_tabs: "salt", add_salt: "salt", chk_salt: "salt",
      caffeine_mg: "caffeine", add_caff: "caffeine", chk_caff: "caffeine",
    };
    return map[key] || key;
  }

  const state = {
    planRows: [],
    checklist: [],
    customItems: [],
    customGearItems: [],
    ruleOutput: null,
    raceProfile: null,
    cpMap: {},
    raceProfileForm: {},
    routeFitPoints: [],
    routeTrack: [],
    language: "zh",
  };

  let el = {};
  let container = null;

  // ---------- 工具 ----------
  function sf(v) {
    const n = safeFloat(v);
    return n;
  }
  function fmtHM(h) {
    const total = Math.round((sf(h) || 0) * 60);
    const pad = (n) => (n < 10 ? "0" + n : "" + n);
    return pad(Math.floor(total / 60)) + ":" + pad(total % 60);
  }
  function esc(v) { return escapeHtml(v); }

  function L(zh, en) {
    return state.language === "en" ? en : zh;
  }

  // ---------- 补给库 ----------
  function getAllSupplyItems() {
    const custom = (state.customItems || []).map((i) => ({ ...i, isCustom: true, cat: 99, sort: 0, nutri: formatNutri(i) }));
    return BASE_SUPPLY_FIVE.map((i) => ({ ...i, isCustom: false, nutri: formatNutri(i) }))
      .concat(SUPPLY_ITEMS.map((i) => ({ ...i, isCustom: false, nutri: formatNutri(i) })))
      .concat(custom)
      .sort((a, b) => (a.cat || 99) - (b.cat || 99) || (a.sort || 0) - (b.sort || 0));
  }

  // 装备库 = 内置装备 + 自定义装备（与小程序 gearLibrary 一致，自定义标记 isCustom）
  function gearLibrary() {
    const custom = (state.customGearItems || []).map((i) => ({ ...i, isCustom: true, nutri: L("装备", "gear") }));
    return TAKE_OUT_GEAR.map((i) => ({ ...i, isCustom: false, nutri: L("装备", "gear") })).concat(custom);
  }

  // 自定义确认弹层（对齐小程序底部抽屉确认，替代 window.confirm）
  function peConfirm(opts) {
    const en = state.language === "en";
    const overlay = document.createElement("div");
    overlay.className = "pe-overlay pe-confirm-overlay";
    overlay.id = "peConfirmOverlay";
    overlay.innerHTML = `
      <div class="pe-modal pe-confirm-modal">
        <div class="pe-modal-head"><h3>${esc(opts.title)}</h3></div>
        <div class="pe-modal-body"><p class="pe-confirm-text">${esc(opts.text || "")}</p></div>
        <div class="pe-confirm-actions">
          <button type="button" class="pe-confirm-cancel" data-close="1">${en ? "Cancel" : "取消"}</button>
          <button type="button" class="pe-confirm-ok${opts.danger ? " danger" : ""}" data-ok="1">${esc(opts.confirmText)}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => {
      const ok = e.target.closest("[data-ok]");
      const cancel = e.target.closest("[data-close]") || e.target === overlay;
      if (!ok && !cancel) return;
      overlay.remove();
      if (ok && typeof opts.onConfirm === "function") opts.onConfirm();
    });
  }

  // 删除自定义补给品/装备：从库、各补给点（extra/takeout）、出发自查清单同步移除
  function deleteCustomItem(key) {
    if (!key) return;
    const en = state.language === "en";
    const isGear = String(key).indexOf("customgear_") === 0;
    peConfirm({
      title: en ? "Delete custom item?" : "删除自定义项？",
      text: en
        ? "Delete this custom " + (isGear ? "gear" : "item") + "? It will be removed from all points and the checklist."
        : "删除该自定义" + (isGear ? "装备" : "补给品") + "？将从所有补给点与出发自查清单中移除。",
      confirmText: en ? "Delete" : "删除",
      danger: true,
      onConfirm: () => {
        // 从各补给点移除（extra 或 takeout）
        const rows = state.planRows.map((r) => {
          const next = { ...r };
          if (isGear) {
            next.takeout = (r.takeout || []).filter((t) => t.key !== key);
          } else {
            const extra = { ...(r.extra || {}) };
            if (extra[key] != null) delete extra[key];
            next.extra = extra;
          }
          return next;
        });
        // 从出发自查清单移除
        const checklist = (state.checklist || []).filter((c) => c.key !== key);
        if (isGear) {
          state.customGearItems = (state.customGearItems || []).filter((it) => it.key !== key);
        } else {
          state.customItems = (state.customItems || []).filter((it) => it.key !== key);
        }
        state.planRows = refreshDerived(rows);
        state.checklist = checklist;
        recalcTotals();
        render();
        if (global.__peToast) global.__peToast(en ? "Custom item deleted" : "自定义项已删除");
      },
    });
  }

  function carryMeta(key) {
    const BASE = {
      carbs: { checkKey: "chk_carbs", addKey: "add_carbs", label: "能量胶", unit: "件", color: "#FF7A00" },
      electrolyte: { checkKey: "chk_elec", addKey: "add_elec", label: "电解质水", unit: "瓶", color: "#4D96FF" },
      water: { checkKey: "chk_water", addKey: "add_water", label: "白水", unit: "瓶", color: "#6BCB77" },
      salt: { checkKey: "chk_salt", addKey: "add_salt", label: "盐丸", unit: "粒", color: "#9B59B6" },
      caffeine: { checkKey: "chk_caff", addKey: "add_caff", label: "咖啡因", unit: "份", color: "#5B8A72" },
    };
    if (BASE[key]) return BASE[key];
    const it = getAllSupplyItems().find((i) => i.key === key);
    return { checkKey: key, addKey: key, label: (it && it.label) || key, unit: (it && it.unit) || "份", color: (it && it.color) || "#9BA8B4" };
  }

  // ---------- 引擎携带分段 → 官方点默认带出 ----------
  function segmentCarryItems(seg) {
    const list = [];
    const add = (canonKey, count) => {
      if (!count || count <= 0) return;
      const meta = carryMeta(canonKey);
      list.push({ key: meta.addKey, label: meta.label, count, unit: meta.unit, color: meta.color });
    };
    add("carbs", seg.gels);
    add("electrolyte", seg.electrolyte_bottles);
    add("water", seg.water_bottles);
    add("salt", seg.salt_tabs);
    add("caffeine", seg.caffeine_cups);
    return list;
  }

  // ---------- 累计爬升（真实轨迹插值优先，回退路段） ----------
  function cumulativeClimb(km) {
    const pts = state.routeFitPoints || [];
    if (pts.length >= 2) {
      let climb = 0;
      let prevKm = Number(pts[0].km) || 0;
      let prevAlt = Number(pts[0].altitude);
      if (!Number.isFinite(prevAlt)) prevAlt = 0;
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        const pKm = Number(p.km) || 0;
        const pAlt = Number(p.altitude);
        if (!Number.isFinite(pAlt)) continue;
        if (pKm >= km) {
          const frac = Math.min(Math.max((km - prevKm) / Math.max(pKm - prevKm, 0.001), 0), 1);
          const alt = prevAlt + (pAlt - prevAlt) * frac;
          climb += Math.max(alt - prevAlt, 0);
          break;
        }
        climb += Math.max(pAlt - prevAlt, 0);
        prevKm = pKm;
        prevAlt = pAlt;
      }
      return climb;
    }
    return cumulativeClimbBySegments(km);
  }
  function cumulativeClimbBySegments(km) {
    const segs = (state.raceProfile && state.raceProfile.climb_segments) || [];
    let covered = 0;
    let ascent = 0;
    for (const [d, a] of segs) {
      if (km <= covered || d <= 0) break;
      const take = Math.min(km - covered, d);
      if (take > 0) ascent += Math.max(a || 0, 0) * (take / d);
      covered += d;
      if (covered >= km) break;
    }
    return ascent;
  }

  // ---------- refreshDerived：区间距离/爬升 + km 校验 + 视图 ----------
  function refreshDerived(rows) {
    const indexed = rows.map((r, idx) => ({ r, idx }));
    const sorted = [...indexed].sort((a, b) => (sf(a.r.km) || 0) - (sf(b.r.km) || 0));
    const segInfo = {};
    let prevKm = 0;
    let prevClimb = 0;
    for (const { r, idx } of sorted) {
      const km = sf(r.km) || 0;
      const climb = km > 0 ? cumulativeClimb(km) : 0;
      segInfo[idx] = {
        seg_dist_km: Math.max(0, Math.round((km - prevKm) * 10) / 10),
        seg_climb_m: Math.max(0, Math.round((climb - prevClimb) * 10) / 10),
      };
      prevKm = km;
      prevClimb = climb;
    }
    return rows.map((r, idx) => {
      const km = sf(r.km);
      const prevKm = idx > 0 ? sf(rows[idx - 1].km) : null;
      const nextKm = idx < rows.length - 1 ? sf(rows[idx + 1].km) : null;
      let kmInvalid = false;
      let kmError = "";
      if (km == null) {
        kmInvalid = true;
        kmError = L("距离未填写", "distance missing");
      } else if (km < 0.1 || km > 300) {
        kmInvalid = true;
        kmError = L("距离需在 0.1–300 km", "distance 0.1–300 km");
      } else if (prevKm != null && km <= prevKm) {
        kmInvalid = true;
        kmError = L("需大于上一补给点（" + prevKm + "km）", "must be > previous (" + prevKm + "km)");
      } else if (nextKm != null && km >= nextKm) {
        kmInvalid = true;
        kmError = L("需小于下一补给点（" + nextKm + "km）", "must be < next (" + nextKm + "km)");
      }
      return {
        ...r,
        timeHM: fmtHM(r.time_h),
        kmInvalid,
        kmError,
        ...(segInfo[idx] || { seg_dist_km: 0, seg_climb_m: 0 }),
      };
    });
  }

  function sortRowsByKm(rows) {
    return [...rows].sort((a, b) => {
      const ka = sf(a.km);
      const kb = sf(b.km);
      return (ka == null ? Infinity : ka) - (kb == null ? Infinity : kb);
    });
  }

  // ---------- buildPlanRows（从引擎输出） ----------
  function buildPlanRows(ruleOutput) {
    const kmKey = (v) => String(Number(Number(v).toFixed(2)));
    const caffByKm = new Map((ruleOutput.caffeine_schedule || []).map((c) => [kmKey(c.km), c]));
    const proteinByKm = new Map((ruleOutput.protein_schedule || []).map((p) => [kmKey(p.km), p]));
    const rows = (ruleOutput.fueling_points || []).map((p) => {
      const isCp = (p.source || "").split("+").includes("cp");
      const electrolyteMl = p.electrolyte_ml != null ? p.electrolyte_ml : Math.min(p.fluid_ml, Math.round(p.sodium_mg / 0.5));
      const plainMl = p.plain_ml != null ? p.plain_ml : Math.round(p.fluid_ml - electrolyteMl);
      const saltCount = p.salt_tab_count != null ? p.salt_tab_count : Math.ceil(Math.max(0, p.sodium_mg - Math.round(electrolyteMl * 0.5)) / 200);
      const gels = p.gels_count != null ? p.gels_count : (p.carbs_g > 0 ? Math.max(1, Math.round(p.carbs_g / 25)) : 0);
      const caff = caffByKm.get(kmKey(p.km));
      const protein = proteinByKm.get(kmKey(p.km));
      const seg = (ruleOutput.carry_segments || []).find((s) => s.from_km > 0 && Math.abs(s.from_km - Number(p.km)) < 0.05);
      return {
        km: String(Math.round(Number(p.km) * 10) / 10),
        time_h: String(p.time_h),
        typeIndex: isCp ? 0 : 1,
        cutoff: isCp ? ((state.cpMap || {})[kmKey(p.km)] || {}).cutoff || "" : "",
        takeout: isCp ? [
          { key: "bread", label: "面包", count: 1, unit: "份", color: "#E8C996" },
          { key: "cola", label: "可乐（罐）", count: 1, unit: "份", color: "#4D2B2B" },
          { key: "banana", label: "香蕉", count: 1, unit: "份", color: "#FFC94D" },
        ].concat(seg ? segmentCarryItems(seg) : []) : [],
        gels: String(gels),
        electrolyte_ml: String(electrolyteMl),
        plain_ml: String(plainMl),
        salt_tabs: String(saltCount),
        caffeine_mg: caff ? String(caff.mg) : "",
        protein_g: protein ? String(protein.g) : "",
        note: p.source || "",
        extra: {},
      };
    });
    return refreshDerived(sortRowsByKm(rows));
  }

  // ---------- 单个自补点消耗（统一口径） ----------
  function rowSupplyNeed(r) {
    const need = {};
    const add = (key, n) => {
      const v = Math.round((sf(n) || 0) * 10) / 10;
      if (v > 0) need[key] = Math.round(((need[key] || 0) + v) * 10) / 10;
    };
    add("carbs", sf(r.gels));
    add("electrolyte", (sf(r.electrolyte_ml) || 0) / 500);
    add("water", (sf(r.plain_ml) || 0) / 500);
    add("salt", sf(r.salt_tabs));
    add("caffeine", (sf(r.caffeine_mg) || 0) / 100);
    (getAllSupplyItems() || []).forEach((it) => {
      const n = (r.extra && r.extra[it.key]) || 0;
      if (n > 0) add(canonSupplyKey(it.key), n);
    });
    return need;
  }

  // ---------- 携带校验 ----------
  function buildCarryWarnings() {
    const warnings = [];
    const indexed = (state.planRows || [])
      .map((r, idx) => ({ r, idx }))
      .filter((x) => !x.r.kmInvalid && sf(x.r.km) != null)
      .map((x) => ({ ...x, kmNum: sf(x.r.km) || 0 }))
      .sort((a, b) => a.kmNum - b.kmNum);
    const cps = indexed.filter((x) => Number(x.r.typeIndex) === 0);
    if (!cps.length) return warnings;
    const sumNeed = (list) => {
      const total = {};
      list.forEach((x) => {
        const n = rowSupplyNeed(x.r);
        Object.keys(n).forEach((k) => {
          total[k] = Math.round(((total[k] || 0) + n[k]) * 10) / 10;
        });
      });
      return total;
    };
    const amountMap = (list) => {
      const map = {};
      (list || []).forEach((it) => {
        const k = canonSupplyKey(it.key);
        map[k] = Math.round(((map[k] || 0) + (sf(it.count) || 0)) * 10) / 10;
      });
      return map;
    };
    const cpName = (km) => {
      let name = "";
      try {
        const cps0 = JSON.parse((state.raceProfileForm && state.raceProfileForm.officialCp) || "[]");
        const hit = (cps0 || []).find((c) => Math.abs(Number(c.distance) - km) < 0.05);
        if (hit && hit.name) name = hit.name;
      } catch (err) { /* ignore */ }
      return name;
    };
    const pushWarn = (type, rowIdx, cpKm, key, need, carry) => {
      const meta = carryMeta(key);
      const short = Math.round((need - carry) * 10) / 10;
      if (short <= 0) return;
      const prefix = type === "start" ? L("出发携带", "carry at start") : (cpName(cpKm) || L("官方补给点", "aid station")) + L("带出", " takeout");
      warnings.push({
        id: type + "_" + key + "_" + (rowIdx == null ? "start" : rowIdx),
        type,
        rowIdx,
        canonKey: key,
        label: meta.label,
        unit: meta.unit,
        need,
        carry,
        short,
        text: prefix + "：" + meta.label + " " + L("需", "need ") + need + " " + meta.unit + "，" + L("当前", "have ") + carry + " " + meta.unit,
      });
    };
    const firstCp = cps[0];
    const seg0 = indexed.filter((x) => Number(x.r.typeIndex) !== 0 && x.kmNum < firstCp.kmNum);
    const need0 = sumNeed(seg0);
    const carry0 = amountMap(state.checklist.filter((c) => c.kind === "supply"));
    Object.keys(need0).forEach((k) => pushWarn("start", null, null, k, need0[k], carry0[k] || 0));
    for (let i = 0; i < cps.length - 1; i += 1) {
      const from = cps[i].kmNum;
      const to = cps[i + 1].kmNum;
      const seg = indexed.filter((x) => Number(x.r.typeIndex) !== 0 && x.kmNum > from && x.kmNum < to);
      const need = sumNeed(seg);
      const carry = amountMap(cps[i].r.takeout);
      Object.keys(need).forEach((k) => pushWarn("cp", cps[i].idx, from, k, need[k], carry[k] || 0));
    }
    const lastCp = cps[cps.length - 1];
    const segLast = indexed.filter((x) => Number(x.r.typeIndex) !== 0 && x.kmNum > lastCp.kmNum);
    const needLast = sumNeed(segLast);
    const carryLast = amountMap(lastCp.r.takeout);
    Object.keys(needLast).forEach((k) => pushWarn("cp", lastCp.idx, lastCp.kmNum, k, needLast[k], carryLast[k] || 0));
    return warnings;
  }

  // ---------- 合计 ----------
  function recalcTotals() {
    const t = { carbs_g: 0, fluid_ml: 0, sodium_mg: 0, gels: 0, salt_tabs: 0, caffeine_mg: 0 };
    for (const r of state.planRows) {
      if (r.kmInvalid) continue;
      const gels = sf(r.gels) || 0;
      const elec = sf(r.electrolyte_ml) || 0;
      const plain = sf(r.plain_ml) || 0;
      const salt = sf(r.salt_tabs) || 0;
      const caff = sf(r.caffeine_mg) || 0;
      t.gels += gels;
      t.salt_tabs += salt;
      t.carbs_g += gels * 25 + extraOf(r, "carbs_g");
      t.fluid_ml += elec + plain + extraOf(r, "fluid_ml");
      t.sodium_mg += elec * 0.5 + salt * 200 + extraOf(r, "sodium_mg");
      t.caffeine_mg += caff + extraOf(r, "caffeine_mg");
    }
    t.carbs_g = Math.round(t.carbs_g * 10) / 10;
    t.fluid_ml = Math.round(t.fluid_ml);
    t.sodium_mg = Math.round(t.sodium_mg);
    t.caffeine_mg = Math.round(t.caffeine_mg);
    const carry = { gels: 0, salt: 0, fluid: 0, elec: 0, plain: 0, caff: 0, weight: 0 };
    for (const r of state.planRows) {
      if (r.kmInvalid || r.typeIndex === 0) continue;
      const gels = sf(r.gels) || 0;
      const salt = sf(r.salt_tabs) || 0;
      const elec = sf(r.electrolyte_ml) || 0;
      const plain = sf(r.plain_ml) || 0;
      const caff = sf(r.caffeine_mg) || 0;
      carry.gels += gels;
      carry.salt += salt;
      carry.fluid += elec + plain + extraOf(r, "fluid_ml");
      carry.elec += elec;
      carry.plain += plain;
      carry.caff += caff + extraOf(r, "caffeine_mg");
    }
    carry.gels = Math.round(carry.gels);
    carry.salt = Math.round(carry.salt);
    carry.fluid = Math.round(carry.fluid);
    carry.elec = Math.round(carry.elec);
    carry.plain = Math.round(carry.plain);
    carry.caff = Math.round(carry.caff);
    carry.weight = Math.round(carry.gels * 34 + carry.salt * 2 + carry.fluid);
    state.planTotals = t;
    state.carryTotals = carry;
  }

  function extraOf(r, field) {
    const e = r.extra || {};
    return getAllSupplyItems().reduce((sum, it) => {
      if ((e[it.key] || 0) > 0) {
        if (field === "carbs_g") sum += (it.carbs_g || 0) * e[it.key];
        else if (field === "fluid_ml") sum += (it.fluid_ml || 0) * e[it.key];
        else if (field === "sodium_mg") sum += (it.sodium_mg || 0) * e[it.key];
        else if (field === "caffeine_mg") sum += (it.caffeine_mg || 0) * e[it.key];
      }
      return sum;
    }, 0);
  }

  function extraLabel(r) {
    const e = r.extra || {};
    return getAllSupplyItems()
      .filter((it) => (e[it.key] || 0) > 0)
      .map((it) => `${it.label} ${e[it.key]}${it.unit || ""}（${formatNutri(it)}）`)
      .join(" + ");
  }

  function takeoutText(r) {
    return (r.takeout || []).filter((it) => (sf(it.count) || 0) > 0).map((it) => `${it.label}×${it.count}${it.unit || ""}`).join("、");
  }

  // ---------- 渲染 ----------
  function render() {
    if (!container) return;
    renderToolbar();
    renderSummary();
    renderTable();
    renderTotals();
    renderCarryWarnings();
    renderChecklist();
    renderMeta();
  }

  // 安全提示横幅 + 类型图例（语言感知）
  function renderMeta() {
    const en = state.language === "en";
    const safety = document.getElementById("planSafetyBanner");
    if (safety) {
      safety.textContent = en
        ? "Safety note: general estimate, not medical advice. Adjust to your fitness, weather and GI tolerance; use at your own risk."
        : "安全提示：本方案为通用规则估算，非医疗建议；请结合自身体能、天气与肠胃耐受，在专业人士指导下调整，量力而行；使用者自行承担风险。";
    }
    const legend = document.getElementById("planTypeLegend");
    if (legend) {
      legend.innerHTML = `
        <span class="type-swatch"><i class="swatch-dot self"></i>${en ? "Self-supply" : "自补点"}</span>
        <span class="type-swatch"><i class="swatch-dot cp"></i>${en ? "Aid station" : "官方补给点"}</span>`;
    }
  }

  function renderToolbar() {
    const en = state.language === "en";
    if (el.addBtn) el.addBtn.innerHTML = en ? "＋ Add self point" : "＋ 添加自补给点";
    if (el.clearBtn) el.clearBtn.innerHTML = en ? "Clear self points" : "清空自补给点";
    const warns = buildCarryWarnings();
    if (el.fixBtn) el.fixBtn.innerHTML = warns.length
      ? (en ? `Auto-fix carry (${warns.length})` : `一键补齐携带 (${warns.length})`)
      : (en ? "Auto-fix carry" : "一键补齐携带");
    if (el.libBtn) el.libBtn.innerHTML = en ? "Library" : "补给库";
  }

  // 方案摘要卡：完赛时间 + 每小时目标 4 卡 + 赛前/赛后建议（与小程序 result 一致）
  function renderSummary() {
    if (!el.summary) return;
    const en = state.language === "en";
    const out = state.ruleOutput;
    if (!out) return;
    const weightKg = out.weight_kg || 70;
    const conf = out.confidence && out.confidence.finish_time;
    const confLabel = conf === "high" ? (en ? "High" : "高") : conf === "low" ? (en ? "Low" : "低") : (en ? "Medium" : "中");
    const tierLabel = { staged: en ? "staged" : "分次", late: en ? "late" : "后段", optional: en ? "optional" : "按需可选" }[out.caffeine_tier] || out.caffeine_tier;
    const hourly = [
      { label: en ? "Carbs" : "碳水", value: out.carbs_per_hour_g, unit: " g/h", extra: `${out.carb_range_g[0]}–${out.carb_range_g[1]}${out.dual_sugar ? (en ? " · dual" : " · 双糖") : ""}` },
      { label: en ? "Fluid" : "液体", value: out.fluid_per_hour_ml, unit: " ml/h", extra: `${out.fluid_range_ml[0]}–${out.fluid_range_ml[1]}` },
      { label: en ? "Sodium" : "钠", value: out.sodium_per_hour_mg, unit: " mg/h", extra: `${out.sodium_mg_l} mg/L` },
      { label: en ? "Caffeine" : "咖啡因", value: `${out.caffeine_budget_mg[0]}–${out.caffeine_budget_mg[1]}`, unit: " mg", extra: tierLabel },
    ];
    const prePost = [
      (en ? "Pre-race 36–48h: glycogen " : "赛前 36–48h：糖原填充 ") + Math.round(weightKg * 10) + "–" + Math.round(weightKg * 12) + " g/天（" + weightKg + "kg × 10–12）",
      (en ? "Pre-race 1–4h: " : "赛前 1–4h：") + Math.round(weightKg * 1) + "–" + Math.round(weightKg * 4) + " g 碳水（低纤维低脂）",
      (en ? "Post-race 0–4h: " : "赛后 0–4h：每小时 ") + Math.round(weightKg * 1.0) + "–" + Math.round(weightKg * 1.2) + " g 碳水 + " + Math.round(weightKg * 0.3) + "–" + Math.round(weightKg * 0.4) + " g 蛋白",
    ];
    el.summary.innerHTML = `
      <div class="pe-summary-head">
        <span class="pe-summary-finish">${en ? "Est. finish" : "预计完赛"} <b>${fmtHM(out.estimated_finish_time_h)}</b>
          <i>${fmtHM(out.finish_time_range[0])}–${fmtHM(out.finish_time_range[1])} · ${en ? "conf" : "置信度"} ${confLabel}</i></span>
        <span class="pe-summary-race">${(state.raceProfile && state.raceProfile.distance_km) || "-"} km · ${(state.raceProfile && state.raceProfile.ascent_m) || 0} m · ${(state.raceProfile && state.raceProfile.descent_m) || 0} m</span>
      </div>
      <div class="pe-summary-hourly">${hourly.map((h) => `
        <span class="pe-hourly-card"><b>${esc(String(h.value))}${h.unit}</b><i>${esc(h.label)}</i><em>${esc(h.extra)}</em></span>`).join("")}</div>
      <div class="pe-summary-prepost">${prePost.map((p) => `<span>${esc(p)}</span>`).join("")}</div>
    `;
  }

  function renderTable() {
    const en = state.language === "en";
    const rows = state.planRows;
    const stepBtn = (dir, key, step, extraAttr) => `
      <button type="button" class="pe-step" data-step="${dir > 0 ? step : -step}" data-key="${key}" ${extraAttr || ""}>${dir > 0 ? "＋" : "−"}</button>`;
    const chip = (label, countTxt, color, minus, plus) => `
      <span class="pe-chip-item">
        ${minus}
        <span class="pe-chip" style="--c:${color || "#9BA8B4"}">${esc(label)} ${countTxt}</span>
        ${plus}
      </span>`;
    const fmtBottle = (ml) => String(Math.round(((sf(ml) || 0) / 500) * 10) / 10);
    const fmtCup = (mg) => String(Math.round(((sf(mg) || 0) / 100) * 10) / 10);
    const body = rows.map((r, idx) => {
      const isCp = Number(r.typeIndex) === 0;
      const rowClass = "pe-row" + (isCp ? " is-cp" : "") + (r.kmInvalid ? " has-error" : "");
      const errHtml = r.kmInvalid ? `<span class="pe-err">${esc(r.kmError)}</span>` : "";
      // 固定五件套（口径与小程序一致：电解质水/白水按瓶，咖啡因按份）
      const gels = sf(r.gels) || 0;
      const elecMl = sf(r.electrolyte_ml) || 0;
      const plainMl = sf(r.plain_ml) || 0;
      const salt = sf(r.salt_tabs) || 0;
      const caff = sf(r.caffeine_mg) || 0;
      const itemsHtml = []
        .concat(gels > 0 ? [chip(en ? "Gel" : "能量胶", gels + "件", "#FF7A00", stepBtn(-1, "gels", 1), stepBtn(1, "gels", 1))] : [])
        .concat(elecMl > 0 ? [chip(en ? "Elec" : "电解质水", fmtBottle(elecMl) + "瓶", "#4D96FF", stepBtn(-1, "electrolyte_ml", 50), stepBtn(1, "electrolyte_ml", 250))] : [])
        .concat(plainMl > 0 ? [chip(en ? "Water" : "白水", fmtBottle(plainMl) + "瓶", "#6BCB77", stepBtn(-1, "plain_ml", 50), stepBtn(1, "plain_ml", 250))] : [])
        .concat(salt > 0 ? [chip(en ? "Salt" : "盐丸", salt + "粒", "#9B59B6", stepBtn(-1, "salt_tabs", 1), stepBtn(1, "salt_tabs", 1))] : [])
        .concat(caff > 0 ? [chip(en ? "Caff" : "咖啡因", fmtCup(caff) + "份", "#5B8A72", stepBtn(-1, "caffeine_mg", 10), stepBtn(1, "caffeine_mg", 50))] : [])
        .concat(
          getAllSupplyItems()
            .filter((it) => ((r.extra || {})[it.key] || 0) > 0)
            .map((it) => chip(it.label, (r.extra || {})[it.key] + (it.unit || ""), it.color || "#9BA8B4", "", ""))
        )
        .join("");
      const takeoutHtml = (r.takeout || []).filter((it) => (sf(it.count) || 0) > 0).map((it) => `
        <span class="pe-chip-item">
          ${stepBtn(-1, it.key, 1)}
          <span class="pe-chip" style="--c:${it.color || "#9BA8B4"}">${esc(it.label)} ${it.count}${it.unit || ""}</span>
          ${stepBtn(1, it.key, 1)}
        </span>`).join("");
      const addBtn = isCp
        ? `<button type="button" class="pe-libmini" data-act="takeout" data-idx="${idx}">＋ ${en ? "Takeout" : "带出"}</button>`
        : `<button type="button" class="pe-libmini" data-act="extra" data-idx="${idx}">＋ ${en ? "Add" : "补给"}</button>`;
      return `
        <div class="${rowClass}" data-idx="${idx}">
          <span class="pe-row-bar" aria-hidden="true"></span>
          <div class="pe-row-main">
            <div class="pe-row-top">
              <div class="pe-stat pe-stat-primary">
                <span class="pe-stat-label">${en ? "Cum. dist" : "累计距离"}</span>
                <div class="pe-stat-value">
                  ${isCp
                    ? `<span class="pe-km-readonly">${esc(r.km)}<span class="pe-unit">km</span></span>`
                    : `<input class="pe-input pe-km pe-km-input" data-key="km" value="${esc(r.km || "")}" inputmode="decimal" placeholder="0.0" /><span class="pe-unit">km</span>`}
                </div>
              </div>
              <div class="pe-stat pe-stat-primary">
                <span class="pe-stat-label">${en ? "Est. time" : "预计时间"}</span>
                <div class="pe-stat-value">
                  <input class="pe-input pe-time" data-key="time_h" value="${esc(r.timeHM || "")}" placeholder="HH:MM" />
                </div>
              </div>
              <div class="pe-stat pe-stat-seg">
                <span class="pe-stat-label">${en ? "Seg dist" : "区间距离"}</span>
                <div class="pe-stat-value"><b class="pe-seg-dist">${r.seg_dist_km != null ? r.seg_dist_km : ""}</b><span class="pe-unit">km</span></div>
              </div>
              <div class="pe-stat pe-stat-seg">
                <span class="pe-stat-label">${en ? "Seg climb" : "区间爬升"}</span>
                <div class="pe-stat-value"><b class="pe-seg-climb">${r.seg_climb_m != null ? r.seg_climb_m : ""}</b><span class="pe-unit">m</span></div>
              </div>
              <span class="pe-seg" style="display:none">${r.seg_dist_km != null ? r.seg_dist_km : ""}km / ${r.seg_climb_m != null ? r.seg_climb_m : ""}m</span>
              ${isCp ? "" : `<button type="button" class="pe-del" data-act="del" data-idx="${idx}" title="${en ? "Delete" : "删除"}">×</button>`}
            </div>
            ${errHtml}
            ${isCp ? `<div class="pe-cp-row"><span class="pe-cp-label">${en ? "In-station" : "站内补给"}</span><span class="pe-cutoff">${en ? "Cutoff " : "关门时间 "}${esc(r.cutoff || "--:--")}</span></div>` : ""}
            <div class="pe-items">
              ${itemsHtml}
              ${addBtn}
            </div>
            ${isCp && takeoutHtml ? `<div class="pe-takeout"><span class="pe-takeout-label">${en ? "Takeout" : "带出"}</span><div class="pe-takeout-items">${takeoutHtml}</div></div>` : ""}
          </div>
        </div>
        <button type="button" class="pe-insert-row" data-act="insert" data-idx="${idx}">＋ ${en ? "Insert point after" : "在此后插入补给点"}</button>`;
    }).join("");
    el.table.innerHTML =
      `<button type="button" class="pe-insert-row" data-act="insert" data-idx="-1">＋ ${en ? "Insert point before" : "在此前插入补给点"}</button>` +
      body +
      (rows.length ? "" : `<button type="button" class="pe-insert-row pe-empty-add" data-act="insert" data-idx="-1">＋ ${en ? "Add first point" : "添加第一个补给点（从 0 开始创建）"}</button>`);
  }

  function renderTotals() {
    const en = state.language === "en";
    const t = state.planTotals || { carbs_g: 0, fluid_ml: 0, sodium_mg: 0, gels: 0, salt_tabs: 0, caffeine_mg: 0 };
    el.totals.innerHTML = `
      <span class="pe-total">${en ? "Adjusted total" : "调整后合计"}：${en ? "Carbs" : "碳水"} <b>${t.carbs_g}g</b> / ${en ? "Fluid" : "液体"} <b>${t.fluid_ml}ml</b> / ${en ? "Sodium" : "钠"} <b>${t.sodium_mg}mg</b>（${en ? "Gels" : "能量胶"} <b>${t.gels}</b> · ${en ? "Salt" : "盐丸"} <b>${t.salt_tabs}</b> · ${en ? "Caffeine" : "咖啡因"} <b>${t.caffeine_mg}mg</b>）</span>`;
  }

  function renderCarryWarnings() {
    const en = state.language === "en";
    const warns = buildCarryWarnings();
    el.carryWarnings.innerHTML = warns.length
      ? `<div class="pe-cw-title">${en ? "Carry check: insufficient carry/takeout" : "携带校验：携带/带出量不足（自补点消耗更大）"}</div>` +
        warns.map((w) => `<div class="pe-cw-row">${esc(w.text)}</div>`).join("") +
        `<button type="button" class="pe-cw-fix" data-act="fix-carry">${en ? "One-click fix" : "一键补齐携带/带出"}</button>`
      : `<div class="pe-cw-ok">${en ? "Carry check passed" : "携带校验通过"}</div>`;
  }

  function defaultChecklist(carry) {
    // 单位换算：电解质水/白水 1瓶=500ml，咖啡因 1份=100mg
    const bottles = (ml) => Math.max(1, Math.ceil((ml || 0) / 500));
    const cups = (mg) => Math.max(1, Math.ceil((mg || 0) / 100));
    const items = [
      { key: "chk_carbs", label: "能量胶", count: carry.gels || 0, unit: "件", kind: "supply", color: "#FF7A00" },
      { key: "chk_salt", label: "盐丸", count: carry.salt || 0, unit: "粒", kind: "supply", color: "#9B59B6" },
      { key: "chk_elec", label: "电解质水", count: bottles(carry.elec), unit: "瓶", kind: "supply", color: "#4D96FF" },
      { key: "chk_water", label: "白水", count: bottles(carry.plain), unit: "瓶", kind: "supply", color: "#6BCB77" },
      { key: "chk_caff", label: "咖啡因", count: cups(carry.caff), unit: "份", kind: "supply", color: "#5B8A72" },
      { key: "take_phone", label: "手机/导航", count: 1, unit: "件", kind: "gear", color: "#4D96FF" },
      { key: "take_firstaid", label: "急救包", count: 1, unit: "件", kind: "gear", color: "#FF6B6B" },
      { key: "take_whistle", label: "救生口哨", count: 1, unit: "件", kind: "gear", color: "#FF8A1F" },
      { key: "take_blanket", label: "保温毯", count: 1, unit: "件", kind: "gear", color: "#C9825B" },
      { key: "take_waterbottle", label: "水具", count: 1, unit: "件", kind: "gear", color: "#6BCB77" },
      { key: "take_backpack", label: "越野背包", count: 1, unit: "件", kind: "gear", color: "#3D5B4D" },
      { key: "take_jacket", label: "冲锋衣", count: 1, unit: "件", kind: "gear", color: "#2B3A6B" },
    ];
    return items.filter((it) => it.count > 0);
  }

  // 清单项步进（含非对称步进；超建议上限时提示，不再截断）
  function adjustChecklist(key, dir) {
    const FRACTION = {
      chk_elec: { dec: 0.1, inc: 0.5 },
      chk_water: { dec: 0.1, inc: 0.5 },
      chk_caff: { dec: 0.1, inc: 0.5 },
    };
    const target = (state.checklist || []).find((c) => c.key === key);
    if (!target) return;
    const fstep = FRACTION[key];
    const step = fstep ? (dir < 0 ? fstep.dec : fstep.inc) : 1;
    const prevCount = target.count;
    state.checklist = (state.checklist || [])
      .map((c) => {
        if (c.key !== key) return c;
        return { ...c, count: Math.max(0, Math.round((c.count + dir * step) * 10) / 10) };
      })
      .filter((c) => c.count > 0);
    recalcTotals();
    renderChecklist();
    // 超量提示：增加后跨过建议上限时即时提醒（不再强制截断）
    if (dir > 0) {
      const limit = CHECKLIST_LIMITS[key];
      const next = Math.round((prevCount + step) * 10) / 10;
      if (limit != null && prevCount <= limit && next > limit) {
        if (global.__peToast) {
          global.__peToast(L(`「${target.label}」已超过建议上限 ${limit}${target.unit || ""}，请确认实际携带能力`, `"${target.label}" exceeds the suggested limit ${limit}${target.unit || ""}`));
        }
      }
    }
  }

  // 带出项步进（含非对称步进，减到 0 自动移除）
  function adjustTakeout(idx, key, dir) {
    const FRACTION = {
      electrolyte_ml: { dec: 50, inc: 250 },
      plain_ml: { dec: 50, inc: 250 },
      caffeine_mg: { dec: 10, inc: 50 },
      add_elec: { dec: 0.1, inc: 0.5 },
      add_water: { dec: 0.1, inc: 0.5 },
      add_caff: { dec: 0.1, inc: 0.5 },
      cola: { dec: 0.1, inc: 0.5 },
    };
    const fstep = FRACTION[key];
    const step = fstep ? (dir < 0 ? fstep.dec : fstep.inc) : 1;
    const rows = state.planRows.map((r) => ({ ...r }));
    const r = rows[idx];
    if (!r) return;
    r.takeout = (r.takeout || [])
      .map((t) => (t.key === key ? { ...t, count: Math.max(0, Math.round((t.count + dir * step) * 10) / 10) } : t))
      .filter((t) => t.count > 0);
    state.planRows = rows;
    recalcTotals();
    renderTable();
    renderCarryWarnings();
  }

  function renderChecklist() {
    const en = state.language === "en";
    if (!state.checklist || !state.checklist.length) return;
    const supply = state.checklist.filter((c) => c.kind === "supply");
    const gear = state.checklist.filter((c) => c.kind === "gear");
    let html = `<div class="pe-chk-title">${en ? "Departure checklist (supplies + gear)" : "出发自查清单（补给品 + 装备）"}</div><div class="pe-chk-body">`;
    if (supply.length) {
      html += `<div class="pe-chk-group"><span class="pe-chk-group-label">${en ? "Supplies" : "补给品"}</span>`;
      supply.forEach((c) => {
        html += `<span class="pe-chip-item">
          <button type="button" class="pe-step" data-chk="-1" data-key="${c.key}">−</button>
          <span class="pe-chip" style="--c:${c.color || "#9BA8B4"}">${esc(c.label)} × ${c.count}${c.unit || ""}</span>
          <button type="button" class="pe-step" data-chk="1" data-key="${c.key}">＋</button>
        </span>`;
      });
      html += `<button type="button" class="pe-chk-add" data-act="checklist-supply">${en ? "＋ Add supply" : "＋ 添加补给品"}</button>
        <button type="button" class="pe-chk-add" data-act="checklist-custom-supply">${en ? "＋ Custom supply" : "＋ 自定义补给品"}</button></div>`;
    }
    if (gear.length) {
      html += `<div class="pe-chk-group"><span class="pe-chk-group-label">${en ? "Gear" : "装备"}</span>`;
      gear.forEach((c) => {
        html += `<span class="pe-chip-item">
          <button type="button" class="pe-step" data-chk="-1" data-key="${c.key}">−</button>
          <span class="pe-chip" style="--c:${c.color || "#9BA8B4"}">${esc(c.label)}${c.count > 1 ? " × " + c.count : ""}</span>
          <button type="button" class="pe-step" data-chk="1" data-key="${c.key}">＋</button>
        </span>`;
      });
      html += `<button type="button" class="pe-chk-add" data-act="checklist">${en ? "＋ Add gear" : "＋ 添加装备"}</button>
        <button type="button" class="pe-chk-add" data-act="checklist-custom">${en ? "＋ Custom gear" : "＋ 自定义装备"}</button></div>`;
    }
    html += `</div>`;
    // 超建议上限提示（不再截断，仅提示）
    const overLimit = (state.checklist || []).filter((c) => CHECKLIST_LIMITS[c.key] != null && c.count > CHECKLIST_LIMITS[c.key]);
    if (overLimit.length) {
      html += `<div class="pe-chk-warn"><div class="pe-chk-warn-title">${en ? "Above suggested limits" : "携带量超建议上限"}</div>` +
        overLimit.map((c) => `<div class="pe-chk-warn-item">${esc(c.label)} ${c.count}${c.unit || ""} ${en ? "exceeds suggested" : "已超过建议上限"} ${CHECKLIST_LIMITS[c.key]}${c.unit || ""}，${en ? "verify carrying capacity" : "请确认实际携带能力"}</div>`).join("") +
        `</div>`;
    }
    el.checklist.innerHTML = html;
  }

  // ---------- 补给库弹层 ----------
  // 出发清单添加补给品：打开补给品库（mode=extra 的补给品列表），选择后加为清单 supply 项
  function openSupplyLibraryForChecklist() {
    const en = state.language === "en";
    const overlay = document.createElement("div");
    overlay.className = "pe-overlay";
    overlay.id = "peLibOverlay";
    let html = `<div class="pe-modal"><div class="pe-modal-head"><h3>${en ? "Add supply to checklist" : "添加补给品到清单"}</h3><button type="button" class="pe-modal-close" data-close="1">×</button></div><div class="pe-modal-body">`;
    html += `<div class="pe-lib-title">${en ? "Supplies" : "补给品"}</div><div class="pe-lib-note">${en ? "Nutrition values are engineering estimates; check the actual package label." : "营养参考值为工程估算，以实际包装为准"}</div><div class="pe-lib-grid">`;
    getAllSupplyItems().forEach((it) => {
      html += `<button type="button" class="pe-lib-item" data-add="${it.key}" data-canon="${canonSupplyKey(it.key)}" style="--c:${it.color || "#9BA8B4"}">
        ${it.isCustom ? `<span class="pe-lib-del" data-del="${it.key}" title="${en ? "Delete" : "删除"}">×</span>` : ""}
        <span class="pe-lib-name">${esc(it.label)}</span><span class="pe-lib-nutri">${esc(it.nutri || "")}</span>
      </button>`;
    });
    html += `</div></div></div>`;
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) { overlay.remove(); return; }
      const delBtn = e.target.closest("[data-del]");
      if (delBtn) { e.stopPropagation(); deleteCustomItem(delBtn.dataset.del); return; }
      const addBtn = e.target.closest("[data-add]");
      if (addBtn) {
        const key = addBtn.dataset.add;
        const item = getAllSupplyItems().find((i) => i.key === key);
        if (!item) return;
        state.checklist = state.checklist || [];
        // 统一口径（carbs/electrolyte/water/salt/caffeine）合并到既有清单项，避免"能量胶×N + 能量胶×1"重复显示
        const canon = canonSupplyKey(key);
        const meta = carryMeta(canon);
        const hit = state.checklist.find((c) => c.kind === "supply" && canonSupplyKey(c.key) === canon);
        if (hit) hit.count = Math.round((hit.count + 1) * 10) / 10;
        else state.checklist.push({ key: meta.checkKey, label: meta.label, unit: meta.unit || "份", count: 1, kind: "supply", color: item.color || meta.color });
        overlay.remove();
        renderChecklist();
        recalcTotals();
        renderCarryWarnings();
      }
    });
  }

  function openLibrary(mode, idx) {
    const en = state.language === "en";
    state.libMode = mode;
    state.libIdx = idx;
    const overlay = document.createElement("div");
    overlay.className = "pe-overlay";
    overlay.id = "peLibOverlay";
    const supplyItemHtml = (it) => `
      <button type="button" class="pe-lib-item" data-add="${it.key}" data-canon="${canonSupplyKey(it.key)}" style="--c:${it.color || "#9BA8B4"}">
        ${it.isCustom ? `<span class="pe-lib-del" data-del="${it.key}" title="${en ? "Delete" : "删除"}">×</span>` : ""}
        <span class="pe-lib-name">${esc(it.label)}</span><span class="pe-lib-nutri">${esc(it.nutri || "")}</span>
      </button>`;
    const gearItemHtml = (it) => `
      <button type="button" class="pe-lib-item" data-add="${it.key}" data-canon="${it.key}" style="--c:${it.color || "#9BA8B4"}">
        ${it.isCustom ? `<span class="pe-lib-del" data-del="${it.key}" title="${en ? "Delete" : "删除"}">×</span>` : ""}
        <span class="pe-lib-name">${esc(it.label)}</span>
      </button>`;
    let html = `<div class="pe-modal"><div class="pe-modal-head"><h3>${en ? "Supply / Gear library" : "补给品 / 装备库"}</h3><button type="button" class="pe-modal-close" data-close="1">×</button></div><div class="pe-modal-body">`;
    if (mode === "takeout") {
      // 官方点带出：补给品 + 装备（含自定义）
      html += `<div class="pe-lib-title">${en ? "Supplies (for takeout)" : "补给品（用于带出）"}</div><div class="pe-lib-note">${en ? "Take-out supplies match in-station fuel; nutrition values are estimates based on the package label." : "带出补给品与站内补给一致；营养参考值以包装为准"}</div><div class="pe-lib-grid">`;
      getAllSupplyItems().forEach((it) => { html += supplyItemHtml(it); });
      html += `</div><div class="pe-lib-title">${en ? "Gear" : "装备"}</div><div class="pe-lib-note">${en ? "Gear is for checklist reference only; adjust as needed." : "装备仅作清单参考，按需调整"}</div><div class="pe-lib-grid">`;
      gearLibrary().forEach((it) => { html += gearItemHtml(it); });
      html += `</div>`;
    } else if (mode === "extra") {
      // 补给点补充补给品（自补点/官方点通用）：香蕉/能量棒/自定义等，计入合计与携带
      html += `<div class="pe-lib-title">${en ? "Extra supplies for this point" : "本点额外补给品（计入合计/携带）"}</div><div class="pe-lib-note">${en ? "Nutrition values are engineering estimates; check the actual package label." : "营养参考值为工程估算，以实际包装为准"}</div><div class="pe-lib-grid">`;
      getAllSupplyItems().forEach((it) => { html += supplyItemHtml(it); });
      html += `</div>`;
    } else {
      // checklist 装备（含自定义装备）
      html += `<div class="pe-lib-title">${en ? "Gear" : "装备"}</div><div class="pe-lib-note">${en ? "Gear is for checklist reference only; adjust as needed." : "装备仅作清单参考，按需调整"}</div><div class="pe-lib-grid">`;
      gearLibrary().forEach((it) => { html += gearItemHtml(it); });
      html += `</div>`;
    }
    html += `<div class="pe-lib-title">${en ? "Custom" : "自定义"}</div>`;
    html += `<button type="button" class="pe-libmini" data-act="custom">${en ? "＋ Add custom item" : "＋ 添加自定义补给品/装备"}</button>`;
    html += `</div></div>`;
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) { overlay.remove(); return; }
      const delBtn = e.target.closest("[data-del]");
      if (delBtn) {
        // 删除自定义项（阻止冒泡到 add）
        e.stopPropagation();
        deleteCustomItem(delBtn.dataset.del);
        return;
      }
      const addBtn = e.target.closest("[data-add]");
      if (addBtn) {
        const key = addBtn.dataset.add;
        const canon = addBtn.dataset.canon;
        thisAddLibItem(key, canon);
        return;
      }
      if (e.target.closest('[data-act="custom"]')) {
        openCustomForm(overlay);
      }
    });
  }

  function thisAddLibItem(key, canon) {
    const item = getAllSupplyItems().find((i) => i.key === key) || gearLibrary().find((i) => i.key === key);
    if (!item) return;
    if (state.libMode === "checklist") {
      const hit = state.checklist.find((c) => c.kind === "gear" && c.key === item.key);
      if (hit) hit.count += 1;
      else state.checklist.push({ key: item.key, label: item.label, unit: "件", count: 1, kind: "gear", color: item.color });
      renderChecklist();
      return;
    }
    const row = state.planRows[state.libIdx];
    if (!row) return;
    if (state.libMode === "extra") {
      // 补给点额外补给品：加进该点 extra（计入合计/携带/导出）
      const extra = { ...(row.extra || {}) };
      extra[item.key] = Math.round(((extra[item.key] || 0) + 1) * 10) / 10;
      row.extra = extra;
      state.planRows = refreshDerived(state.planRows.map((r) => ({ ...r })));
      recalcTotals();
      renderTable();
      renderCarryWarnings();
      const overlay = document.getElementById("peLibOverlay");
      if (overlay) overlay.remove();
      return;
    }
    // takeout 模式：加到官方补给点带出
    const takeout = (row.takeout || []).map((t) => ({ ...t }));
    const hit = takeout.find((t) => t.key === item.key);
    if (hit) hit.count += 1;
    else takeout.push({ key: item.key, label: item.label, count: 1, unit: item.unit || "份", color: item.color });
    row.takeout = takeout;
    renderTable();
    renderCarryWarnings();
    const overlay = document.getElementById("peLibOverlay");
    if (overlay) overlay.remove();
  }

  function openCustomForm(overlay) {
    const en = state.language === "en";
    // 类型判定：checklist → 装备；takeout → 需用户选择（默认补给品，可选装备）；extra → 补给品
    const isTakeoutMode = state.libMode === "takeout";
    let isGear = state.libMode === "checklist" || (isTakeoutMode && (state.libCategory || "") === "gear");
    if (overlay) overlay.remove();
    const form = document.createElement("div");
    form.className = "pe-overlay";
    form.id = "peCustomOverlay";
    const colorChips = CUSTOM_COLORS.map((c) => `<button type="button" class="pe-color" data-color="${c}" style="background:${c}"></button>`).join("");
    // takeout 模式提供 补给品/装备 类型切换（对齐小程序带出库的 food/gear 分类）
    const typeToggle = isTakeoutMode
      ? `<div class="pe-lib-title">${en ? "Type" : "类型"}</div>
         <div class="pe-lib-tabs">
           <button type="button" class="pe-lib-tab ${!isGear ? "active" : ""}" data-ctype="supply">${en ? "Supply" : "补给品"}</button>
           <button type="button" class="pe-lib-tab ${isGear ? "active" : ""}" data-ctype="gear">${en ? "Gear" : "装备"}</button>
         </div>`
      : "";
    // 装备：只需名称+单位；补给品：名称+营养字段
    const nutriFields = isGear
      ? ""
      : `<div class="pe-custom-grid">
          <label class="pe-field"><span>${en ? "Carbs (g)" : "碳水 (g)"}</span><input id="peCustomCarbs" type="number" min="0" step="1"/></label>
          <label class="pe-field"><span>${en ? "Sodium (mg)" : "钠 (mg)"}</span><input id="peCustomSodium" type="number" min="0" step="1"/></label>
          <label class="pe-field"><span>${en ? "Caffeine (mg)" : "咖啡因 (mg)"}</span><input id="peCustomCaff" type="number" min="0" step="1"/></label>
          <label class="pe-field"><span>${en ? "Fluid (ml)" : "水 (ml)"}</span><input id="peCustomFluid" type="number" min="0" step="1"/></label>
          <label class="pe-field"><span>${en ? "Protein (g)" : "蛋白 (g)"}</span><input id="peCustomProtein" type="number" min="0" step="1"/></label>
          <label class="pe-field"><span>${en ? "Unit" : "单位"}</span><input id="peCustomUnit" value="${en ? "份" : "份"}"/></label>
        </div>`;
    form.innerHTML = `
      <div class="pe-modal"><div class="pe-modal-head"><h3>${en ? "Custom item" : "自定义" + (isGear ? "装备" : "补给品")}</h3><button type="button" class="pe-modal-close" data-close="1">×</button></div>
      <div class="pe-modal-body">
        ${typeToggle}
        <label class="pe-field"><span>${en ? "Name" : "名称"}</span><input id="peCustomName" placeholder="${isGear ? (en ? "e.g. 保温毯 / 头灯" : "如：保温毯 / 头灯") : (en ? "e.g. 榨菜 / 咖啡" : "如：榨菜 / 咖啡")}"/></label>
        <label class="pe-field"><span>${en ? "Color" : "颜色"}</span><span class="pe-colors" id="peCustomColors">${colorChips}</span></label>
        <div id="peCustomNutri">${nutriFields}</div>
        <button type="button" class="pe-libmini" data-save="1">${en ? "Save and add" : "保存并添加"}</button>
      </div></div>`;
    document.body.appendChild(form);
    let pickedColor = CUSTOM_COLORS[0];
    form.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) { form.remove(); return; }
      const c = e.target.closest("[data-color]");
      if (c) {
        pickedColor = c.dataset.color;
        form.querySelectorAll(".pe-color").forEach((x) => x.classList.remove("is-picked"));
        c.classList.add("is-picked");
        return;
      }
      // takeout 模式类型切换：补给品 ↔ 装备（重建营养字段区）
      const typeBtn = e.target.closest("[data-ctype]");
      if (typeBtn) {
        isGear = typeBtn.dataset.ctype === "gear";
        form.querySelectorAll(".pe-lib-tab").forEach((x) => x.classList.toggle("active", x === typeBtn));
        const h3 = form.querySelector(".pe-modal-head h3");
        if (h3) h3.textContent = en ? "Custom item" : "自定义" + (isGear ? "装备" : "补给品");
        const name = form.querySelector("#peCustomName");
        name.placeholder = isGear ? (en ? "e.g. 保温毯 / 头灯" : "如：保温毯 / 头灯") : (en ? "e.g. 榨菜 / 咖啡" : "如：榨菜 / 咖啡");
        const nutriWrap = form.querySelector("#peCustomNutri");
        if (isGear) {
          nutriWrap.innerHTML = "";
        } else {
          nutriWrap.innerHTML = `<div class="pe-custom-grid">
            <label class="pe-field"><span>${en ? "Carbs (g)" : "碳水 (g)"}</span><input id="peCustomCarbs" type="number" min="0" step="1"/></label>
            <label class="pe-field"><span>${en ? "Sodium (mg)" : "钠 (mg)"}</span><input id="peCustomSodium" type="number" min="0" step="1"/></label>
            <label class="pe-field"><span>${en ? "Caffeine (mg)" : "咖啡因 (mg)"}</span><input id="peCustomCaff" type="number" min="0" step="1"/></label>
            <label class="pe-field"><span>${en ? "Fluid (ml)" : "水 (ml)"}</span><input id="peCustomFluid" type="number" min="0" step="1"/></label>
            <label class="pe-field"><span>${en ? "Protein (g)" : "蛋白 (g)"}</span><input id="peCustomProtein" type="number" min="0" step="1"/></label>
            <label class="pe-field"><span>${en ? "Unit" : "单位"}</span><input id="peCustomUnit" value="${en ? "份" : "份"}"/></label>
          </div>`;
        }
        return;
      }
      if (e.target.closest("[data-save]")) {
        const name = form.querySelector("#peCustomName").value.trim();
        if (!name) return;
        if (isGear) {
          // 自定义装备：加入装备库；checklist → 加入清单；takeout → 加入该官方点带出
          const item = {
            key: "customgear_" + Date.now(),
            label: name,
            unit: "件",
            count: 1,
            kind: "gear",
            color: pickedColor || "#9BA8B4",
            isCustom: true,
            step: 1,
          };
          state.customGearItems = state.customGearItems || [];
          state.customGearItems.push(item);
          form.remove();
          if (state.libMode === "checklist") {
            state.checklist = state.checklist || [];
            const hit = state.checklist.find((c) => c.key === item.key);
            if (hit) hit.count += 1;
            else state.checklist.push({ key: item.key, label: item.label, unit: "件", count: 1, kind: "gear", color: item.color });
            renderChecklist();
            return;
          }
          // takeout：加入目标官方点带出
          const row = state.planRows[state.libIdx];
          if (row) {
            const takeout = (row.takeout || []).map((t) => ({ ...t }));
            takeout.push({ key: item.key, label: item.label, count: 1, unit: "件", color: item.color });
            row.takeout = takeout;
            recalcTotals();
            renderTable();
            renderCarryWarnings();
          }
          return;
        }
        // 自定义补给品：加入补给库，并自动加入目标点（extra / takeout）
        const it = {
          key: "custom_" + Date.now(),
          label: name,
          unit: (form.querySelector("#peCustomUnit") || {}).value ? form.querySelector("#peCustomUnit").value.trim() : "份",
          carbs_g: sf((form.querySelector("#peCustomCarbs") || {}).value) || 0,
          sodium_mg: sf((form.querySelector("#peCustomSodium") || {}).value) || 0,
          caffeine_mg: sf((form.querySelector("#peCustomCaff") || {}).value) || 0,
          fluid_ml: sf((form.querySelector("#peCustomFluid") || {}).value) || 0,
          protein_g: sf((form.querySelector("#peCustomProtein") || {}).value) || 0,
          step: 1,
          color: pickedColor || "#9BA8B4",
          isCustom: true,
        };
        state.customItems = state.customItems || [];
        state.customItems.push(it);
        form.remove();
        if (state.libMode === "extra") {
          // 自动加入该补给点 extra（计入合计/携带）
          const row = state.planRows[state.libIdx];
          if (row) {
            const extra = { ...(row.extra || {}) };
            extra[it.key] = Math.round(((extra[it.key] || 0) + 1) * 10) / 10;
            row.extra = extra;
            state.planRows = refreshDerived(state.planRows.map((r) => ({ ...r })));
            recalcTotals();
            renderTable();
            renderCarryWarnings();
          }
          return;
        }
        if (state.libMode === "takeout") {
          // 自动加入该官方点带出
          const row = state.planRows[state.libIdx];
          if (row) {
            const takeout = (row.takeout || []).map((t) => ({ ...t }));
            takeout.push({ key: it.key, label: it.label, count: 1, unit: it.unit || "份", color: it.color });
            row.takeout = takeout;
            recalcTotals();
            renderTable();
            renderCarryWarnings();
          }
          return;
        }
        // checklist 补给品：加入清单 supply
        state.checklist = state.checklist || [];
        state.checklist.push({ key: it.key, label: it.label, unit: it.unit || "份", count: 1, kind: "supply", color: it.color });
        renderChecklist();
      }
    });
  }

  // ---------- 动作 ----------
  // 单个补给点内补给数量的建议上限（与出发清单口径一致：超量仅提示，不截断）
  const ROW_LIMITS = {
    gels: { limit: 10, unit: "件", label: "能量胶" },
    salt_tabs: { limit: 10, unit: "粒", label: "盐丸" },
    electrolyte_ml: { limit: 500, unit: "ml", label: "电解质水" },
    plain_ml: { limit: 500, unit: "ml", label: "白水" },
    caffeine_mg: { limit: 200, unit: "mg", label: "咖啡因" },
  };

  function adjustRow(idx, key, delta) {
    const rows = state.planRows.map((r) => ({ ...r }));
    const row = rows[idx];
    if (!row) return;
    let v = sf(row[key]) || 0;
    const prev = v;
    v = Math.max(0, Math.round((v + delta) * 10) / 10);
    row[key] = String(v);
    state.planRows = refreshDerived(rows);
    recalcTotals();
    render();
    // 超量提示：增加后跨过建议上限时即时提醒（与出发清单口径一致，不截断）
    const meta = ROW_LIMITS[key];
    if (delta > 0 && meta && prev <= meta.limit && v > meta.limit) {
      if (global.__peToast) {
        global.__peToast(L(`「${meta.label}」已超过单点建议上限 ${meta.limit}${meta.unit}，请确认该区间实际消耗`, `"${meta.label}" exceeds the suggested per-point limit ${meta.limit}${meta.unit}`));
      }
    }
  }

  function addRow() {
    const rows = [...state.planRows.map((r) => ({ ...r })), {
      km: "", time_h: "", typeIndex: 1, cutoff: "", takeout: [], gels: 0, electrolyte_ml: 0, plain_ml: 0, salt_tabs: 0, caffeine_mg: 0, protein_g: "", note: "", extra: {},
    }];
    state.planRows = refreshDerived(sortRowsByKm(rows));
    recalcTotals();
    render();
    // 聚焦新行的距离输入框，明确"已添加一行"
    const rowEls = container.querySelectorAll(".pe-row");
    const kmInput = rowEls.length ? rowEls[rowEls.length - 1].querySelector("input.pe-km") : null;
    if (kmInput) kmInput.focus();
  }

  function clearSelf() {
    // 与小程序 clearAllRows 一致：danger 确认后再清（自定义弹层，非原生 confirm）
    const en = state.language === "en";
    peConfirm({
      title: en ? "Clear self-supply points?" : "清空自补给点？",
      text: en
        ? "All self-supply points will be deleted and official aid stations kept; you can re-add from zero."
        : "将删除所有自补给点并保留官方补给点，之后可从 0 添加自补给点。",
      confirmText: en ? "Clear" : "清空",
      danger: true,
      onConfirm: () => {
        const rows = state.planRows.filter((r) => Number(r.typeIndex) === 0);
        state.planRows = refreshDerived(sortRowsByKm(rows));
        recalcTotals();
        render();
      },
    });
  }

  function insertRow(idx) {
    const rows = state.planRows.map((r) => ({ ...r }));
    if (idx === -1) {
      if (!rows.length) { addRow(); return; }
      const first = rows[0];
      const km = Math.max(0.1, Math.round((sf(first.km) || 0) / 2 * 10) / 10);
      const timeH = Math.round((sf(first.time_h) || 0) / 2 * 100) / 100;
      rows.splice(0, 0, { km: String(km), time_h: String(timeH), typeIndex: 1, cutoff: "", takeout: [], gels: 0, electrolyte_ml: 0, plain_ml: 0, salt_tabs: 0, caffeine_mg: 0, protein_g: "", note: "", extra: {} });
      state.planRows = refreshDerived(sortRowsByKm(rows));
      recalcTotals();
      render();
      return;
    }
    const cur = rows[idx] || {};
    const next = rows[idx + 1];
    const curKm = sf(cur.km);
    const nextKm = next ? sf(next.km) : null;
    const km = nextKm != null ? Math.round(((curKm || 0) + nextKm) / 2 * 10) / 10 : Math.round(((curKm || 0) + 1) * 10) / 10;
    const curT = sf(cur.time_h);
    const nextT = next ? sf(next.time_h) : null;
    const timeH = nextT != null ? Math.round(((curT || 0) + nextT) / 2 * 100) / 100 : Math.round(((curT || 0) + 0.5) * 100) / 100;
    rows.splice(idx + 1, 0, { km: String(km), time_h: String(timeH), typeIndex: 1, cutoff: "", takeout: [], gels: 0, electrolyte_ml: 0, plain_ml: 0, salt_tabs: 0, caffeine_mg: 0, protein_g: "", note: "", extra: {} });
    state.planRows = refreshDerived(sortRowsByKm(rows));
    recalcTotals();
    render();
  }

  function delRow(idx) {
    const rows = state.planRows.map((r) => ({ ...r }));
    rows.splice(idx, 1);
    state.planRows = rows;
    recalcTotals();
    render();
  }

  function fixCarryWarnings() {
    const warns = buildCarryWarnings();
    if (!warns.length) {
      if (global.__peToast) global.__peToast(L("当前各段携带/带出已满足，无需补齐", "Carry/takeout already sufficient"));
      return;
    }
    const checklist = (state.checklist || []).map((c) => ({ ...c }));
    const rows = state.planRows.map((r) => ({ ...r }));
    for (const w of warns) {
      const meta = carryMeta(w.canonKey);
      if (w.type === "start") {
        const hit = checklist.find((c) => c.kind === "supply" && canonSupplyKey(c.key) === w.canonKey);
        if (hit) hit.count = Math.max(hit.count, w.need);
        else checklist.push({ key: meta.checkKey, label: meta.label, count: w.need, unit: meta.unit, kind: "supply", color: meta.color });
      } else {
        const row = rows[w.rowIdx];
        if (!row) continue;
        const takeout = (row.takeout || []).map((t) => ({ ...t }));
        const hit = takeout.find((t) => canonSupplyKey(t.key) === w.canonKey);
        if (hit) hit.count = Math.max(hit.count, w.need);
        else takeout.push({ key: meta.addKey, label: meta.label, count: w.need, unit: meta.unit, color: meta.color });
        row.takeout = takeout;
      }
    }
    state.checklist = checklist;
    state.planRows = rows;
    recalcTotals();
    render();
    if (global.__peToast) global.__peToast(L("已按各段自补点消耗补齐携带/带出", "Carry/takeout fixed to cover each segment"));
  }

  // ---------- 导出 ----------
  function buildTimelineText() {
    return state.planRows.filter((r) => !r.kmInvalid).map((r) => {
      const type = Number(r.typeIndex) === 0 ? L("官方补给点", "official") : L("自补给点", "self");
      const gels = sf(r.gels) || 0;
      const elec = sf(r.electrolyte_ml) || 0;
      const plain = sf(r.plain_ml) || 0;
      const salt = sf(r.salt_tabs) || 0;
      const caff = sf(r.caffeine_mg) || 0;
      const parts = [];
      if (gels > 0) parts.push(L("碳水", "carbs") + " " + gels + " " + L("份", "") + "（≈" + gels * 25 + "g）");
      if (elec > 0) parts.push("电解质水 " + elec + "ml（≈" + Math.round(elec * 0.5) + "mg 钠）");
      if (plain > 0) parts.push("白水 " + plain + "ml");
      if (salt > 0) parts.push("盐丸 " + salt + " 粒（≈" + salt * 200 + "mg 钠）");
      if (caff > 0) parts.push("咖啡因 " + caff + " mg");
      const extraTxt = extraLabel(r);
      if (extraTxt) parts.push(extraTxt);
      return "- " + r.km + "km · 约" + fmtHM(r.time_h) + " · " + type + "：" + (parts.join(" + ") || "无");
    }).join("\n");
  }

  function copyPlan() {
    const out = state.ruleOutput;
    if (!out) { if (global.__peToast) global.__peToast(L("请先生成方案", "Please generate first")); return; }
    const text = [
      state.planHeadText || "",
      "四、补给时间轴（已手动调整）\n" + buildTimelineText(),
      state.planTailText || "",
    ].filter(Boolean).join("\n\n");
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (global.__peToast) global.__peToast(L("方案已复制", "Plan copied"));
      }).catch(() => {
        if (global.__peToast) global.__peToast(L("复制失败，请手动选择复制", "Copy failed"));
      });
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); if (global.__peToast) global.__peToast(L("方案已复制", "Plan copied")); } catch (e) { /* ignore */ }
      document.body.removeChild(ta);
    }
  }

  function buildXlsxRows() {
    const out = state.ruleOutput;
    const rp = state.raceProfile;
    const weightKg = (out && out.weight_kg) || 70;
    const trace = (out && out.debug_trace) || {};
    const s1 = [];
    const push = (...cells) => s1.push(cells);
    push("补给方案（完整版·Trail Lab Engine v2.0）");
    push("安全提示：本方案为通用规则估算，非医疗建议；请结合自身体能、天气与肠胃耐受，在专业人士指导下调整，量力而行；使用者自行承担风险。");
    push("一、路线与完赛");
    push("距离(km)", rp.distance_km, "爬升(m)", rp.ascent_m, "", "赛前 36-48h 糖原填充(g/天)", `${Math.round(weightKg * 10)}-${Math.round(weightKg * 12)}（${weightKg} kg × 10-12）`);
    push("下降(m)", rp.descent_m, "预计完赛", fmtHM(out.estimated_finish_time_h), "", "赛前 1-4h 碳水(g)", `${Math.round(weightKg * 1)}-${Math.round(weightKg * 4)}（低纤维低脂）`);
    push("时间区间", `${fmtHM(out.finish_time_range[0])}–${fmtHM(out.finish_time_range[1])}`, "置信度", out.confidence.finish_time, "", "总碳水(g)", out.total_carbs_g);
    push("估算分支", trace.finish_time_branch || "", "完赛来源", out.finish_time_source === "user_input" ? "用户输入" : "引擎估算", "", "总液体(ml)", out.total_fluid_ml);
    push("", "", "", "", "", "总钠(mg)", out.total_sodium_mg, "", "");
    push("", "", "", "", "", "赛后 0-4h 碳水(g/h)", `${Math.round(weightKg * 1.0)}-${Math.round(weightKg * 1.2)}`, "赛后 0-4h 蛋白(g/h)", `${Math.round(weightKg * 0.3)}-${Math.round(weightKg * 0.4)}`);
    push("");
    push("五、补给点明细（已按手动调整）");
    push("公里", "时间(HH:MM)", "区间距离(km)", "区间爬升(m)", "关门时间", "带出物品", "碳水(g)", "电解质水(ml)", "白水(ml)", "钠目标(mg)", "盐丸(粒)", "咖啡因(mg)", "蛋白(g)", "其他补给", "来源");
    for (const r of state.planRows) {
      if (r.kmInvalid) continue;
      const gels = sf(r.gels) || 0;
      const electrolyteMl = sf(r.electrolyte_ml) || 0;
      const plainMl = sf(r.plain_ml) || 0;
      const saltCount = sf(r.salt_tabs) || 0;
      const carbsG = Math.round((gels * 25 + extraOf(r, "carbs_g")) * 10) / 10;
      const sodiumMg = Math.round(electrolyteMl * 0.5 + saltCount * 200 + extraOf(r, "sodium_mg"));
      push(
        String(r.km), fmtHM(r.time_h),
        r.seg_dist_km != null ? r.seg_dist_km : "",
        r.seg_climb_m != null ? r.seg_climb_m : "",
        r.cutoff || "",
        takeoutText(r),
        carbsG, electrolyteMl, plainMl, sodiumMg, saltCount,
        r.caffeine_mg || "", r.protein_g || "", extraLabel(r), r.note || ""
      );
    }
    push("");
    push("九、警告");
    if (out.warnings && out.warnings.length) out.warnings.forEach((w) => push("警告", w));
    else push("警告", "无");
    const cw = buildCarryWarnings();
    if (cw.length) {
      push("携带校验（出发携带 ≥ 到第一个官方补给点；官方补给点带出 ≥ 到下一个官方补给点）");
      cw.forEach((w) => push("携带校验", w.text));
    }
    const s2 = [];
    const push2 = (...cells) => s2.push(cells);
    const chkSupply = state.checklist.filter((c) => c.kind === "supply");
    const chkGear = state.checklist.filter((c) => c.kind === "gear");
    push2("补给品");
    if (chkSupply.length) chkSupply.forEach((c) => push2("　" + c.label, `${c.count}${c.unit || ""}`));
    push2("装备");
    if (chkGear.length) chkGear.forEach((c) => push2("　" + c.label, c.count > 1 ? String(c.count) : ""));
    return { s1, s2 };
  }

  function exportXlsx(imageBytes) {
    const out = state.ruleOutput;
    if (!out) { if (global.__peToast) global.__peToast(L("请先生成方案", "Please generate first")); return; }
    const { s1, s2 } = buildXlsxRows();
    const sheets = [
      { name: "补给方案", rows: s1, imageBytes: imageBytes || null, imageAt: "bottom" },
      { name: "出门携带清单（出发自查）", rows: s2 },
    ];
    try {
      const ab = global.TrailLabXlsx.buildXlsx({ sheets });
      const blob = new Blob([ab], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "trail_lab_fuel_plan.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (global.__peToast) global.__peToast(L("已导出 Excel", "Excel exported"));
    } catch (e) {
      if (global.__peToast) global.__peToast(L("导出 Excel 失败，请使用 CSV", "Excel export failed, use CSV"));
    }
  }

  function exportCsv() {
    const out = state.ruleOutput;
    if (!out) { if (global.__peToast) global.__peToast(L("请先生成方案", "Please generate first")); return; }
    const { s1 } = buildXlsxRows();
    const csv = "\uFEFF" + s1.map((r) => (Array.isArray(r) ? r : [""]).map((c) => {
      const s = String(c == null ? "" : c);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trail_lab_fuel_plan.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 竖版方案海报导出（对应小程序 exportImage）：出门携带清单 + 海拔剖面 + 补给点图标明细 + 图标说明
  // 海报海拔剖面数据：优先用目标路线真实轨迹（routeFitPoints），否则按爬升路段模拟（与 app.js buildSimulatedElevation 一致）
  function elevationPoints() {
    const pts = state.routeFitPoints || [];
    if (pts.length >= 2) return pts;
    const rp = state.raceProfile;
    const points = [{ km: 0, altitude: 0 }];
    let currentKm = 0;
    let currentAltitude = 0;
    for (const [segmentDistance, segmentDelta] of (rp && rp.climb_segments) || []) {
      const endKm = currentKm + segmentDistance;
      const endAltitude = currentAltitude + segmentDelta;
      points.push({ km: Number(endKm.toFixed(2)), altitude: Number(endAltitude.toFixed(1)) });
      currentKm = endKm;
      currentAltitude = endAltitude;
    }
    if (rp && points[points.length - 1].km < rp.distance_km) {
      points.push({ km: rp.distance_km, altitude: currentAltitude });
    }
    return points;
  }

  function interpolateAltitude(points, km) {
    for (let i = 1; i < points.length; i += 1) {
      const prev = points[i - 1];
      const curr = points[i];
      if (km <= curr.km) {
        const range = curr.km - prev.km || 1;
        const ratio = (km - prev.km) / range;
        return prev.altitude + ratio * (curr.altitude - prev.altitude);
      }
    }
    return points[points.length - 1]?.altitude || 0;
  }

  // 海报中的爬升/下降路段（读取 raceProfileForm.routeSegments，与 app.js getRouteSegmentsToDraw 一致）
  function posterSegmentsToDraw(wantedType) {
    let hasFormSegs = false;
    try {
      const parsed = JSON.parse(String(state.raceProfileForm?.routeSegments || "[]"));
      hasFormSegs = Array.isArray(parsed) && parsed.length > 0;
    } catch (err) { /* ignore */ }
    if (!hasFormSegs) return [];
    const threshold = Math.max(sf(state.raceProfileForm?.segmentThresholdM) || 50, 0);
    const segments = [];
    let km = 0;
    for (const [dist, delta] of (state.raceProfile && state.raceProfile.climb_segments) || []) {
      const isClimb = delta > 0;
      const isDescent = delta < 0;
      if ((wantedType === "climb" ? isClimb : isDescent) && Math.abs(delta) >= threshold) {
        segments.push({ start: Number(km.toFixed(2)), end: Number((km + dist).toFixed(2)), height: Math.round(Math.abs(delta)) });
      }
      km += dist;
    }
    return segments;
  }

  function exportImage() {
    const out = state.ruleOutput;
    const rp = state.raceProfile;
    if (!out || !rp) { if (global.__peToast) global.__peToast(L("请先生成方案", "Please generate first")); return; }
    const en = state.language === "en";
    const W = 900; // 竖版画布宽（手机竖屏比例）
    const H = 1560;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    const fmtHM = (h) => {
      const total = Math.round((sf(h) || 0) * 60);
      const p = (n) => (n < 10 ? "0" + n : "" + n);
      return p(Math.floor(total / 60)) + ":" + p(total % 60);
    };
    const conf = out.confidence && out.confidence.finish_time;
    const confLabel = conf === "high" ? (en ? "High" : "高") : conf === "low" ? (en ? "Low" : "低") : (en ? "Medium" : "中");
    // 背景
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, "#14271d");
    bgGrad.addColorStop(1, "#0b1410");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // 头部
    ctx.fillStyle = "#ff7a00";
    ctx.fillRect(40, 46, 22, 22);
    ctx.fillStyle = "#e9f3ec";
    ctx.textAlign = "left";
    ctx.font = "bold 40px sans-serif";
    ctx.fillText("TRAIL LAB", 72, 66);
    ctx.font = "24px sans-serif";
    ctx.fillStyle = "rgba(233,243,236,0.55)";
    ctx.fillText(en ? "Fueling plan (full)" : "山野实验室 · 补给方案（完整版）", 72, 104);
    ctx.textAlign = "right";
    ctx.font = "bold 30px sans-serif";
    ctx.fillStyle = "#f7b054";
    ctx.fillText(`${rp.distance_km} km · ${en ? "ascent" : "爬升"} ${rp.ascent_m} m · ${en ? "descent" : "下降"} ${rp.descent_m} m`, W - 40, 66);
    ctx.font = "22px sans-serif";
    ctx.fillStyle = "rgba(233,243,236,0.85)";
    ctx.fillText(`${en ? "Est." : "预计"} ${fmtHM(out.estimated_finish_time_h)}（${fmtHM(out.finish_time_range[0])}–${fmtHM(out.finish_time_range[1])}）· ${en ? "conf" : "置信度"} ${confLabel}`, W - 40, 104);
    ctx.strokeStyle = "rgba(255,122,0,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 128);
    ctx.lineTo(W - 40, 128);
    ctx.stroke();
    let y = 156;
    const drawChip = (label, count, color) => {
      // 左侧色块（用补给色）+ 名称 + 数量
      ctx.fillStyle = color || "#9BA8B4";
      roundRect(48, y, 14, 14, 4);
      ctx.fill();
      ctx.textAlign = "left";
      ctx.font = "20px sans-serif";
      ctx.fillStyle = "#e9f3ec";
      ctx.fillText(`${label}`, 72, y + 12);
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffb066";
      ctx.fillText(String(count), W - 48, y + 12);
      ctx.strokeStyle = "rgba(126,168,142,0.25)";
      ctx.beginPath();
      ctx.moveTo(48, y + 24);
      ctx.lineTo(W - 48, y + 24);
      ctx.stroke();
      y += 40;
    };
    const roundRect = (x, yy, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, yy);
      ctx.arcTo(x + w, yy, x + w, yy + h, r);
      ctx.arcTo(x + w, yy + h, x, yy + h, r);
      ctx.arcTo(x, yy + h, x, yy, r);
      ctx.arcTo(x, yy, x + w, yy, r);
      ctx.closePath();
    };
    // 出门携带清单
    ctx.textAlign = "left";
    ctx.font = "bold 24px sans-serif";
    ctx.fillStyle = "#ffd9ae";
    ctx.fillText(en ? "Departure checklist" : "出发自查清单（携带）", 48, y);
    y += 30;
    const supply = state.checklist.filter((c) => c.kind === "supply");
    const gear = state.checklist.filter((c) => c.kind === "gear");
    if (supply.length) {
      ctx.font = "20px sans-serif";
      supply.forEach((c) => drawChip(c.label, `${c.count}${c.unit || ""}`, c.color));
    }
    if (gear.length) {
      ctx.font = "20px sans-serif";
      gear.forEach((c) => drawChip(c.label, c.count > 1 ? String(c.count) : "", c.color));
    }
    if (!supply.length && !gear.length) {
      ctx.font = "20px sans-serif";
      ctx.fillStyle = "rgba(233,243,236,0.6)";
      ctx.fillText(en ? "— empty —" : "— 空 —", 48, y + 10);
      y += 34;
    }
    y += 16;

    // ---- 路线海拔剖面（对齐小程序海报：横轴刻度=补给点，爬升/下降色带，图例） ----
    const pathPoints = elevationPoints();
    const climbSegs = posterSegmentsToDraw("climb");
    const descentSegs = posterSegmentsToDraw("descent");
    const minAlt = Math.min(...pathPoints.map((p) => p.altitude));
    const maxAlt = Math.max(...pathPoints.map((p) => p.altitude));
    const altRange = Math.max(maxAlt - minAlt, 1);
    const chartTop = y + 8;
    const chartH = 300;
    const padL = 84;
    const padR = 40;
    const plotPadT = 54;
    const plotPadB = 56;
    const plotTop = chartTop + plotPadT;
    const plotBot = chartTop + chartH - plotPadB;
    const plotW = W - padL - padR;
    const plotH = plotBot - plotTop;
    const xForKm = (km) => padL + (km / Math.max(rp.distance_km, 1)) * plotW;
    const yForAlt = (alt) => plotTop + (1 - (alt - minAlt) / altRange) * plotH;
    // 网格 + Y 轴
    ctx.strokeStyle = "rgba(171,219,189,0.18)";
    ctx.lineWidth = 1;
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "rgba(171,219,189,0.75)";
    const yTicks = 4;
    for (let i = 0; i <= yTicks; i += 1) {
      const alt = minAlt + (altRange / yTicks) * i;
      const yy = yForAlt(alt);
      ctx.beginPath();
      ctx.moveTo(padL, yy);
      ctx.lineTo(padL + plotW, yy);
      ctx.stroke();
      ctx.textAlign = "right";
      ctx.fillText(Math.round(alt) + "m", padL - 12, yy + 6);
    }
    // 图内标题 + 图例
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(233,243,236,0.82)";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText(en ? "Elevation profile" : "路线海拔剖面", padL, chartTop + 22);
    const legend = [
      ["#f7b054", en ? "elevation" : "海拔"],
      ["#34d399", en ? "aid station" : "官方补给点"],
      ["#2dd4bf", en ? "self point" : "自补点"],
      ["rgba(255,79,126,0.9)", en ? "climb" : "爬坡"],
      ["rgba(79,156,240,0.9)", en ? "descent" : "下降"],
    ];
    ctx.font = "15px sans-serif";
    let lx = padL + 12;
    for (const item of legend) {
      ctx.fillStyle = item[0];
      ctx.fillRect(lx, chartTop + 30, 12, 12);
      ctx.fillStyle = "rgba(233,243,236,0.7)";
      ctx.textAlign = "left";
      ctx.fillText(item[1], lx + 18, chartTop + 41);
      lx += ctx.measureText(item[1]).width + 44;
    }
    // 爬升/下降色带
    const drawBands = (segs, color, textColor, prefix) => {
      let lane = 0;
      ctx.font = "17px sans-serif";
      for (const seg of segs) {
        const x1 = xForKm(seg.start);
        const x2 = xForKm(seg.end);
        ctx.fillStyle = color;
        ctx.fillRect(x1, plotTop, Math.max(x2 - x1, 2), plotH);
        const label = prefix + seg.height + "m";
        const tw = ctx.measureText(label).width + 14;
        if (x2 - x1 < tw) continue;
        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        ctx.fillText(label, (x1 + x2) / 2, lane === 0 ? plotTop + 26 : plotBot - 16);
        lane = 1 - lane;
      }
    };
    drawBands(climbSegs, "rgba(255,79,126,0.12)", "#ff8fa8", "↑");
    drawBands(descentSegs, "rgba(79,156,240,0.12)", "#9cc6f5", "↓");
    // 海拔面积 + 折线
    ctx.beginPath();
    pathPoints.forEach((p, i) => {
      const x = xForKm(p.km);
      const yy = yForAlt(p.altitude);
      if (i === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    });
    const grad = ctx.createLinearGradient(0, plotTop, 0, plotBot);
    grad.addColorStop(0, "rgba(240,136,40,0.30)");
    grad.addColorStop(1, "rgba(240,136,40,0.04)");
    ctx.lineTo(xForKm(rp.distance_km), plotBot);
    ctx.lineTo(padL, plotBot);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.beginPath();
    pathPoints.forEach((p, i) => {
      const x = xForKm(p.km);
      const yy = yForAlt(p.altitude);
      if (i === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    });
    ctx.strokeStyle = "#f7b054";
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
    // 补给点刻度 + 轨迹标记
    const rows = state.planRows
      .filter((r) => !r.kmInvalid && sf(r.km) != null)
      .map((r) => Object.assign({}, r, { kmNum: sf(r.km) || 0 }))
      .sort((a, b) => a.kmNum - b.kmNum);
    let prevTickX = -1e9;
    let prevTickRow = 0;
    ctx.font = "17px sans-serif";
    for (const r of rows) {
      const x = xForKm(r.kmNum);
      ctx.strokeStyle = "rgba(247,176,84,0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, plotBot);
      ctx.lineTo(x, plotBot + 8);
      ctx.stroke();
      let row = 0;
      if (x - prevTickX < 56) row = 1 - prevTickRow;
      prevTickX = x;
      prevTickRow = row;
      ctx.fillStyle = "rgba(247,176,84,0.95)";
      ctx.textAlign = "center";
      ctx.fillText(String(Math.round(r.kmNum * 10) / 10), x, plotBot + 26 + row * 20);
      const alt = interpolateAltitude(pathPoints, r.kmNum);
      const py = yForAlt(alt);
      const isCp = Number(r.typeIndex) === 0;
      ctx.beginPath();
      ctx.arc(x, py, isCp ? 8 : 6, 0, Math.PI * 2);
      ctx.fillStyle = isCp ? "#34d399" : "#2dd4bf";
      ctx.fill();
      ctx.strokeStyle = "rgba(6,16,11,0.9)";
      ctx.lineWidth = 2;
      ctx.stroke();
      // 官方补给点名称标签（上方/下方自适应，钳制在绘图区内）
      if (isCp) {
        const cp = cpInfo.find((item) => Math.abs(Number(item.distance) - r.kmNum) < 0.05);
        const label = (cp && cp.name ? cp.name : (en ? "CP" : "补给站")) + " " + Math.round(r.kmNum) + "km";
        ctx.font = "13px sans-serif";
        const tw = ctx.measureText(label).width + 18;
        const lx = Math.max(padL + tw / 2, Math.min(x, W - padR - tw / 2));
        let labelY = py > plotTop + 34 ? py - 24 : py + 28;
        labelY = Math.max(plotTop + 12, Math.min(labelY, plotBot - 12));
        ctx.fillStyle = "rgba(6,16,11,0.9)";
        roundRect(lx - tw / 2, labelY - 10, tw, 20, 10);
        ctx.fill();
        ctx.strokeStyle = "rgba(52,211,153,0.6)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = "#8ce8c4";
        ctx.textAlign = "center";
        ctx.fillText(label, lx, labelY + 4);
      }
    }
    // 终点刻度
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
      ctx.fillText(en ? "finish" : "终点", endX, plotBot + 26);
    }
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(233,243,236,0.55)";
    ctx.font = "17px sans-serif";
    ctx.fillText(en ? "distance (km)" : "距离 (km)", W - padR, chartTop + 22);
    y = chartTop + chartH + 16;

    // ---- 补给点明细（图标色块 + 数量，参考小程序海报） ----
    ctx.font = "bold 24px sans-serif";
    ctx.fillStyle = "#ffd9ae";
    ctx.textAlign = "left";
    ctx.fillText(en ? "Fueling points" : "补给点明细", 48, y);
    y += 30;
    let shownRows = 0;
    for (const r of rows) {
      if (y > H - 120) break;
      shownRows += 1;
      const isCp = Number(r.typeIndex) === 0;
      const type = isCp ? (en ? "Official" : "官方") : (en ? "Self" : "自补");
      // 图标列表：先五件套再 extra
      const iconItems = [];
      const gels = sf(r.gels) || 0;
      const elec = sf(r.electrolyte_ml) || 0;
      const plain = sf(r.plain_ml) || 0;
      const salt = sf(r.salt_tabs) || 0;
      const caff = sf(r.caffeine_mg) || 0;
      if (gels > 0) iconItems.push({ label: en ? "gel" : "胶", qty: gels, color: "#FF7A00", unit: "" });
      if (elec > 0) iconItems.push({ label: en ? "elec" : "电解质水", qty: Math.round(elec), color: "#4D96FF", unit: "ml" });
      if (plain > 0) iconItems.push({ label: en ? "water" : "白水", qty: Math.round(plain), color: "#6BCB77", unit: "ml" });
      if (salt > 0) iconItems.push({ label: en ? "salt" : "盐丸", qty: salt, color: "#9B59B6", unit: "" });
      if (caff > 0) iconItems.push({ label: "caff", qty: Math.round(caff), color: "#5B8A72", unit: "mg" });
      getAllSupplyItems().forEach((it) => {
        const n = (r.extra || {})[it.key] || 0;
        if (n > 0) iconItems.push({ label: it.label, qty: n, color: it.color || "#9BA8B4", unit: it.unit || "" });
      });
      const header = `${r.km}km · ${fmtHM(r.time_h)} · ${type}`;
      ctx.font = "bold 18px sans-serif";
      ctx.fillStyle = isCp ? "#ffd9ae" : "#e9f3ec";
      ctx.fillText(header, 48, y + 10);
      // 图标行（色块+短标签+数量）
      let ix = 48;
      const iy = y + 34;
      ctx.font = "13px sans-serif";
      for (const it of iconItems) {
        const label = it.label.length > 6 ? it.label.slice(0, 6) + "…" : it.label;
        const textW = ctx.measureText(`${label} ${it.qty}${it.unit}`).width + 34;
        if (ix + textW > W - 48) {
          ix = 48;
          y += 22;
        }
        ctx.fillStyle = it.color;
        roundRect(ix, iy - 14, 16, 16, 4);
        ctx.fill();
        ctx.fillStyle = "#cdeadd";
        ctx.textAlign = "left";
        ctx.fillText(`${label} ${it.qty}${it.unit}`, ix + 22, iy);
        ix += textW;
      }
      // 官方点：带出
      const takeouts = (r.takeout || []).filter((t) => (sf(t.count) || 0) > 0);
      if (isCp && takeouts.length) {
        y += 24;
        ctx.fillStyle = "#ffb65c";
        ctx.font = "13px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(en ? "takeout: " : "带出：", 48, y + 10);
        let tx = 48 + ctx.measureText(en ? "takeout: " : "带出：").width;
        for (const t of takeouts) {
          const label = t.label.length > 5 ? t.label.slice(0, 5) + "…" : t.label;
          const textW = ctx.measureText(`${label}×${t.count}`).width + 24;
          if (tx + textW > W - 48) { tx = 48; y += 20; }
          ctx.fillStyle = t.color || "#9BA8B4";
          roundRect(tx, y - 6, 12, 12, 3);
          ctx.fill();
          ctx.fillStyle = "#ffd9ae";
          ctx.fillText(`${label}×${t.count}`, tx + 18, y + 6);
          tx += textW;
        }
        y += 8;
      } else if (!iconItems.length) {
        ctx.font = "18px sans-serif";
        ctx.fillStyle = "rgba(233,243,236,0.6)";
        ctx.fillText(en ? "— none —" : "— 无 —", 48, iy);
      }
      y += 34;
      ctx.strokeStyle = "rgba(126,168,142,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(48, y - 6);
      ctx.lineTo(W - 48, y - 6);
      ctx.stroke();
    }
    if (shownRows < rows.length) {
      ctx.font = "17px sans-serif";
      ctx.fillStyle = "rgba(233,243,236,0.6)";
      ctx.textAlign = "left";
      ctx.fillText((en ? "and " : "另有 ") + (rows.length - shownRows) + (en ? " more points…" : " 个补给点未展示…"), 48, y + 14);
      y += 34;
    }
    // 图标说明（图例）
    y += 8;
    ctx.font = "bold 20px sans-serif";
    ctx.fillStyle = "#ffd9ae";
    ctx.textAlign = "left";
    ctx.fillText(en ? "Icon legend" : "图标说明", 48, y);
    y += 22;
    const legendEntries = [];
    const addLegend = (label, color) => {
      if (!label || legendEntries.some((e) => e.label === label)) return;
      legendEntries.push({ label, color: color || "#9BA8B4" });
    };
    state.planRows.forEach((r) => {
      const gels = sf(r.gels) || 0; if (gels > 0) addLegend(en ? "gel" : "胶", "#FF7A00");
      const elec = sf(r.electrolyte_ml) || 0; if (elec > 0) addLegend(en ? "elec" : "电解质水", "#4D96FF");
      const plain = sf(r.plain_ml) || 0; if (plain > 0) addLegend(en ? "water" : "白水", "#6BCB77");
      const salt = sf(r.salt_tabs) || 0; if (salt > 0) addLegend(en ? "salt" : "盐丸", "#9B59B6");
      const caff = sf(r.caffeine_mg) || 0; if (caff > 0) addLegend("caff", "#5B8A72");
      getAllSupplyItems().forEach((it) => { if ((r.extra || {})[it.key] > 0) addLegend(it.label, it.color); });
      (r.takeout || []).forEach((t) => { if ((sf(t.count) || 0) > 0) addLegend(t.label, t.color); });
    });
    state.checklist.forEach((c) => addLegend(c.label, c.color));
    ctx.font = "15px sans-serif";
    let ly = y;
    let lcx = 48;
    let remainingLegend = 0;
    for (const e of legendEntries) {
      const tw = ctx.measureText(e.label).width + 34;
      if (lcx + tw > W - 48) {
        if (ly + 28 > H - 96) { remainingLegend += 1; continue; }
        lcx = 48; ly += 28;
      }
      ctx.fillStyle = e.color;
      roundRect(lcx, ly - 12, 14, 14, 4);
      ctx.fill();
      ctx.fillStyle = "rgba(233,243,236,0.85)";
      ctx.textAlign = "left";
      ctx.fillText(e.label, lcx + 20, ly);
      lcx += tw;
    }
    if (remainingLegend > 0) {
      if (lcx + 60 > W - 48) { lcx = 48; ly += 28; }
      ctx.fillStyle = "rgba(233,243,236,0.6)";
      ctx.textAlign = "left";
      ctx.fillText("+" + remainingLegend, lcx, ly);
      lcx += 40;
    }
    y = ly + 26;
    // 安全提示
    ctx.textAlign = "left";
    ctx.font = "15px sans-serif";
    ctx.fillStyle = "rgba(233,243,236,0.42)";
    ctx.fillText("Trail Lab Engine v2.0 · " + (en ? "local data · for reference only" : "数据本地解析 · 仅供参考"), 48, H - 54);
    ctx.fillStyle = "rgba(233,243,236,0.5)";
    const safety = en ? "General estimate, not medical advice. Adjust by conditions, GI tolerance and professional guidance." : "通用规则估算，非医疗建议；请结合天气、肠胃耐受与专业指导调整，量力而行。";
    ctx.fillText(safety, 48, H - 24);
    // 海报预览弹层：保证图片一定可见可保存（右键另存 / 点"保存图片"按钮，用户手势下载最可靠）
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
          if (global.__peToast) global.__peToast(L("海报已导出", "Poster exported"));
          return;
        }
        if (e.target.closest("[data-close]") || e.target === overlay) {
          overlay.remove();
          setTimeout(() => URL.revokeObjectURL(url), 2000);
        }
      });
    };
    // 导出（toBlob 优先，缺失时回退 dataURL；自动下载 + 预览弹层双保险）
    const finishPoster = (blob) => {
      if (!blob) {
        if (global.__peToast) global.__peToast(L("海报生成失败，请重试", "Poster generation failed, please retry"));
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
        if (global.__peToast) global.__peToast(L("海报已导出", "Poster exported"));
      } catch (e) {
        if (global.__peToast) global.__peToast(L("自动下载失败，请在预览中保存：", "Auto-download failed, save from preview: ") + String(e && e.message));
      }
      // 预览弹层（关闭或保存后才释放 URL）
      showPosterPreview(url);
    };
    try {
      if (typeof canvas.toBlob === "function") {
        canvas.toBlob(finishPoster, "image/png");
      } else {
        const dataUrl = canvas.toDataURL("image/png");
        const bin = atob(dataUrl.split(",")[1]);
        const buf = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i += 1) buf[i] = bin.charCodeAt(i);
        finishPoster(new Blob([buf], { type: "image/png" }));
      }
    } catch (e) {
      if (global.__peToast) global.__peToast(L("海报生成失败：", "Poster generation failed: ") + String(e && e.message));
    }
  }

  // 导出 FIT/GPX 路线：轨迹 + 补给点航点（自补给点命名“自补给+公里数”，与小程序一致）
  function exportRouteFile(mode) {
    const track = state.routeTrack || [];
    if (!Array.isArray(track) || track.length < 2) {
      if (global.__peToast) global.__peToast(L("请先在第 3 步上传路线文件（GPX/FIT），才能导出含补给点的路线文件", "Upload a route file in step 3 first (GPX/FIT) to export route with waypoints"));
      return;
    }
    let cpInfo = [];
    try {
      cpInfo = JSON.parse(state.raceProfileForm.officialCp || "[]");
    } catch (e) {
      cpInfo = [];
    }
    const trackPts = track.filter((p) => p.lat != null && p.lon != null && p.km != null);
    if (trackPts.length < 2) {
      if (global.__peToast) global.__peToast(L("路线文件缺少经纬度轨迹，无法导出路线文件", "Route file has no lat/lon track, cannot export"));
      return;
    }
    const interp = (km) => {
      let prev = trackPts[0];
      for (const p of trackPts) {
        if (p.km >= km) {
          const span = p.km - prev.km;
          const tt = span > 0 ? Math.min(1, Math.max(0, (km - prev.km) / span)) : 0;
          return {
            lat: Number((prev.lat + (p.lat - prev.lat) * tt).toFixed(7)),
            lon: Number((prev.lon + (p.lon - prev.lon) * tt).toFixed(7)),
            altitude:
              prev.altitude != null && p.altitude != null ? prev.altitude + (p.altitude - prev.altitude) * tt : null,
          };
        }
        prev = p;
      }
      const last = trackPts[trackPts.length - 1];
      return { lat: last.lat, lon: last.lon, altitude: last.altitude != null ? last.altitude : null };
    };
    const points = [];
    for (const r of state.planRows) {
      if (r.kmInvalid || r.km == null) continue;
      const km = Number(r.km);
      const isCp = Number(r.typeIndex) === 0;
      const name = isCp
        ? ((cpInfo.find((c) => Math.abs(Number(c.distance) - km) < 0.05) || {}).name || "官方补给点")
        : "自补给" + Number(km.toFixed(2));
      const pos = interp(km);
      points.push({ name, km, isCp, lat: pos.lat, lon: pos.lon, altitude: pos.altitude });
    }
    const ext = mode === "gpx" ? "gpx" : "fit";
    let blob;
    if (ext === "gpx") {
      const content = global.TrailGpx.buildGpx(trackPts, points);
      blob = new Blob([content], { type: "application/gpx+xml" });
    } else {
      if (typeof buildCourseFit !== "function") {
        if (global.__peToast) global.__peToast(L("FIT 编码器未加载（app.js 版本过旧）", "FIT encoder not loaded (old app.js)"));
        return;
      }
      const ab = buildCourseFit(trackPts, points);
      blob = new Blob([ab], { type: "application/octet-stream" });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "山野实验室补给路线." + ext;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (global.__peToast) global.__peToast(L(ext.toUpperCase() + " 路线已导出", ext.toUpperCase() + " route exported"));
  }

  // ---------- 绑定事件 ----------
  function bind() {
    container.addEventListener("input", (e) => {
      const input = e.target.closest(".pe-input");
      if (!input) return;
      const idx = Number(input.closest(".pe-row").dataset.idx);
      const key = input.dataset.key;
      let value = input.value;
      if (["km", "gels", "electrolyte_ml", "plain_ml", "salt_tabs", "caffeine_mg", "protein_g"].includes(key)) {
        value = value.replace(/[^0-9.]/g, "");
        if (key === "km") {
          const m = value.match(/^(\d{0,3})(?:\.(\d{0,2}))?/);
          value = m ? m[1] + (m[2] != null ? "." + m[2] : "") : "";
        }
      }
      const rows = state.planRows.map((r) => ({ ...r }));
      rows[idx] = { ...rows[idx], [key]: value };
      state.planRows = refreshDerived(rows);
      recalcTotals();
      // 只更新合计与派生字段（不整表重绘避免输入抖动）
      renderTotals();
      renderCarryWarnings();
      renderDerivedRow(idx);
    });

    // km 失焦后：距离保留 1 位小数 + 校验 + 全部有效时按距离重排
    container.addEventListener("change", (e) => {
      const input = e.target.closest(".pe-input.pe-km");
      if (!input) return;
      const idx = Number(input.closest(".pe-row").dataset.idx);
      let rows = state.planRows.map((r) => ({ ...r }));
      rows = rows.map((r, i) => {
        if (i !== idx) return r;
        const km = sf(r.km);
        if (km == null) return r;
        return { ...r, km: String(Math.round(km * 10) / 10) };
      });
      const refreshed = refreshDerived(rows);
      const hasInvalid = refreshed.some((r) => r.kmInvalid);
      if (hasInvalid) {
        state.planRows = refreshed;
      } else {
        state.planRows = refreshDerived(sortRowsByKm(refreshed));
      }
      recalcTotals();
      render();
    });

    container.addEventListener("change", (e) => {
      const input = e.target.closest(".pe-input");
      if (input && input.dataset.key === "time_h") {
        const idx = Number(input.closest(".pe-row").dataset.idx);
        const parts = String(input.value || "").split(":");
        const h = parts.length === 2 ? Math.round(((Number(parts[0]) * 60 + Number(parts[1])) / 60) * 100) / 100 : 0;
        const rows = state.planRows.map((r) => ({ ...r }));
        rows[idx] = { ...rows[idx], time_h: String(h) };
        state.planRows = refreshDerived(rows);
        recalcTotals();
        render();
        return;
      }
      const sel = e.target.closest(".pe-select");
      if (sel) {
        const idx = Number(sel.closest(".pe-row").dataset.idx);
        const rows = state.planRows.map((r) => ({ ...r }));
        rows[idx].typeIndex = Number(sel.value);
        state.planRows = rows;
        recalcTotals();
        render();
      }
    });

    container.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-act]");
      if (btn) {
        const act = btn.dataset.act;
        const idx = Number(btn.dataset.idx);
        if (act === "insert") insertRow(idx);
        else if (act === "del") delRow(idx);
        else if (act === "takeout") openLibrary("takeout", idx);
        else if (act === "extra") openLibrary("extra", idx);
        else if (act === "fix-carry") fixCarryWarnings();
        else if (act === "checklist") openLibrary("checklist", idx);
        else if (act === "checklist-supply") {
          // 出发清单添加补给品：复用 extra 补给库，加为清单 supply 项
          state.libMode = "checklist_supply";
          state.libIdx = -1;
          openSupplyLibraryForChecklist();
        } else if (act === "checklist-custom") {
          state.libMode = "checklist";
          state.libIdx = -1;
          openCustomForm(null);
        } else if (act === "checklist-custom-supply") {
          state.libMode = "checklist_supply";
          state.libIdx = -1;
          openCustomForm(null);
        } else if (act === "custom") openCustomForm(null);
        return;
      }
      const step = e.target.closest(".pe-step");
      if (step) {
        // 清单步进（在 checklist 区内）
        if (step.dataset.chk != null) {
          const key = step.dataset.key;
          adjustChecklist(key, Number(step.dataset.chk));
          return;
        }
        const idx = Number(step.closest(".pe-row").dataset.idx);
        const key = step.dataset.key;
        const delta = Number(step.dataset.step);
        // 带出步进：点击的 step 在 takeout 容器内时走 adjustTakeout
        if (step.closest(".pe-takeout")) {
          adjustTakeout(idx, key, Math.sign(delta));
          return;
        }
        adjustRow(idx, key, delta);
        return;
      }
    });

    if (el.addBtn) el.addBtn.addEventListener("click", addRow);
    if (el.addFirstBtn) el.addFirstBtn.addEventListener("click", () => insertRow(-1));
    if (el.clearBtn) el.clearBtn.addEventListener("click", clearSelf);
    if (el.fixBtn) el.fixBtn.addEventListener("click", fixCarryWarnings);
    if (el.libBtn) el.libBtn.addEventListener("click", () => openSupplyLibraryForChecklist());

    // 出发自查清单独立面板：单独挂接清单交互（data-chk 步进 + 添加/自定义）
    if (el.checklist) {
      el.checklist.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-act]");
        if (btn) {
          const act = btn.dataset.act;
          if (act === "checklist") openLibrary("checklist", -1);
          else if (act === "checklist-supply") {
            state.libMode = "checklist_supply";
            state.libIdx = -1;
            openSupplyLibraryForChecklist();
          } else if (act === "checklist-custom") {
            state.libMode = "checklist";
            state.libIdx = -1;
            openCustomForm(null);
          } else if (act === "checklist-custom-supply") {
            state.libMode = "checklist_supply";
            state.libIdx = -1;
            openCustomForm(null);
          }
          return;
        }
        const step = e.target.closest(".pe-step");
        if (step && step.dataset.chk != null) adjustChecklist(step.dataset.key, Number(step.dataset.chk));
      });
    }
  }

  function renderDerivedRow(idx) {
    const row = state.planRows[idx];
    const rowEl = container.querySelector(`.pe-row[data-idx="${idx}"]`);
    if (!row || !rowEl) return;
    const segEl = rowEl.querySelector(".pe-seg");
    if (segEl) segEl.textContent = (row.seg_dist_km != null ? row.seg_dist_km : "") + "km / " + (row.seg_climb_m != null ? row.seg_climb_m : "") + "m";
    const segDistEl = rowEl.querySelector(".pe-seg-dist");
    if (segDistEl) segDistEl.textContent = row.seg_dist_km != null ? row.seg_dist_km : "";
    const segClimbEl = rowEl.querySelector(".pe-seg-climb");
    if (segClimbEl) segClimbEl.textContent = row.seg_climb_m != null ? row.seg_climb_m : "";
    // 同步错误提示
    rowEl.classList.toggle("has-error", Boolean(row.kmInvalid));
    let errEl = rowEl.querySelector(".pe-err");
    if (row.kmInvalid) {
      if (!errEl) {
        errEl = document.createElement("span");
        errEl.className = "pe-err";
        rowEl.appendChild(errEl);
      }
      errEl.textContent = row.kmError || "";
    } else if (errEl) {
      errEl.remove();
    }
  }

  // ---------- 初始化 ----------
  function init(rootContainer, refs) {
    container = rootContainer;
    el = refs || {};
    el.addBtn = refs.addBtn;
    el.addFirstBtn = refs.addFirstBtn || null;
    el.clearBtn = refs.clearBtn;
    el.fixBtn = refs.fixBtn;
    el.libBtn = refs.libBtn;
    el.table = refs.table;
    el.totals = refs.totals;
    el.carryWarnings = refs.carryWarnings;
    el.checklist = refs.checklist;
    el.summary = refs.summary || null;
    bind();
  }

  function load(opts) {
    state.ruleOutput = opts.ruleOutput;
    state.raceProfile = opts.raceProfile;
    state.cpMap = opts.cpMap || {};
    state.raceProfileForm = opts.raceProfileForm || {};
    state.routeFitPoints = opts.routeFitPoints || [];
    state.routeTrack = opts.routeTrack || [];
    state.language = opts.language || "zh";
    state.customItems = opts.customItems || [];
    state.planRows = buildPlanRows(opts.ruleOutput);
    const carry = { gels: 0, salt: 0, fluid: 0, elec: 0, plain: 0, caff: 0, weight: 0 };
    state.checklist = defaultChecklist(carry);
    recalcTotals();
    // 携带清单以当前 carry 预填
    state.checklist = defaultChecklist(state.carryTotals);
    recalcTotals();
    // head/tail 文本（复用 app 引擎渲染，去掉时间轴）
    state.planHeadText = opts.planHeadText || "";
    state.planTailText = opts.planTailText || "";
    render();
  }

  function setLanguage(lang) {
    state.language = lang;
    if (state.planRows.length) render();
  }

  global.TrailLabPlanEditor = {
    init,
    load,
    setLanguage,
    exportXlsx,
    exportCsv,
    copyPlan,
    exportImage,
    exportRouteFile,
    getState: () => state,
  };
})(typeof window !== "undefined" ? window : globalThis);
