let garminSdkPromise = null;

const state = {
  decodedActivity: null,
  decodedRace: null,
  activitySummaryForm: null,
  userProfileForm: null,
  raceMode: "manual",
  raceProfileForm: null,
  routeRaceProfile: null,
  language: "zh",
};

const TEXT = {
  zh: {
    pageTitle: "Trail Lab · AI Fuel Planner",
    languageSwitcherLabel: "语言 / Language",
    heroTitle: "越野跑AI补给规划工具",
    heroTagline: "上传.FIT运动文件，自动计算补给节奏与分段建议",
    heroSubtitle: "五步完成补给规划-解析历史运动记录、校准用户能力画像、设定线路信息、确认线路信息、生成规则与 AI 解释。",
    labIntro: "Trail Lab · 山野实验室 — 用科技探索山野，让户外更有趣、更高效、更安全。",
    stepBadge1: "步骤 1",
    stepBadge2: "步骤 2",
    stepBadge3: "步骤 3",
    stepBadge4: "步骤 4",
    stepBadge5: "步骤 5",
    step1Title: "上传你的活动 FIT 文件",
    stepHint1: "本步将生成：活动原始数据与可解析状态，用于后续用户画像推导。",
    step1Callout: "提醒上传自己的文件",
    activityFitLabel: "选择活动 FIT 文件",
    chooseFile: "选择文件",
    noFileChosen: "未选择文件",
    confirmStep1: "确认并解析",
    step2Title: "确认活动概括与 User Profile",
    stepHint2: "本步将生成：可编辑 User Profile，用于规则引擎能力评估与风险判断。",
    step2Note: "提醒：以下显示内容均为运动设备自带信息，如信息不适用，请手动去掉信息或更改。",
    activitySummaryTitle: "活动概括",
    userProfileTitle: "User Profile",
    backStep: "返回上一步",
    confirmStep2: "确认活动信息",
    step3Title: "目标赛事参数 (Trail Only)",
    stepHint3: "本步将生成：目标赛事画像（距离、爬升、CP 与触发参数）。",
    raceModeManual: "手动填写",
    raceModeFit: "读取目标赛事 FIT",
    raceFitBlockTitle: "读取目标赛事 FIT",
    raceFitLabel: "选择目标赛事 FIT 文件",
    parseRaceFit: "读取目标赛事 FIT",
    raceParamsTitle: "赛事参数",
    confirmStep3: "确认赛事参数",
    step4Title: "路线、海拔、补给点概况图",
    stepHint4: "本步将生成：路线轮廓图与补给触发点，帮助你直观看到补给节奏。",
    step4Note: "基于当前目标赛事参数模拟生成，用于确认补给点分布与坡段结构。",
    legendLine: "路线海拔轮廓",
    legendCp: "CP / 补给站",
    legendSupplemental: "补充补给点",
    legendClimb: "爬升触发点",
    confirmStep4: "确认路线概况",
    step5Title: "规则引擎与 AI 解释",
    stepHint5: "本步将生成：规则契约 JSON、补给定量输出与 AI 可执行解释。",
    aiPlannerTitle: "AI Planner (可选)",
    providerLabel: "Provider",
    modelLabel: "Model",
    apiKeyLabel: "API Key（浏览器端明文，仅本地实验）",
    apiKeyPlaceholder: "可留空使用 mock",
    temperatureLabel: "Temperature",
    aiPlannerNote: "提示：浏览器端调用第三方模型可能受 CORS 限制。若失败请先使用 mock 验证全流程。",
    runBtn: "开始计算并生成解释",
    contractOutputTitle: "Rule Contract JSON",
    engineOutputTitle: "Rule Engine 输出",
    aiOutputTitle: "AI Planner 输出",
    routeDistance: "距离",
    routeAscent: "爬升",
    routeCp: "CP",
    routeSupplemental: "补充点",
    routeSource: "路线来源",
    routeSourceFit: "目标赛事 FIT",
    routeSourceSimulated: "模拟",
    axisElevation: "海拔 (m)",
    axisDistance: "距离 (km)",
    kvTotalDistance: "总距离",
    kvTotalAscent: "总爬升",
    kvSportType: "运动类型",
    statusUploadOwnFit: "请先上传自己的 FIT 文件。",
    statusParsingActivity: "解析活动 FIT 中...",
    statusActivityReady: "活动 FIT 已解析，请确认活动概括和 User Profile。",
    statusConfirmRace: "请确认目标赛事参数，可手动填写或读取目标赛事 FIT。",
    statusSelectRaceFit: "请先选择目标赛事 FIT 文件。",
    statusParsingRace: "读取目标赛事 FIT 中...",
    statusRaceReady: "目标赛事 FIT 已读取，可继续补充 CP、坡段和天气参数。",
    statusRouteReady: "路线、海拔与补给点概况已生成，请确认。",
    statusReadyEngine: "可以开始运行 Trail Lab Rule Engine 与 AI Planner。",
    statusNeedActivity: "请先完成活动 FIT 解析。",
    statusEngineDone: "规则引擎完成，正在生成 AI 解释...",
    statusAllDone: "全部完成。",
    statusFailed: "失败",
    errorPrefix: "错误",
    sdkLoadFailed: "Garmin FIT SDK 加载失败。请优先使用本地静态服务器打开当前页面，而不是直接双击 HTML。原始错误:",
    decodeInvalidMessages: "Garmin FIT SDK 解码失败：未返回有效消息字典。",
    decodeFatal: "Garmin FIT SDK 解码异常：{error}",
    noExtraNumbers: "除非明确标注为假设，否则不得输出契约 JSON 之外的新数值。",
    plannerInstruction: "请输出可执行时间轴清单（赛前/赛中/赛后），并给出每个阶段简要解释。",
    mockResponse: "[Mock response] 请在实际环境中配置 AI API Key 并选择模型。",
    activitySummaryReadonlyHint: "活动概括直接来自当前活动 FIT，仅展示，不参与勾选或编辑。",
    providerNeedsApiKey: "当前 provider 需要 API Key。请填写后重试，或切回 mock。",
    aiApiFailed: "AI API 调用失败：{status} {statusText}",
    aiApiEmpty: "AI API 返回为空。可能受 CORS 或模型策略限制。",
    geminiApiFailed: "Gemini API 调用失败：{status} {statusText}",
    geminiEmpty: "Gemini 返回为空。可能是模型名不可用或 CORS 限制。",
    unsupportedProvider: "不支持的 provider: {provider}",
    defaultSelectOption: "请选择",
    optionalPlaceholder: "选填，如实填写可提升策略准备性",
    hrvLow: "低",
    hrvNormal: "正常",
    hrvGood: "良好",
    chartAriaLabel: "路线海拔和补给点概况图",
    raceCpPlaceholder: "例如 8,16,24",
    raceSegmentPlaceholder: "例如 6:200,8:800,10:300",
    raceNotesPlaceholder: "例如高海拔、暴晒、补给站间隔长",
  },
  en: {
    pageTitle: "Trail Lab · AI Fuel Planner",
    languageSwitcherLabel: "Language / 语言",
    heroTitle: "Smart Nutrition Planning for Trail Running",
    heroTagline: "Upload a .FIT activity file and automatically get fueling rhythm plus segment suggestions.",
    heroSubtitle: "Finish fueling planning in five steps: parse activity history, calibrate your ability profile, set route info, confirm route info, then generate rules and an AI explanation.",
    labIntro: "Trail Lab · 山野实验室 — Explore the wilderness with technology—making the outdoors more fun, efficient, and safe.",
    stepBadge1: "Step 1",
    stepBadge2: "Step 2",
    stepBadge3: "Step 3",
    stepBadge4: "Step 4",
    stepBadge5: "Step 5",
    step1Title: "Upload Your Activity FIT File",
    stepHint1: "This step generates: parsed activity baseline and readiness for profile extraction.",
    step1Callout: "Reminder: upload your own FIT file",
    activityFitLabel: "Choose activity FIT file",
    chooseFile: "Choose file",
    noFileChosen: "No file chosen",
    confirmStep1: "Confirm and parse",
    step2Title: "Review Activity Summary and User Profile",
    stepHint2: "This step generates: editable user profile for rule-engine ability and risk scoring.",
    step2Note: "Reminder: the following values come from device data. If any item does not apply, remove it or edit it manually.",
    activitySummaryTitle: "Activity Summary",
    userProfileTitle: "User Profile",
    backStep: "Back",
    confirmStep2: "Confirm activity info",
    step3Title: "Target Race Parameters (Trail Only)",
    stepHint3: "This step generates: race profile (distance, ascent, CP and trigger parameters).",
    raceModeManual: "Manual input",
    raceModeFit: "Read race FIT",
    raceFitBlockTitle: "Read target race FIT",
    raceFitLabel: "Choose target race FIT file",
    parseRaceFit: "Read target race FIT",
    raceParamsTitle: "Race parameters",
    confirmStep3: "Confirm race parameters",
    step4Title: "Route, Elevation, and Fuel Point Overview",
    stepHint4: "This step generates: route contour and fueling trigger points for visual verification.",
    step4Note: "Generated from current race parameters to confirm fuel point distribution and climb structure.",
    legendLine: "Route elevation profile",
    legendCp: "CP / aid station",
    legendSupplemental: "Supplemental fuel point",
    legendClimb: "Climb trigger point",
    confirmStep4: "Confirm route overview",
    step5Title: "Rule Engine and AI Explanation",
    stepHint5: "This step generates: rule-contract JSON, quantified fueling output, and AI execution guidance.",
    aiPlannerTitle: "AI Planner (Optional)",
    providerLabel: "Provider",
    modelLabel: "Model",
    apiKeyLabel: "API key (plain in browser, local experiment only)",
    apiKeyPlaceholder: "Leave blank to use mock",
    temperatureLabel: "Temperature",
    aiPlannerNote: "Browser-side calls to third-party models may be blocked by CORS. Use mock first to validate the full flow.",
    runBtn: "Run engine and generate explanation",
    contractOutputTitle: "Rule Contract JSON",
    engineOutputTitle: "Rule Engine Output",
    aiOutputTitle: "AI Planner Output",
    routeDistance: "Distance",
    routeAscent: "Ascent",
    routeCp: "CP",
    routeSupplemental: "Supplemental",
    routeSource: "Route source",
    routeSourceFit: "Race FIT",
    routeSourceSimulated: "Simulated",
    axisElevation: "Elevation (m)",
    axisDistance: "Distance (km)",
    kvTotalDistance: "Total distance",
    kvTotalAscent: "Total ascent",
    kvSportType: "Sport type",
    statusUploadOwnFit: "Please upload your own FIT file first.",
    statusParsingActivity: "Parsing activity FIT...",
    statusActivityReady: "Activity FIT parsed. Review the activity summary and user profile.",
    statusConfirmRace: "Review race parameters. You can fill them manually or read a target race FIT.",
    statusSelectRaceFit: "Please choose a target race FIT file first.",
    statusParsingRace: "Reading target race FIT...",
    statusRaceReady: "Target race FIT loaded. You can continue editing CP, segments, and weather.",
    statusRouteReady: "Route, elevation, and fuel point overview generated. Please review it.",
    statusReadyEngine: "You can now run the Trail Lab Rule Engine and AI Planner.",
    statusNeedActivity: "Please finish parsing the activity FIT first.",
    statusEngineDone: "Rule engine done. Generating AI explanation...",
    statusAllDone: "All done.",
    statusFailed: "Failed",
    errorPrefix: "Error",
    sdkLoadFailed: "Garmin FIT SDK failed to load. Use a local static server instead of opening the HTML file directly. Original error:",
    decodeInvalidMessages: "Garmin FIT SDK decode failed: no valid message map returned.",
    decodeFatal: "Garmin FIT SDK decode exception: {error}",
    noExtraNumbers: "Do not output any number outside the contract JSON unless clearly marked as an assumption.",
    plannerInstruction: "Output an actionable timeline checklist (pre-race / during / post-race) with brief explanations.",
    mockResponse: "[Mock response] Please configure an AI API key and choose a real model in production.",
    activitySummaryReadonlyHint: "Activity summary comes directly from the current FIT file. It is display-only and not editable.",
    providerNeedsApiKey: "This provider requires an API key. Fill it in, or switch back to mock.",
    aiApiFailed: "AI API call failed: {status} {statusText}",
    aiApiEmpty: "AI API returned empty content. This may be caused by CORS or model policy limits.",
    geminiApiFailed: "Gemini API call failed: {status} {statusText}",
    geminiEmpty: "Gemini returned empty content. The model may be unavailable or blocked by CORS.",
    unsupportedProvider: "Unsupported provider: {provider}",
    defaultSelectOption: "Select",
    optionalPlaceholder: "Optional. Fill truthfully to improve plan readiness",
    hrvLow: "Low",
    hrvNormal: "Normal",
    hrvGood: "Good",
    chartAriaLabel: "Route elevation and fueling point overview",
    raceCpPlaceholder: "e.g. 8,16,24",
    raceSegmentPlaceholder: "e.g. 6:200,8:800,10:300",
    raceNotesPlaceholder: "e.g. high altitude, exposed sun, long station gaps",
  },
};

