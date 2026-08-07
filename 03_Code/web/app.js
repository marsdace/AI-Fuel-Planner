let garminSdkPromise = null;

const state = {
  decodedActivity: null,
  decodedRace: null,
  activitySummaryForm: null,
  userProfileForm: null,
  raceMode: "manual",
  raceProfileForm: null,
  routeRaceProfile: null,
  manualUserProfile: false,
  language: "zh",
};

const TEXT = {
  zh: {
    pageTitle: "Trail Lab · AI Fuel Planner",
    languageSwitcherLabel: "语言 / Language",
    heroTitle: "越野跑AI补给规划工具",
    heroTagline: "上传历史运动文件，设定目标运动路线，自动计算补给节奏与分段建议",
    heroSubtitle: "五步完成补给规划-解析历史运动记录、校准用户能力画像、设定线路信息、确认线路信息、生成规则与 AI 解释。",
    labIntro: "Trail Lab · 山野实验室 — 用科技探索山野，让户外更有趣、更高效、更安全。",
    stepBadge1: "步骤 1",
    stepBadge2: "步骤 2",
    stepBadge3: "步骤 3",
    stepBadge4: "步骤 4",
    stepBadge5: "步骤 5",
    step1Title: "上传你的历史运动文件",
    stepHint1: "本步将生成：历史运动原始数据与可解析状态，用于后续用户画像推导。",
    step1Callout: "提醒上传自己的历史运动文件",
    activityFitLabel: "选择历史运动文件",
    chooseFile: "选择文件",
    noFileChosen: "未选择文件",
    confirmStep1: "确认并解析",
    manualProfileBtn: "手动填写用户信息",
    step2Title: "确认历史运动概括与用户能力画像",
    stepHint2: "本步将生成：可编辑用户能力画像，用于规则引擎能力评估与风险判断。",
    step2Note: "提醒：以下显示内容均为运动设备自带信息，如信息不适用，请手动去掉信息或更改。",
    activitySummaryTitle: "历史运动概括",
    userProfileTitle: "用户能力画像",
    backStep: "返回上一步",
    confirmStep2: "确认活动信息",
    step3Title: "目标路线参数 (Trail Only)",
    stepHint3: "本步将生成：目标路线画像（距离、爬升、CP 与触发参数）。",
    raceModeManual: "手动填写",
    raceModeFit: "读取目标运动文件",
    raceFitBlockTitle: "读取目标运动文件",
    raceFitLabel: "选择目标运动文件",
    parseRaceFit: "读取目标运动文件",
    raceParamsTitle: "路线参数",
    confirmStep3: "确认路线参数",
    step4Title: "路线、海拔、补给点概况图",
    stepHint4: "本步将生成：路线海拔轮廓与补给点分布，帮助你直观确认线路结构。",
    step4NoteFit: "基于目标运动文件的真实海拔轨迹绘制；补给点来自步骤 3 确认的官方补给点。",
    step4NoteSim: "基于步骤 3 确认的路线参数模拟生成（爬坡起点默认海拔 0）；补给点来自步骤 3 确认的官方补给点。",
    legendLine: "路线海拔轮廓",
    legendCp: "CP / 补给站",
    legendClimbSeg: "爬坡路段",
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
    routeSource: "路线来源",
    routeSourceFit: "目标运动文件",
    routeSourceSimulated: "模拟",
    axisElevation: "海拔 (m)",
    axisDistance: "距离 (km)",
    statusUploadOwnFit: "请先上传自己的历史运动文件，或选择手动填写。",
    statusParsingActivity: "解析历史运动文件中...",
    statusActivityReady: "历史运动文件已解析，请确认历史运动概括和用户能力画像。",
    statusConfirmRace: "请确认目标路线参数，可手动填写或读取目标运动文件。",
    statusSelectRaceFit: "请先选择目标运动文件。",
    statusParsingRace: "读取目标运动文件中...",
    statusRaceReady: "目标运动文件已读取，可继续补充 CP、坡段和天气参数。",
    statusRouteReady: "路线、海拔与补给点概况已生成，请确认。",
    raceCpDistanceInvalid: "官方补给点的“所在距离”必须大于 0，且列表从上到下需依次递增。",
    raceClimbRangeInvalid: "爬坡路段的“爬升起点”必须小于“爬升终点”。",
    raceClimbOrderInvalid: "爬坡路段必须从上到下依次排列且不重叠（每段起点需 ≥ 上一段终点）。",
    raceCpExceedsDistance: "官方补给点的“所在距离”不能超过路线总距离。",
    raceClimbExceedsDistance: "爬坡路段的“终点”不能超过路线总距离。",
    raceClimbExceedsAscent: "爬坡路段的“爬升高度”合计不能超过路线总爬升。",
    raceCpExceedsAscent: "官方补给点的“区间爬升”合计不能超过路线总爬升。",
    statusReadyEngine: "可以开始运行 Trail Lab Rule Engine 与 AI Planner。",
    statusNeedActivity: "请先上传历史运动文件，或选择手动填写用户信息。",
    statusManualProfile: "未上传历史运动文件，已切换为手动填写用户能力画像。",
    kvHistoricalFile: "历史运动文件",
    manualSummaryNoFile: "未上传（手动填写）",
    statusEngineDone: "规则引擎完成，正在生成 AI 解释...",
    statusAllDone: "全部完成。",
    statusFailed: "失败",
    errorPrefix: "错误",
    sdkLoadFailed: "Garmin FIT SDK 加载失败。请优先使用本地静态服务器打开当前页面，而不是直接双击 HTML。原始错误:",
    decodeInvalidMessages: "Garmin FIT SDK 解码失败：未返回有效消息字典。",
    decodeFatal: "Garmin FIT SDK 解码异常：{error}",
    noExtraNumbers: "除非明确标注为假设，否则不得输出契约 JSON 之外的新数值。",
    plannerInstruction: "请输出可执行时间轴清单（跑前/跑中/跑后），并给出每个阶段简要解释。",
    mockResponse: "[Mock response] 请在实际环境中配置 AI API Key 并选择模型。",
    activitySummaryReadonlyHint: "历史运动概括直接来自当前历史运动文件，仅展示，不参与勾选或编辑。",
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
    heroTagline: "Upload your historical activity file, set your target route, and automatically get fueling rhythm plus segment suggestions.",
    heroSubtitle: "Finish fueling planning in five steps: parse activity history, calibrate your ability profile, set route info, confirm route info, then generate rules and an AI explanation.",
    labIntro: "Trail Lab · 山野实验室 — Explore the wilderness with technology—making the outdoors more fun, efficient, and safe.",
    stepBadge1: "Step 1",
    stepBadge2: "Step 2",
    stepBadge3: "Step 3",
    stepBadge4: "Step 4",
    stepBadge5: "Step 5",
    step1Title: "Upload Your Historical Activity File",
    stepHint1: "This step generates: raw historical-activity data and readiness for profile extraction.",
    step1Callout: "Reminder: upload your own historical activity file",
    activityFitLabel: "Choose historical activity file",
    chooseFile: "Choose file",
    noFileChosen: "No file chosen",
    confirmStep1: "Confirm and parse",
    manualProfileBtn: "Fill in profile manually",
    step2Title: "Review Historical Activity Summary and User Profile",
    stepHint2: "This step generates: editable user profile for rule-engine ability and risk scoring.",
    step2Note: "Reminder: the following values come from device data. If any item does not apply, remove it or edit it manually.",
    activitySummaryTitle: "Historical Activity Summary",
    userProfileTitle: "User Profile",
    backStep: "Back",
    confirmStep2: "Confirm activity info",
    step3Title: "Target Route Parameters (Trail Only)",
    stepHint3: "This step generates: route profile (distance, ascent, CP and trigger parameters).",
    raceModeManual: "Manual input",
    raceModeFit: "Read target activity file",
    raceFitBlockTitle: "Read target activity file",
    raceFitLabel: "Choose target activity file",
    parseRaceFit: "Read target activity file",
    raceParamsTitle: "Route parameters",
    confirmStep3: "Confirm route parameters",
    step4Title: "Route, Elevation, and Fuel Point Overview",
    stepHint4: "This step generates: route elevation profile and fuel-point layout for visual confirmation.",
    step4NoteFit: "Drawn from the real elevation track of the target activity file; aid stations come from the official CPs confirmed in step 3.",
    step4NoteSim: "Simulated from the route parameters confirmed in step 3 (climb starts default to 0 m); aid stations come from the official CPs confirmed in step 3.",
    legendLine: "Route elevation profile",
    legendCp: "CP / aid station",
    legendClimbSeg: "Climb segments",
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
    routeSource: "Route source",
    routeSourceFit: "Target activity file",
    routeSourceSimulated: "Simulated",
    axisElevation: "Elevation (m)",
    axisDistance: "Distance (km)",
    statusUploadOwnFit: "Please upload your historical activity file, or choose manual entry.",
    statusParsingActivity: "Parsing historical activity file...",
    statusActivityReady: "Historical activity file parsed. Review the historical activity summary and user profile.",
    statusConfirmRace: "Review route parameters. You can fill them manually or read a target activity file.",
    statusSelectRaceFit: "Please choose a target activity file first.",
    statusParsingRace: "Reading target activity file...",
    statusRaceReady: "Target activity file loaded. You can continue editing CP, segments, and weather.",
    statusRouteReady: "Route, elevation, and fuel point overview generated. Please review it.",
    raceCpDistanceInvalid: "Aid-station distances must be greater than 0 and increase from top to bottom.",
    raceClimbRangeInvalid: "Climb segment start must be less than its end.",
    raceClimbOrderInvalid: "Climb segments must be ordered top-to-bottom and not overlap (each start ≥ previous end).",
    raceCpExceedsDistance: "Aid-station distance must not exceed the route's total distance.",
    raceClimbExceedsDistance: "Climb segment end must not exceed the route's total distance.",
    raceClimbExceedsAscent: "Climb segment heights must not exceed the route's total ascent.",
    raceCpExceedsAscent: "Aid-station segment climbs must not exceed the route's total ascent.",
    statusReadyEngine: "You can now run the Trail Lab Rule Engine and AI Planner.",
    statusNeedActivity: "Please upload a historical activity file, or choose to fill in your profile manually.",
    statusManualProfile: "No historical activity file uploaded. Switched to manual profile entry.",
    kvHistoricalFile: "Historical activity file",
    manualSummaryNoFile: "Not uploaded (manual entry)",
    statusEngineDone: "Rule engine done. Generating AI explanation...",
    statusAllDone: "All done.",
    statusFailed: "Failed",
    errorPrefix: "Error",
    sdkLoadFailed: "Garmin FIT SDK failed to load. Use a local static server instead of opening the HTML file directly. Original error:",
    decodeInvalidMessages: "Garmin FIT SDK decode failed: no valid message map returned.",
    decodeFatal: "Garmin FIT SDK decode exception: {error}",
    noExtraNumbers: "Do not output any number outside the contract JSON unless clearly marked as an assumption.",
    plannerInstruction: "Output an actionable timeline checklist (pre-run / during-run / post-run) with brief explanations.",
    mockResponse: "[Mock response] Please configure an AI API key and choose a real model in production.",
    activitySummaryReadonlyHint: "Historical activity summary comes directly from the current historical activity file. It is display-only and not editable.",
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
  const session = decoded?.session_mesgs?.[0] || {};
  const lap = decoded?.lap_mesgs?.[0] || {};
  const records = sortedRecords((decoded?.record_mesgs || []).filter((record) => record && record.timestamp));
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

const HR_ZONE_NAMES = [
  { zh: "恢复区", en: "Very Light" },
  { zh: "有氧基础区", en: "Aerobic" },
  { zh: "节奏区", en: "Tempo" },
  { zh: "乳酸阈值区", en: "Threshold" },
  { zh: "无氧冲刺区", en: "Very Hard" },
];

// 将设备区间边界转换为 5 个区间（每行 "下限-上限"，供逐区上下限编辑框使用）。
// 设备若含 6 个边界（新固件常含一个极低强度区间），去掉第一个，保留 5 个。
function stringifyHrBoundaries(boundaries) {
  if (!Array.isArray(boundaries) || boundaries.length === 0) {
    return "";
  }
  const highs = [];
  for (let index = 0; index < boundaries.length; index += 1) {
    const upper = safeFloat(boundaries[index]);
    if (upper !== null) {
      highs.push(Math.round(upper));
    }
  }
  const dropFirst = highs.length >= 6;
  const kept = dropFirst ? highs.slice(1, 1 + HR_ZONE_NAMES.length) : highs.slice(0, HR_ZONE_NAMES.length);
  const lines = [];
  let lower = dropFirst ? highs[0] + 1 : 0;
  for (let index = 0; index < kept.length; index += 1) {
    const upper = kept[index];
    lines.push(`${lower}-${upper}`);
    lower = upper + 1;
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

    // 官方补给点列表（JSON）：名称 / 距离 / 关门时间 / 区间爬升 / 区间下降
    let cpList = [];
    try {
      const parsed = JSON.parse(input.officialCp || "[]");
      if (Array.isArray(parsed)) cpList = parsed;
    } catch (error) {
      cpList = [];
    }
    const validCps = cpList
      .map((cp) => ({ ...cp, distance: safeFloat(cp.distance) }))
      .filter((cp) => cp.distance !== null && cp.distance > 0);

    // 补给站里程 = 各 CP 距离
    let aidStations = [...new Set(validCps.map((cp) => Number(cp.distance.toFixed(2))))]
      .filter((km) => km > 0 && km < distanceKm)
      .sort((a, b) => a - b);

    // 爬坡路段列表（JSON）：爬升起点/终点位置（距起点相对距离 km）
    let climbList = [];
    try {
      const parsed = JSON.parse(input.climbSegments || "[]");
      if (Array.isArray(parsed)) climbList = parsed;
    } catch (error) {
      climbList = [];
    }
    const validClimbs = climbList
      .map((seg) => ({ start: safeFloat(seg.start), end: safeFloat(seg.end), height: safeFloat(seg.height) }))
      .filter((seg) => seg.start !== null && seg.end !== null && seg.end > seg.start);
    const hasClimbHeights = validClimbs.some((seg) => seg.height !== null && seg.height > 0);

    // 爬坡分段：优先用爬坡路段（起点/终点）；若填写了“爬升高度”则直接使用，否则将总爬升按爬坡距离比例分配；平坦段爬升为 0
    const climbSegments = [];
    if (validClimbs.length) {
      const climbTotalDist = validClimbs.reduce((sum, seg) => sum + (seg.end - seg.start), 0);
      let prevKm = 0;
      for (const seg of validClimbs) {
        if (seg.start > prevKm) {
          climbSegments.push([Number((seg.start - prevKm).toFixed(2)), 0]);
        }
        const segDist = seg.end - seg.start;
        const segAscent = hasClimbHeights
          ? Number(seg.height || 0)
          : Number((ascentM * (segDist / climbTotalDist)).toFixed(1));
        climbSegments.push([Number(segDist.toFixed(2)), segAscent]);
        prevKm = seg.end;
      }
      if (prevKm < distanceKm) {
        climbSegments.push([Number((distanceKm - prevKm).toFixed(2)), 0]);
      }
    }

    // 爬坡分段只来源于“爬坡路段”；补给点信息仅用于图中标记，不作为绘制海拔曲线的依据
    const manualSegments = climbSegments.length ? climbSegments : parseClimbSegments(input.segmentGain || "");
    // 若爬坡路段填了明确的“爬升高度”，直接采用（不再按总爬升缩放）；否则标准化到总爬升/总距离
    const segments = hasClimbHeights ? manualSegments : this.normalizeSegments(distanceKm, ascentM, manualSegments);

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

    if (!aidStations.length) {
      aidStations = [distanceKm * 0.25, distanceKm * 0.5, distanceKm * 0.75]
        .filter((value) => value > 0 && value < distanceKm)
        .map((value) => Number(value.toFixed(1)));
    }
    aidStations = [...new Set(aidStations)].sort((a, b) => a - b);

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
      expected_finish_time_h: safeFloat(input.expectedFinishH),
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
    if (raceProfile.expected_finish_time_h && raceProfile.expected_finish_time_h > 0) {
      finishTimeH = raceProfile.expected_finish_time_h;
    }
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
  { key: "height", label: { zh: "身高 (m)", en: "Height (m)" }, type: "number", step: "0.01", min: 0, placeholder: "optionalPlaceholder" },
  { key: "weight", label: { zh: "体重 (kg)", en: "Weight (kg)" }, type: "number", step: "0.1", min: 0, placeholder: "optionalPlaceholder" },
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
  { key: "restingHeartRate", label: { zh: "静息心率 (bpm)", en: "Resting HR (bpm)" }, type: "number", step: "1", min: 0, placeholder: "optionalPlaceholder" },
  { key: "hrv", label: { zh: "HRV", en: "HRV" }, type: "number", step: "0.1", min: 0, placeholder: "optionalPlaceholder" },
  { key: "physiologicalMaxHr", label: { zh: "生物最大心率 (bpm)", en: "physiological max HR (bpm)" }, type: "number", step: "1", min: 0, placeholder: "optionalPlaceholder" },
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
  { key: "heartRateZones", label: { zh: "心率区间 (bpm)", en: "HR zones (bpm)" }, type: "hrzones", help: { zh: "按 5 区划分：恢复区 / 有氧基础区 / 节奏区 / 乳酸阈值区 / 无氧冲刺区。每格填写该区间上限 (bpm)。", en: "5 zones: Very Light / Aerobic / Tempo / Threshold / Very Hard. Enter each zone's upper bound (bpm)." } },
  { key: "itraPoints", label: { zh: "ITRA 积分 (pts)", en: "ITRA points (pts)" }, type: "number", step: "1", min: 0, placeholder: "optionalPlaceholder" },
  { key: "utmbPoints", label: { zh: "UTMB 积分 (pts)", en: "UTMB points (pts)" }, type: "number", step: "1", min: 0, placeholder: "optionalPlaceholder" },
];

const CP_OFFICIAL_COLUMNS = [
  { key: "name", label: { zh: "名称", en: "Name" }, type: "text", flex: 1.3 },
  { key: "distance", label: { zh: "所在距离 (km)", en: "Distance (km)" }, type: "number", step: "0.1", min: 0, flex: 0.55 },
  { key: "cutoff", label: { zh: "关门时间", en: "Cutoff" }, type: "time", flex: 0.9 },
  { key: "climb", label: { zh: "区间爬升 (m)", en: "Climb (m)" }, type: "number", step: "1", min: 0, flex: 0.7 },
  { key: "descent", label: { zh: "区间下降 (m)", en: "Descent (m)" }, type: "number", step: "1", min: 0, flex: 0.7 },
];
const CP_CLIMB_COLUMNS = [
  { key: "start", label: { zh: "爬升起点 (km)", en: "Climb start (km)" }, type: "number", step: "0.1", min: 0, flex: 1 },
  { key: "end", label: { zh: "爬升终点 (km)", en: "Climb end (km)" }, type: "number", step: "0.1", min: 0, flex: 1 },
  { key: "height", label: { zh: "爬升高度 (m)", en: "Climb height (m)" }, type: "number", step: "1", min: 0, flex: 0.8 },
];

const raceProfileFields = [
  // 左列：基础路线参数
  { key: "distanceKm", label: { zh: "距离 (km)", en: "Distance (km)" }, type: "number", step: "0.1", min: 0, placeholder: "optionalPlaceholder" },
  { key: "ascentM", label: { zh: "总爬升 (m)", en: "Total ascent (m)" }, type: "number", step: "1", min: 0, placeholder: "optionalPlaceholder" },
  { key: "expectedFinishH", label: { zh: "期望完赛时间 (h)", en: "Expected finish time (h)" }, type: "number", step: "0.1", min: 0, placeholder: "optionalPlaceholder" },
  { key: "weatherTemp", label: { zh: "预计温度 (°C)", en: "Expected temperature (°C)" }, type: "number", step: "0.1", placeholder: "optionalPlaceholder" },
  { key: "humidity", label: { zh: "预计湿度 (%)", en: "Expected humidity (%)" }, type: "number", step: "1", min: 0, max: 100, placeholder: "optionalPlaceholder" },
  { key: "locationNotes", label: { zh: "线路备注", en: "Route notes" }, type: "textarea", placeholder: "raceNotesPlaceholder" },
  // 右列：官方补给点 + 爬坡路段（位置均为距起点相对距离，提示统一在“!”悬浮中）
  { key: "officialCp", label: { zh: "官方补给点", en: "Official aid stations" }, type: "cplist", columns: CP_OFFICIAL_COLUMNS, addLabel: { zh: "新增补给点", en: "Add aid station" }, help: { zh: "FIT 有 CP 点会自动导入；也可手动新增。位置为距起点相对距离 (km)，每站可填名称、所在距离、关门时间、区间爬升与下降。列表从上到下需按距离递增排列。注意：补给点信息仅用于图中标记，不作为绘制海拔曲线的依据（不依据累计爬升/下降绘制图形）。", en: "CP points are auto-imported from FIT; add more manually. Position = relative distance (km) from the start. Each station: name, distance, cutoff, segment climb and descent. Rows must be ordered by increasing distance from top to bottom. Note: aid-station info is only used as chart markers and does not affect the elevation curve (the curve is not drawn from cumulative ascent/descent)." } },
  { key: "climbSegments", label: { zh: "爬坡路段", en: "Climb segments" }, type: "cplist", columns: CP_CLIMB_COLUMNS, addLabel: { zh: "新增爬坡路段", en: "Add climb segment" }, help: { zh: "读取目标运动文件后会自动生成爬坡路段，可手动修改。记录每个爬坡路段的爬升起点、爬升终点（距起点相对距离，km）与爬升高度 (m)。列表从上到下需依次排列且不重叠。", en: "Climb segments are auto-generated after reading a target activity file; you can edit them manually. Record each climb segment's start, end (relative distance in km from the start) and climb height (m). Rows must be ordered top-to-bottom and must not overlap." } },
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
    const minAttr = field.min !== undefined ? escapeAttr(String(field.min)) : "";
    const maxAttr = field.max !== undefined ? escapeAttr(String(field.max)) : "";
    const rawValue = String(value);
    const valueText = escapeHtml(rawValue);
    const valueAttr = escapeAttr(rawValue);
    if (field.type === "cplist") {
      const columns = Array.isArray(field.columns) ? field.columns : [];
      const colLabel = (col) => (typeof col.label === "object" ? col.label[state.language] : col.label);
      const colType = (col) => col.type || "text";
      const gridTemplate = `${columns.map((col) => `${col.flex || 1}fr`).join(" ")} 26px`;
      let cpItems = [];
      try {
        const parsed = JSON.parse(String(value) || "[]");
        if (Array.isArray(parsed)) cpItems = parsed;
      } catch (error) {
        cpItems = [];
      }
      if (!cpItems.length) {
        const empty = {};
        columns.forEach((col) => {
          empty[col.key] = "";
        });
        cpItems = [empty];
      }
      const en = state.language === "en";
      const header = `
          <span class="cp-head" style="grid-template-columns:${gridTemplate}">${columns.map((col) => `<span>${escapeHtml(colLabel(col))}</span>`).join("")}<span></span></span>`;
      const rows = cpItems.map((cp, index) => {
        const cells = columns.map((col) => {
          const type = colType(col);
          const extra = type === "number"
            ? `step="${col.step || "any"}" min="${col.min ?? 0}" placeholder="0"`
            : type === "time" ? "" : `placeholder="${escapeHtml(colLabel(col))}"`;
          return `<input class="cp-input" data-cp-field="${fieldKeyAttr}" data-cp-index="${index}" data-cp-key="${col.key}" type="${type}" value="${escapeAttr(cp?.[col.key] ?? "")}" ${extra} />`;
        }).join("");
        return `
          <span class="cpline" style="grid-template-columns:${gridTemplate}" data-cp-index="${index}">
            ${cells}
            <button type="button" class="cp-remove" data-cp-remove="${index}" aria-label="${en ? "Remove" : "删除"}">×</button>
          </span>`;
      }).join("");
      const tooltip = typeof field.help === "object" ? field.help[state.language] : field.help;
      const tooltipAttr = tooltip ? ` data-tooltip="${escapeAttr(tooltip)}"` : "";
      const addLabel = typeof field.addLabel === "object" ? field.addLabel[state.language] : (field.addLabel || (en ? "Add" : "新增"));
      return `
        <label class="field-row" data-row-key="${fieldKeyAttr}">
          <span class="field-topline"><input data-enabled-field="${fieldKeyAttr}" type="checkbox" ${enabled ? "checked" : ""} /> <span>${label}</span><span class="field-info" tabindex="0" role="note" aria-label="${escapeAttr(tooltip || "")}"${tooltipAttr}>!</span></span>
          <span class="cplist">${header}${rows}</span>
          <button type="button" class="cp-add" data-cp-add="${fieldKeyAttr}">+ ${escapeHtml(addLabel)}</button>
        </label>`;
    }
    if (field.type === "textarea") {
      return `
        <label class="field-row" data-row-key="${fieldKeyAttr}">
          <span class="field-topline"><input data-enabled-field="${fieldKeyAttr}" type="checkbox" ${enabled ? "checked" : ""} /> <span>${label}</span></span>
          <textarea data-field="${fieldKeyAttr}" placeholder="${placeholder}">${valueText}</textarea>
          ${escapedHelp ? `<span class="field-help">${escapedHelp}</span>` : ""}
        </label>`;
    }
    if (field.type === "hrzones") {
      const zoneValues = String(value).split("\n");
      const header = `
          <span class="hrzone-head">
            <span></span>
            <span>${state.language === "en" ? "Lower" : "下限"}</span>
            <span>${state.language === "en" ? "Upper" : "上限"}</span>
          </span>`;
      const rows = HR_ZONE_NAMES.map((zoneName, index) => {
        const zoneLabel = state.language === "en" ? zoneName.en : zoneName.zh;
        const parts = (zoneValues[index] ?? "").split("-");
        const lowerVal = escapeAttr(parts[0] ?? "");
        const upperVal = escapeAttr(parts[1] ?? "");
        return `
          <span class="hrzone-line">
            <span class="hrzone-name">${escapeHtml(zoneLabel)}</span>
            <input class="hrzone-input" data-hrzone-field="${fieldKeyAttr}" data-hrzone-index="${index}" data-hrzone-bound="lower" type="number" step="1" min="0" value="${lowerVal}" placeholder="—" />
            <input class="hrzone-input" data-hrzone-field="${fieldKeyAttr}" data-hrzone-index="${index}" data-hrzone-bound="upper" type="number" step="1" min="0" value="${upperVal}" placeholder="—" />
          </span>`;
      }).join("");
      const tooltip = typeof field.help === "object" ? field.help[state.language] : field.help;
      const tooltipAttr = tooltip ? ` data-tooltip="${escapeAttr(tooltip)}"` : "";
      return `
        <label class="field-row" data-row-key="${fieldKeyAttr}">
          <span class="field-topline"><input data-enabled-field="${fieldKeyAttr}" type="checkbox" ${enabled ? "checked" : ""} /> <span>${label}</span><span class="field-info" tabindex="0" role="note" aria-label="${escapeAttr(tooltip || "")}"${tooltipAttr}>!</span></span>
          <span class="hrzone-list">${header}${rows}</span>
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
        <label class="field-row" data-row-key="${fieldKeyAttr}">
          <span class="field-topline"><input data-enabled-field="${fieldKeyAttr}" type="checkbox" ${enabled ? "checked" : ""} /> <span>${label}</span></span>
          <select data-field="${fieldKeyAttr}">
            ${renderedOptions}
          </select>
          ${escapedHelp ? `<span class="field-help">${escapedHelp}</span>` : ""}
        </label>`;
    }
    return `
      <label class="field-row" data-row-key="${fieldKeyAttr}">
        <span class="field-topline"><input data-enabled-field="${fieldKeyAttr}" type="checkbox" ${enabled ? "checked" : ""} /> <span>${label}</span></span>
        <input data-field="${fieldKeyAttr}" type="${fieldTypeAttr}" value="${valueAttr}" step="${stepAttr}" ${minAttr ? `min="${minAttr}"` : ""} ${maxAttr ? `max="${maxAttr}"` : ""} placeholder="${placeholder}" />
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
    const enabledEl = container.querySelector(`[data-enabled-field="${field.key}"]`);
    if (field.type === "hrzones") {
      const inputs = Array.from(container.querySelectorAll(`[data-hrzone-field="${field.key}"]`));
      const byIndex = new Map();
      for (const input of inputs) {
        const idx = Number(input.dataset.hrzoneIndex);
        if (!byIndex.has(idx)) byIndex.set(idx, {});
        byIndex.get(idx)[input.dataset.hrzoneBound] = input.value.trim();
      }
      const rawValue = [...byIndex.keys()]
        .sort((a, b) => a - b)
        .map((idx) => {
          const zone = byIndex.get(idx);
          const lo = zone.lower || "";
          const hi = zone.upper || "";
          return lo === "" && hi === "" ? "" : `${lo}-${hi}`;
        })
        .filter(Boolean)
        .join("\n");
      const enabled = Boolean(enabledEl?.checked) && rawValue !== "";
      values.__enabled[field.key] = enabled;
      values[field.key] = enabled ? rawValue : "";
      continue;
    }
    if (field.type === "cplist") {
      const inputs = Array.from(container.querySelectorAll(`[data-cp-field="${field.key}"]`));
      const byIndex = new Map();
      for (const input of inputs) {
        const idx = Number(input.dataset.cpIndex);
        if (!byIndex.has(idx)) byIndex.set(idx, {});
        byIndex.get(idx)[input.dataset.cpKey] = input.value.trim();
      }
      const list = [...byIndex.keys()]
        .sort((a, b) => a - b)
        .map((idx) => byIndex.get(idx));
      const rawValue = list.length ? JSON.stringify(list) : "";
      const enabled = Boolean(enabledEl?.checked) && rawValue !== "";
      values.__enabled[field.key] = enabled;
      values[field.key] = enabled ? rawValue : "";
      continue;
    }
    const el = container.querySelector(`[data-field="${field.key}"]`);
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

// 校验官方补给点与爬坡路段：位置递增且不重叠、位置不超过总距离、爬升高度合计不超过总爬升
function validateRaceProfile(form) {
  const distanceKm = Math.max(safeFloat(form.distanceKm) || 30, 1);
  const ascentM = Math.max(safeFloat(form.ascentM) || 0, 0);

  let cpList = [];
  try {
    const parsed = JSON.parse(String(form.officialCp || "[]"));
    if (Array.isArray(parsed)) cpList = parsed;
  } catch (error) {
    cpList = [];
  }
  let prevDist = -1;
  let totalCpClimb = 0;
  for (let i = 0; i < cpList.length; i++) {
    const dist = safeFloat(cpList[i].distance);
    if (dist === null) continue;
    if (dist <= 0 || dist <= prevDist) {
      return { ok: false, message: t("raceCpDistanceInvalid") };
    }
    if (dist > distanceKm) {
      return { ok: false, message: t("raceCpExceedsDistance") };
    }
    totalCpClimb += Math.max(safeFloat(cpList[i].climb) || 0, 0);
    prevDist = dist;
  }
  if (ascentM > 0 && totalCpClimb > ascentM) {
    return { ok: false, message: t("raceCpExceedsAscent") };
  }

  let climbList = [];
  try {
    const parsed = JSON.parse(String(form.climbSegments || "[]"));
    if (Array.isArray(parsed)) climbList = parsed;
  } catch (error) {
    climbList = [];
  }
  let prevEnd = -1;
  let totalHeight = 0;
  for (let i = 0; i < climbList.length; i++) {
    const start = safeFloat(climbList[i].start);
    const end = safeFloat(climbList[i].end);
    const height = safeFloat(climbList[i].height);
    if (start === null && end === null && height === null) continue;
    if (start === null || end === null || start >= end) {
      return { ok: false, message: t("raceClimbRangeInvalid") };
    }
    if (start < prevEnd) {
      return { ok: false, message: t("raceClimbOrderInvalid") };
    }
    if (end > distanceKm) {
      return { ok: false, message: t("raceClimbExceedsDistance") };
    }
    totalHeight += Math.max(height || 0, 0);
    prevEnd = end;
  }
  if (ascentM > 0 && totalHeight > ascentM) {
    return { ok: false, message: t("raceClimbExceedsAscent") };
  }

  return { ok: true };
}

function buildSimulatedElevation(raceProfile) {
  // 不读取 FIT 线路信息时，爬升点起点默认海拔为 0
  const points = [{ km: 0, altitude: 0 }];
  let currentKm = 0;
  let currentAltitude = 0;
  for (const [segmentDistance, segmentAscent] of raceProfile.climb_segments) {
    const climbEndKm = currentKm + segmentDistance * 0.62;
    const peakAltitude = currentAltitude + segmentAscent;
    const endKm = currentKm + segmentDistance;
    const endAltitude = Math.max(peakAltitude - segmentAscent * 0.78, 0);
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

// 从目标路线 FIT 的海拔记录自动提取爬坡路段（起点/终点/爬升高度），可再手动修改
function extractClimbSegmentsFromFit(decoded) {
  const records = decoded?.record_mesgs || [];
  const raw = [];
  for (const record of records) {
    const km = safeFloat(record.distance);
    const alt = firstField(record, "enhanced_altitude", "altitude");
    if (km === null || alt === null || km < 0) continue;
    raw.push({ km: km / 1000, alt });
  }
  if (raw.length < 4) return [];
  raw.sort((a, b) => a.km - b.km);

  // 平滑采样：每 ~50m 取平均海拔，降低噪声
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
  for (const point of raw) {
    const b = Math.floor(point.km / step) * step;
    if (bucket === null) bucket = b;
    if (b > bucket) flush();
    if (bucket === null) bucket = b;
    sumAlt += point.alt;
    count += 1;
  }
  flush();
  if (sampled.length < 3) return [];

  // 谷→峰检测：上升 ≥ minClimb，且峰后回落 ≥ hysteresis 记为一段爬升
  const minClimb = 30;
  const minLen = 0.2;
  const hysteresis = 15;
  const climbs = [];
  let valley = 0;
  let peak = 0;
  for (let i = 0; i < sampled.length; i += 1) {
    if (sampled[i].alt < sampled[valley].alt) valley = i;
    if (sampled[i].alt > sampled[peak].alt) peak = i;
    const isLast = i === sampled.length - 1;
    if (sampled[peak].alt - sampled[i].alt >= hysteresis || isLast) {
      const rise = sampled[peak].alt - sampled[valley].alt;
      const length = sampled[peak].km - sampled[valley].km;
      if (rise >= minClimb && length >= minLen) {
        climbs.push({
          start: Number(sampled[valley].km.toFixed(2)),
          end: Number(sampled[peak].km.toFixed(2)),
          height: Math.round(rise),
        });
      }
      valley = i;
      peak = i;
    }
  }

  // 最多保留 8 段（按高度取最大的），再按起点排序
  return climbs
    .sort((a, b) => b.height - a.height)
    .slice(0, 8)
    .sort((a, b) => a.start - b.start);
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

// 提取需要在图中标注的爬坡路段：仅当步骤三填写了爬坡路段时才标注；位置与高度取自画像（与所绘海拔一致）
function getClimbSegmentsToDraw(raceProfile) {
  let hasFormClimbs = false;
  try {
    const parsed = JSON.parse(String(state.raceProfileForm?.climbSegments || "[]"));
    hasFormClimbs = Array.isArray(parsed) && parsed.length > 0;
  } catch (error) {
    hasFormClimbs = false;
  }
  if (!hasFormClimbs) return [];
  const segments = [];
  let km = 0;
  for (const [dist, ascent] of raceProfile.climb_segments) {
    if (ascent > 0) {
      segments.push({ start: Number(km.toFixed(2)), end: Number((km + dist).toFixed(2)), height: Math.round(ascent) });
    }
    km += dist;
  }
  return segments;
}

function renderRouteOverview(raceProfile) {
  // 图表只用当前步骤三确认的信息绘制：FIT 模式下用目标运动文件真实海拔轨迹；手动模式下始终用模拟（即使之前读取过 FIT）
  const useFitRoute = state.raceMode === "fit" && Boolean(state.decodedRace);
  const fitRoutePoints = useFitRoute ? buildRoutePointsFromDecoded(state.decodedRace, raceProfile.distance_km) : null;
  const pathPoints = fitRoutePoints || buildSimulatedElevation(raceProfile);
  document.getElementById("step4Note").textContent = fitRoutePoints ? t("step4NoteFit") : t("step4NoteSim");
  const climbSegs = getClimbSegmentsToDraw(raceProfile);
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

  // 补给点信息标注：在蓝点上方显示完整信息（名称/距离/D+爬升/D-下降/关门时间），带半透明背景便于阅读
  let cpInfo = [];
  try {
    const parsed = JSON.parse(String(state.raceProfileForm?.officialCp || "[]"));
    if (Array.isArray(parsed)) cpInfo = parsed;
  } catch (error) {
    cpInfo = [];
  }
  const cjkCount = (text) => (String(text).match(/[\u4e00-\u9fff]/g) || []).length;
  const charW = 6.3;
  const padX = 7;
  const padY = 5;
  const lineH = 13;
  const lineWidth = (line) => line.length * charW + cjkCount(line) * 4.6;
  const chipLayouts = raceProfile.aid_stations_km.map((km, idx) => {
    const cp = cpInfo.find((item) => Math.abs((safeFloat(item.distance) || -1) - km) < 0.001);
    const name = cp && cp.name ? String(cp.name) : `CP${idx + 1}`;
    const climbVal = cp ? safeFloat(cp.climb) : null;
    const descentVal = cp ? safeFloat(cp.descent) : null;
    const cutoff = cp && cp.cutoff ? String(cp.cutoff).trim() : "";
    const distText = `${Math.round(km)}km`;
    const gainLine = [
      climbVal !== null && climbVal > 0 ? `D+${Math.round(climbVal)}` : "",
      descentVal !== null && descentVal > 0 ? `D-${Math.round(descentVal)}` : "",
    ].filter(Boolean).join("  ");
    const lines = [name, distText];
    if (gainLine) lines.push(gainLine);
    if (cutoff) lines.push(cutoff);
    const boxW = Math.max(...lines.map(lineWidth)) + padX * 2;
    const boxH = lines.length * lineH + padY * 2;
    const mx = xForKm(km);
    const my = yForAlt(interpolateAltitude(pathPoints, km));
    return { mx, my, x: mx - boxW / 2, w: boxW, h: boxH, lines };
  });

  // 碰撞避让：优先放标记上方，重叠则试下方，再从上方向下逐段跳到已放置盒下方，保证标记互不重叠
  const intersects = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const placedBoxes = [];
  const sortedChips = [...chipLayouts].sort((a, b) => a.mx - b.mx);
  for (const chip of sortedChips) {
    const aboveY = chip.my - 10 - chip.h;
    const belowY = chip.my + 12;
    const tryPlace = (yy) => {
      const box = { x: chip.x, y: yy, w: chip.w, h: chip.h };
      return placedBoxes.some((p) => intersects(box, p)) ? null : yy;
    };
    let y = tryPlace(aboveY);
    if (y === null) y = tryPlace(belowY);
    if (y === null) {
      y = aboveY;
      let guard = 0;
      while (guard < 300) {
        const box = { x: chip.x, y, w: chip.w, h: chip.h };
        const hit = placedBoxes.find((p) => intersects(box, p));
        if (!hit) break;
        y = hit.y + hit.h + 2;
        guard += 1;
      }
    }
    y = Math.max(y, padding + 2); // 仅限制不高于绘图区顶部，必要时允许下探被裁剪，避免重叠
    chip.y = y;
    placedBoxes.push({ x: chip.x, y: chip.y, w: chip.w, h: chip.h });
  }

  const renderCpLabels = sortedChips.map((chip) => {
    const linesSvg = chip.lines.map((line, li) => {
      const weight = li === 0 ? ' font-weight="600"' : "";
      const lineY = chip.y + padY + 11 + li * lineH;
      return `<text x="${chip.mx.toFixed(1)}" y="${lineY.toFixed(1)}" text-anchor="middle" font-size="11" fill="#a8d3ff"${weight}>${escapeHtml(line)}</text>`;
    }).join("");
    return `
      <g style="pointer-events:none">
        <rect x="${chip.x.toFixed(1)}" y="${chip.y.toFixed(1)}" width="${chip.w.toFixed(1)}" height="${chip.h.toFixed(1)}" rx="6" fill="rgba(9,22,15,0.88)" stroke="rgba(124,192,255,0.55)" stroke-width="1" />
        ${linesSvg}
      </g>`;
  }).join("");

  // 爬坡路段：半透明色带标出范围，顶部标注爬升高度
  const renderClimbBands = climbSegs.map((seg) => {
    const x1 = xForKm(seg.start);
    const x2 = xForKm(seg.end);
    const midX = (x1 + x2) / 2;
    return `
      <rect x="${x1.toFixed(1)}" y="${padding}" width="${Math.max(x2 - x1, 2).toFixed(1)}" height="${(height - padding * 2).toFixed(1)}" fill="rgba(255,79,126,0.10)" />
      <text x="${midX.toFixed(1)}" y="${padding + 14}" text-anchor="middle" font-size="11" fill="#ff6f95">↑${seg.height}m</text>`;
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
        <span class="pill">${t("routeSource")} ${fitRoutePoints ? t("routeSourceFit") : t("routeSourceSimulated")}</span>
      </div>
      <svg viewBox="0 0 ${width} ${height}" width="100%" height="320" role="img" aria-label="${t("chartAriaLabel")}">
        <rect x="0" y="0" width="${width}" height="${height}" fill="transparent"></rect>
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#d7c5b2" stroke-width="1" />
        <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#d7c5b2" stroke-width="1" />
        ${renderXTicks}
        ${renderYTicks}
        ${renderClimbBands}
        <polyline fill="none" stroke="#8c2f12" stroke-width="3" points="${polyline}" />
        ${renderMarkers(raceProfile.aid_stations_km, "#225ea8")}
        ${renderCpLabels}
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
  manualProfileBtn: document.getElementById("manualProfileBtn"),
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
  routeOverview: document.getElementById("routeOverview"),
  contractOutput: document.getElementById("contractOutput"),
  engineOutput: document.getElementById("engineOutput"),
  aiOutput: document.getElementById("aiOutput"),
};

function setStatus(text, kind) {
  ui.status.textContent = text;
  ui.status.classList.toggle("is-error", kind === "error");
}

function seedRaceEditor(values = null) {
  const defaults = values || {
    distanceKm: "30",
    ascentM: "1200",
    expectedFinishH: "",
    weatherTemp: "",
    humidity: "",
    locationNotes: "",
    officialCp: "",
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
  document.getElementById("manualProfileBtn").textContent = t("manualProfileBtn");
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
  setLegendItem("legendLine", "line", t("legendLine"));
  setLegendItem("legendCp", "cp", t("legendCp"));
  setLegendItem("legendClimbSeg", "climb", t("legendClimbSeg"));
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
    state.manualUserProfile = false;
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
    setStatus(error instanceof Error ? error.message : String(error), "error");
  } finally {
    ui.confirmStep1Btn.disabled = false;
  }
});

ui.fitFileTrigger.addEventListener("click", () => {
  ui.fitFile.click();
});

// 手动填写用户信息：跳过历史运动文件解析，直接进入步骤 2 手动填写用户能力画像
ui.manualProfileBtn.addEventListener("click", () => {
  state.manualUserProfile = true;
  state.decodedActivity = null;
  state.activitySummaryForm = null;
  state.userProfileForm = {};
  renderKvPreview(ui.activitySummaryEditor, [[t("kvHistoricalFile"), t("manualSummaryNoFile")]]);
  renderEditor(ui.userProfileEditor, userProfileFields, {});
  refreshProfileStage({});
  showOnlyStep(ui.step2Panel);
  seedRaceEditor();
  setStatus(t("statusManualProfile"));
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
    const coursePoints = state.decodedRace.course_point_mesgs || [];
    const seenCp = new Set();
    const officialCp = coursePoints
      .filter((cp) => cp && cp.distance !== undefined && cp.distance !== null)
      .map((cp) => ({
        name: String(cp.name || "CP"),
        distance: (cp.distance / 1000).toFixed(2),
        cutoff: "",
        climb: "",
        descent: "",
      }))
      .filter((cp) => {
        const key = `${cp.name}|${cp.distance}`;
        if (seenCp.has(key)) return false;
        seenCp.add(key);
        return true;
      });
    const autoClimbs = extractClimbSegmentsFromFit(state.decodedRace);
    const values = {
      distanceKm: firstField(session, "total_distance") !== null ? (firstField(session, "total_distance") / 1000).toFixed(2) : "",
      ascentM: firstField(session, "total_ascent") !== null ? firstField(session, "total_ascent").toFixed(0) : "",
      expectedFinishH: "",
      weatherTemp: "",
      humidity: "",
      locationNotes: "",
      officialCp: officialCp.length ? JSON.stringify(officialCp) : "",
      climbSegments: autoClimbs.length ? JSON.stringify(autoClimbs) : "",
    };
    state.raceProfileForm = values;
    renderEditor(ui.raceProfileEditor, raceProfileFields, values);
    setStatus(t("statusRaceReady"));
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), "error");
  }
});

ui.raceFitFileTrigger.addEventListener("click", () => {
  ui.raceFitFile.click();
});

ui.raceProfileEditor.addEventListener("click", (event) => {
  const addBtn = event.target.closest("[data-cp-add]");
  if (addBtn) {
    event.preventDefault();
    const fieldKey = addBtn.dataset.cpAdd;
    const field = raceProfileFields.find((f) => f.key === fieldKey);
    const columns = (field && field.columns) || [];
    const current = readEditorValues(ui.raceProfileEditor, raceProfileFields);
    let list = [];
    try {
      const parsed = JSON.parse(current[fieldKey] || "[]");
      if (Array.isArray(parsed)) list = parsed;
    } catch (error) {
      list = [];
    }
    const empty = {};
    columns.forEach((col) => {
      empty[col.key] = "";
    });
    list.push(empty);
    current[fieldKey] = JSON.stringify(list);
    current.__enabled = current.__enabled || {};
    current.__enabled[fieldKey] = true;
    renderEditor(ui.raceProfileEditor, raceProfileFields, current);
    return;
  }
  const removeBtn = event.target.closest("[data-cp-remove]");
  if (removeBtn) {
    event.preventDefault();
    const idx = Number(removeBtn.dataset.cpRemove);
    const fieldKey = removeBtn.closest(".field-row").dataset.rowKey;
    const current = readEditorValues(ui.raceProfileEditor, raceProfileFields);
    let list = [];
    try {
      const parsed = JSON.parse(current[fieldKey] || "[]");
      if (Array.isArray(parsed)) list = parsed;
    } catch (error) {
      list = [];
    }
    list.splice(idx, 1);
    current[fieldKey] = list.length ? JSON.stringify(list) : "";
    current.__enabled = current.__enabled || {};
    current.__enabled[fieldKey] = true;
    renderEditor(ui.raceProfileEditor, raceProfileFields, current);
    return;
  }
});

ui.raceFitFile.addEventListener("change", () => {
  refreshFileNameLabel(ui.raceFitFile, ui.raceFitFileName);
});

ui.confirmStep3Btn.addEventListener("click", () => {
  const form = buildRaceProfileFromEditor();
  const check = validateRaceProfile(form);
  if (!check.ok) {
    setStatus(check.message, "error");
    return;
  }
  state.raceProfileForm = form;
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
    if (!state.decodedActivity && !state.manualUserProfile) {
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
    setStatus(`${t("statusFailed")}: ${message}`, "error");
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