function t(key) {
  return TEXT[state.language][key] || key;
}

function tf(key, tokens = {}) {
  let text = t(key);
  for (const [token, value] of Object.entries(tokens)) {
    text = text.replaceAll(`{${token}}`, String(value));
  }
  return text;
}

function safeFloat(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

function firstField(obj, ...names) {
  for (const name of names) {
    const value = safeFloat(obj?.[name]);
    if (value !== null) {
      return value;
    }
  }
  return null;
}

function camelToSnake(key) {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/\s+/g, "_").toLowerCase();
}

function normalizeKeysDeep(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeKeysDeep(item));
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const result = {};
    for (const [key, nested] of Object.entries(value)) {
      result[typeof key === "string" ? camelToSnake(key) : key] = normalizeKeysDeep(nested);
    }
    return result;
  }
  return value;
}

function pickMessageGroup(messages, ...keys) {
  for (const key of keys) {
    if (Array.isArray(messages[key])) {
      return messages[key];
    }
  }
  return [];
}

function parseKmPoints(rawPoints, maxDistanceKm = null) {
  if (!rawPoints) {
    return [];
  }
  const points = rawPoints
    .split(",")
    .map((token) => safeFloat(token.trim()))
    .filter((value) => value !== null && value > 0)
    .filter((value) => maxDistanceKm === null || value < maxDistanceKm)
    .map((value) => Number(value.toFixed(2)));
  return [...new Set(points)].sort((a, b) => a - b);
}

function parseClimbSegments(rawSegments) {
  if (!rawSegments) {
    return [];
  }
  const segments = [];
  for (const token of rawSegments.split(",")) {
    const [distanceText, ascentText] = token.split(":");
    const distanceKm = safeFloat((distanceText || "").trim());
    const ascentM = safeFloat((ascentText || "").trim());
    if (distanceKm !== null && ascentM !== null && distanceKm > 0) {
      segments.push([distanceKm, Math.max(ascentM, 0)]);
    }
  }
  return segments;
}

function formatDuration(seconds) {
  const secs = safeFloat(seconds);
  if (secs === null) {
    return "";
  }
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function formatDistanceMeters(meters) {
  const value = safeFloat(meters);
  return value === null ? "" : `${(value / 1000).toFixed(2)} km`;
}

function stringifyZoneTimes(zones) {
  if (!zones || typeof zones !== "object") {
    return "";
  }
  return Object.entries(zones)
    .map(([key, value]) => `${key}: ${(Number(value) / 60).toFixed(1)} min`)
    .join(" | ");
}

function getHrvStatus(hrvScore) {
  const hrv = safeFloat(hrvScore);
  if (hrv === null) {
    return "";
  }
  if (hrv < 35) {
    return "low";
  }
  if (hrv >= 60) {
    return "good";
  }
  return "normal";
}

function hasMeaningfulValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#96;");
}

function sortedRecords(records) {
  return [...records].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

async function loadGarminSdk() {
  if (!garminSdkPromise) {
    garminSdkPromise = import("https://esm.sh/@garmin/fitsdk@21.212.0").catch((error) => {
      garminSdkPromise = null;
      throw error;
    });
  }
  return garminSdkPromise;
}

async function decodeFitMessages(arrayBuffer) {
  let sdk;
  try {
    sdk = await loadGarminSdk();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${t("sdkLoadFailed")} ${reason}`);
  }

  const { Decoder, Stream } = sdk;
  const stream = Stream.fromArrayBuffer(arrayBuffer);
  const decoder = new Decoder(stream);
  const { messages, errors } = decoder.read({
    applyScaleAndOffset: true,
    convertDateTimesToDates: true,
    convertTypesToStrings: true,
    expandSubFields: true,
    expandComponents: true,
    includeUnknownData: true,
    mergeHeartRates: true,
    decodeMemoGlobs: true,
    skipHeader: false,
    dataOnly: false,
  });

  if (!messages || typeof messages !== "object") {
    throw new Error(t("decodeInvalidMessages"));
  }
  if (Array.isArray(errors)) {
    const fatal = errors.find((error) => String(error).toLowerCase().includes("exception"));
    if (fatal) {
      throw new Error(tf("decodeFatal", { error: fatal }));
    }
  }

  const normalized = normalizeKeysDeep(messages);
  return {
    session_mesgs: pickMessageGroup(normalized, "session_mesgs"),
    lap_mesgs: pickMessageGroup(normalized, "lap_mesgs"),
    record_mesgs: pickMessageGroup(normalized, "record_mesgs"),
    course_point_mesgs: pickMessageGroup(normalized, "course_point_mesgs"),
    sport_mesgs: pickMessageGroup(normalized, "sport_mesgs"),
    event_mesgs: pickMessageGroup(normalized, "event_mesgs"),
    device_info_mesgs: pickMessageGroup(normalized, "device_info_mesgs"),
    zones_target_mesgs: pickMessageGroup(normalized, "zones_target_mesgs"),
    time_in_zone_mesgs: pickMessageGroup(normalized, "time_in_zone_mesgs"),
    climb_pro_mesgs: pickMessageGroup(normalized, "climb_pro_mesgs"),
    user_profile_mesgs: pickMessageGroup(normalized, "user_profile_mesgs"),
    hrv_mesgs: pickMessageGroup(normalized, "hrv_mesgs"),
  };
}

function extractFitMetrics(decoded) {
  const session = decoded.session_mesgs[0] || {};
  const lap = decoded.lap_mesgs[0] || {};
  const records = sortedRecords(decoded.record_mesgs.filter((record) => record && record.timestamp));
  const metrics = {
    基础数据: {},
    耐力数据: {},
    心肺数据: {},
    动态数据: {},
    功率数据: {},
    环境数据: {},
  };
  const unavailable = [];

  const totalDistance = firstField(session, "total_distance");
  const totalTimerTime = firstField(session, "total_timer_time");
  const totalElapsedTime = firstField(session, "total_elapsed_time");
  const avgSpeed = firstField(session, "enhanced_avg_speed", "avg_speed");
  const totalAscent = firstField(session, "total_ascent");
  const avgHeartRate = firstField(session, "avg_heart_rate");
  const maxHeartRate = firstField(session, "max_heart_rate");

  if (totalDistance !== null) metrics.基础数据.距离 = totalDistance / 1000; // m → km
  else unavailable.push("基础数据: 距离");

  if (totalTimerTime !== null) metrics.基础数据.时间 = totalTimerTime;
  else if (totalElapsedTime !== null) metrics.基础数据.时间 = totalElapsedTime;
  else unavailable.push("基础数据: 时间");

  if (avgSpeed !== null) {
    metrics.基础数据.平均速度 = avgSpeed * 3.6; // m/s → km/h
    metrics.基础数据.配速 = avgSpeed > 0 ? 60 / (avgSpeed * 3.6) : null; // min/km
  } else {
    unavailable.push("基础数据: 平均速度");
    unavailable.push("基础数据: 配速");
  }

  if (totalAscent !== null) metrics.基础数据.爬升 = totalAscent;
  else unavailable.push("基础数据: 爬升");

  if (avgHeartRate !== null) {
    metrics.基础数据.平均心率 = avgHeartRate;
    metrics.心肺数据.平均心率 = avgHeartRate;
  } else {
    unavailable.push("基础数据: 平均心率");
  }

  if (maxHeartRate !== null) {
    metrics.基础数据.最大心率 = maxHeartRate;
    metrics.心肺数据.最大心率 = maxHeartRate;
  } else {
    unavailable.push("基础数据: 最大心率");
  }

  if (records.length > 1 && totalAscent !== null) {
    let uphillTime = 0;
    let downhillSpeedAcc = 0;
    let downhillCount = 0;
    for (let i = 1; i < records.length; i += 1) {
      const prev = records[i - 1];
      const curr = records[i];
      const prevAlt = firstField(prev, "enhanced_altitude", "altitude");
      const currAlt = firstField(curr, "enhanced_altitude", "altitude");
      const dt = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000;
      if (!Number.isFinite(dt) || dt <= 0 || prevAlt === null || currAlt === null) {
        continue;
      }
      if (currAlt > prevAlt) {
        uphillTime += dt;
      } else if (currAlt < prevAlt) {
        const speed = firstField(prev, "enhanced_speed", "speed");
        if (speed !== null) {
          downhillSpeedAcc += speed;
          downhillCount += 1;
        }
      }
    }
    if (uphillTime > 0) {
      metrics.耐力数据.平均爬升速度 = totalAscent / uphillTime;
      metrics.耐力数据.上坡时间比例 = totalTimerTime ? uphillTime / totalTimerTime : null;
    }
    if (downhillCount > 0) {
      metrics.耐力数据.下坡速度 = (downhillSpeedAcc / downhillCount) * 3.6; // m/s → km/h
    }
  }

  const avgCadence = firstField(session, "avg_running_cadence", "avg_cadence");
  const avgPower = firstField(session, "avg_power");
  const maxPower = firstField(session, "max_power");
  const avgStepLength = firstField(session, "avg_step_length");
  const avgStanceTime = firstField(session, "avg_stance_time");
  const avgVerticalOsc = firstField(session, "avg_vertical_oscillation");
  const avgVerticalRatio = firstField(session, "avg_vertical_ratio");
  if (avgCadence !== null) metrics.动态数据.步频 = avgCadence;
  if (avgPower !== null) metrics.功率数据.平均功率 = avgPower;
  if (maxPower !== null) metrics.功率数据.最大功率 = maxPower;
  if (avgStepLength !== null) metrics.动态数据.步幅 = avgStepLength;
  if (avgStanceTime !== null) metrics.动态数据.触地时间 = avgStanceTime;
  if (avgVerticalOsc !== null) metrics.动态数据.垂直振幅 = avgVerticalOsc;
  if (avgVerticalRatio !== null) metrics.动态数据.跑姿效率 = avgVerticalRatio;

  const maxAlt = firstField(lap, "enhanced_max_altitude");
  const minAlt = firstField(lap, "enhanced_min_altitude");
  const altitudes = records.map((record) => firstField(record, "enhanced_altitude", "altitude")).filter((value) => value !== null);
  if (maxAlt !== null && minAlt !== null) {
    metrics.环境数据.海拔最高 = maxAlt;
    metrics.环境数据.海拔最低 = minAlt;
  } else if (altitudes.length) {
    metrics.环境数据.海拔最高 = Math.max(...altitudes);
    metrics.环境数据.海拔最低 = Math.min(...altitudes);
  }

  for (const key of Object.keys(metrics)) {
    if (!Object.keys(metrics[key]).length) {
      delete metrics[key];
    }
  }

  return { metrics, unavailable };
}

function stringifyHrBoundaries(boundaries) {
  if (!Array.isArray(boundaries) || boundaries.length < 5) {
    return "";
  }
  const lines = [];
  let lower = 0;
  for (let index = 0; index < 5; index += 1) {
    const upper = safeFloat(boundaries[index]);
    if (upper === null) {
      continue;
    }
    const label = state.language === "en" ? `Zone ${index + 1}` : `区间 ${index + 1}`;
    if (index === 0) {
      lines.push(`${label}: <= ${upper.toFixed(0)} bpm`);
    } else {
      lines.push(`${label}: ${Math.round(lower + 1)} - ${upper.toFixed(0)} bpm`);
    }
    lower = upper;
  }
  return lines.join("\n");
}

function buildActivityOverview(decoded, physiologicalMaxHr = null) {
  const session = decoded.session_mesgs[0] || {};
  const userMesg = decoded.user_profile_mesgs[0] || {};
  const zoneMesg = decoded.time_in_zone_mesgs[0] || {};
  const hrBoundaries = zoneMesg.hr_zone_high_boundary || [];

  return {
    activitySummary: {
      totalDuration: formatDuration(firstField(session, "total_timer_time", "total_elapsed_time")),
      totalDistance: formatDistanceMeters(firstField(session, "total_distance")),
      totalAscent: firstField(session, "total_ascent") !== null ? `${firstField(session, "total_ascent").toFixed(0)} m` : "",
      totalDescent: firstField(session, "total_descent") !== null ? `${firstField(session, "total_descent").toFixed(0)} m` : "",
      avgHeartRate: firstField(session, "avg_heart_rate") !== null ? `${firstField(session, "avg_heart_rate").toFixed(0)} bpm` : "",
      sportType: String(session.sport_profile_name || session.sub_sport || session.sport || ""),
    },
    userProfile: {
      height: firstField(userMesg, "height") !== null ? String(firstField(userMesg, "height")) : "",
      weight: firstField(userMesg, "weight") !== null ? String(firstField(userMesg, "weight")) : "",
      gender: String(userMesg.gender || ""),
      restingHeartRate: firstField(userMesg, "resting_heart_rate") !== null ? String(firstField(userMesg, "resting_heart_rate")) : "",
      hrv: "",
      hrvStatus: "",
      heartRateZones: stringifyHrBoundaries(hrBoundaries),
      itraPoints: "",
      utmbPoints: "",
      physiologicalMaxHr: firstField(zoneMesg, "max_heart_rate") !== null ? String(firstField(zoneMesg, "max_heart_rate")) : "",
    },
  };
}

class UserProfileBuilder {
  build(decoded, input) {
    const { metrics, unavailable } = extractFitMetrics(decoded);
    const pace = safeFloat(metrics.基础数据?.配速);
    const itraPoints = safeFloat(input.itraPoints);

    const itraComponent = itraPoints !== null ? clamp(itraPoints / 1000, 0.2, 1) : 0.5;
    const paceComponent = pace && pace > 0 ? clamp(8.5 / pace, 0.2, 1) : 0.5;
    const abilityScore = Math.round((itraComponent * 0.45 + paceComponent * 0.55) * 1000) / 10;

    const hrv = safeFloat(input.hrv);
    let fatigueRisk = "medium";
    if (input.hrvStatus === "low" || (hrv !== null && hrv < 35)) {
      fatigueRisk = "high";
    } else if (input.hrvStatus === "good" || (hrv !== null && hrv >= 60)) {
      fatigueRisk = "low";
    }

    return {
      ability_score: abilityScore,
      fatigue_risk: fatigueRisk,
      metrics,
      unavailable,
      raw_profile: input,
    };
  }
}

class RaceProfileBuilder {
  normalizeSegments(distanceKm, ascentM, rawSegments) {
    if (rawSegments.length) {
      const totalDistance = rawSegments.reduce((sum, segment) => sum + segment[0], 0);
      const totalAscent = rawSegments.reduce((sum, segment) => sum + segment[1], 0);
      const distanceScale = totalDistance > 0 ? distanceKm / totalDistance : 1;
      const ascentScale = totalAscent > 0 ? ascentM / totalAscent : 0;
      return rawSegments.map(([distance, ascent]) => [Number((distance * distanceScale).toFixed(2)), Number((ascent * ascentScale).toFixed(1))]);
    }

    return [
      [Number((distanceKm * 0.35).toFixed(2)), Number((ascentM * 0.25).toFixed(1))],
      [Number((distanceKm * 0.35).toFixed(2)), Number((ascentM * 0.5).toFixed(1))],
      [Number((distanceKm * 0.3).toFixed(2)), Number((ascentM * 0.25).toFixed(1))],
    ];
  }

  build(input) {
    const distanceKm = Math.max(safeFloat(input.distanceKm) || 30, 1);
    const ascentM = Math.max(safeFloat(input.ascentM) || 0, 0);
    const manualSegments = parseClimbSegments(input.segmentGain || "");
    const segments = this.normalizeSegments(distanceKm, ascentM, manualSegments);

    let cumulativeKm = 0;
    const steepSegments = [];
    const supplementalPoints = [];
    for (const [segmentDistance, segmentAscent] of segments) {
      const startKm = cumulativeKm;
      const endKm = cumulativeKm + segmentDistance;
      const gradient = segmentAscent / Math.max(segmentDistance, 0.1);
      if (gradient >= 80) {
        steepSegments.push([Number(startKm.toFixed(2)), Number(endKm.toFixed(2)), Number(gradient.toFixed(1))]);
        const preClimb = Math.max(startKm - 0.6, 0.8);
        if (preClimb < distanceKm) {
          supplementalPoints.push(Number(preClimb.toFixed(2)));
        }
      }
      cumulativeKm = endKm;
    }

    let cpPoints = parseKmPoints(input.cpKm || "", distanceKm);
    if (!cpPoints.length) {
      cpPoints = [distanceKm * 0.25, distanceKm * 0.5, distanceKm * 0.75]
        .filter((value) => value > 0 && value < distanceKm)
        .map((value) => Number(value.toFixed(1)));
    }

    const aidStations = [...new Set(cpPoints)].sort((a, b) => a - b);
    const dedupSupplemental = [...new Set(supplementalPoints)].filter((value) => !aidStations.includes(value)).sort((a, b) => a - b);

    return {
      distance_km: distanceKm,
      ascent_m: ascentM,
      aid_stations_km: aidStations,
      climb_segments: segments,
      steep_segments: steepSegments,
      supplemental_points_km: dedupSupplemental,
      climb_trigger_m: Math.max(safeFloat(input.climbTriggerM) || 250, 100),
      max_interval_min: Math.max(safeFloat(input.maxIntervalMin) || 45, 20),
      weather_temp_c: safeFloat(input.weatherTemp),
      humidity_pct: safeFloat(input.humidity),
      location_history_notes: input.locationNotes || null,
    };
  }
}

class TrailLabRuleEngine {
  buildClimbTriggerPoints(raceProfile, triggerM) {
    if (triggerM <= 0) {
      return [];
    }
    const points = [];
    let nextTrigger = triggerM;
    let accumulatedAscent = 0;
    let cumulativeKm = 0;
    for (const [segmentDistance, segmentAscent] of raceProfile.climb_segments) {
      if (segmentDistance <= 0) {
        continue;
      }
      const startAscent = accumulatedAscent;
      const endAscent = accumulatedAscent + Math.max(segmentAscent, 0);
      const startKm = cumulativeKm;
      const endKm = cumulativeKm + segmentDistance;
      while (nextTrigger <= endAscent && endAscent > startAscent) {
        const ratio = (nextTrigger - startAscent) / (endAscent - startAscent);
        const triggerKm = startKm + ratio * (endKm - startKm);
        if (triggerKm >= 0.5 && triggerKm < raceProfile.distance_km) {
          points.push(Number(triggerKm.toFixed(2)));
        }
        nextTrigger += triggerM;
      }
      accumulatedAscent = endAscent;
      cumulativeKm = endKm;
    }
    return [...new Set(points)].sort((a, b) => a - b);
  }

  buildTimeFallbackPoints(raceProfile, finishTimeH, maxIntervalMin) {
    if (maxIntervalMin <= 0) {
      return [];
    }
    const finishTimeMin = Math.max(finishTimeH * 60, 1);
    const intervalKm = Math.max((raceProfile.distance_km / finishTimeMin) * maxIntervalMin, 0.8);
    const points = [];
    for (let km = intervalKm; km < raceProfile.distance_km; km += intervalKm) {
      if (km >= 0.5) {
        points.push(Number(km.toFixed(2)));
      }
    }
    return [...new Set(points)].sort((a, b) => a - b);
  }

  compute(userProfile, raceProfile, weightKg) {
    const abilityScale = clamp(userProfile.ability_score / 100, 0.35, 1);
    const basePaceMinPerKm = 8.8 - abilityScale * 2.2;
    const climbFactor = raceProfile.ascent_m / Math.max(raceProfile.distance_km, 1);
    const climbPenalty = 1 + clamp((climbFactor - 30) / 120, 0, 0.6);
    const fatiguePenalty = userProfile.fatigue_risk === "high" ? 1.12 : userProfile.fatigue_risk === "low" ? 0.96 : 1;

    let finishTimeH = (raceProfile.distance_km * basePaceMinPerKm / 60) * climbPenalty * fatiguePenalty;
    finishTimeH = Number(Math.max(finishTimeH, 1).toFixed(2));

    let carbsPerHour = 55 + (1 - abilityScale) * 8 + clamp((climbFactor - 35) / 12, 0, 10);
    if (userProfile.fatigue_risk === "high") {
      carbsPerHour += 4;
    }

    let fluidPerHour = 550;
    if (raceProfile.weather_temp_c !== null) {
      fluidPerHour += Math.max(0, raceProfile.weather_temp_c - 15) * 18;
    }
    if (raceProfile.humidity_pct !== null) {
      fluidPerHour += Math.max(0, raceProfile.humidity_pct - 55) * 3;
    }
    fluidPerHour = clamp(fluidPerHour, 450, 1100);

    let sodiumPerHour = 450;
    if (raceProfile.weather_temp_c !== null && raceProfile.weather_temp_c >= 24) {
      sodiumPerHour += 120;
    }
    if (raceProfile.humidity_pct !== null && raceProfile.humidity_pct >= 70) {
      sodiumPerHour += 80;
    }

    const totalCarbs = Number((carbsPerHour * finishTimeH).toFixed(1));
    const totalFluid = Number((fluidPerHour * finishTimeH).toFixed(1));
    const totalSodium = Number((sodiumPerHour * finishTimeH).toFixed(1));

    const climbPoints = this.buildClimbTriggerPoints(raceProfile, raceProfile.climb_trigger_m);
    const timePoints = this.buildTimeFallbackPoints(raceProfile, finishTimeH, raceProfile.max_interval_min);
    const fuelingPointsKm = [...new Set([...raceProfile.aid_stations_km, ...raceProfile.supplemental_points_km, ...climbPoints, ...timePoints])]
      .filter((point) => point >= 0.5 && point < raceProfile.distance_km)
      .sort((a, b) => a - b);

    const effectivePoints = fuelingPointsKm.length ? fuelingPointsKm : [Number((raceProfile.distance_km / 2).toFixed(1))];
    const carbsPerEvent = Number((totalCarbs / effectivePoints.length).toFixed(1));
    const fluidPerEvent = Number((totalFluid / effectivePoints.length).toFixed(1));
    const sodiumPerEvent = Number((totalSodium / effectivePoints.length).toFixed(1));

    const fuelingPoints = effectivePoints.map((pointKm) => {
      const sources = [];
      if (raceProfile.aid_stations_km.some((point) => Math.abs(point - pointKm) <= 0.05)) sources.push("cp");
      if (raceProfile.supplemental_points_km.some((point) => Math.abs(point - pointKm) <= 0.05)) sources.push("supplemental");
      if (climbPoints.some((point) => Math.abs(point - pointKm) <= 0.05)) sources.push("climb_trigger");
      if (timePoints.some((point) => Math.abs(point - pointKm) <= 0.05)) sources.push("time_fallback");
      return {
        km: Number(pointKm.toFixed(2)),
        time_h: Number((finishTimeH * (pointKm / raceProfile.distance_km)).toFixed(2)),
        carbs_g: carbsPerEvent,
        fluid_ml: fluidPerEvent,
        sodium_mg: sodiumPerEvent,
        source: [...new Set(sources)].sort().join("+") || "auto",
      };
    });

    return {
      contract_version: "trail_lab_rule_contract_v1",
      estimated_finish_time_h: finishTimeH,
      carbs_per_hour_g: Number(carbsPerHour.toFixed(1)),
      fluid_per_hour_ml: Number(fluidPerHour.toFixed(1)),
      sodium_per_hour_mg: Number(sodiumPerHour.toFixed(1)),
      total_carbs_g: totalCarbs,
      total_fluid_ml: totalFluid,
      total_sodium_mg: totalSodium,
      fueling_points: fuelingPoints,
      trigger_config: {
        climb_trigger_m: raceProfile.climb_trigger_m,
        max_interval_min: raceProfile.max_interval_min,
      },
      warnings: [],
      weight_kg: weightKg,
    };
  }
}

function ruleEngineOutputToContract(userProfile, raceProfile, ruleOutput) {
  return {
    contract_version: ruleOutput.contract_version,
    sport_mode: "trail_run",
    user_profile: {
      ability_score: userProfile.ability_score,
      fatigue_risk: userProfile.fatigue_risk,
      editable_profile: userProfile.raw_profile,
    },
    race_profile: {
      distance_km: raceProfile.distance_km,
      ascent_m: raceProfile.ascent_m,
      aid_stations_km: raceProfile.aid_stations_km,
      supplemental_points_km: raceProfile.supplemental_points_km,
      steep_segments: raceProfile.steep_segments,
      weather_temp_c: raceProfile.weather_temp_c,
      humidity_pct: raceProfile.humidity_pct,
    },
    trigger_config: ruleOutput.trigger_config,
    engine_outputs: {
      estimated_finish_time_h: ruleOutput.estimated_finish_time_h,
      carbs_per_hour_g: ruleOutput.carbs_per_hour_g,
      fluid_per_hour_ml: ruleOutput.fluid_per_hour_ml,
      sodium_per_hour_mg: ruleOutput.sodium_per_hour_mg,
      total_carbs_g: ruleOutput.total_carbs_g,
      total_fluid_ml: ruleOutput.total_fluid_ml,
      total_sodium_mg: ruleOutput.total_sodium_mg,
      fueling_points: ruleOutput.fueling_points,
      warnings: ruleOutput.warnings,
    },
  };
}

function renderRuleEngineOutput(ruleOutput, language = "zh") {
  const lines = language === "en"
    ? [
      "Trail Lab Rule Engine Output",
      `- Estimated finish time: ${ruleOutput.estimated_finish_time_h.toFixed(2)} h`,
      `- Carbohydrate: ${ruleOutput.carbs_per_hour_g.toFixed(1)} g/h (total ${ruleOutput.total_carbs_g.toFixed(1)} g)`,
      `- Fluid: ${ruleOutput.fluid_per_hour_ml.toFixed(0)} ml/h (total ${ruleOutput.total_fluid_ml.toFixed(0)} ml)`,
      `- Sodium: ${ruleOutput.sodium_per_hour_mg.toFixed(0)} mg/h (total ${ruleOutput.total_sodium_mg.toFixed(0)} mg)`,
      "- Fueling points:",
    ]
    : [
      "Trail Lab Rule Engine 输出",
      `- 预计完赛时间: ${ruleOutput.estimated_finish_time_h.toFixed(2)} h`,
      `- 碳水: ${ruleOutput.carbs_per_hour_g.toFixed(1)} g/h（总量 ${ruleOutput.total_carbs_g.toFixed(1)} g）`,
      `- 液体: ${ruleOutput.fluid_per_hour_ml.toFixed(0)} ml/h（总量 ${ruleOutput.total_fluid_ml.toFixed(0)} ml）`,
      `- 钠: ${ruleOutput.sodium_per_hour_mg.toFixed(0)} mg/h（总量 ${ruleOutput.total_sodium_mg.toFixed(0)} mg）`,
      "- 补给点:",
    ];

  for (const point of ruleOutput.fueling_points) {
    lines.push(
      language === "en"
        ? `  km ${point.km.toFixed(1)} (~${point.time_h.toFixed(2)} h): ${point.carbs_g.toFixed(1)} g carbs, ${point.fluid_ml.toFixed(0)} ml fluid, ${point.sodium_mg.toFixed(0)} mg sodium`
        : `  km ${point.km.toFixed(1)}（约 ${point.time_h.toFixed(2)} h）: 碳水 ${point.carbs_g.toFixed(1)} g, 液体 ${point.fluid_ml.toFixed(0)} ml, 钠 ${point.sodium_mg.toFixed(0)} mg`
    );
  }

  if (ruleOutput.warnings.length) {
    lines.push(language === "en" ? "- Warnings:" : "- 警告:");
    for (const warning of ruleOutput.warnings) {
      lines.push(`  - ${warning}`);
    }
  }
  return lines.join("\n");
}

function buildPlannerPrompt(userProfile, raceProfile, ruleOutput, language) {
  const contractJson = JSON.stringify(ruleEngineOutputToContract(userProfile, raceProfile, ruleOutput), null, 2);
  if (language === "en") {
    return [
      "You are AI Planner and explainer only. Do not recompute core numbers.",
      "Use fixed Rule Engine outputs to explain and sequence fueling actions.",
      "Sport mode is trail running only.",
      `User ability score: ${userProfile.ability_score}`,
      `User fatigue risk: ${userProfile.fatigue_risk}`,
      `Route distance: ${raceProfile.distance_km} km, ascent: ${raceProfile.ascent_m} m`,
      `Aid stations (km): ${JSON.stringify(raceProfile.aid_stations_km)}`,
      `Supplemental points (km): ${JSON.stringify(raceProfile.supplemental_points_km)}`,
      `Rule estimated finish time (h): ${ruleOutput.estimated_finish_time_h}`,
      `Rule carbs/hour: ${ruleOutput.carbs_per_hour_g}`,
      `Rule fluid/hour (ml): ${ruleOutput.fluid_per_hour_ml}`,
      `Rule sodium/hour (mg): ${ruleOutput.sodium_per_hour_mg}`,
      `Fueling points: ${JSON.stringify(ruleOutput.fueling_points)}`,
      `Warnings: ${JSON.stringify(ruleOutput.warnings)}`,
      `Rule contract JSON:\n${contractJson}`,
      TEXT.en.noExtraNumbers,
      TEXT.en.plannerInstruction,
    ].join("\n");
  }

  return [
    "你是 AI Planner，只负责规划与解释，不重新计算规则引擎数值。",
    "请严格基于 Rule Engine 固定结果安排补给时间点并解释原因。",
    "运动模式仅为越野跑。",
    `用户能力分: ${userProfile.ability_score}`,
    `用户疲劳风险: ${userProfile.fatigue_risk}`,
    `线路距离: ${raceProfile.distance_km} km，爬升: ${raceProfile.ascent_m} m`,
    `CP/补给站 (km): ${JSON.stringify(raceProfile.aid_stations_km)}`,
    `补充补给点 (km): ${JSON.stringify(raceProfile.supplemental_points_km)}`,
    `规则引擎完赛时间(h): ${ruleOutput.estimated_finish_time_h}`,
    `规则引擎碳水(g/h): ${ruleOutput.carbs_per_hour_g}`,
    `规则引擎液体(ml/h): ${ruleOutput.fluid_per_hour_ml}`,
    `规则引擎钠(mg/h): ${ruleOutput.sodium_per_hour_mg}`,
    `补给点清单: ${JSON.stringify(ruleOutput.fueling_points)}`,
    `警告: ${JSON.stringify(ruleOutput.warnings)}`,
    `规则契约 JSON:\n${contractJson}`,
    TEXT.zh.noExtraNumbers,
    TEXT.zh.plannerInstruction,
  ].join("\n");
}

async function callAIPlanner({ provider, model, apiKey, temperature, language, prompt }) {
  if (provider === "mock") {
    return language === "en" ? TEXT.en.mockResponse : TEXT.zh.mockResponse;
  }
  if (!apiKey) {
    throw new Error(t("providerNeedsApiKey"));
  }

  if (provider === "openai" || provider === "deepseek") {
    const base = provider === "openai" ? "https://api.openai.com/v1" : "https://api.deepseek.com/v1";
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature,
        max_tokens: 4096,
      }),
    });
    if (!response.ok) {
      throw new Error(tf("aiApiFailed", { status: response.status, statusText: response.statusText }));
    }
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error(t("aiApiEmpty"));
    }
    return String(text).trim();
  }

  if (provider === "gemini") {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature, maxOutputTokens: 4096 },
      }),
    });
    if (!response.ok) {
      throw new Error(tf("geminiApiFailed", { status: response.status, statusText: response.statusText }));
    }
    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((part) => part.text || "").join("\n").trim();
    if (!text) {
      throw new Error(t("geminiEmpty"));
    }
    return text;
  }

  throw new Error(tf("unsupportedProvider", { provider }));
}

const activitySummaryFields = [
  { key: "totalDuration", label: { zh: "总耗时", en: "Total duration" } },
  { key: "totalDistance", label: { zh: "总距离", en: "Total distance" } },
  { key: "totalAscent", label: { zh: "总爬升", en: "Total ascent" } },
  { key: "totalDescent", label: { zh: "总下降", en: "Total descent" } },
  { key: "avgHeartRate", label: { zh: "平均心率", en: "Average heart rate" } },
  { key: "sportType", label: { zh: "运动类型", en: "Sport type" } },
];

const userProfileFields = [
  { key: "height", label: { zh: "身高 (m)", en: "Height (m)" }, type: "text", help: { zh: "设备画像值，可改。", en: "Device profile value. Editable." }, placeholder: "optionalPlaceholder" },
  { key: "weight", label: { zh: "体重 (kg)", en: "Weight (kg)" }, type: "text", help: { zh: "最终规则引擎会优先使用这里的体重。", en: "The rule engine will prioritize this weight." }, placeholder: "optionalPlaceholder" },
  {
    key: "gender",
    label: { zh: "性别", en: "Gender" },
    type: "select",
    options: [
      { value: "", label: { zh: "请选择", en: "Select" } },
      { value: "female", label: { zh: "女", en: "Female" } },
      { value: "male", label: { zh: "男", en: "Male" } },
      { value: "nonbinary", label: { zh: "非二元", en: "Non-binary" } },
    ],
  },
  { key: "restingHeartRate", label: { zh: "静息心率 (bpm)", en: "Resting HR (bpm)" }, type: "text", placeholder: "optionalPlaceholder" },
  { key: "physiologicalMaxHr", label: { zh: "physiological_max_hr / 生物最大心率 (bpm)", en: "physiological_max_hr / physiological max HR (bpm)" }, type: "number", step: "1", help: { zh: "设备读取值，可改。", en: "Device-read value. Editable." }, placeholder: "optionalPlaceholder" },
  { key: "hrv", label: { zh: "HRV", en: "HRV" }, type: "number", step: "0.1", placeholder: "optionalPlaceholder" },
  {
    key: "hrvStatus",
    label: { zh: "HRV 状态", en: "HRV status" },
    type: "select",
    options: [
      { value: "", label: { zh: "请选择", en: "Select" } },
      { value: "low", label: { zh: "低", en: "Low" } },
      { value: "normal", label: { zh: "正常", en: "Normal" } },
      { value: "good", label: { zh: "良好", en: "Good" } },
    ],
  },
  { key: "heartRateZones", label: { zh: "设备心率区间 (bpm)", en: "Device HR zones (bpm)" }, type: "textarea", placeholder: "optionalPlaceholder" },
  { key: "itraPoints", label: { zh: "ITRA 积分 (pts)", en: "ITRA points (pts)" }, type: "number", step: "1", placeholder: "optionalPlaceholder" },
  { key: "utmbPoints", label: { zh: "UTMB 积分 (pts)", en: "UTMB points (pts)" }, type: "number", step: "1", placeholder: "optionalPlaceholder" },
];

const raceProfileFields = [
  { key: "distanceKm", label: { zh: "距离 (km)", en: "Distance (km)" }, type: "number", step: "0.1", placeholder: "optionalPlaceholder" },
  { key: "ascentM", label: { zh: "爬升 (m)", en: "Ascent (m)" }, type: "number", step: "1", placeholder: "optionalPlaceholder" },
  { key: "cpKm", label: { zh: "CP 点位 (km，逗号分隔)", en: "CP points (km, comma separated)" }, type: "text", placeholder: "raceCpPlaceholder" },
  { key: "segmentGain", label: { zh: "分段爬升 (distance:ascent)", en: "Segment climbs (distance:ascent)" }, type: "text", placeholder: "raceSegmentPlaceholder" },
  { key: "climbTriggerM", label: { zh: "爬升触发阈值 (m)", en: "Climb trigger threshold (m)" }, type: "number", step: "10", placeholder: "optionalPlaceholder" },
  { key: "maxIntervalMin", label: { zh: "最大补给间隔 (min)", en: "Max fuel interval (min)" }, type: "number", step: "1", placeholder: "optionalPlaceholder" },
  { key: "weatherTemp", label: { zh: "预计温度 (°C)", en: "Expected temperature (°C)" }, type: "number", step: "0.1", placeholder: "optionalPlaceholder" },
  { key: "humidity", label: { zh: "预计湿度 (%)", en: "Expected humidity (%)" }, type: "number", step: "1", placeholder: "optionalPlaceholder" },
  { key: "locationNotes", label: { zh: "线路备注", en: "Route notes" }, type: "textarea", placeholder: "raceNotesPlaceholder" },
];

function renderEditor(container, fields, values) {
  container.innerHTML = fields.map((field) => {
    const value = values?.[field.key] ?? "";
    const enabled = values?.__enabled?.[field.key] ?? hasMeaningfulValue(value);
    const placeholder = escapeAttr(field.placeholder ? t(field.placeholder) : t("optionalPlaceholder"));
    const label = escapeHtml(typeof field.label === "object" ? field.label[state.language] : field.label);
    const help = typeof field.help === "object" ? field.help[state.language] : field.help;
    const escapedHelp = help ? escapeHtml(help) : "";
    const fieldKeyAttr = escapeAttr(field.key);
    const fieldTypeAttr = escapeAttr(field.type || "text");
    const stepAttr = escapeAttr(field.step || "any");
    const rawValue = String(value);
    const valueText = escapeHtml(rawValue);
    const valueAttr = escapeAttr(rawValue);
    if (field.type === "textarea") {
      return `
        <label class="field-row">
          <span class="field-topline"><input data-enabled-field="${fieldKeyAttr}" type="checkbox" ${enabled ? "checked" : ""} /> <span>${label}</span></span>
          <textarea data-field="${fieldKeyAttr}" placeholder="${placeholder}">${valueText}</textarea>
          ${escapedHelp ? `<span class="field-help">${escapedHelp}</span>` : ""}
        </label>`;
    }
    if (field.type === "select") {
      const renderedOptions = field.options.map((option) => {
        if (typeof option === "string") {
          const optionLabel = escapeHtml(option || t("defaultSelectOption"));
          const optionValue = escapeAttr(option);
          return `<option value="${optionValue}" ${String(value) === option ? "selected" : ""}>${optionLabel}</option>`;
        }
        const display = escapeHtml(typeof option.label === "object" ? option.label[state.language] : option.label);
        const optionValue = escapeAttr(option.value);
        return `<option value="${optionValue}" ${String(value) === option.value ? "selected" : ""}>${display}</option>`;
      }).join("");
      return `
        <label class="field-row">
          <span class="field-topline"><input data-enabled-field="${fieldKeyAttr}" type="checkbox" ${enabled ? "checked" : ""} /> <span>${label}</span></span>
          <select data-field="${fieldKeyAttr}">
            ${renderedOptions}
          </select>
          ${escapedHelp ? `<span class="field-help">${escapedHelp}</span>` : ""}
        </label>`;
    }
    return `
      <label class="field-row">
        <span class="field-topline"><input data-enabled-field="${fieldKeyAttr}" type="checkbox" ${enabled ? "checked" : ""} /> <span>${label}</span></span>
        <input data-field="${fieldKeyAttr}" type="${fieldTypeAttr}" value="${valueAttr}" step="${stepAttr}" placeholder="${placeholder}" />
        ${escapedHelp ? `<span class="field-help">${escapedHelp}</span>` : ""}
      </label>`;
  }).join("");
}

function renderActivitySummaryPreview(values) {
  renderKvPreview(ui.activitySummaryEditor, activitySummaryFields.map((field) => {
    const label = typeof field.label === "object" ? field.label[state.language] : field.label;
    return [label, values?.[field.key] || "-"];
  }));
}

function formatGenderLabel(value) {
  if (value === "female") {
    return state.language === "en" ? "Female" : "女";
  }
  if (value === "male") {
    return state.language === "en" ? "Male" : "男";
  }
  if (value === "nonbinary") {
    return state.language === "en" ? "Non-binary" : "非二元";
  }
  return state.language === "en" ? "Unknown" : "未设置";
}

function refreshProfileStage(values = null) {
  if (!ui.profileSilhouette) {
    return;
  }
  const profile = values || state.userProfileForm || {};
  const gender = String(profile.gender || "").toLowerCase();
  const silhouette = ui.profileSilhouette;
  silhouette.classList.remove("is-female", "is-male", "is-nonbinary");
  if (gender === "female") {
    silhouette.classList.add("is-female");
  } else if (gender === "male") {
    silhouette.classList.add("is-male");
  } else if (gender === "nonbinary") {
    silhouette.classList.add("is-nonbinary");
  }

  const genderPrefix = state.language === "en" ? "Gender" : "性别";
  const weightPrefix = state.language === "en" ? "Weight" : "体重";
  const hrPrefix = state.language === "en" ? "MaxHR" : "最大心率";
  const weightValue = profile.weight ? `${profile.weight} kg` : "-";
  const hrValue = profile.physiologicalMaxHr ? `${profile.physiologicalMaxHr} bpm` : "-";

  ui.profileGenderTag.textContent = `${genderPrefix} ${formatGenderLabel(gender)}`;
  ui.profileWeightTag.textContent = `${weightPrefix} ${weightValue}`;
  ui.profileHrTag.textContent = `${hrPrefix} ${hrValue}`;
}

function readEditorValues(container, fields) {
  const values = { __enabled: {} };
  for (const field of fields) {
    const el = container.querySelector(`[data-field="${field.key}"]`);
    const enabledEl = container.querySelector(`[data-enabled-field="${field.key}"]`);
    const rawValue = el ? el.value.trim() : "";
    const enabled = Boolean(enabledEl?.checked) && rawValue !== "";
    values.__enabled[field.key] = enabled;
    values[field.key] = enabled ? rawValue : "";
  }
  return values;
}

function showPanel(panel) {
  panel.classList.remove("is-hidden");
}

function hidePanel(panel) {
  panel.classList.add("is-hidden");
}

function hideAllStepPanels() {
  [ui.step1Panel, ui.step2Panel, ui.step3Panel, ui.step4Panel, ui.step5Panel].forEach((panel) => {
    panel.classList.add("is-hidden");
  });
}

function showOnlyStep(panel, doScroll = true) {
  hideAllStepPanels();
  showPanel(panel);
  if (doScroll) {
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function setRaceMode(mode) {
  state.raceMode = mode;
  ui.raceFitBlock.classList.toggle("is-hidden", mode !== "fit");
  ui.raceModeToggle.querySelectorAll(".chip").forEach((chip) => {
    chip.classList.toggle("is-active", chip.dataset.mode === mode);
  });
}

function renderKvPreview(container, entries) {
  container.innerHTML = entries.map(([key, value]) => `
    <div class="kv-item">
      <span class="kv-key">${escapeHtml(key)}</span>
      <span class="kv-value">${escapeHtml(value)}</span>
    </div>`).join("");
}

function setLegendItem(id, dotClass, text) {
  const el = document.getElementById(id);
  el.textContent = "";
  const dot = document.createElement("i");
  dot.className = `dot ${dotClass}`;
  el.appendChild(dot);
  el.append(text);
}

function buildProfileFromActivityForm() {
  return { ...readEditorValues(ui.userProfileEditor, userProfileFields) };
}

function buildRaceProfileFromEditor() {
  return { ...readEditorValues(ui.raceProfileEditor, raceProfileFields) };
}

function buildSimulatedElevation(raceProfile) {
  const points = [{ km: 0, altitude: 1200 }];
  let currentKm = 0;
  let currentAltitude = 1200;
  for (const [segmentDistance, segmentAscent] of raceProfile.climb_segments) {
    const climbEndKm = currentKm + segmentDistance * 0.62;
    const peakAltitude = currentAltitude + segmentAscent;
    const endKm = currentKm + segmentDistance;
    const endAltitude = Math.max(peakAltitude - segmentAscent * 0.78, 880);
    points.push({ km: Number(climbEndKm.toFixed(2)), altitude: Number(peakAltitude.toFixed(1)) });
    points.push({ km: Number(endKm.toFixed(2)), altitude: Number(endAltitude.toFixed(1)) });
    currentKm = endKm;
    currentAltitude = endAltitude;
  }
  if (points[points.length - 1].km < raceProfile.distance_km) {
    points.push({ km: raceProfile.distance_km, altitude: currentAltitude });
  }
  return points;
}

function buildRoutePointsFromDecoded(decoded, fallbackDistanceKm) {
  if (!decoded?.record_mesgs?.length) {
    return null;
  }

  const rawPoints = decoded.record_mesgs
    .map((record) => ({
      km: safeFloat(record.distance) !== null ? safeFloat(record.distance) / 1000 : null,
      altitude: firstField(record, "enhanced_altitude", "altitude"),
    }))
    .filter((point) => point.km !== null && point.altitude !== null);

  if (rawPoints.length < 2) {
    return null;
  }

  const maxKm = rawPoints[rawPoints.length - 1].km || fallbackDistanceKm || 1;
  const targetDistance = fallbackDistanceKm || maxKm;
  const scale = maxKm > 0 ? targetDistance / maxKm : 1;

  const sampled = [];
  const step = Math.max(Math.floor(rawPoints.length / 160), 1);
  for (let i = 0; i < rawPoints.length; i += step) {
    const point = rawPoints[i];
    sampled.push({
      km: Number((point.km * scale).toFixed(2)),
      altitude: Number(point.altitude.toFixed(1)),
    });
  }
  const last = rawPoints[rawPoints.length - 1];
  const lastKm = Number((last.km * scale).toFixed(2));
  if (!sampled.length || sampled[sampled.length - 1].km !== lastKm) {
    sampled.push({ km: lastKm, altitude: Number(last.altitude.toFixed(1)) });
  }
  return sampled;
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

function renderRouteOverview(raceProfile) {
  const engine = new TrailLabRuleEngine();
  const climbPoints = engine.buildClimbTriggerPoints(raceProfile, raceProfile.climb_trigger_m);
  const fitRoutePoints = buildRoutePointsFromDecoded(state.decodedRace, raceProfile.distance_km);
  const pathPoints = fitRoutePoints || buildSimulatedElevation(raceProfile);
  const width = 920;
  const height = 280;
  const padding = 32;
  const minAlt = Math.min(...pathPoints.map((point) => point.altitude));
  const maxAlt = Math.max(...pathPoints.map((point) => point.altitude));
  const altRange = Math.max(maxAlt - minAlt, 1);
  const xForKm = (km) => padding + (km / Math.max(raceProfile.distance_km, 1)) * (width - padding * 2);
  const yForAlt = (altitude) => height - padding - ((altitude - minAlt) / altRange) * (height - padding * 2);
  const polyline = pathPoints.map((point) => `${xForKm(point.km).toFixed(1)},${yForAlt(point.altitude).toFixed(1)}`).join(" ");
  const xTicks = 5;
  const yTicks = 4;

  const renderMarkers = (points, color) => points.map((point) => {
    const y = interpolateAltitude(pathPoints, point);
    return `<circle cx="${xForKm(point).toFixed(1)}" cy="${yForAlt(y).toFixed(1)}" r="5" fill="${color}" />`;
  }).join("");

  const renderXTicks = Array.from({ length: xTicks + 1 }, (_, index) => {
    const km = (raceProfile.distance_km / xTicks) * index;
    const x = xForKm(km);
    return `
      <line x1="${x.toFixed(1)}" y1="${height - padding}" x2="${x.toFixed(1)}" y2="${height - padding + 6}" stroke="#c9b9aa" stroke-width="1" />
      <text x="${x.toFixed(1)}" y="${height - padding + 20}" text-anchor="middle" font-size="11">${km.toFixed(1)}</text>`;
  }).join("");

  const renderYTicks = Array.from({ length: yTicks + 1 }, (_, index) => {
    const altitude = minAlt + ((altRange / yTicks) * index);
    const y = yForAlt(altitude);
    return `
      <line x1="${padding - 6}" y1="${y.toFixed(1)}" x2="${padding}" y2="${y.toFixed(1)}" stroke="#c9b9aa" stroke-width="1" />
      <text x="${padding - 10}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="11">${altitude.toFixed(0)}</text>`;
  }).join("");

  ui.routeOverview.innerHTML = `
    <div class="chart-wrap">
      <div class="chart-meta">
        <span class="pill">${t("routeDistance")} ${raceProfile.distance_km.toFixed(1)} km</span>
        <span class="pill">${t("routeAscent")} ${raceProfile.ascent_m.toFixed(0)} m</span>
        <span class="pill">${t("routeCp")} ${raceProfile.aid_stations_km.length}</span>
        <span class="pill">${t("routeSupplemental")} ${raceProfile.supplemental_points_km.length}</span>
        <span class="pill">${t("routeSource")} ${fitRoutePoints ? t("routeSourceFit") : t("routeSourceSimulated")}</span>
      </div>
      <svg viewBox="0 0 ${width} ${height}" width="100%" height="320" role="img" aria-label="${t("chartAriaLabel")}">
        <rect x="0" y="0" width="${width}" height="${height}" fill="transparent"></rect>
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#d7c5b2" stroke-width="1" />
        <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#d7c5b2" stroke-width="1" />
        ${renderXTicks}
        ${renderYTicks}
        <polyline fill="none" stroke="#8c2f12" stroke-width="3" points="${polyline}" />
        ${renderMarkers(raceProfile.aid_stations_km, "#225ea8")}
        ${renderMarkers(raceProfile.supplemental_points_km, "#c06014")}
        ${renderMarkers(climbPoints, "#a01f44")}
        <text x="${padding}" y="${padding - 8}" font-size="12">${t("axisElevation")}</text>
        <text x="${width - padding - 36}" y="${height - 8}" font-size="12">${t("axisDistance")}</text>
      </svg>
    </div>`;
}

const ui = {
  fitFile: document.getElementById("fitFile"),
  fitFileTrigger: document.getElementById("fitFileTrigger"),
  fitFileName: document.getElementById("fitFileName"),
  confirmStep1Btn: document.getElementById("confirmStep1Btn"),
  confirmStep2Btn: document.getElementById("confirmStep2Btn"),
  confirmStep3Btn: document.getElementById("confirmStep3Btn"),
  confirmStep4Btn: document.getElementById("confirmStep4Btn"),
  parseRaceFitBtn: document.getElementById("parseRaceFitBtn"),
  raceFitFileTrigger: document.getElementById("raceFitFileTrigger"),
  raceFitFileName: document.getElementById("raceFitFileName"),
  runBtn: document.getElementById("runBtn"),
  raceFitFile: document.getElementById("raceFitFile"),
  topLanguage: document.getElementById("topLanguage"),
  provider: document.getElementById("provider"),
  model: document.getElementById("model"),
  apiKey: document.getElementById("apiKey"),
  temperature: document.getElementById("temperature"),
  status: document.getElementById("status"),
  step1Panel: document.getElementById("step1Panel"),
  step2Panel: document.getElementById("step2Panel"),
  step3Panel: document.getElementById("step3Panel"),
  step4Panel: document.getElementById("step4Panel"),
  step5Panel: document.getElementById("step5Panel"),
  backStep2Btn: document.getElementById("backStep2Btn"),
  backStep3Btn: document.getElementById("backStep3Btn"),
  backStep4Btn: document.getElementById("backStep4Btn"),
  backStep5Btn: document.getElementById("backStep5Btn"),
  activitySummaryEditor: document.getElementById("activitySummaryEditor"),
  userProfileEditor: document.getElementById("userProfileEditor"),
  profileSilhouette: document.getElementById("profileSilhouette"),
  profileGenderTag: document.getElementById("profileGenderTag"),
  profileWeightTag: document.getElementById("profileWeightTag"),
  profileHrTag: document.getElementById("profileHrTag"),
  raceProfileEditor: document.getElementById("raceProfileEditor"),
  raceModeToggle: document.getElementById("raceModeToggle"),
  raceFitBlock: document.getElementById("raceFitBlock"),
  raceFitPreview: document.getElementById("raceFitPreview"),
  routeOverview: document.getElementById("routeOverview"),
  contractOutput: document.getElementById("contractOutput"),
  engineOutput: document.getElementById("engineOutput"),
  aiOutput: document.getElementById("aiOutput"),
};

function setStatus(text) {
  ui.status.textContent = text;
}

function seedRaceEditor(values = null) {
  const defaults = values || {
    distanceKm: "30",
    ascentM: "1200",
    cpKm: "8,16,24",
    segmentGain: "6:200,8:800,10:300",
    climbTriggerM: "250",
    maxIntervalMin: "45",
    weatherTemp: "",
    humidity: "",
    locationNotes: "",
  };
  renderEditor(ui.raceProfileEditor, raceProfileFields, defaults);
}

function refreshFileNameLabel(inputEl, nameEl) {
  const file = inputEl.files?.[0];
  nameEl.textContent = file ? file.name : t("noFileChosen");
}

function refreshFilePickers() {
  ui.fitFileTrigger.textContent = t("chooseFile");
  ui.raceFitFileTrigger.textContent = t("chooseFile");
  refreshFileNameLabel(ui.fitFile, ui.fitFileName);
  refreshFileNameLabel(ui.raceFitFile, ui.raceFitFileName);
}

function applyLanguage() {
  document.documentElement.lang = state.language === "en" ? "en" : "zh-CN";
  document.title = t("pageTitle");
  document.getElementById("languageSwitcherLabel").textContent = t("languageSwitcherLabel");
  document.getElementById("heroTitle").textContent = t("heroTitle");
  document.getElementById("heroTagline").textContent = t("heroTagline");
  document.getElementById("heroSubtitle").textContent = t("heroSubtitle");
  document.getElementById("labIntro").textContent = t("labIntro");
  document.getElementById("stepBadge1").textContent = t("stepBadge1");
  document.getElementById("stepBadge2").textContent = t("stepBadge2");
  document.getElementById("stepBadge3").textContent = t("stepBadge3");
  document.getElementById("stepBadge4").textContent = t("stepBadge4");
  document.getElementById("stepBadge5").textContent = t("stepBadge5");
  document.getElementById("step1Title").textContent = t("step1Title");
  document.getElementById("stepHint1").textContent = t("stepHint1");
  document.getElementById("step1Callout").textContent = t("step1Callout");
  document.getElementById("activityFitLabel").textContent = t("activityFitLabel");
  document.getElementById("confirmStep1Btn").textContent = t("confirmStep1");
  document.getElementById("step2Title").textContent = t("step2Title");
  document.getElementById("stepHint2").textContent = t("stepHint2");
  document.getElementById("step2Note").textContent = t("step2Note");
  document.getElementById("activitySummaryTitle").textContent = t("activitySummaryTitle");
  document.getElementById("userProfileTitle").textContent = t("userProfileTitle");
  document.getElementById("confirmStep2Btn").textContent = t("confirmStep2");
  document.getElementById("backStep2Btn").textContent = t("backStep");
  document.getElementById("step3Title").textContent = t("step3Title");
  document.getElementById("stepHint3").textContent = t("stepHint3");
  document.getElementById("raceModeManualBtn").textContent = t("raceModeManual");
  document.getElementById("raceModeFitBtn").textContent = t("raceModeFit");
  document.getElementById("raceFitBlockTitle").textContent = t("raceFitBlockTitle");
  document.getElementById("raceFitLabel").textContent = t("raceFitLabel");
  document.getElementById("parseRaceFitBtn").textContent = t("parseRaceFit");
  document.getElementById("raceParamsTitle").textContent = t("raceParamsTitle");
  document.getElementById("confirmStep3Btn").textContent = t("confirmStep3");
  document.getElementById("backStep3Btn").textContent = t("backStep");
  document.getElementById("step4Title").textContent = t("step4Title");
  document.getElementById("stepHint4").textContent = t("stepHint4");
  document.getElementById("step4Note").textContent = t("step4Note");
  setLegendItem("legendLine", "line", t("legendLine"));
  setLegendItem("legendCp", "cp", t("legendCp"));
  setLegendItem("legendSupplemental", "supplemental", t("legendSupplemental"));
  setLegendItem("legendClimb", "climb", t("legendClimb"));
  document.getElementById("confirmStep4Btn").textContent = t("confirmStep4");
  document.getElementById("backStep4Btn").textContent = t("backStep");
  document.getElementById("step5Title").textContent = t("step5Title");
  document.getElementById("stepHint5").textContent = t("stepHint5");
  document.getElementById("aiPlannerTitle").textContent = t("aiPlannerTitle");
  document.getElementById("providerLabel").textContent = t("providerLabel");
  document.getElementById("modelLabel").textContent = t("modelLabel");
  document.getElementById("apiKeyLabel").textContent = t("apiKeyLabel");
  document.getElementById("temperatureLabel").textContent = t("temperatureLabel");
  ui.apiKey.placeholder = t("apiKeyPlaceholder");
  document.getElementById("aiPlannerNote").textContent = t("aiPlannerNote");
  document.getElementById("runBtn").textContent = t("runBtn");
  document.getElementById("backStep5Btn").textContent = t("backStep");
  document.getElementById("contractOutputTitle").textContent = t("contractOutputTitle");
  document.getElementById("engineOutputTitle").textContent = t("engineOutputTitle");
  document.getElementById("aiOutputTitle").textContent = t("aiOutputTitle");

  refreshFilePickers();

  if (state.activitySummaryForm) {
    renderActivitySummaryPreview(state.activitySummaryForm);
  }
  if (state.userProfileForm) {
    renderEditor(ui.userProfileEditor, userProfileFields, state.userProfileForm);
    refreshProfileStage(state.userProfileForm);
  }
  if (state.raceProfileForm) {
    renderEditor(ui.raceProfileEditor, raceProfileFields, state.raceProfileForm);
  } else {
    seedRaceEditor();
  }
  if (state.routeRaceProfile) {
    renderRouteOverview(state.routeRaceProfile);
  }
}

ui.confirmStep1Btn.addEventListener("click", async () => {
  try {
    const file = ui.fitFile.files?.[0];
    if (!file) {
      throw new Error(t("statusUploadOwnFit"));
    }
    ui.confirmStep1Btn.disabled = true;
    setStatus(t("statusParsingActivity"));
    state.decodedActivity = await decodeFitMessages(await file.arrayBuffer());
    const overview = buildActivityOverview(state.decodedActivity);
    if (!overview.userProfile.hrvStatus && overview.userProfile.hrv) {
      overview.userProfile.hrvStatus = getHrvStatus(overview.userProfile.hrv);
    }
    state.activitySummaryForm = overview.activitySummary;
    state.userProfileForm = overview.userProfile;
    renderActivitySummaryPreview(state.activitySummaryForm);
    renderEditor(ui.userProfileEditor, userProfileFields, state.userProfileForm);
    refreshProfileStage(state.userProfileForm);
    showOnlyStep(ui.step2Panel);
    seedRaceEditor();
    setStatus(t("statusActivityReady"));
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error));
  } finally {
    ui.confirmStep1Btn.disabled = false;
  }
});

ui.fitFileTrigger.addEventListener("click", () => {
  ui.fitFile.click();
});

ui.fitFile.addEventListener("change", () => {
  refreshFileNameLabel(ui.fitFile, ui.fitFileName);
});

ui.confirmStep2Btn.addEventListener("click", () => {
  state.userProfileForm = readEditorValues(ui.userProfileEditor, userProfileFields);
  if (!state.userProfileForm.hrvStatus && state.userProfileForm.hrv) {
    state.userProfileForm.hrvStatus = getHrvStatus(state.userProfileForm.hrv);
    renderEditor(ui.userProfileEditor, userProfileFields, state.userProfileForm);
  }
  refreshProfileStage(state.userProfileForm);
  showOnlyStep(ui.step3Panel);
  setStatus(t("statusConfirmRace"));
});

ui.userProfileEditor.addEventListener("input", () => {
  refreshProfileStage(readEditorValues(ui.userProfileEditor, userProfileFields));
});

ui.userProfileEditor.addEventListener("change", () => {
  refreshProfileStage(readEditorValues(ui.userProfileEditor, userProfileFields));
});

ui.backStep2Btn.addEventListener("click", () => {
  showOnlyStep(ui.step1Panel);
});

ui.raceModeToggle.addEventListener("click", (event) => {
  const button = event.target.closest("[data-mode]");
  if (!button) {
    return;
  }
  setRaceMode(button.dataset.mode);
  if (!ui.step4Panel.classList.contains("is-hidden") || !ui.step5Panel.classList.contains("is-hidden")) {
    showOnlyStep(ui.step3Panel);
    hidePanel(ui.step4Panel);
    hidePanel(ui.step5Panel);
  }
  ui.routeOverview.innerHTML = "";
  ui.contractOutput.textContent = "";
  ui.engineOutput.textContent = "";
  ui.aiOutput.textContent = "";
});

ui.backStep3Btn.addEventListener("click", () => {
  showOnlyStep(ui.step2Panel);
});

ui.parseRaceFitBtn.addEventListener("click", async () => {
  try {
    const file = ui.raceFitFile.files?.[0];
    if (!file) {
      throw new Error(t("statusSelectRaceFit"));
    }
    setStatus(t("statusParsingRace"));
    state.decodedRace = await decodeFitMessages(await file.arrayBuffer());
    const session = state.decodedRace.session_mesgs[0] || {};
    const values = {
      ...buildRaceProfileFromEditor(),
      distanceKm: firstField(session, "total_distance") !== null ? (firstField(session, "total_distance") / 1000).toFixed(2) : "",
      ascentM: firstField(session, "total_ascent") !== null ? firstField(session, "total_ascent").toFixed(0) : "",
    };
    renderKvPreview(ui.raceFitPreview, [
      [t("kvTotalDistance"), values.distanceKm ? `${values.distanceKm} km` : ""],
      [t("kvTotalAscent"), values.ascentM ? `${values.ascentM} m` : ""],
      [t("kvSportType"), String(session.sport_profile_name || session.sub_sport || session.sport || "")],
    ]);
    state.raceProfileForm = values;
    renderEditor(ui.raceProfileEditor, raceProfileFields, values);
    setStatus(t("statusRaceReady"));
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error));
  }
});

ui.raceFitFileTrigger.addEventListener("click", () => {
  ui.raceFitFile.click();
});

ui.raceFitFile.addEventListener("change", () => {
  refreshFileNameLabel(ui.raceFitFile, ui.raceFitFileName);
});

ui.confirmStep3Btn.addEventListener("click", () => {
  state.raceProfileForm = buildRaceProfileFromEditor();
  const raceProfile = new RaceProfileBuilder().build(state.raceProfileForm);
  state.routeRaceProfile = raceProfile;
  hidePanel(ui.step5Panel);
  ui.contractOutput.textContent = "";
  ui.engineOutput.textContent = "";
  ui.aiOutput.textContent = "";
  renderRouteOverview(raceProfile);
  showOnlyStep(ui.step4Panel);
  setStatus(t("statusRouteReady"));
});

ui.backStep4Btn.addEventListener("click", () => {
  showOnlyStep(ui.step3Panel);
});

ui.confirmStep4Btn.addEventListener("click", () => {
  showOnlyStep(ui.step5Panel);
  setStatus(t("statusReadyEngine"));
});

ui.backStep5Btn.addEventListener("click", () => {
  showOnlyStep(ui.step4Panel);
});

ui.runBtn.addEventListener("click", async () => {
  try {
    if (!state.decodedActivity) {
      throw new Error(t("statusNeedActivity"));
    }
    ui.runBtn.disabled = true;
    ui.contractOutput.textContent = "";
    ui.engineOutput.textContent = "";
    ui.aiOutput.textContent = "";

    const userProfileInput = buildProfileFromActivityForm();
    const raceProfileInput = buildRaceProfileFromEditor();
    const userProfile = new UserProfileBuilder().build(state.decodedActivity, userProfileInput);
    const raceProfile = new RaceProfileBuilder().build(raceProfileInput);
    state.raceProfileForm = raceProfileInput;
    state.routeRaceProfile = raceProfile;
    const weightKg = safeFloat(userProfileInput.weight) || 70;
    const ruleOutput = new TrailLabRuleEngine().compute(userProfile, raceProfile, weightKg);
    const contract = ruleEngineOutputToContract(userProfile, raceProfile, ruleOutput);
    const language = state.language;

    ui.contractOutput.textContent = JSON.stringify(contract, null, 2);
    ui.engineOutput.textContent = renderRuleEngineOutput(ruleOutput, language);

    setStatus(t("statusEngineDone"));
    const aiText = await callAIPlanner({
      provider: ui.provider.value,
      model: ui.model.value.trim(),
      apiKey: ui.apiKey.value.trim(),
      temperature: safeFloat(ui.temperature.value) || 0.6,
      language,
      prompt: buildPlannerPrompt(userProfile, raceProfile, ruleOutput, language),
    });

    ui.aiOutput.textContent = aiText;
    setStatus(t("statusAllDone"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ui.aiOutput.textContent = `${t("errorPrefix")}: ${message}`;
    setStatus(`${t("statusFailed")}: ${message}`);
  } finally {
    ui.runBtn.disabled = false;
  }
});

ui.topLanguage.addEventListener("change", () => {
  state.language = ui.topLanguage.value === "en" ? "en" : "zh";
  applyLanguage();
});

setRaceMode("manual");
seedRaceEditor();
applyLanguage();
showOnlyStep(ui.step1Panel, false); // 初始进入不滚动，保留介绍信息
refreshProfileStage();
