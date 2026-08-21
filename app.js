let garminSdkPromise = null;

const state = {
  decodedActivity: null,
  decodedRace: null,
  gpxRoutePoints: null,
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
    raceFitBlockTitle: "读取目标路线 FIT/GPX 文件",
    raceFitLabel: "选择目标路线 FIT/GPX 文件",
    parseRaceFit: "读取目标路线 FIT/GPX",
    raceParamsTitle: "路线参数",
    confirmStep3: "确认路线参数",
    step4Title: "路线、海拔、补给点概况图",
    stepHint4: "本步将生成：路线海拔轮廓与补给点分布，帮助你直观确认线路结构。",
    step4NoteFit: "基于目标运动文件的真实海拔轨迹绘制；补给点来自步骤 3 确认的官方补给点。",
    step4NoteSim: "基于步骤 3 确认的路线参数模拟生成（爬坡起点默认海拔 0）；补给点来自步骤 3 确认的官方补给点。",
    legendLine: "路线海拔轮廓",
    legendCp: "CP / 补给站",
    legendClimbSeg: "爬坡路段",
    legendDescentSeg: "下降路段",
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
    downloadRoute: "下载路线概况图 (PNG)",
    downloadRouteIcon: "⬇",
    axisElevation: "海拔 (m)",
    axisDistance: "距离 (km)",
    statusUploadOwnFit: "请先上传自己的历史运动文件，或选择手动填写。",
    statusParsingActivity: "解析历史运动文件中...",
    statusActivityReady: "历史运动文件已解析，请确认历史运动概括和用户能力画像。",
    statusInvalidActivity: "文件中未找到运动记录数据：可能是路线/地图文件、非活动记录文件或文件已损坏。请上传运动手表导出的活动记录（.fit）文件。",
    statusNotRunningSport: "该文件为「{sport}」活动记录。Trail Lab 用户画像仅支持跑步类（路跑 / 越野跑 / 跑步机 / 田径），请上传跑步类活动文件，或选择手动填写画像。",
    statusUnknownSport: "无法识别该文件的运动类型。为避免画像误导，请上传跑步类活动文件，或选择手动填写画像。",
    statusSportLowConfidence: "文件未携带标准运动类型字段，已按跑步数据识别，画像置信度较低。",
    statusCrcWarning: "文件 CRC 校验未通过，文件可能损坏或导出不完整，画像结果仅供参考。",
    statusTooFewRecords: "有效运动记录点过少（{count} 条），画像精度受限；建议上传完整活动记录。",
    statusTooShort: "运动时长过短（{minutes} 分钟），画像参考价值有限。",
    statusLowHrCoverage: "心率数据覆盖不足，有氧 / 耐力类画像置信度低。",
    statusLowSpeedCoverage: "速度数据覆盖不足，配速 / VAM 类画像置信度低。",
    statusLowAltitudeCoverage: "海拔数据覆盖不足，爬升 / 下降能力画像无法可靠测算。",
    statusFileTooLarge: "文件过大（{mb} MB），请上传运动手表导出的 FIT 活动文件。",
    statusFitDecodeWarning: "FIT 解码警告：{msg}",
    statusProfileMismatch: "画像文件缺少爬升/下降能力数据（可能是平路跑文件）。完赛时间基于 ITRA 积分保守估算，置信度较低；建议上传越野跑 FIT 文件重新生成画像，可显著提高完赛时间与补给方案精度。",
    statusConfirmRace: "请确认目标路线参数，可手动填写或读取目标运动文件。",
    statusSelectRaceFit: "请先选择目标路线 FIT/GPX 文件。",
    statusParsingRace: "读取目标路线文件中...",
    statusRaceReady: "目标路线文件已读取（FIT/GPX），可继续补充 CP、坡段和天气参数。",
    statusGpxReadyWithCp: "GPX 路线已读取，识别到 {n} 个官方补给点，可继续补充坡段和天气参数。",
    statusGpxReadyNoCp: "GPX 路线已读取（未检测到航点，可手动补充官方补给点），可继续补充坡段和天气参数。",
    statusRouteReady: "路线、海拔与补给点概况已生成，请确认。",
    raceCpDistanceInvalid: "官方补给点的“所在距离”必须大于 0，且列表从上到下需依次递增。",
    raceSegRangeInvalid: "路段的“起点”必须小于“终点”。",
    raceSegOrderInvalid: "路段必须从上到下依次排列且互不重叠（每段起点需 ≥ 上一段终点）。",
    raceCpExceedsDistance: "官方补给点的“所在距离”不能超过路线总距离。",
    raceSegExceedsDistance: "路段的“终点”不能超过路线总距离。",
    raceClimbExceedsAscent: "爬升路段的“高差”合计不能超过路线总爬升。",
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
    aiApiEmpty: "AI API 返回为空（HTTP 200 但无输出内容）。常见原因：思考类模型（如 DeepSeek V4）的思考链占满 max_tokens 预算，或模型策略限制。请重试，或调大 max_tokens / 关闭思考模式。",
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
    raceFitBlockTitle: "Read target route FIT/GPX file",
    raceFitLabel: "Choose target route FIT/GPX file",
    parseRaceFit: "Read target route FIT/GPX",
    raceParamsTitle: "Route parameters",
    confirmStep3: "Confirm route parameters",
    step4Title: "Route, Elevation, and Fuel Point Overview",
    stepHint4: "This step generates: route elevation profile and fuel-point layout for visual confirmation.",
    step4NoteFit: "Drawn from the real elevation track of the target activity file; aid stations come from the official CPs confirmed in step 3.",
    step4NoteSim: "Simulated from the route parameters confirmed in step 3 (climb starts default to 0 m); aid stations come from the official CPs confirmed in step 3.",
    legendLine: "Route elevation profile",
    legendCp: "CP / aid station",
    legendClimbSeg: "Climb segments",
    legendDescentSeg: "Descent segments",
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
    downloadRoute: "Download route overview (PNG)",
    downloadRouteIcon: "⬇",
    axisElevation: "Elevation (m)",
    axisDistance: "Distance (km)",
    statusUploadOwnFit: "Please upload your historical activity file, or choose manual entry.",
    statusParsingActivity: "Parsing historical activity file...",
    statusActivityReady: "Historical activity file parsed. Review the historical activity summary and user profile.",
    statusInvalidActivity: "No activity data found in this file: it may be a course/map file, a non-activity file, or corrupted. Please upload an activity record (.fit) exported from your watch.",
    statusNotRunningSport: "This file is a \"{sport}\" activity. Trail Lab profiles support running-type activities only (road / trail / treadmill / track). Please upload a running activity file, or fill in the profile manually.",
    statusUnknownSport: "Could not identify the sport type of this file. To avoid a misleading profile, please upload a running activity file, or fill in the profile manually.",
    statusSportLowConfidence: "The file has no standard sport-type field; it was treated as running data with lower profile confidence.",
    statusCrcWarning: "File CRC check failed. The file may be corrupted or incompletely exported; results are for reference only.",
    statusTooFewRecords: "Too few usable records ({count}). Profile precision is limited; please upload a complete activity record.",
    statusTooShort: "Activity too short ({minutes} min). Limited reference value for profiling.",
    statusLowHrCoverage: "Heart-rate data coverage is low; aerobic / endurance profile confidence is reduced.",
    statusLowSpeedCoverage: "Speed data coverage is low; pace / VAM profile confidence is reduced.",
    statusLowAltitudeCoverage: "Altitude data coverage is low; climb / descent ability cannot be reliably estimated.",
    statusFileTooLarge: "File too large ({mb} MB). Please upload a FIT activity file exported from your sports watch.",
    statusFitDecodeWarning: "FIT decode warning: {msg}",
    statusProfileMismatch: "The profile file lacks climb/descent capability data (likely a flat-road file). Finish time is estimated conservatively from ITRA points with low confidence; upload a trail-run FIT file and regenerate the profile for much better finish-time and fueling accuracy.",
    statusConfirmRace: "Review route parameters. You can fill them manually or read a target activity file.",
    statusSelectRaceFit: "Please choose a target route FIT/GPX file first.",
    statusParsingRace: "Reading target route file...",
    statusRaceReady: "Target route file loaded (FIT/GPX). You can continue editing CP, segments, and weather.",
    statusGpxReadyWithCp: "GPX route loaded with {n} official aid stations detected. You can continue editing segments and weather.",
    statusGpxReadyNoCp: "GPX route loaded (no waypoints detected; add official aid stations manually). You can continue editing segments and weather.",
    statusRouteReady: "Route, elevation, and fuel point overview generated. Please review it.",
    raceCpDistanceInvalid: "Aid-station distances must be greater than 0 and increase from top to bottom.",
    raceSegRangeInvalid: "Segment start must be less than its end.",
    raceSegOrderInvalid: "Segments must be ordered top-to-bottom and must not overlap (each start ≥ previous end).",
    raceCpExceedsDistance: "Aid-station distance must not exceed the route's total distance.",
    raceSegExceedsDistance: "Segment end must not exceed the route's total distance.",
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
    aiApiEmpty: "AI API returned empty content (HTTP 200 but no output). Common cause: thinking-mode models (e.g. DeepSeek V4) spend the whole max_tokens budget on reasoning, or a model policy limit. Retry, or raise max_tokens / disable thinking mode.",
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
    fitErrors: errors && errors.length ? errors.map(String) : [],
  };
}

// ================= 运动类型（Web 版：官方 SDK 输出字符串枚举）=================
const SPORT_LABELS = {
  1: "跑步", 2: "骑行", 3: "转换", 4: "健身器械", 5: "游泳", 6: "篮球", 7: "足球",
  8: "网球", 9: "美式足球", 10: "训练", 11: "步行", 12: "越野滑雪", 13: "高山滑雪",
  14: "单板滑雪", 15: "划船", 16: "登山", 17: "徒步", 18: "多项运动", 19: "桨类运动",
  20: "飞行", 21: "电助力骑行", 22: "摩托车", 23: "船类", 24: "驾车", 25: "高尔夫",
  26: "滑翔", 27: "骑马", 28: "狩猎", 29: "钓鱼", 30: "轮滑", 31: "攀岩", 32: "帆船",
  33: "滑冰", 34: "跳伞", 35: "雪鞋行走", 36: "雪地摩托", 37: "立式桨板", 38: "冲浪",
  39: "尾波滑水", 40: "滑水", 41: "皮划艇", 42: "漂流", 43: "风帆冲浪", 44: "风筝冲浪",
  45: "战术", 46: "跳伞（军事）", 47: "拳击", 48: "爬楼", 49: "棒球", 53: "潜水",
  56: "射击", 58: "冬季运动", 59: "绞盘", 62: "HIIT", 63: "电竞", 64: "球拍类",
  65: "轮椅步行", 66: "轮椅跑步", 67: "冥想", 68: "残疾人运动", 69: "飞盘高尔夫",
  70: "团体运动", 71: "板球", 72: "橄榄球", 73: "冰球", 74: "长曲棍球", 75: "排球",
  76: "水上滑管", 77: "尾波冲浪", 78: "水上运动", 79: "射箭", 80: "综合格斗",
  81: "赛车", 82: "浮潜", 83: "舞蹈", 84: "跳绳", 85: "泳池自由潜", 86: "灵活性训练",
  87: "寻宝", 88: "独木舟", 254: "全部",
  running: "跑步", cycling: "骑行", transition: "转换", fitness_equipment: "健身器械",
  swimming: "游泳", basketball: "篮球", soccer: "足球", tennis: "网球",
  american_football: "美式足球", training: "训练", walking: "步行",
  cross_country_skiing: "越野滑雪", alpine_skiing: "高山滑雪", snowboarding: "单板滑雪",
  rowing: "划船", mountaineering: "登山", hiking: "徒步", multisport: "多项运动",
  paddling: "桨类运动", flying: "飞行", e_biking: "电助力骑行", motorcycling: "摩托车",
  boating: "船类", driving: "驾车", golf: "高尔夫", hang_gliding: "滑翔",
  horseback_riding: "骑马", hunting: "狩猎", fishing: "钓鱼", inline_skating: "轮滑",
  rock_climbing: "攀岩", sailing: "帆船", ice_skating: "滑冰", sky_diving: "跳伞",
  snowshoeing: "雪鞋行走", snowmobiling: "雪地摩托", stand_up_paddleboarding: "立式桨板",
  surfing: "冲浪", wakeboarding: "尾波滑水", water_skiing: "滑水", kayaking: "皮划艇",
  rafting: "漂流", windsurfing: "风帆冲浪", kitesurfing: "风筝冲浪", tactical: "战术",
  jumpmaster: "跳伞（军事）", boxing: "拳击", floor_climbing: "爬楼", baseball: "棒球",
  diving: "潜水", shooting: "射击", winter_sport: "冬季运动", grinding: "绞盘",
  hiit: "HIIT", video_gaming: "电竞", racket: "球拍类", wheelchair_push_walk: "轮椅步行",
  wheelchair_push_run: "轮椅跑步", meditation: "冥想", para_sport: "残疾人运动",
  disc_golf: "飞盘高尔夫", team_sport: "团体运动", cricket: "板球", rugby: "橄榄球",
  hockey: "冰球", lacrosse: "长曲棍球", volleyball: "排球", water_tubing: "水上滑管",
  wakesurfing: "尾波冲浪", water_sport: "水上运动", archery: "射箭",
  mixed_martial_arts: "综合格斗", motor_sports: "赛车", snorkeling: "浮潜", dance: "舞蹈",
  jump_rope: "跳绳", pool_apnea: "泳池自由潜", mobility: "灵活性训练", geocaching: "寻宝",
  canoeing: "独木舟", all: "全部", generic: "通用",
};
const SUBSPORT_LABELS = {
  0: "通用", 1: "跑步机", 2: "街道跑", 3: "越野跑", 4: "田径场", 5: "室内动感单车",
  6: "室内骑行", 7: "公路骑行", 8: "山地骑行", 9: "速降", 10: "躺式骑行",
  11: "越野自行车", 12: "手摇骑行", 13: "场地骑行", 14: "室内划船", 15: "椭圆机",
  16: "爬楼机", 17: "泳池游泳", 18: "开放水域", 19: "柔韧训练", 20: "力量训练",
  21: "热身", 22: "比赛", 23: "练习", 24: "挑战", 25: "室内滑雪", 26: "有氧训练",
  27: "室内步行", 28: "电助力健身", 29: "BMX", 30: "休闲步行", 31: "快走",
  32: "骑车转跑步", 33: "跑步转骑车", 34: "游泳转骑车", 35: "ATV", 36: "越野摩托",
  37: "野雪", 38: "雪场", 39: "无人机", 40: "翼装", 41: "白水", 42: "滑冰滑雪",
  43: "瑜伽", 44: "普拉提", 45: "室内跑", 46: "砾石骑行", 47: "电助力山地",
  48: "通勤骑行", 49: "混合路面", 50: "导航", 51: "Track Me", 52: "地图",
  53: "单气瓶潜水", 54: "多气瓶潜水", 55: "仪表潜水", 56: "自由潜水", 57: "渔猎潜水",
  58: "虚拟活动", 59: "障碍赛", 62: "呼吸训练", 63: "CCR 潜水", 65: "帆船赛",
  66: "探险", 67: "超马", 68: "室内攀岩", 69: "抱石", 70: "HIIT", 71: "室内绞盘",
  72: "携犬狩猎", 73: "AMRAP", 74: "EMOM", 75: "Tabata", 77: "电竞",
  78: "铁人三项", 79: "铁人两项", 80: "连项训练", 81: "游泳跑", 82: "探险赛",
  83: "卡车司机训练", 84: "匹克球", 85: "板式网球", 86: "室内轮椅步行",
  87: "室内轮椅跑步", 88: "室内手摇骑行", 90: "冰球场", 91: "冰球", 92: "极限飞盘",
  93: "平台网球", 94: "壁球", 95: "羽毛球", 96: "壁球拍", 97: "乒乓球",
  98: "陆路探险", 99: "拖钓", 110: "伞降飞行", 111: "滑翔伞", 112: "动力伞",
  113: "增压飞行", 114: "飞行导航", 115: "计时飞行", 116: "高度计", 117: "气象飞行",
  118: "目视飞行", 119: "仪表飞行", 121: "动态自由潜水", 123: "耐力骑行",
  124: "负重徒步", 125: "拉力赛", 126: "泳池铁三", 127: "电助力耐力骑行", 254: "全部",
  generic: "通用", treadmill: "跑步机", street: "街道跑", trail: "越野跑", track: "田径场",
  spin: "室内动感单车", indoor_cycling: "室内骑行", road: "公路骑行", mountain: "山地骑行",
  downhill: "速降", recumbent: "躺式骑行", cyclocross: "越野自行车", hand_cycling: "手摇骑行",
  track_cycling: "场地骑行", indoor_rowing: "室内划船", elliptical: "椭圆机",
  stair_climbing: "爬楼机", lap_swimming: "泳池游泳", open_water: "开放水域",
  flexibility_training: "柔韧训练", strength_training: "力量训练", warm_up: "热身",
  match: "比赛", exercise: "练习", challenge: "挑战", indoor_skiing: "室内滑雪",
  cardio_training: "有氧训练", indoor_walking: "室内步行", e_bike_fitness: "电助力健身",
  bmx: "BMX", casual_walking: "休闲步行", speed_walking: "快走",
  bike_to_run_transition: "骑车转跑步", run_to_bike_transition: "跑步转骑车",
  swim_to_bike_transition: "游泳转骑车", atv: "ATV", motocross: "越野摩托",
  backcountry: "野雪", resort: "雪场", rc_drone: "无人机", wingsuit: "翼装",
  whitewater: "白水", skate_skiing: "滑冰滑雪", yoga: "瑜伽", pilates: "普拉提",
  indoor_running: "室内跑", gravel_cycling: "砾石骑行", e_bike_mountain: "电助力山地",
  commuting: "通勤骑行", mixed_surface: "混合路面", navigate: "导航", track_me: "Track Me",
  map: "地图", single_gas_diving: "单气瓶潜水", multi_gas_diving: "多气瓶潜水",
  gauge_diving: "仪表潜水", apnea_diving: "自由潜水", apnea_hunting: "渔猎潜水",
  virtual_activity: "虚拟活动", obstacle: "障碍赛", breathing: "呼吸训练",
  ccr_diving: "CCR 潜水", sail_race: "帆船赛", expedition: "探险", ultra: "超马",
  indoor_climbing: "室内攀岩", bouldering: "抱石", indoor_grinding: "室内绞盘",
  hunting_with_dogs: "携犬狩猎", amrap: "AMRAP", emom: "EMOM", tabata: "Tabata",
  esport: "电竞", triathlon: "铁人三项", duathlon: "铁人两项", brick: "连项训练",
  swim_run: "游泳跑", adventure_race: "探险赛", trucker_workout: "卡车司机训练",
  pickleball: "匹克球", padel: "板式网球", indoor_wheelchair_walk: "室内轮椅步行",
  indoor_wheelchair_run: "室内轮椅跑步", indoor_hand_cycling: "室内手摇骑行",
  field: "冰球场", ice: "冰球", ultimate: "极限飞盘", platform: "平台网球",
  squash: "壁球", badminton: "羽毛球", racquetball: "壁球拍", table_tennis: "乒乓球",
  overland: "陆路探险", trolling_motor: "拖钓", fly_canopy: "伞降飞行",
  fly_paraglide: "滑翔伞", fly_paramotor: "动力伞", fly_pressurized: "增压飞行",
  fly_navigate: "飞行导航", fly_timer: "计时飞行", fly_altimeter: "高度计",
  fly_wx: "气象飞行", fly_vfr: "目视飞行", fly_ifr: "仪表飞行",
  dynamic_apnea: "动态自由潜水", enduro: "耐力骑行", rucking: "负重徒步",
  rally: "拉力赛", pool_triathlon: "泳池铁三", e_bike_enduro: "电助力耐力骑行",
};
const RUNNING_SUBSPORTS = new Set(["generic", "treadmill", "street", "trail", "track", "indoor_running", "ultra"]);
const RUNNING_NAME_HINTS = ["run", "running", "trail", "越野", "跑步", "马拉松", "marathon", "超马", "ultra", "跑步机", "treadmill", "田径", "track"];
const NON_RUNNING_NAME_HINTS = [
  "cycle", "cycling", "ride", "bike", "骑", "swim", "游泳", "ski", "滑雪", "snowboard",
  "单板", "hike", "hiking", "徒步", "walk", "步行", "row", "划船", "paddle", "桨",
  "gym", "fitness", "健身", "yoga", "瑜伽", "strength", "力量", "dance", "舞蹈",
  "climb", "攀", "hunt", "狩猎", "fish", "钓鱼", "golf", "高尔夫", "tennis", "网球",
  "soccer", "足球", "basketball", "篮球", "baseball", "棒球", "boxing", "拳击",
  "martial", "格斗", "e_bike", "电助力", "motor", "摩托", "drive", "驾驶", "驾车",
  "sail", "帆", "kayak", "皮划艇", "surf", "冲浪", "dive", "潜水", "snorkel", "浮潜",
  "meditation", "冥想", "hiit", "esport", "电竞", "video", "游戏", "rowing", "划",
  "elliptical", "椭圆机", "stair", "爬楼", "weight", "举重",
];

// Web 版运动类型分类（官方 SDK 字符串枚举；数字值也兼容）
function classifyWebSportType(decoded) {
  const session = decoded.session_mesgs[0] || {};
  const rawSport = session.sport ?? null;
  const rawSubSport = session.sub_sport ?? null;
  const name = String(session.sport_profile_name || "").trim() || String(decoded.sport_mesgs?.[0]?.name || "").trim();
  const records = (decoded.record_mesgs || []).filter((r) => r && r.timestamp);
  let recActivity = null;
  if (records.length) {
    recActivity = records[Math.floor(records.length / 2)].activity_type ?? null;
  }
  const sportKey = rawSport != null ? String(rawSport) : "";
  const subKey = rawSubSport != null ? String(rawSubSport) : "";
  const sportLabel = SPORT_LABELS[sportKey] || (rawSport != null ? String(rawSport) : "");
  const subSportLabel = SUBSPORT_LABELS[subKey] || (rawSubSport != null ? String(rawSubSport) : "");
  const label = sportLabel ? (subSportLabel && subSportLabel !== "通用" ? `${sportLabel} · ${subSportLabel}` : sportLabel) : subSportLabel;
  const isRun = (v) => v === "running" || v === "run" || v === 1;
  const hintOf = (v) => {
    const s = String(v == null ? "" : v).toLowerCase();
    if (!s) return null;
    if (RUNNING_NAME_HINTS.some((k) => s.includes(k.toLowerCase()))) return "running";
    if (NON_RUNNING_NAME_HINTS.some((k) => s.includes(k.toLowerCase()))) return "not_running";
    return null;
  };
  const hint = hintOf(name) || hintOf(recActivity);

  if (rawSport != null && isRun(rawSport)) {
    if (rawSubSport != null && !RUNNING_SUBSPORTS.has(subKey) && !RUNNING_SUBSPORTS.has(Number(subKey))) {
      return { kind: "not_running", label, sportLabel, subSportLabel, rawSport, rawSubSport, confidence: "high" };
    }
    return { kind: "running", label, sportLabel, subSportLabel, rawSport, rawSubSport, confidence: "high" };
  }
  if (rawSport != null) {
    return {
      kind: "not_running",
      label: sportLabel ? (subSportLabel && subSportLabel !== "通用" ? `${sportLabel} · ${subSportLabel}` : sportLabel) : subSportLabel || String(rawSport),
      sportLabel, subSportLabel, rawSport, rawSubSport, confidence: "high",
    };
  }
  if (rawSubSport != null) {
    if (RUNNING_SUBSPORTS.has(subKey) || RUNNING_SUBSPORTS.has(Number(subKey))) {
      return { kind: "running", label: subSportLabel, sportLabel, subSportLabel, rawSport, rawSubSport, confidence: "low" };
    }
    return { kind: "not_running", label: subSportLabel, sportLabel, subSportLabel, rawSport, rawSubSport, confidence: "low" };
  }
  if (hint === "running") {
    return { kind: "running", label: label || "跑步", sportLabel, subSportLabel, rawSport, rawSubSport, confidence: "low" };
  }
  if (hint === "not_running") {
    return { kind: "not_running", label: label || "非跑步活动", sportLabel, subSportLabel, rawSport, rawSubSport, confidence: "low" };
  }
  return { kind: "unknown", label, sportLabel, subSportLabel, rawSport, rawSubSport, confidence: "low" };
}

// Web 版活动文件校验（与小程序 validateActivityFit 规则一致）
function validateWebActivityFit(decoded, opts = {}) {
  const errors = [];
  const warnings = [];
  const sport = classifyWebSportType(decoded);
  if (sport.kind === "not_running") {
    errors.push(tf("statusNotRunningSport", { sport: sport.label || sport.sportLabel || "non-running" }));
  } else if (sport.kind === "unknown") {
    errors.push(t("statusUnknownSport"));
  } else if (sport.kind === "running" && sport.confidence === "low") {
    warnings.push(t("statusSportLowConfidence"));
  }
  (decoded.fitErrors || []).forEach((msg) => {
    if (/crc/i.test(msg)) warnings.push(t("statusCrcWarning"));
    else warnings.push(tf("statusFitDecodeWarning", { msg }));
  });

  const session = decoded.session_mesgs[0] || {};
  const hasSessionData =
    safeFloat(session.total_timer_time ?? session.total_elapsed_time) != null ||
    safeFloat(session.total_distance) != null;
  const records = (decoded.record_mesgs || []).filter((r) => r && r.timestamp);
  const usableRecords = records.filter(
    (record) =>
      safeFloat(record.heart_rate) != null ||
      safeFloat(record.enhanced_speed ?? record.speed) != null ||
      safeFloat(record.distance) != null
  ).length;
  if (!hasSessionData && usableRecords < 30) {
    errors.push(t("statusInvalidActivity"));
  }

  const durationH = (safeFloat(session.total_timer_time ?? session.total_elapsed_time) || 0) / 3600;
  if (records.length < 60) warnings.push(tf("statusTooFewRecords", { count: records.length }));
  if (durationH > 0 && durationH < 0.25) warnings.push(tf("statusTooShort", { minutes: Math.round(durationH * 60) }));
  const total = Math.max(records.length, 1);
  const hrN = records.filter((r) => safeFloat(r.heart_rate) != null).length;
  const spdN = records.filter((r) => safeFloat(r.enhanced_speed ?? r.speed) != null).length;
  const altN = records.filter((r) => safeFloat(r.enhanced_altitude ?? r.altitude) != null).length;
  if (records.length && hrN / total < 0.5) warnings.push(t("statusLowHrCoverage"));
  if (records.length && spdN / total < 0.5) warnings.push(t("statusLowSpeedCoverage"));
  if (records.length && altN / total < 0.5) warnings.push(t("statusLowAltitudeCoverage"));

  const sizeMB = opts.fileSizeBytes ? opts.fileSizeBytes / 1024 / 1024 : 0;
  if (sizeMB > 200) errors.push(tf("statusFileTooLarge", { mb: sizeMB.toFixed(0) }));

  return { ok: errors.length === 0, errors, warnings, sport };
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

  const avgTemperature = firstField(session, "avg_temperature");
  if (avgTemperature !== null) {
    metrics.环境数据.温度 = avgTemperature;
  } else {
    unavailable.push("环境数据: 温度");
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
  const sportInfo = classifyWebSportType(decoded);

  return {
    activitySummary: {
      totalDuration: formatDuration(firstField(session, "total_timer_time", "total_elapsed_time")),
      totalDistance: formatDistanceMeters(firstField(session, "total_distance")),
      totalAscent: firstField(session, "total_ascent") !== null ? `${firstField(session, "total_ascent").toFixed(0)} m` : "",
      totalDescent: firstField(session, "total_descent") !== null ? `${firstField(session, "total_descent").toFixed(0)} m` : "",
      avgHeartRate: firstField(session, "avg_heart_rate") !== null ? `${firstField(session, "avg_heart_rate").toFixed(0)} bpm` : "",
      sportType: sportInfo.label || String(session.sport_profile_name || ""),
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

const ENGINE_VERSION = "2.0.0";

// HRV 状态五档 → fatigue_risk（PRD §4.1 映射表）
const HRV_TO_FATIGUE = {
  balanced: "low",
  unbalanced: "medium",
  low: "high",
  poor: "severe",
  no_status: "medium",
  "": "medium",
};

// 平路配速 → 速度子分（min/km 越小越高；8.5 min/km ≈ 5 分，6 min/km ≈ 95 分）
function flatPaceScore(flatPaceMinKm) {
  if (flatPaceMinKm == null) return null;
  return clamp((8.5 - flatPaceMinKm) / 2.5 * 100, 5, 95);
}

// 速度能力子分：爬升/下坡/平路/耐力（ITRA 代理）四维，缺失维度按权重归一化（2026-08-21）
function buildSpeedAbility(terrain, itraPoints) {
  const dims = [];
  if (terrain && terrain.climbVamMh != null) dims.push({ v: clamp(terrain.climbVamMh / 10, 5, 95), w: 0.25 });
  if (terrain && terrain.descentVamMh != null) dims.push({ v: clamp(terrain.descentVamMh / 14, 5, 95), w: 0.2 });
  if (terrain && terrain.flatPaceMinKm != null) {
    const fs = flatPaceScore(terrain.flatPaceMinKm);
    if (fs != null) dims.push({ v: fs, w: 0.3 });
  }
  const itra = safeFloat(itraPoints);
  if (itra != null) dims.push({ v: clamp(itra / 10, 5, 95), w: 0.25 });
  if (!dims.length) return null;
  const totalW = dims.reduce((sum, d) => sum + d.w, 0);
  return Math.round((dims.reduce((sum, d) => sum + d.v * d.w, 0) / totalW) * 10) / 10;
}

// 信号 A · 速度能力提取（Trail Lab Engine v2.0 §4.1）
// 200m 距离分桶分类爬升/平路/下降；
// VAM 分子分母口径一致（bin 净海拔变化 ÷ bin 用时），并设最低样本门槛，
// 避免小爬升/短促片段把 VAM、配速放大到荒谬值。
function classifyTerrainSpeed(records) {
  if (records.length < 2) return null;
  const BIN_METERS = 200;
  const CLIMB_GRADIENT = 0.02;
  const DESCENT_GRADIENT = -0.02;
  const MIN_CLIMB_SECONDS = 300;
  const MIN_CLIMB_METERS = 30;
  const MIN_FLAT_KM = 2;
  const MIN_FLAT_SECONDS = 600;
  const bins = new Map();
  for (const record of records) {
    const d = firstField(record, "distance");
    const alt = firstField(record, "enhanced_altitude", "altitude");
    const ts = record.timestamp ? new Date(record.timestamp).getTime() : null;
    if (d === null || alt === null || ts === null) continue;
    const key = Math.floor(d / BIN_METERS);
    let bin = bins.get(key);
    if (!bin) {
      bin = { first: null, last: null };
      bins.set(key, bin);
    }
    if (!bin.first || d < bin.first.d) bin.first = { d, alt, ts };
    if (!bin.last || d > bin.last.d) bin.last = { d, alt, ts };
  }
  let climbSeconds = 0;
  let descentSeconds = 0;
  let flatKm = 0;
  let flatSeconds = 0;
  let binClimbM = 0;
  let binDescentM = 0;
  for (const bin of bins.values()) {
    if (!bin.first || !bin.last) continue;
    const dDist = bin.last.d - bin.first.d;
    const dt = (bin.last.ts - bin.first.ts) / 1000;
    if (dDist <= 0 || dt <= 0) continue;
    const dAlt = bin.last.alt - bin.first.alt;
    const gradient = dAlt / dDist;
    if (gradient >= CLIMB_GRADIENT) {
      climbSeconds += dt;
      binClimbM += Math.max(dAlt, 0);
    } else if (gradient <= DESCENT_GRADIENT) {
      descentSeconds += dt;
      binDescentM += Math.max(-dAlt, 0);
    } else {
      flatKm += dDist / 1000;
      flatSeconds += dt;
    }
  }
  const result = {};
  if (climbSeconds >= MIN_CLIMB_SECONDS && binClimbM >= MIN_CLIMB_METERS) {
    result.climbVamMh = Number((binClimbM / (climbSeconds / 3600)).toFixed(0));
  }
  if (descentSeconds >= MIN_CLIMB_SECONDS && binDescentM >= MIN_CLIMB_METERS) {
    result.descentVamMh = Number((binDescentM / (descentSeconds / 3600)).toFixed(0));
  }
  if (flatKm >= MIN_FLAT_KM && flatSeconds >= MIN_FLAT_SECONDS) {
    result.flatPaceMinKm = Number((flatSeconds / 60 / flatKm).toFixed(2));
  }
  result.samples = {
    climb: result.climbVamMh != null,
    descent: result.descentVamMh != null,
    flat: result.flatPaceMinKm != null,
  };
  return result;
}

function extractTerrainSpeed(decoded) {
  const records = sortedRecords(
    (decoded && decoded.record_mesgs || []).filter((record) => record && record.timestamp)
  );
  return classifyTerrainSpeed(records);
}

// 阈值心率区间版（与小程序 fit.js 一致）：区间样本不足时按全量 30% 最近心率兜底
function extractTerrainSpeedInHrZone(decoded, zone) {
  const all = sortedRecords(
    (decoded && decoded.record_mesgs || []).filter((record) => record && record.timestamp)
  );
  if (all.length < 2) return null;
  const withHr = all.filter((record) => firstField(record, "heart_rate") != null);
  if (withHr.length < 30) {
    const res = classifyTerrainSpeed(all);
    if (res) res.usedHrFallback = true;
    return res;
  }
  const mid = (zone.lo + zone.hi) / 2;
  const inZone = withHr.filter((record) => {
    const h = firstField(record, "heart_rate");
    return h >= zone.lo && h <= zone.hi;
  });
  let selected = inZone;
  let usedFallback = false;
  if (inZone.length < 30) {
    const fallbackCount = Math.max(Math.floor(withHr.length * 0.3), 60);
    const nearest = [...withHr].sort(
      (a, b) => Math.abs(firstField(a, "heart_rate") - mid) - Math.abs(firstField(b, "heart_rate") - mid)
    );
    selected = sortedRecords(nearest.slice(0, Math.max(inZone.length * 3, fallbackCount)));
    usedFallback = true;
  } else {
    selected = sortedRecords(inZone);
  }
  const res = classifyTerrainSpeed(selected);
  if (res) res.usedHrFallback = usedFallback;
  return res;
}

class UserProfileBuilder {
  build(decoded, input) {
    const { metrics, unavailable } = extractFitMetrics(decoded);
    // 地形速度：阈值心率区间优先（与画像页一致），区间无可用样本时回退全量记录（2026-08-21）
    let terrain = decoded ? extractTerrainSpeed(decoded) : null;
    let terrainHrZone = false;
    if (decoded) {
      const zoneMesg = decoded.time_in_zone_mesgs?.[0];
      const thresholdHr = zoneMesg ? firstField(zoneMesg, "threshold_heart_rate") : null;
      const maxHr = safeFloat(input.physiologicalMaxHr);
      const zone = thresholdHr != null
        ? { lo: thresholdHr * 0.9, hi: thresholdHr * 1.05 }
        : maxHr != null ? { lo: maxHr * 0.8, hi: maxHr * 0.95 } : null;
      if (zone) {
        const zoned = extractTerrainSpeedInHrZone(decoded, zone);
        if (zoned && (zoned.samples.climb || zoned.samples.descent || zoned.samples.flat)) {
          // 类型级合并：HR 区间值优先，缺失类型回退全量，避免完整度下降
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
          terrainHrZone = true;
        }
      }
    }
    // 配速优先用 HR 区间平路配速（与画像页一致）；缺失时回退全量平均配速（2026-08-21）
    const terrainPace = terrain && terrain.flatPaceMinKm;
    const pace = safeFloat(terrainPace) || safeFloat(metrics.基础数据?.配速);
    const itraPoints = safeFloat(input.itraPoints);
    const itraComponent = itraPoints !== null ? clamp(itraPoints / 1000, 0.2, 1) : 0.5;
    const paceComponent = pace && pace > 0 ? clamp(8.5 / pace, 0.2, 1) : 0.5;
    const abilityScore = Math.round((itraComponent * 0.45 + paceComponent * 0.55) * 1000) / 10;
    // 速度能力子分：引擎 fallback/平路兜底使用（2026-08-21）
    const speedAbilityScore = buildSpeedAbility(terrain, input.itraPoints);
    const fatigueRisk = HRV_TO_FATIGUE[String(input.hrvStatus || "")] || "medium";
    const weightKg = safeFloat(input.weight);
    const heightM = safeFloat(input.height);
    const bmi =
      weightKg !== null && heightM !== null && heightM > 0
        ? Number((weightKg / (heightM * heightM)).toFixed(1))
        : null;
    return {
      ability_score: abilityScore,
      speed_ability_score: speedAbilityScore,
      fatigue_risk: fatigueRisk,
      terrain_speed: terrain,
      terrain_hr_zone: terrainHrZone,
      vo2max: safeFloat(input.vo2max),
      itra_points: itraPoints,
      physiological_max_hr: safeFloat(input.physiologicalMaxHr),
      hrv_status: String(input.hrvStatus || ""),
      verified_cho_max: safeFloat(input.verifiedChoMax),
      sweat_rate: safeFloat(input.sweatRate),
      sweat_sodium: safeFloat(input.sweatSodium),
      caffeine_habit: safeFloat(input.caffeineHabit),
      gi_sensitivity: input.giSensitivity || null,
      heat_acclimated: input.heatAcclimated || null,
      weight_kg: weightKg,
      height_m: heightM,
      gender: input.gender || "",
      bmi,
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
    const descentM = Math.max(safeFloat(input.descentM) || 0, 0);

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

    // 路段列表（JSON，爬升/下降整合）：类型/起点/终点/高差。
    // 阈值 segmentThresholdM（默认 50）以下的段不计为路段（视为平坦）
    let segList = [];
    try {
      const parsed = JSON.parse(input.routeSegments || "[]");
      if (Array.isArray(parsed)) segList = parsed;
    } catch (error) {
      segList = [];
    }
    const segmentThreshold = Math.max(safeFloat(input.segmentThresholdM) || 50, 0);
    const validSegs = segList
      .map((seg) => ({
        type: seg.type === "descent" ? "descent" : "climb",
        start: safeFloat(seg.start),
        end: safeFloat(seg.end),
        height: Math.max(safeFloat(seg.height) || 0, 0),
      }))
      .filter((seg) => seg.start !== null && seg.end !== null && seg.end > seg.start && seg.height >= segmentThreshold);

    // 构建有序海拔分段：[距离, 海拔变化]（正=爬升且终点即最高点，负=下降，0=平坦）。
    // 爬升段增量=高差（终点即最高点），下降段增量=-高差；低于阈值的段已过滤（视为平坦）
    const events = [];
    for (const seg of validSegs) {
      const delta = seg.type === "descent" ? -seg.height : seg.height;
      events.push({ start: seg.start, end: seg.end, delta });
    }
    events.sort((a, b) => a.start - b.start || a.end - b.end);

    const climbSegments = [];
    if (events.length) {
      let prevKm = 0;
      for (const ev of events) {
        if (ev.start > prevKm) {
          climbSegments.push([Number((ev.start - prevKm).toFixed(2)), 0]);
        }
        climbSegments.push([Number((ev.end - ev.start).toFixed(2)), Number(ev.delta.toFixed(1))]);
        prevKm = ev.end;
      }
      if (prevKm < distanceKm) {
        climbSegments.push([Number((distanceKm - prevKm).toFixed(2)), 0]);
      }
    }

    // 路段分段只来源于整合后的路段；补给点信息仅用于图中标记，不作为绘制海拔曲线的依据
    const manualSegments = climbSegments.length ? climbSegments : parseClimbSegments(input.segmentGain || "");
    // 显式提供路段（高差 ≥ 阈值）时直接采用（不做缩放）；否则标准化到总爬升/总距离
    const hasExplicitStructure = validSegs.length > 0;
    const segments = hasExplicitStructure ? manualSegments : this.normalizeSegments(distanceKm, ascentM, manualSegments);

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

    // 无官方补给点时不生成默认 CP：aid_stations_km 保持空（图中不画 CP 点）
    aidStations = [...new Set(aidStations)].sort((a, b) => a - b);

    const dedupSupplemental = [...new Set(supplementalPoints)].filter((value) => !aidStations.includes(value)).sort((a, b) => a - b);

    return {
      distance_km: distanceKm,
      ascent_m: ascentM,
      descent_m: descentM,
      aid_stations_km: aidStations,
      climb_segments: segments,
      steep_segments: steepSegments,
      supplemental_points_km: dedupSupplemental,
      climb_trigger_m: Math.max(safeFloat(input.climbTriggerM) || 250, 100),
      max_interval_min: Math.max(safeFloat(input.maxIntervalMin) || 30, 20),
      expected_finish_time_h: safeFloat(input.expectedFinishH),
      weather_temp_c: safeFloat(input.weatherTemp),
      humidity_pct: safeFloat(input.humidity),
      location_history_notes: input.locationNotes || null,
    };
  }
}

// ===== Trail Lab Engine v2.0 完赛时间分层估算（PRD §5.1）=====
function fallbackEstimate(raceProfile, speedAbilityScore) {
  const basePace = 8.8 - clamp(speedAbilityScore / 100, 0.35, 1) * 2.2;
  const climbFactor = raceProfile.ascent_m / Math.max(raceProfile.distance_km, 1);
  const climbPenalty = 1 + clamp((climbFactor - 30) / 120, 0, 0.6);
  return ((raceProfile.distance_km * basePace) / 60) * climbPenalty;
}

// 地形参数完整性：对应地形显著但参数缺失时，不得静默丢弃该段时间
// "显著"采用相对阈值：爬升/下降 >50m 且平均坡度 >3%（m/km > 30）
function terrainCompleteness(raceProfile, terrain) {
  const missing = [];
  const d = raceProfile.distance_km || 0;
  const a = raceProfile.ascent_m || 0;
  const dn = raceProfile.descent_m || 0;
  if (a > 50 && a / Math.max(d, 0.1) > 30 && !terrain.climbVamMh) missing.push("爬升");
  if (dn > 50 && dn / Math.max(d, 0.1) > 30 && !terrain.descentVamMh) missing.push("下降");
  // 平路不构成硬性缺失：纯越野缺乏 ≥2km 平路段，flatPace 缺失时用能力分速度兜底（2026-08-21）
  return { ok: missing.length === 0, missing };
}

function estimateFinishTime(raceProfile, terrain, speedAbilityScore) {
  const flatSpeedKmh = terrain.flatPaceMinKm ? 60 / terrain.flatPaceMinKm : null;
  const basePace = 8.8 - clamp(speedAbilityScore / 100, 0.35, 1) * 2.2;
  const abilitySpeedKmh = 60 / basePace;
  const segments = raceProfile.climb_segments || [];
  const hasClimb = Boolean(terrain.climbVamMh);
  const hasDescent = Boolean(terrain.descentVamMh);
  const hasFlat = Boolean(flatSpeedKmh);
  if (!terrainCompleteness(raceProfile, terrain).ok) {
    return { hours: fallbackEstimate(raceProfile, speedAbilityScore), breakdown: null };
  }
  let climbH = 0;
  let descentH = 0;
  let flatH = 0;
  if (hasClimb) climbH = (raceProfile.ascent_m || 0) / terrain.climbVamMh;
  if (hasDescent) descentH = (raceProfile.descent_m || 0) / terrain.descentVamMh;
  if (hasFlat) {
    const segFlats = segments
      .filter(([, deltaM]) => deltaM === 0)
      .reduce((sum, [distKm]) => sum + distKm, 0);
    let flatKm = segFlats;
    // 兜底放宽：提取段中平路段占比过小（<30%）时，用"总距离−爬升当量"兜底（2026-08-21）
    const q = 8;
    const fallbackFlat = Math.max(
      raceProfile.distance_km - (((raceProfile.ascent_m || 0) + (raceProfile.descent_m || 0)) * q) / 1000,
      0
    );
    if (flatKm < raceProfile.distance_km * 0.3) flatKm = Math.max(flatKm, fallbackFlat);
    flatH = flatKm / flatSpeedKmh;
  } else if (raceProfile.distance_km > 0) {
    const fallbackFlat = Math.max(
      raceProfile.distance_km - (((raceProfile.ascent_m || 0) + (raceProfile.descent_m || 0)) * 8) / 1000,
      0
    );
    flatH = fallbackFlat / abilitySpeedKmh;
  }
  const totalH = climbH + descentH + flatH;
  if (totalH <= 0) return { hours: fallbackEstimate(raceProfile, speedAbilityScore), breakdown: null };
  return {
    hours: totalH,
    breakdown: {
      climb_h: Number(climbH.toFixed(2)),
      descent_h: Number(descentH.toFixed(2)),
      flat_h: Number(flatH.toFixed(2)),
    },
  };
}

function itraFallbackEstimate(raceProfile, itraPoints) {
  const effectiveKm = raceProfile.distance_km + (raceProfile.ascent_m || 0) / 100;
  const pi = clamp(itraPoints || 0, 0, 1000);
  const speedKmh = 7.0 + (pi - 300) * 0.005;
  const est = effectiveKm / Math.max(speedKmh, 3);
  return {
    // 保守化系数 1.08→1.15（2026-08-21 数据集回归）
    hours: Number((est * 1.15).toFixed(2)),
    range: [Number((est * 1.05).toFixed(2)), Number((est * 1.25).toFixed(2))],
    confidence: "medium",
  };
}

function vo2maxFallbackEstimate(raceProfile, vo2max) {
  const vVo2Kmh = 3.5 + 0.3 * vo2max;
  const sustainKmh = vVo2Kmh * 0.6;
  const climbFactor = raceProfile.ascent_m / Math.max(raceProfile.distance_km, 1);
  const climbPenalty = 1 + clamp((climbFactor - 30) / 120, 0, 0.6);
  const base = (raceProfile.distance_km / Math.max(sustainKmh, 3)) * climbPenalty;
  return {
    hours: Number((base * 1.8).toFixed(2)),
    range: [Number((base * 1.4).toFixed(2)), Number((base * 2.1).toFixed(2))],
    confidence: "low",
  };
}

function conservativeFallbackEstimate(raceProfile) {
  const d = raceProfile.distance_km || 1;
  return {
    hours: Number((d / 3.8).toFixed(2)),
    range: [Number((d / 5.0).toFixed(2)), Number((d / 3.5).toFixed(2))],
    confidence: "low",
  };
}

function layeredFinishEstimate(raceProfile, terrain, userProfile) {
  const completeness = terrainCompleteness(raceProfile, terrain);
  if (completeness.ok) {
    const speedAbility = userProfile.speed_ability_score ?? userProfile.ability_score;
    const est = estimateFinishTime(raceProfile, terrain, speedAbility);
    const hours = Number(est.hours.toFixed(2));
    // HR 兜底降权：与画像页评分上限 60 对齐（2026-08-21）
    const hrFallback = Boolean(terrain.usedHrFallback);
    return {
      hours,
      range: hrFallback
        ? [Number((hours * 0.8).toFixed(2)), Number((hours * 1.25).toFixed(2))]
        : [Number((hours * 0.9).toFixed(2)), Number((hours * 1.1).toFixed(2))],
      confidence: hrFallback ? "low" : "medium",
      branch: "terrain",
      breakdown: est.breakdown,
      completeness,
      hrFallback,
    };
  }
  if (userProfile.itra_points != null) {
    const fb = itraFallbackEstimate(raceProfile, userProfile.itra_points);
    return { hours: fb.hours, range: fb.range, confidence: fb.confidence, branch: "itra_fallback", breakdown: null, completeness };
  }
  if (userProfile.vo2max != null) {
    const fb = vo2maxFallbackEstimate(raceProfile, userProfile.vo2max);
    return { hours: fb.hours, range: fb.range, confidence: fb.confidence, branch: "vo2max_fallback", breakdown: null, completeness };
  }
  const fb = conservativeFallbackEstimate(raceProfile);
  return { hours: fb.hours, range: fb.range, confidence: fb.confidence, branch: "conservative", breakdown: null, completeness };
}

const FINISH_BRANCH_LABEL = {
  terrain: "分段分解",
  itra_fallback: "ITRA 保守",
  vo2max_fallback: "VO2max 粗略",
  conservative: "极端保守",
};

function choTierBand(durationH) {
  if (durationH < 0.75) return { lo: 0, hi: 0, mid: 0 };
  if (durationH < 1.25) return { lo: 0, hi: 30, mid: 30 };
  if (durationH < 2.5) return { lo: 30, hi: 60, mid: 45 };
  if (durationH < 3) return { lo: 60, hi: 90, mid: 75 };
  return { lo: 60, hi: 90, mid: 75 };
}

// 从候选补给点中按时间间隔均匀选 n 个（咖啡因分次分配用，工程化规则，待实测校准）
function pickSpacedPoints(candidates, n, minGapH) {
  if (!candidates.length) return [];
  const sorted = [...candidates].sort((a, b) => a.time_h - b.time_h);
  const picked = [];
  let last = -Infinity;
  for (const c of sorted) {
    if (picked.length >= n) break;
    if (picked.length === 0 || c.time_h - last >= minGapH) {
      picked.push(c);
      last = c.time_h;
    }
  }
  if (picked.length < n) {
    for (let i = sorted.length - 1; i >= 0 && picked.length < n; i--) {
      const c = sorted[i];
      if (!picked.includes(c) && Math.abs(c.time_h - (last === -Infinity ? c.time_h : last)) >= 0.75) {
        picked.push(c);
        last = c.time_h;
      }
    }
  }
  return picked.sort((a, b) => a.time_h - b.time_h).slice(0, n);
}

// 整件分配：把不可分切的物品（能量胶/盐丸）按"累计缺口"分配到各补给点。
// 全程总量 = ceil(总目标 / 单件量)，任意时刻实际摄入落后目标 < 单件量；
// 避免每个补给点各自向上取整，导致一小时内多个点叠加而过量。
function allocateWholeItems(targets, itemSize) {
  const counts = targets.map(() => 0);
  let acc = 0;
  for (let i = 0; i < targets.length; i++) {
    acc += targets[i] || 0;
    if (acc >= itemSize) {
      counts[i] = Math.floor(acc / itemSize);
      acc = acc % itemSize;
    }
  }
  // 全程剩余不足单件量的需求：在最后一个补给点补 1 件（宁多勿少，全程至多超 1 件）
  if (acc > 0 && counts.length) counts[counts.length - 1] += 1;
  return counts;
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
    const terrain = userProfile.terrain_speed || {};
    const weight = safeFloat(weightKg) || 70;
    const warnings = [];
    const hasUserFinishTime =
      raceProfile.expected_finish_time_h !== null && raceProfile.expected_finish_time_h > 0;

    if (terrain.climbVamMh > 1200) {
      warnings.push("上坡 VAM 异常偏高（>1200 m/h），文件可能不含代表性爬升段，建议上传比赛/高强度文件");
    }
    if (terrain.descentVamMh > 1600) {
      warnings.push("下坡 VAM 异常偏高（>1600 m/h），文件可能为高速下坡片段，完赛时间可能低估");
    }
    // 下坡 VAM 异常低值校验（2026-08-21 数据集回归）
    if (terrain.descentVamMh != null && terrain.descentVamMh < 300) {
      warnings.push("下坡 VAM 异常偏低（<300 m/h），可能为技术型下坡或数据异常，完赛时间可能高估；建议核对下坡段数据");
    }

    const est = layeredFinishEstimate(raceProfile, terrain, userProfile);
    let finishTimeH;
    let finishTimeRange;
    let finishConfidence;
    let estimateModeLabel;
    let finishBranch;
    let finishBreakdown = est.breakdown;
    if (hasUserFinishTime) {
      finishTimeH = raceProfile.expected_finish_time_h;
      finishTimeRange = [
        Number((finishTimeH * 0.95).toFixed(2)),
        Number((finishTimeH * 1.05).toFixed(2)),
      ];
      finishConfidence = "high";
      estimateModeLabel = "用户输入";
      finishBranch = "user_input";
      if (est.confidence !== "low") {
        const ratio = finishTimeH / est.hours;
        const diffPct = Math.round(Math.abs(ratio - 1) * 100);
        if (ratio < 0.8) {
          warnings.push(
            `期望完赛时间 ${finishTimeH}h 明显快于能力画像估算 ${est.hours}h（约快 ${diffPct}%），可能过于激进；按此规划补给按较短时间计算，撞墙/补给不足风险较高，请核实目标或改保守`
          );
        } else if (ratio > 1.25) {
          warnings.push(
            `期望完赛时间 ${finishTimeH}h 明显慢于能力画像估算 ${est.hours}h（约慢 ${diffPct}%）；按此规划补给总量偏宽松（携带量增加），如为保守完赛目标可接受，否则请核实输入`
          );
        }
      }
    } else {
      finishTimeH = est.hours;
      finishTimeRange = est.range;
      finishConfidence = est.confidence;
      estimateModeLabel = FINISH_BRANCH_LABEL[est.branch] || "估算";
      finishBranch = est.branch;
      finishBreakdown = est.breakdown;
      if (est.branch === "terrain" && est.hrFallback) {
        warnings.push(
          "画像地形速度基于最接近心率区间的记录兜底（区间内样本不足），完赛时间置信度低（low）；建议上传含该地形的代表性文件"
        );
      }
      if (!est.completeness.ok) {
        const missingText = est.completeness.missing.join("/");
        if (est.branch === "itra_fallback") {
          warnings.push(
            `画像文件缺少${missingText}样本，完赛时间基于 ITRA 积分的保守估算（medium 置信度）；建议上传含该地形的代表性文件`
          );
        } else if (est.branch === "vo2max_fallback") {
          warnings.push(
            `画像文件缺少${missingText}样本且未填 ITRA，完赛时间基于 VO2max 的粗略保守估算（low 置信度）；建议填写 ITRA 或目标完赛时间`
          );
        } else if (est.branch === "conservative") {
          warnings.push(
            "画像文件地形样本不足且未填 ITRA/VO2max，完赛时间无法可靠估算，给出极端保守区间（low 置信度）；建议填写目标完赛时间或 ITRA/VO2max"
          );
        }
      }
    }
    const fatigueMult =
      userProfile.fatigue_risk === "low"
        ? 0.96
        : userProfile.fatigue_risk === "high"
          ? 1.12
          : userProfile.fatigue_risk === "severe"
            ? 1.18
            : 1;
    if (!hasUserFinishTime && finishConfidence !== "low") {
      finishTimeH *= fatigueMult;
      finishTimeRange = finishTimeRange.map((value) => Number((value * fatigueMult).toFixed(2)));
    }
    const floorH = 0.25;
    finishTimeH = Number(Math.max(finishTimeH, floorH).toFixed(2));
    const rangeLo = Math.max(finishTimeRange[0], floorH);
    const rangeHi = Math.max(finishTimeRange[1], rangeLo + 0.1);
    finishTimeRange = [Number(rangeLo.toFixed(2)), Number(rangeHi.toFixed(2))];

    const tier = choTierBand(finishTimeH);
    const ceiling = Math.min(90, userProfile.verified_cho_max != null ? userProfile.verified_cho_max : 60);
    const carbsPerHour = Number(Math.min(tier.mid, ceiling).toFixed(1));
    const dualSugar = carbsPerHour >= 60;
    const totalCarbs = Number((carbsPerHour * finishTimeH).toFixed(1));
    const carbRange = [Math.min(tier.lo, ceiling), Math.min(tier.hi, ceiling)];

    let fluidMlPerHour = 550;
    let fluidRangeMl = [450, 1100];
    let fluidEstimated = true;
    const sr = userProfile.sweat_rate;
    if (sr != null && sr > 0) {
      const loLh = Number((sr * 0.65).toFixed(2));
      const hiLh = Number(Math.min(sr * 1.0, 1.2).toFixed(2));
      fluidRangeMl = [Math.round(loLh * 1000), Math.round(hiLh * 1000)];
      fluidMlPerHour = Math.round(((loLh + hiLh) / 2) * 1000);
      fluidEstimated = false;
    } else {
      // 温度：目标赛事温度优先，缺省时自动带入画像文件平均温度（2026-08-21）
      let tempC = raceProfile.weather_temp_c;
      if (tempC === null && userProfile.metrics?.环境数据) {
        tempC = safeFloat(userProfile.metrics.环境数据.温度);
      }
      if (tempC !== null) fluidMlPerHour += Math.max(0, tempC - 15) * 18;
      if (raceProfile.humidity_pct !== null) {
        fluidMlPerHour += Math.max(0, raceProfile.humidity_pct - 55) * 3;
      }
      // 心率修正：画像文件平均心率高 → 出汗更多（仅无实测汗率时生效）
      const avgHr = userProfile.metrics?.心肺数据 ? safeFloat(userProfile.metrics.心肺数据.平均心率) : null;
      if (avgHr !== null) {
        if (avgHr >= 175) fluidMlPerHour *= 1.15;
        else if (avgHr >= 160) fluidMlPerHour *= 1.08;
      }
      fluidMlPerHour = Math.round(clamp(fluidMlPerHour, 450, 1100));
      fluidEstimated = true;
    }
    const totalFluidMl = Number((fluidMlPerHour * finishTimeH).toFixed(0));

    let drinkSodiumMgL = 600;
    if (userProfile.sweat_sodium != null && fluidMlPerHour > 0) {
      const lossMgh = userProfile.sweat_sodium * (fluidMlPerHour / 1000);
      drinkSodiumMgL = clamp(Math.round(lossMgh / Math.max(fluidMlPerHour / 1000, 0.1)), 400, 1000);
    }
    const sodiumMgh = Number((drinkSodiumMgL * (fluidMlPerHour / 1000)).toFixed(0));
    const totalSodiumMg = Number((sodiumMgh * finishTimeH).toFixed(0));

    const cafLo = Number((weight * 3).toFixed(0));
    const cafHi = Number((weight * 6).toFixed(0));
    let caffeineTier = "optional";
    if (finishTimeH >= 6) caffeineTier = "staged";
    else if (finishTimeH >= 4) caffeineTier = "late";
    // 咖啡因耐受（[A8] ISSN 3-6mg/kg；健康成人每日安全上限约 400mg）：
    // 按日常习惯调整单次剂量——高习惯者效应可能减弱但注意总量上限与赛前戒断；低/未知习惯者敏感、小剂量起步
    const caffeineHabit = safeFloat(userProfile.caffeine_habit);
    let caffPerDose = 100;
    if (caffeineHabit === null || caffeineHabit < 150) caffPerDose = 75;
    if (caffeineHabit !== null && caffeineHabit > 400) {
      warnings.push(
        "日常咖啡因习惯较高（>400mg/天），赛中咖啡因提神效应可能减弱；当日总量注意不超过每日安全上限约 400mg，赛前 2-3 天勿突然停用（避免戒断头痛）"
      );
    } else if (caffeineHabit === null || caffeineHabit < 150) {
      warnings.push(
        "日常咖啡因摄入较低（或未填），对咖啡因可能较敏感：分次按 75mg 起步，留意心悸与睡眠影响"
      );
    }

    const climbPoints = this.buildClimbTriggerPoints(raceProfile, raceProfile.climb_trigger_m);
    const timePoints = this.buildTimeFallbackPoints(raceProfile, finishTimeH, raceProfile.max_interval_min);
    const rawFuelingKm = [...new Set([
      ...raceProfile.aid_stations_km,
      ...raceProfile.supplemental_points_km,
      ...climbPoints,
      ...timePoints,
    ])]
      .filter((point) => point >= 0.5 && point < raceProfile.distance_km)
      .sort((a, b) => a - b);
    const MERGE_TIME_H = 0.25;
    const cpSet = new Set(raceProfile.aid_stations_km);
    const fuelingPointsKm = [];
    for (const km of rawFuelingKm) {
      const last = fuelingPointsKm[fuelingPointsKm.length - 1];
      if (last === undefined) {
        fuelingPointsKm.push(km);
        continue;
      }
      const dtHours = (finishTimeH * (km - last)) / raceProfile.distance_km;
      if (dtHours > MERGE_TIME_H) {
        fuelingPointsKm.push(km);
        continue;
      }
      if (!cpSet.has(last) && cpSet.has(km)) {
        fuelingPointsKm[fuelingPointsKm.length - 1] = km;
      }
    }
    const effectivePoints = fuelingPointsKm.length ? fuelingPointsKm : [Number((raceProfile.distance_km / 2).toFixed(1))];
    const carbsPerEvent = Number((totalCarbs / effectivePoints.length).toFixed(1));
    const fluidPerEvent = Number((totalFluidMl / effectivePoints.length).toFixed(0));
    const sodiumPerEvent = Number((totalSodiumMg / effectivePoints.length).toFixed(0));
    // 钠的具体分配（消除"盐丸按需补"式模糊）：电解质水按常见 500mg/L 参考（以包装为准），
    // 优先覆盖该点钠目标（以液体量封顶）；剩余缺口按全程累计由整粒盐丸补足（见 allocateWholeItems）。
    const ELEC_DRINK_NA_MG_L = 500;
    const SALT_TAB_MG = 200;
    const GEL_G = 25;
    const basePoints = effectivePoints.map((pointKm) => {
      const sources = [];
      if (raceProfile.aid_stations_km.some((point) => Math.abs(point - pointKm) <= 0.3)) sources.push("cp");
      if (raceProfile.supplemental_points_km.some((point) => Math.abs(point - pointKm) <= 0.3)) sources.push("supplemental");
      if (climbPoints.some((point) => Math.abs(point - pointKm) <= 0.05)) sources.push("climb_trigger");
      if (timePoints.some((point) => Math.abs(point - pointKm) <= 0.05)) sources.push("time_fallback");
      const electrolyteNaMg = Number(((fluidPerEvent * ELEC_DRINK_NA_MG_L) / 1000).toFixed(0));
      const saltTabTopupMg = Math.max(0, sodiumPerEvent - electrolyteNaMg);
      return {
        km: Number(pointKm.toFixed(2)),
        time_h: Number((finishTimeH * (pointKm / raceProfile.distance_km)).toFixed(2)),
        carbs_g: carbsPerEvent,
        fluid_ml: fluidPerEvent,
        sodium_mg: sodiumPerEvent,
        electrolyte_na_mg: electrolyteNaMg,
        salt_tab_topup_mg: saltTabTopupMg,
        source: [...new Set(sources)].sort().join("+") || "auto",
      };
    });
    // 白水/电解质水拆分 + 整件分配：
    // - 电解质水（按常见 500mg/L 估算）优先覆盖该点钠目标，但每点最多占液体 2/3，
    //   至少保留 1/3 白水（电解质水浓度较高，过量饮用易加重口渴）；
    // - 剩余钠缺口按全程累计（carry-forward）由整粒盐丸补足，避免逐点取整叠加过量；
    // - 能量胶同理由累计缺口分配。
    const ELEC_NA_MG_ML = 0.5;
    const ELEC_MAX_FRACTION = 2 / 3;
    const drinkPlan = basePoints.map((p) => {
      const electrolyteMl = Math.min(Math.round(p.fluid_ml * ELEC_MAX_FRACTION), Math.round(p.sodium_mg / ELEC_NA_MG_ML));
      return {
        electrolyte_ml: electrolyteMl,
        plain_ml: Math.round(p.fluid_ml - electrolyteMl),
        residual_mg: Math.max(0, Math.round(p.sodium_mg - electrolyteMl * ELEC_NA_MG_ML)),
      };
    });
    const saltTabCounts = allocateWholeItems(drinkPlan.map((d) => d.residual_mg), SALT_TAB_MG);
    const gelCounts = allocateWholeItems(basePoints.map((p) => p.carbs_g), GEL_G);
    const fuelingPoints = basePoints.map((p, i) => ({
      ...p,
      electrolyte_ml: drinkPlan[i].electrolyte_ml,
      plain_ml: drinkPlan[i].plain_ml,
      salt_tab_count: saltTabCounts[i],
      gels_count: gelCounts[i],
    }));

    // 咖啡因分次分配：把预算落实到具体补给点（工程化规则，待实测校准）
    // staged(≥6h)：3.5h 后每隔约 1.5h 一次 ×100mg（≤3 次，总量 ~300mg 落在预算 228-456 内）
    // late(4-6h)：2.5h 后 2 次 ×100mg（保守取预算下限附近）
    // optional(<4h)：1 次 ×100mg，按需可选
    let caffeineSchedule = [];
    if (caffeineTier === "staged") {
      caffeineSchedule = pickSpacedPoints(
        fuelingPoints.filter((p) => p.time_h >= 3.5 && p.time_h <= finishTimeH - 0.5),
        3,
        1.2
      ).map((p) => ({ km: p.km, time_h: p.time_h, mg: caffPerDose }));
    } else if (caffeineTier === "late") {
      caffeineSchedule = pickSpacedPoints(
        fuelingPoints.filter((p) => p.time_h >= 2.5 && p.time_h <= finishTimeH - 0.5),
        2,
        1.0
      ).map((p) => ({ km: p.km, time_h: p.time_h, mg: caffPerDose }));
    } else {
      const optionalPoint = pickSpacedPoints(
        fuelingPoints.filter((p) => p.time_h >= 1.5 && p.time_h <= finishTimeH - 0.5),
        1,
        0
      );
      caffeineSchedule = optionalPoint.map((p) => ({ km: p.km, time_h: p.time_h, mg: caffPerDose, optional: true }));
    }
    const caffeineTotalMg = caffeineSchedule.reduce((sum, c) => sum + c.mg, 0);

    // 赛中蛋白分配：>5h 启用，落到官方补给站（热食/蛋白棒，每站约 10g）
    const proteinEnabled = finishTimeH > 5;
    const proteinSchedule = proteinEnabled
      ? fuelingPoints
          .filter((p) => (p.source || "").split("+").includes("cp"))
          .map((p) => ({ km: p.km, time_h: p.time_h, g: 10 }))
      : [];

    // 携带清单：自补给点（无官方站）所需的自备补给数量与重量（工程化，待实测校准）
    const GEL_WEIGHT_G = 34; // 每支胶含包装约 34g
    const SALT_WEIGHT_G = 2; // 每粒约 2g
    const selfPoints = fuelingPoints.filter((p) => !(p.source || "").split("+").includes("cp"));
    const selfFluidMl = selfPoints.reduce((sum, p) => sum + p.fluid_ml, 0);
    const selfElecMl = selfPoints.reduce((sum, p) => sum + (p.electrolyte_ml || 0), 0);
    const selfPlainMl = selfPoints.reduce((sum, p) => sum + (p.plain_ml || 0), 0);
    // 携带量 = 自补给点分配到的整件数之和（与时间轴一致，不再独立按总量取整）
    const gelCount = selfPoints.reduce((sum, p) => sum + (p.gels_count || 0), 0);
    const saltCount = selfPoints.reduce((sum, p) => sum + (p.salt_tab_count || 0), 0);
    const totalCarryG = gelCount * GEL_WEIGHT_G + saltCount * SALT_WEIGHT_G + selfFluidMl;
    const carryPlan = {
      gels: { count: gelCount, per_g: GEL_G, weight_g: gelCount * GEL_WEIGHT_G },
      salt_tabs: { count: saltCount, per_mg: SALT_TAB_MG, weight_g: saltCount * SALT_WEIGHT_G },
      self_fluid_ml: Math.round(selfFluidMl),
      self_electrolyte_ml: Math.round(selfElecMl),
      self_plain_ml: Math.round(selfPlainMl),
      caffeine_total_mg: caffeineTotalMg,
      caffeine_note: "含咖啡因能量胶 50-100mg/支 或 咖啡（约 80-100mg/杯）",
      total_weight_g: Math.round(totalCarryG),
      note: "仅统计自补给点所需（官方站可补的未计入）；两站间隔长时建议在官方站带出补给，减少随身携带重量",
    };

    if (fluidEstimated) warnings.push("无实测出汗率，液体为环境估算（低置信度），建议按体重法实测校准");
    if (userProfile.sweat_sodium === null) warnings.push("无汗液钠浓度数据，钠为保守区间（低置信度）");
    if (userProfile.verified_cho_max === null) warnings.push("无已验证碳水上限，默认上限 60 g/h（低置信度）；长距离实测后回填可升级");
    if (sodiumMgh > 1000) warnings.push("钠摄入超过 1000 mg/h 上限，需拆分盐丸/含盐食物来源或降低饮料浓度");
    if (userProfile.fatigue_risk === "severe") warnings.push("HRV 状态极差：不建议参赛/高强度，请优先休息");
    if (userProfile.bmi !== null && (userProfile.bmi < 16 || userProfile.bmi > 35)) {
      warnings.push(`BMI ${userProfile.bmi} 超出 16–35，存在营养/健康风险，补给方案建议更保守`);
    }
    if (!hasUserFinishTime) {
      warnings.push(`未填期望完赛时间，完赛时间为引擎估算（${estimateModeLabel}），建议填写目标时间提高精度`);
    }

    const confidence = {
      carbs: userProfile.verified_cho_max != null ? "high" : "medium",
      fluid: fluidEstimated ? "low" : "high",
      sodium: userProfile.sweat_sodium != null ? "high" : "low",
      finish_time: finishConfidence,
    };

    return {
      contract_version: "trail_lab_rule_contract_v2",
      engine_version: ENGINE_VERSION,
      estimated_finish_time_h: finishTimeH,
      finish_time_range: finishTimeRange,
      finish_time_source: hasUserFinishTime ? "user_input" : "engine_estimate",
      debug_trace: {
        engine_version: ENGINE_VERSION,
        finish_time_branch: finishBranch,
        terrain_completeness: est.completeness,
        terrain_speed:
          terrain.climbVamMh || terrain.descentVamMh || terrain.flatPaceMinKm
            ? {
                climb_vam_m_h: terrain.climbVamMh || null,
                descent_vam_m_h: terrain.descentVamMh || null,
                flat_pace_min_km: terrain.flatPaceMinKm || null,
              }
            : null,
        finish_breakdown: finishBreakdown,
        cho: { tier_range: [tier.lo, tier.hi], ceiling },
        fluid: { sweat_rate_lph: userProfile.sweat_rate, estimated: fluidEstimated },
        sodium: { sweat_sodium_mgl: userProfile.sweat_sodium, drink_conc_mg_l: drinkSodiumMgL },
      },
      carbs_per_hour_g: carbsPerHour,
      carb_range_g: carbRange,
      dual_sugar: dualSugar,
      cho_ceiling_g_h: ceiling,
      fluid_per_hour_ml: fluidMlPerHour,
      fluid_range_ml: fluidRangeMl,
      fluid_estimated: fluidEstimated,
      sodium_mg_l: drinkSodiumMgL,
      sodium_per_hour_mg: sodiumMgh,
      caffeine_budget_mg: [cafLo, cafHi],
      caffeine_tier: caffeineTier,
      total_carbs_g: totalCarbs,
      total_fluid_ml: totalFluidMl,
      total_sodium_mg: totalSodiumMg,
      fueling_points: fuelingPoints,
      caffeine_schedule: caffeineSchedule,
      protein_schedule: proteinSchedule,
      protein_enabled: proteinEnabled,
      carry_plan: carryPlan,
      trigger_config: {
        climb_trigger_m: raceProfile.climb_trigger_m,
        max_interval_min: raceProfile.max_interval_min,
      },
      evidence: {
        carbs: ["B5", "A7"],
        fluid: fluidEstimated ? ["A4", "engine_derived"] : ["A5"],
        sodium: userProfile.sweat_sodium != null ? ["A5", "A2"] : ["A4", "A2"],
        caffeine: ["A8"],
      },
      confidence,
      warnings,
      weight_kg: weight,
      bmi: userProfile.bmi,
    };
  }
}

function ruleEngineOutputToContract(userProfile, raceProfile, ruleOutput) {
  return {
    contract_version: ruleOutput.contract_version,
    engine_version: ruleOutput.engine_version,
    sport_mode: "trail_run",
    scope: {
      distance_km: raceProfile.distance_km,
      ascent_m: raceProfile.ascent_m,
      descent_m: raceProfile.descent_m,
      limit: "<=70km / <=5000m",
    },
    user_profile: {
      ability_score: userProfile.ability_score,
      terrain_speed: userProfile.terrain_speed,
      vo2max: userProfile.vo2max,
      itra_points: userProfile.itra_points,
      fatigue_risk: userProfile.fatigue_risk,
      verified_cho_max_gph: userProfile.verified_cho_max,
      sweat_rate_lph: userProfile.sweat_rate,
      sweat_sodium_mgl: userProfile.sweat_sodium,
      caffeine_habit_mg_day: userProfile.caffeine_habit,
      gi_sensitivity: userProfile.gi_sensitivity,
      heat_acclimated: userProfile.heat_acclimated,
      bmi: userProfile.bmi,
      confidence: {
        ability: "display_only",
        terrain_speed: userProfile.terrain_speed ? "representative_file" : "missing",
        fatigue: userProfile.hrv_status ? "medium" : "unknown_default",
      },
    },
    race_profile: {
      distance_km: raceProfile.distance_km,
      ascent_m: raceProfile.ascent_m,
      descent_m: raceProfile.descent_m,
      aid_stations_km: raceProfile.aid_stations_km,
      supplemental_points_km: raceProfile.supplemental_points_km,
      steep_segments: raceProfile.steep_segments,
      weather_temp_c: raceProfile.weather_temp_c,
      humidity_pct: raceProfile.humidity_pct,
    },
    trigger_config: ruleOutput.trigger_config,
    engine_outputs: {
      estimated_finish_time_h: ruleOutput.estimated_finish_time_h,
      finish_time_range: ruleOutput.finish_time_range,
      finish_time_source: ruleOutput.finish_time_source,
      debug_trace: ruleOutput.debug_trace,
      carbs_per_hour_g: ruleOutput.carbs_per_hour_g,
      carb_range_g: ruleOutput.carb_range_g,
      dual_sugar: ruleOutput.dual_sugar,
      cho_ceiling_g_h: ruleOutput.cho_ceiling_g_h,
      fluid_per_hour_ml: ruleOutput.fluid_per_hour_ml,
      fluid_range_ml: ruleOutput.fluid_range_ml,
      fluid_estimated: ruleOutput.fluid_estimated,
      sodium_mg_l: ruleOutput.sodium_mg_l,
      sodium_per_hour_mg: ruleOutput.sodium_per_hour_mg,
      caffeine_budget_mg: ruleOutput.caffeine_budget_mg,
      caffeine_tier: ruleOutput.caffeine_tier,
      total_carbs_g: ruleOutput.total_carbs_g,
      total_fluid_ml: ruleOutput.total_fluid_ml,
      total_sodium_mg: ruleOutput.total_sodium_mg,
      fueling_points: ruleOutput.fueling_points,
      caffeine_schedule: ruleOutput.caffeine_schedule,
      protein_schedule: ruleOutput.protein_schedule,
      protein_enabled: ruleOutput.protein_enabled,
      carry_plan: ruleOutput.carry_plan,
      evidence: ruleOutput.evidence,
      confidence: ruleOutput.confidence,
      warnings: ruleOutput.warnings,
    },
  };
}

// 补给点类型细分标签（UI 渲染 / CSV 导出 / AI 提示共用语义）
function fuelingPointTypeLabel(source, en) {
  const parts = String(source || "").split("+").filter(Boolean);
  if (parts.includes("cp")) return en ? "official aid station" : "官方补给站";
  if (parts.includes("supplemental")) return en ? "self-supply (pre-climb)" : "自补给（爬升前）";
  if (parts.includes("climb_trigger")) return en ? "self-supply (climb)" : "自补给（爬升段）";
  return en ? "self-supply (time-based)" : "自补给（时间兜底）";
}

function renderRuleEngineOutput(ruleOutput, language = "zh") {
  const trace = ruleOutput.debug_trace || {};
  const sourceLabel = ruleOutput.finish_time_source === "user_input"
    ? (language === "en" ? "user input" : "用户输入")
    : (language === "en" ? "engine estimate" : "引擎估算");
  const branchLabel = trace.finish_time_branch || "?";
  const lines = language === "en"
    ? [
      `Trail Lab Rule Engine v2.0 Output (engine ${ruleOutput.engine_version || "?"})`,
      `- Estimated finish time: ${ruleOutput.estimated_finish_time_h.toFixed(2)} h (${sourceLabel}, range ${ruleOutput.finish_time_range[0].toFixed(2)}–${ruleOutput.finish_time_range[1].toFixed(2)}, branch ${branchLabel}, confidence ${ruleOutput.confidence.finish_time})`,
      `- Carbohydrate: ${ruleOutput.carbs_per_hour_g.toFixed(1)} g/h (range ${ruleOutput.carb_range_g[0]}-${ruleOutput.carb_range_g[1]}, ceiling ${ruleOutput.cho_ceiling_g_h}${ruleOutput.dual_sugar ? ", dual sugar" : ""}; evidence ${(ruleOutput.evidence.carbs || []).join("/")})`,
      `- Fluid: ${ruleOutput.fluid_per_hour_ml} ml/h (range ${ruleOutput.fluid_range_ml[0]}-${ruleOutput.fluid_range_ml[1]}${ruleOutput.fluid_estimated ? ", estimated" : ", measured sweat rate"}; evidence ${(ruleOutput.evidence.fluid || []).join("/")})`,
      `- Sodium: ${ruleOutput.sodium_mg_l} mg/L x ${(ruleOutput.fluid_per_hour_ml / 1000).toFixed(2)} L/h = ${ruleOutput.sodium_per_hour_mg} mg/h (evidence ${(ruleOutput.evidence.sodium || []).join("/")})`,
      `- Caffeine budget: ${ruleOutput.caffeine_budget_mg[0]}-${ruleOutput.caffeine_budget_mg[1]} mg (${ruleOutput.caffeine_tier}; evidence ${(ruleOutput.evidence.caffeine || []).join("/")})`,
      ...(ruleOutput.estimated_finish_time_h > 5 ? ["- In-race protein (>5h, optional, weaker evidence [A2]): ~10-20 g every 2-3h at official stations"] : []),
      `- Pre-race 36-48h: glycogen load ${Math.round((ruleOutput.weight_kg || 70) * 10)}-${Math.round((ruleOutput.weight_kg || 70) * 12)} g/day; pre-race 1-4h: ${Math.round((ruleOutput.weight_kg || 70) * 1)}-${Math.round((ruleOutput.weight_kg || 70) * 4)} g carbs (low fiber/fat); post-race 0-4h: ${Math.round((ruleOutput.weight_kg || 70) * 1.0)}-${Math.round((ruleOutput.weight_kg || 70) * 1.2)} g carbs/h + ${Math.round((ruleOutput.weight_kg || 70) * 0.3)}-${Math.round((ruleOutput.weight_kg || 70) * 0.4)} g protein/h`,
      `- Totals: carbs ${ruleOutput.total_carbs_g} g / fluid ${Math.round((ruleOutput.fueling_points || []).reduce((s, p) => s + (p.electrolyte_ml || 0) + (p.plain_ml || 0), 0))} ml (electrolyte ${Math.round((ruleOutput.fueling_points || []).reduce((s, p) => s + (p.electrolyte_ml || 0), 0))} ml + plain ${Math.round((ruleOutput.fueling_points || []).reduce((s, p) => s + (p.plain_ml || 0), 0))} ml) / sodium ${ruleOutput.total_sodium_mg} mg`,
      `- Debug trace: ${branchLabel}${trace.finish_breakdown ? ` (climb ${trace.finish_breakdown.climb_h}h + descent ${trace.finish_breakdown.descent_h}h + flat ${trace.finish_breakdown.flat_h}h)` : ""}; terrain completeness ${JSON.stringify(trace.terrain_completeness || {})}`,
      "- Fueling points:",
    ]
    : [
      `山野实验室规则引擎 v2.0 输出（engine ${ruleOutput.engine_version || "?"}）`,
      `- 预计完赛时间: ${ruleOutput.estimated_finish_time_h.toFixed(2)} 小时（${sourceLabel}，区间 ${ruleOutput.finish_time_range[0].toFixed(2)}–${ruleOutput.finish_time_range[1].toFixed(2)}，分支 ${branchLabel}，置信度 ${ruleOutput.confidence.finish_time}）`,
      `- 碳水: ${ruleOutput.carbs_per_hour_g.toFixed(1)} 克/小时（区间 ${ruleOutput.carb_range_g[0]}-${ruleOutput.carb_range_g[1]}，上限 ${ruleOutput.cho_ceiling_g_h}${ruleOutput.dual_sugar ? "，双糖" : ""}；依据 ${(ruleOutput.evidence.carbs || []).join("/")}）`,
      `- 液体: ${ruleOutput.fluid_per_hour_ml} 毫升/小时（区间 ${ruleOutput.fluid_range_ml[0]}-${ruleOutput.fluid_range_ml[1]}${ruleOutput.fluid_estimated ? "，估算" : "，实测汗率"}；依据 ${(ruleOutput.evidence.fluid || []).join("/")}）`,
      `- 钠: ${ruleOutput.sodium_mg_l} mg/L × ${(ruleOutput.fluid_per_hour_ml / 1000).toFixed(2)} L/h = ${ruleOutput.sodium_per_hour_mg} mg/h（依据 ${(ruleOutput.evidence.sodium || []).join("/")}）`,
      `- 咖啡因预算: ${ruleOutput.caffeine_budget_mg[0]}-${ruleOutput.caffeine_budget_mg[1]} mg（${ruleOutput.caffeine_tier}；依据 ${(ruleOutput.evidence.caffeine || []).join("/")}）`,
      ...(ruleOutput.estimated_finish_time_h > 5 ? ["- 赛中蛋白（>5h，可选、证据较弱 [A2]）：官方站热食/蛋白棒，每 2-3 小时约 10-20 g"] : []),
      `- 赛前 36-48h: 糖原填充 ${Math.round((ruleOutput.weight_kg || 70) * 10)}-${Math.round((ruleOutput.weight_kg || 70) * 12)} g/天；赛前 1-4h: ${Math.round((ruleOutput.weight_kg || 70) * 1)}-${Math.round((ruleOutput.weight_kg || 70) * 4)} g 碳水（低纤维低脂）；赛后 0-4h: 每小时 ${Math.round((ruleOutput.weight_kg || 70) * 1.0)}-${Math.round((ruleOutput.weight_kg || 70) * 1.2)} g 碳水 + ${Math.round((ruleOutput.weight_kg || 70) * 0.3)}-${Math.round((ruleOutput.weight_kg || 70) * 0.4)} g 蛋白`,
      `- 总量: 碳水 ${ruleOutput.total_carbs_g} g / 液体 ${Math.round((ruleOutput.fueling_points || []).reduce((s, p) => s + (p.electrolyte_ml || 0) + (p.plain_ml || 0), 0))} mL（电解质水 ${Math.round((ruleOutput.fueling_points || []).reduce((s, p) => s + (p.electrolyte_ml || 0), 0))} mL + 白水 ${Math.round((ruleOutput.fueling_points || []).reduce((s, p) => s + (p.plain_ml || 0), 0))} mL）/ 钠 ${ruleOutput.total_sodium_mg} mg`,
      `- 调试追踪: ${branchLabel}${trace.finish_breakdown ? `（爬升 ${trace.finish_breakdown.climb_h}h + 下降 ${trace.finish_breakdown.descent_h}h + 平路 ${trace.finish_breakdown.flat_h}h）` : ""}；地形完整性 ${JSON.stringify(trace.terrain_completeness || {})}`,
      "- 补给点:",
    ];

  lines.push(
    language === "en"
      ? "  (Each point gives plain-water / electrolyte-drink ml and whole salt tabs; at least 1/3 plain water per point, and salt tabs are allocated across the whole plan to avoid per-point stacking.)"
      : "  （每点给出白水/电解质水毫升数与整粒盐丸数；每点至少保留 1/3 白水，盐丸按全程累计缺口分配，避免逐点取整过量）"
  );

  // 咖啡因/蛋白固定到具体补给点（caffeine_schedule / protein_schedule 的 km 与补给点 km 一一对应）
  const kmKey = (v) => String(Number(Number(v).toFixed(2)));
  const caffByKm = new Map((ruleOutput.caffeine_schedule || []).map((c) => [kmKey(c.km), c]));
  const proteinByKm = new Map((ruleOutput.protein_schedule || []).map((p) => [kmKey(p.km), p]));

  for (const point of ruleOutput.fueling_points) {
    const type = fuelingPointTypeLabel(point.source, language === "en");
    const caff = caffByKm.get(kmKey(point.km));
    const protein = proteinByKm.get(kmKey(point.km));
    const electrolyteMl = point.electrolyte_ml != null ? point.electrolyte_ml : Math.min(point.fluid_ml, Math.round(point.sodium_mg / 0.5));
    const plainMl = point.plain_ml != null ? point.plain_ml : Math.round(point.fluid_ml - electrolyteMl);
    const saltCount = point.salt_tab_count != null ? point.salt_tab_count : Math.ceil(Math.max(0, point.sodium_mg - Math.round(electrolyteMl * 0.5)) / 200);
    const caffTxt = caff
      ? language === "en"
        ? `; caffeine ${caff.mg} mg${caff.optional ? " (optional)" : ""}`
        : `；咖啡因 ${caff.mg} mg${caff.optional ? "（按需可选）" : ""}`
      : "";
    const proteinTxt = protein
      ? language === "en"
        ? `; protein ~${protein.g} g`
        : `；蛋白约 ${protein.g} g`
      : "";
    const gels = point.gels_count != null ? point.gels_count : (point.carbs_g > 0 ? Math.max(1, Math.round(point.carbs_g / 25)) : 0);
    const gelsTxtEn = gels > 0 ? `${gels} gel${gels === 1 ? "" : "s"} (≈ ${gels * 25} g carbs)` : "no gel needed at this point";
    const gelsTxtZh = gels > 0 ? `能量胶 ${gels} 支（≈${gels * 25}g 碳水）` : "本点无需能量胶";
    const drinkPartsEn = [];
    const drinkPartsZh = [];
    if (electrolyteMl > 0) {
      drinkPartsEn.push(`electrolyte drink ${electrolyteMl} ml (≈ ${Math.round(electrolyteMl * 0.5)} mg sodium)`);
      drinkPartsZh.push(`电解质水 ${electrolyteMl}ml（≈${Math.round(electrolyteMl * 0.5)}mg 钠）`);
    }
    if (plainMl > 0) {
      drinkPartsEn.push(`plain water ${plainMl} ml`);
      drinkPartsZh.push(`白水 ${plainMl}ml`);
    }
    if (saltCount > 0) {
      drinkPartsEn.push(`${saltCount} salt tab${saltCount === 1 ? "" : "s"} (≈ ${saltCount * 200} mg sodium)`);
      drinkPartsZh.push(`盐丸 ${saltCount} 粒（≈${saltCount * 200}mg 钠）`);
    }
    lines.push(
      language === "en"
        ? `  km ${point.km.toFixed(1)} (~${point.time_h.toFixed(2)} h) [${type}]: ${gelsTxtEn} + ${drinkPartsEn.join(" + ") || "0 ml fluid"}${caffTxt}${proteinTxt}`
        : `  km ${point.km.toFixed(1)}（约 ${point.time_h.toFixed(2)} h）[${type}]: ${gelsTxtZh} + ${drinkPartsZh.join(" + ") || "液体量 0ml"}${caffTxt}${proteinTxt}`
    );
    lines.push(
      language === "en"
        ? `    Note: target carbs ${point.carbs_g.toFixed(1)} g / sodium ${point.sodium_mg.toFixed(0)} mg; keep at least 1/3 plain water per point (concentrated electrolyte drink can worsen thirst); sodium not covered by the electrolyte drink is topped up with whole salt tabs allocated across the whole plan (avoid per-point stacking); electrolyte drink ≈ 500 mg/L, check your product label.`
        : `    说明：目标碳水 ${point.carbs_g.toFixed(1)}g / 钠 ${point.sodium_mg.toFixed(0)}mg；每点至少保留 1/3 白水，电解质水未覆盖的钠缺口按全程累计由盐丸补足（整粒执行，避免逐点过量）；电解质水按常见 500mg/L 估算，实际以包装为准。`
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

// V2 新增提示 → 叹号悬浮（引擎警告列表 + 相关表单字段追加引擎提示）
function attachEngineHints(ruleOutput, language, raceProfile) {
  const en = language === "en";
  const warnings = ruleOutput.warnings || [];
  // 画像与路线类型不匹配：itra_fallback + 高爬升路线 → 突出提示置顶（2026-08-21）
  const trace = ruleOutput.debug_trace || {};
  const climbSignificant =
    raceProfile && (raceProfile.ascent_m || 0) >= 400 &&
    (raceProfile.ascent_m || 0) / Math.max(raceProfile.distance_km, 1) >= 30;
  const profileWarning =
    trace.finish_time_branch === "itra_fallback" && climbSignificant ? t("statusProfileMismatch") : "";
  // 1. 结果页"智能提示"区：每条警告一行，叹号悬浮显示完整内容
  const allHints = profileWarning ? [profileWarning, ...warnings] : warnings;
  ui.engineHints.innerHTML = allHints.length
    ? allHints.map((warning, index) => {
        const mismatchClass = index === 0 && profileWarning ? "hint-row mismatch" : "hint-row";
        const esc = escapeHtml(warning);
        const tooltip = escapeAttr(warning);
        return `<div class="${mismatchClass}"><span class="field-info" tabindex="0" role="note" aria-label="${tooltip}" data-tooltip="${tooltip}">!</span><span>${esc}</span></div>`;
      }).join("")
    : "";
  // 2. 相关表单字段的叹号追加引擎提示（保留原有测量说明）
  const fieldMap = [
    { editor: ui.userProfileEditor, key: "sweatRate", match: ["无实测出汗率"] },
    { editor: ui.userProfileEditor, key: "sweatSodium", match: ["无汗液钠浓度"] },
    { editor: ui.userProfileEditor, key: "verifiedChoMax", match: ["无已验证碳水上限"] },
    { editor: ui.raceProfileEditor, key: "expectedFinishH", match: ["明显快于", "明显慢于"] },
  ];
  for (const item of fieldMap) {
    const el = item.editor.querySelector(`[data-row-key="${item.key}"] .field-info`);
    if (!el) continue;
    const hit = warnings.find((warning) => item.match.some((k) => warning.includes(k)));
    if (!hit) continue;
    const existing = el.getAttribute("data-tooltip") || el.getAttribute("aria-label") || "";
    const merged = existing
      ? `${existing} ${en ? "[Engine hint]" : "【引擎提示】"} ${hit}`
      : `${en ? "[Engine hint]" : "【引擎提示】"} ${hit}`;
    el.setAttribute("data-tooltip", merged);
    el.setAttribute("aria-label", merged);
  }
}

// 导出补给方案为 CSV 表格（下载文件）
function exportPlanCsv() {
  const out = state.lastRuleOutput;
  const rp = state.lastRaceProfile;
  if (!out || !rp) {
    setStatus("请先生成补给方案", "error");
    return;
  }
  const type = (s) => fuelingPointTypeLabel(s, false);
  const lines = [];
  lines.push("补给方案摘要");
  lines.push("距离(km),爬升(m),下降(m),预计完赛时间(h),时间区间,估算分支,置信度");
  lines.push(
    `${rp.distance_km},${rp.ascent_m},${rp.descent_m},${out.estimated_finish_time_h},"${out.finish_time_range[0]}-${out.finish_time_range[1]}",${out.debug_trace.finish_time_branch},${out.confidence.finish_time}`
  );
  lines.push("碳水(g/h),碳水区间,上限,双糖,液体(ml/h),钠浓度(mg/L),钠(mg/h),咖啡因(mg)");
  lines.push(
    `${out.carbs_per_hour_g},"${out.carb_range_g[0]}-${out.carb_range_g[1]}",${out.cho_ceiling_g_h},${out.dual_sugar},${out.fluid_per_hour_ml},${out.sodium_mg_l},${out.sodium_per_hour_mg},"${out.caffeine_budget_mg[0]}-${out.caffeine_budget_mg[1]}"`
  );
  const weightKg = out.weight_kg || 70;
  lines.push(`蛋白质(g/h),${out.estimated_finish_time_h > 5 ? "5-10（赛程 >5h 启用）" : "—（赛程 ≤5h 不需额外蛋白）"}`);
  lines.push("赛前/赛后建议,,,");
  lines.push(`赛前 36-48h 糖原填充(g/天),${Math.round(weightKg * 10)}-${Math.round(weightKg * 12)}（${weightKg} kg × 10-12 g/kg）`);
  lines.push(`赛前 1-4h 碳水(g),${Math.round(weightKg * 1)}-${Math.round(weightKg * 4)}（低纤维低脂）`);
  lines.push(`赛后 0-4h 碳水(g/h),${Math.round(weightKg * 1.0)}-${Math.round(weightKg * 1.2)}`);
  lines.push(`赛后 0-4h 蛋白(g/h),${Math.round(weightKg * 0.3)}-${Math.round(weightKg * 0.4)}`);
  lines.push("公里,时间(h),类型,碳水(g),能量胶(支),液体总量(ml),电解质水(ml),白水(ml),钠目标(mg),盐丸(粒),咖啡因(mg),蛋白(g),来源");
  const kmKey = (v) => String(Number(Number(v).toFixed(2)));
  const caffByKm = new Map((out.caffeine_schedule || []).map((c) => [kmKey(c.km), c]));
  const proteinByKm = new Map((out.protein_schedule || []).map((p) => [kmKey(p.km), p]));
  for (const p of out.fueling_points) {
    const caff = caffByKm.get(kmKey(p.km));
    const protein = proteinByKm.get(kmKey(p.km));
    const electrolyteMl = p.electrolyte_ml != null ? p.electrolyte_ml : Math.min(p.fluid_ml, Math.round(p.sodium_mg / 0.5));
    const plainMl = p.plain_ml != null ? p.plain_ml : Math.round(p.fluid_ml - electrolyteMl);
    const saltCount = p.salt_tab_count != null ? p.salt_tab_count : Math.ceil(Math.max(0, p.sodium_mg - Math.round(electrolyteMl * 0.5)) / 200);
    const gels = p.gels_count != null ? p.gels_count : (p.carbs_g > 0 ? Math.max(1, Math.round(p.carbs_g / 25)) : 0);
    lines.push(
      `${p.km},${p.time_h},${type(p.source)},${p.carbs_g},${gels},${p.fluid_ml},${electrolyteMl},${plainMl},${p.sodium_mg},${saltCount},${caff ? caff.mg : ""},${protein ? protein.g : ""},${p.source}`
    );
  }
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "trail_lab_fuel_plan.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildPlannerPrompt(userProfile, raceProfile, ruleOutput, language) {
  const contractJson = JSON.stringify(ruleEngineOutputToContract(userProfile, raceProfile, ruleOutput), null, 2);
  const trace = ruleOutput.debug_trace || {};
  const en = language === "en";
  const points = ruleOutput.fueling_points
    .map((p) => {
      const electrolyteMl = p.electrolyte_ml != null ? p.electrolyte_ml : Math.min(p.fluid_ml, Math.round(p.sodium_mg / 0.5));
      const plainMl = p.plain_ml != null ? p.plain_ml : Math.round(p.fluid_ml - electrolyteMl);
      const saltCount = p.salt_tab_count != null ? p.salt_tab_count : Math.ceil(Math.max(0, p.sodium_mg - Math.round(electrolyteMl * 0.5)) / 200);
      const gels = p.gels_count != null ? p.gels_count : (p.carbs_g > 0 ? Math.max(1, Math.round(p.carbs_g / 25)) : 0);
      const drinkPartsEn = [];
      const drinkPartsZh = [];
      if (electrolyteMl > 0) {
        drinkPartsEn.push(`electrolyte drink ${electrolyteMl} ml (≈ ${Math.round(electrolyteMl * 0.5)} mg sodium)`);
        drinkPartsZh.push(`电解质水 ${electrolyteMl} ml（≈${Math.round(electrolyteMl * 0.5)} mg 钠）`);
      }
      if (plainMl > 0) {
        drinkPartsEn.push(`plain water ${plainMl} ml`);
        drinkPartsZh.push(`白水 ${plainMl} ml`);
      }
      if (saltCount > 0) {
        drinkPartsEn.push(`${saltCount} salt tab${saltCount === 1 ? "" : "s"} (≈ ${saltCount * 200} mg sodium)`);
        drinkPartsZh.push(`盐丸 ${saltCount} 粒（≈${saltCount * 200} mg 钠）`);
      }
      return en
        ? `- km ${p.km} (~${p.time_h} h) [${fuelingPointTypeLabel(p.source, en)}]: ${gels} gel${gels === 1 ? "" : "s"} (≈ ${gels * 25} g carbs) + ${drinkPartsEn.join(" + ") || "0 ml fluid"} | sodium target ${p.sodium_mg} mg`
        : `- 公里 ${p.km}（约 ${p.time_h} h）[${fuelingPointTypeLabel(p.source, en)}]：能量胶 ${gels} 支（≈${gels * 25}g 碳水）+ ${drinkPartsZh.join(" + ") || "液体量 0 ml"} | 钠目标 ${p.sodium_mg} mg`;
    })
    .join("\n");

  // 咖啡因分次计划 / 赛中蛋白计划 / 携带清单（引擎分配，AI 照此输出，不得改动数值）
  const caffeineSchedule = ruleOutput.caffeine_schedule || [];
  const caffeineScheduleText = caffeineSchedule.length
    ? caffeineSchedule
        .map((c) =>
          en
            ? `- ${c.time_h} h @ km ${c.km}: ${c.mg} mg${c.optional ? " (optional)" : ""}`
            : `- ${c.time_h} h（km ${c.km}）：${c.mg} mg${c.optional ? "（按需可选）" : ""}`
        )
        .join("\n")
    : en
      ? "none"
      : "无";
  const proteinSchedule = ruleOutput.protein_schedule || [];
  const proteinScheduleText = proteinSchedule.length
    ? proteinSchedule
        .map((p) =>
          en
            ? `- ${p.time_h} h @ km ${p.km}: ~${p.g} g (hot food / protein bar)`
            : `- ${p.time_h} h（km ${p.km}）：约 ${p.g} g（热食/蛋白棒）`
        )
        .join("\n")
    : en
      ? "not enabled (race ≤5h)"
      : "未启用（赛程 ≤5h）";
  const carry = ruleOutput.carry_plan;
  const carryText = carry
    ? en
      ? `Carry list (self-supply points only; what official stations provide is NOT counted):\n- Energy gels: ${carry.gels.count} (per ${carry.gels.per_g} g) ≈ ${carry.gels.weight_g} g\n- Salt tabs: ${carry.salt_tabs.count} (per ${carry.salt_tabs.per_mg} mg)\n- Self water: ~${carry.self_fluid_ml} ml (electrolyte ~${carry.self_electrolyte_ml != null ? carry.self_electrolyte_ml : carry.self_fluid_ml} ml + plain ~${carry.self_plain_ml != null ? carry.self_plain_ml : 0} ml; ~${(carry.self_fluid_ml / 1000).toFixed(1)} kg)\n- Caffeine: ${carry.caffeine_total_mg} mg total (${carry.caffeine_note})\n- Total carry ≈ ${(carry.total_weight_g / 1000).toFixed(2)} kg; on long gaps, take supplies OUT of official stations to lighten the load`
      : `携带清单（仅自补给点所需；官方站可补的不计入）：\n- 能量胶：${carry.gels.count} 支（按 ${carry.gels.per_g} g/支）≈ ${carry.gels.weight_g} g\n- 盐丸：${carry.salt_tabs.count} 粒（按 ${carry.salt_tabs.per_mg} mg/粒）\n- 自备液体：约 ${carry.self_fluid_ml} mL（电解质水 ${carry.self_electrolyte_ml != null ? carry.self_electrolyte_ml : carry.self_fluid_ml} mL + 白水 ${carry.self_plain_ml != null ? carry.self_plain_ml : 0} mL；约 ${(carry.self_fluid_ml / 1000).toFixed(1)} kg）\n- 咖啡因：共 ${carry.caffeine_total_mg} mg（${carry.caffeine_note}）\n- 合计携带约 ${(carry.total_weight_g / 1000).toFixed(2)} kg；两站间隔长时建议在官方站带出补给、减少随身携带`
    : "";
  const summary = [
    en
      ? `Estimated finish: ${ruleOutput.estimated_finish_time_h} h (range ${ruleOutput.finish_time_range[0]}–${ruleOutput.finish_time_range[1]}, ${ruleOutput.finish_time_source === "user_input" ? "user input" : "engine estimate"}, branch ${trace.finish_time_branch || "?"}, confidence ${ruleOutput.confidence.finish_time})`
      : `预计完赛时间: ${ruleOutput.estimated_finish_time_h} h（区间 ${ruleOutput.finish_time_range[0]}–${ruleOutput.finish_time_range[1]}，${ruleOutput.finish_time_source === "user_input" ? "用户输入" : "引擎估算"}，分支 ${trace.finish_time_branch || "?"}，置信度 ${ruleOutput.confidence.finish_time}）`,
    en
      ? `Carbs: ${ruleOutput.carbs_per_hour_g} g/h (range ${ruleOutput.carb_range_g[0]}–${ruleOutput.carb_range_g[1]}, ceiling ${ruleOutput.cho_ceiling_g_h}, ${ruleOutput.dual_sugar ? "dual sugar" : "single sugar"})`
      : `碳水: ${ruleOutput.carbs_per_hour_g} g/h（区间 ${ruleOutput.carb_range_g[0]}–${ruleOutput.carb_range_g[1]}，上限 ${ruleOutput.cho_ceiling_g_h}，${ruleOutput.dual_sugar ? "双糖" : "单糖"}）`,
    en
      ? `Fluid: ${ruleOutput.fluid_per_hour_ml} ml/h${ruleOutput.fluid_estimated ? " (estimated)" : " (measured sweat rate)"}`
      : `液体: ${ruleOutput.fluid_per_hour_ml} ml/h${ruleOutput.fluid_estimated ? "（估算）" : "（实测汗率）"}`,
    en
      ? `Sodium: ${ruleOutput.sodium_mg_l} mg/L x ${(ruleOutput.fluid_per_hour_ml / 1000).toFixed(2)} L/h = ${ruleOutput.sodium_per_hour_mg} mg/h`
      : `钠: ${ruleOutput.sodium_mg_l} mg/L × ${(ruleOutput.fluid_per_hour_ml / 1000).toFixed(2)} L/h = ${ruleOutput.sodium_per_hour_mg} mg/h`,
    en
      ? `Caffeine budget: ${ruleOutput.caffeine_budget_mg[0]}–${ruleOutput.caffeine_budget_mg[1]} mg (${ruleOutput.caffeine_tier})`
      : `咖啡因预算: ${ruleOutput.caffeine_budget_mg[0]}–${ruleOutput.caffeine_budget_mg[1]} mg（${ruleOutput.caffeine_tier}）`,
    ...(ruleOutput.estimated_finish_time_h > 5
      ? [en
          ? `In-race protein (>5h, optional, weaker evidence [A2]): ~10-20 g every 2-3 h at official stations (hot food/protein bar)`
          : `赛中蛋白（>5h，可选、证据较弱 [A2]）：官方站热食/蛋白棒，每 2-3 小时约 10-20 g`]
      : []),
    (en
      ? `Pre-race only: 36-48h glycogen load ${Math.round((ruleOutput.weight_kg || 70) * 10)}-${Math.round((ruleOutput.weight_kg || 70) * 12)} g/day; 1-4h before race ${Math.round((ruleOutput.weight_kg || 70) * 1)}-${Math.round((ruleOutput.weight_kg || 70) * 4)} g carbs (low fiber/fat)`
      : `赛前（仅赛前）: 36-48h 糖原填充 ${Math.round((ruleOutput.weight_kg || 70) * 10)}-${Math.round((ruleOutput.weight_kg || 70) * 12)} g/天；赛前 1-4h ${Math.round((ruleOutput.weight_kg || 70) * 1)}-${Math.round((ruleOutput.weight_kg || 70) * 4)} g 碳水（低纤维低脂）`),
    (en
      ? `Post-race recovery (NOT pre-race, state at the END): 0-4h ${Math.round((ruleOutput.weight_kg || 70) * 1.0)}-${Math.round((ruleOutput.weight_kg || 70) * 1.2)} g carbs/h + ${Math.round((ruleOutput.weight_kg || 70) * 0.3)}-${Math.round((ruleOutput.weight_kg || 70) * 0.4)} g protein/h`
      : `赛后恢复（不属于跑前准备，放在结尾说）: 0-4h 每小时 ${Math.round((ruleOutput.weight_kg || 70) * 1.0)}-${Math.round((ruleOutput.weight_kg || 70) * 1.2)} g 碳水 + ${Math.round((ruleOutput.weight_kg || 70) * 0.3)}-${Math.round((ruleOutput.weight_kg || 70) * 0.4)} g 蛋白`),
    en ? `Fueling points (typed):\n${points}` : `补给点清单（按类型标注）:\n${points}`,
    en
      ? `Fuel-form reference (convert carbs into concrete food, NEVER change numbers):\n- 1 gel ≈ 20-25 g carbs (assumed here as a common 25 g gel — check your own gel's label; common 20-30 g, dual-sugar gels higher; choose dual-sugar when rate ≥60 g/h)\n- 1 banana ≈ 25-30 g carbs; 1 slice white bread ≈ 15 g; sports drink ≈ 60-80 g carbs/L\n- 1 salt tab ≈ 100-300 mg sodium; cola ≈ 11 g carbs/100 mL + caffeine\n- Official aid stations typically provide: water, electrolyte drink, banana, bread/cookies, cola, salt tabs, and hot food on longer races\n- Self-supply points: carried gels, bars, salt tabs, own water — gels suit intake while moving without long stops\nPlain-language meanings of point types (users are everyday runners — ALWAYS say it simply, never quote "pre-climb/time-based"):\n- official aid station = staffed spot on course with water/food; refill fluids & salt quickly, take solid food out and eat while walking out, don't linger (critical near cut-off)\n- pre-climb self-supply = long stretch with no station before a big climb; take gels/water BEFORE the climb, not mid-climb\n- during-climb self-supply = mid-climb, small sips of gel/water\n- time-based self-supply = 30-45 min since last intake or next station not reached; fuel on schedule, don't wait until thirsty/hungry\nQuantity & sodium-source reference (avoid vague words, never make up amounts):\n- one small sip ≈ 100-150 mL; a big sip / half-bottle ≈ 200-300 mL; 1 salt tab ≈ 100-300 mg sodium (commonly 200 mg, check label)\n- Electrolyte drink contains sodium (commonly 300-700 mg/L, e.g. 400-500 mg/L): at an official aid station, if drinking electrolyte drink, sodium is partly covered — top up with salt tabs only for the difference, avoid double-counting (cap 1000 mg/h); at self-supply points with plain water, cover sodium with salt tabs\n- Carry-over logic: take supplies OUT of an official station (e.g. 1 banana + 1 bottle electrolyte drink + 1-2 salt tabs) for the next self-supply point — say "this station you take X for the next self-fuel"; most useful when the gap between stations is long`
      : `补给形式参考（把碳水换算成具体食物，禁止改动数值）：\n- 1 支能量胶 ≈ 20-25 g 碳水（本文按常见 25 g/支估算——你手头胶的实际含糖量以包装为准，常见 20-30 g/支，双糖胶可更高；速率 ≥60 g/h 应选双糖）\n- 1 根香蕉 ≈ 25-30 g 碳水；1 片白面包 ≈ 15 g；运动饮料 ≈ 60-80 g 碳水/L\n- 1 粒盐丸 ≈ 100-300 mg 钠；可乐 ≈ 11 g 碳水/100 mL + 咖啡因\n- 官方补给站通常提供：水、电解质饮料、香蕉、面包/饼干、可乐、盐丸；长距离大站有热食/热汤\n- 自补给点建议：随身能量胶、能量棒、盐丸、自备水——胶适合跑动中快速摄入、少停表\n补给点类型通俗解释（用户是普通跑者，解释时必须用大白话，禁止照搬"爬升前/时间兜底"这类内部词）：\n- 官方补给站 = 赛道上有志愿者摆摊、能补水补食的地方；进站快速补液补盐，香蕉/面包等固体食物可拿了带出站、出站边走边吃，别在站里耗太久（接近关门时尤其重要）\n- 自补给（爬坡前）= 这段大爬坡开始之前，前方很长一段路没有补给站；提前把坡上要吃的胶/水补上，别边爬边补\n- 自补给（爬坡中）= 爬坡进行到中段，用随身胶和水小口补\n- 自补给（时间兜底）= 距上次补给已 30-45 分钟，或还没到下一个补给站；按时间自己补一次，别等渴了饿了才补\n量词与钠来源参考（避免歧义，禁止编造量）：\n- 一小口水 ≈ 100-150 mL；一大口/半瓶 ≈ 200-300 mL；1 粒盐丸 ≈ 100-300 mg 钠（常见 200 mg，以包装为准）\n- 电解质饮料含钠（常见 300-700 mg/L，如 400-500 mg/L）：在官方站喝电解质饮料时，钠已由饮料提供，盐丸按"目标钠 − 饮料钠"补足、别重复叠加（上限 1000 mg/h）；自补给点只喝白水时，钠靠盐丸补\n- 携带逻辑：官方站可带走补给（如 1 根香蕉 + 1 瓶电解质饮料 + 1-2 粒盐丸），供下一段自补给点用——解释时说明"本站带走 X，供下一自补点消耗"，两站间隔长时尤其有用`,
    en
      ? `Indivisible items (NEVER output fractional gels or salt tabs):\n- 1 gel ≈ 25 g carbs; 1 salt tab ≈ 200 mg sodium; per fueling point state whole items only; official aid stations may substitute banana/bread for gels equally`
      : `不可分切物品与饮品（解释时禁止出现小数支/小数粒，白水/电解质水必须按引擎给的毫升数）：\n- 能量胶≈25g 碳水/支、盐丸≈200mg 钠/粒；每个补给点按引擎给出的整支/整粒数执行；电解质水按引擎给出的毫升数执行（≈500mg/L，引擎已保证每点至少 1/3 白水，解释时不要建议把白水改成电解质水）；官方补给点可用香蕉/面包等量替换能量胶`,
    en
      ? `Caffeine per-point plan (state the point AND amount, never just the total):\n${caffeineScheduleText}`
      : `咖啡因分次计划（具体到补给点输出，禁止只报总量）：\n${caffeineScheduleText}`,
    en
      ? `In-race protein plan (official stations, >5h):\n${proteinScheduleText}`
      : `赛中蛋白计划（官方补给站，>5h 启用）：\n${proteinScheduleText}`,
    ...(carryText ? [carryText] : []),
    en ? `Warnings: ${ruleOutput.warnings.join("; ") || "none"}` : `警告: ${ruleOutput.warnings.join("；") || "无"}`,
  ];
  if (language === "en") {
    return [
      "You are a fueling strategy explainer only. Never compute or invent numbers; use only the Rule Engine results below.",
      "Output in English. Use short sentences and lists. Do not repeat the contract JSON.",
      "Structure your answer strictly:",
      "1. One-sentence conclusion: expected finish time and overall fueling tone (official vs self-supply).",
      "2. Pre-race preparation: ONLY pre-race content (36-48h glycogen load, 1-4h pre-race meal); NEVER put post-race 0-4h recovery here — state it in a short final section instead.",
      "3. In-race timeline: go through fueling points in km order and give a concrete, actionable fueling recommendation for EACH point, by type:",
      "   - Official aid station: use what the station provides (saves carrying) — solid food (banana/bread), electrolyte drink, cola when a sugar/caffeine boost is wanted. Keep the stop short: refill fluids & salt quickly, take solid food OUT and eat it while walking out of the station (walk-and-eat). **State exactly how much you take out** (e.g. \"take 1 banana + 1 bottle electrolyte drink for the pre-climb section at 23km\"); the next self-supply point consumes this carried-over amount first. If drinking electrolyte drink, top up sodium with salt tabs only for the difference (don't double count). Convert that point's carbs/fluid/sodium into concrete food (e.g. \"~1 gel or 1 banana + 200 ml sports drink\").",
      "   - Self-supply point (pre-climb / climb / time-based): first consume what you carried OUT of the previous official station, then your own gels/salt tabs/water. You may drink the electrolyte drink carried from the station, but carry enough (1-2 bottles on long gaps) and alternate it with plain water — avoid drinking only electrolyte drink PLUS extra salt tabs all day: too much sodium makes you thirstier (cap 1000 mg/h). Take them while moving, avoid long stops; top up BEFORE a climb; use the quantity reference (one small sip ≈ 100-150 mL, 1 salt tab ≈ 100-300 mg sodium).",
      "   - Every fueling point must state EXPLICIT amounts: carbs converted into gels/bananas, fluid in ml, sodium via the template below — never \"as needed / a moderate amount / a few sips\".",
      "   - Sodium template: \"drink X ml electrolyte drink (~500 mg/L ≈ Y mg sodium), target Z mg, top up W mg (≈N salt tab(s)); if plain water only, take N salt tab(s)\" — all numbers from the fueling point list's sodium fields; never say \"salt tabs as needed\".",
      "   - Caffeine & protein: use the per-point plans above — state WHICH point and HOW MUCH (mg/g), never just the total; personalize by the runner's daily caffeine habit — heavy users (>400 mg/day) may get less effect, keep the day's total under ~400 mg and don't quit abruptly pre-race; light users/unknown start at 75 mg and watch for palpitations/sleep; explain why the fueling interval is 20-30 min (small amounts often, matching the ~60 g/h gut absorption ceiling for carbs; one big dose piles up in the gut [A7][B5]).",
      "   - End with a \"what to carry\" list: gels/salt tabs/water/caffeine counts and total weight from the carry list above; note that taking supplies out of official stations lightens the load on long gaps.",
      "   Never add or change any engine number.",
      "4. Key reminders: rephrase 1-3 most relevant warnings in plain language.",
      "5. Contingency: GI trouble, heat, or missed aid station (strategy only, never change numbers). For GI trouble: gels and sports drinks are NOT necessarily gentler than solid food (banana/bread) — a gel is concentrated hypertonic carbs and can irritate more if under-hydrated. Reduce portion size, dilute the gel with water, take small frequent amounts, and prefer the form the runner has tolerated in training. If severe, switch to hypotonic fluids only and prompt a temperature refill + recompute.",
      "",
      "=== Rule Engine results (only numeric source) ===",
      ...summary,
      "",
      "=== Contract JSON (for reference, do not repeat) ===",
      contractJson,
    ].join("\n");
  }

  return [
    "你是补给策略智能体，只负责解释，不负责计算。",
    "所有数值必须来自下方规则引擎结果，禁止新增、修改或估算任何数字。",
    "请始终使用简体中文输出，使用短句和列表，内容精炼，不重复契约 JSON。",
    "输出结构（严格按顺序）：",
    "1. 一句话结论：预计完赛时间与整体补给基调（官方补给点为主还是自补给为主）。",
    "2. 跑前准备：只写赛前内容（36-48h 糖原填充、赛前 1-4h 加餐）；赛后 0-4h 恢复内容禁止混入，放在结尾单独一小段（赛后再补碳水+蛋白）。",
    "3. 赛中时间轴：按公里顺序逐个补给点，给出具体可执行的补给建议（按类型区分）：",
    "   - 官方补给站：优先用站上供应（省背负）——香蕉/面包等固体食物、电解质饮料；需要提神可喝可乐。站内停留尽量短：快速补液补盐，固体食物可拿了带出站、出站后边走边吃（walk-and-eat）。**明确说明从本站带走多少**（如\"带走 1 根香蕉 + 1 瓶电解质饮料，供下一段到 23km 爬坡前自补\"），下一自补给点优先消耗这些带走量；喝电解质饮料时盐丸按差量补、别与饮料钠重复。把该点的碳水/液体/钠换算成具体食物（如\"约 1 支胶 或 1 根香蕉 + 200 mL 运动饮料\"）。",
    "   - 自补给点（爬升前/爬升段/时间兜底）：优先消耗上一官方站带走的食物/饮料，再补自带的胶/盐丸/水；可喝官方站带出的电解质饮料，但要带够量（两站间隔长时带 1-2 瓶），白水与电解质饮料交替/混合喝——别整段只喝电解质水又叠加盐丸，钠过高会越喝越渴（上限 1000 mg/h）；跑动中快速摄入、别长时间停留；爬升段尽量在爬升前补；量词按参考（一小口≈100-150mL、1粒盐丸≈100-300mg钠）。",
    "   - 每个补给点必须给出明确量：碳水换算成\"几支胶/几根香蕉\"、液体明确 mL；钠按下面模板给具体数字，禁止\"适量/按需/几口\"等模糊词。",
    "   - 钠表述模板：\"本站喝 X mL 电解质水（按 500mg/L 约含 Y mg 钠）+ Z mL 白水 + 盐丸 N 粒（≈M mg 钠）\"——白水/电解质水毫升数与盐丸粒数全部来自补给点清单，禁止改动；电解质水未覆盖的钠缺口按全程累计由盐丸补足，禁止\"盐丸按需补\"和任何小数粒。",
    "   - 咖啡因与蛋白：按上方\"咖啡因分次计划/赛中蛋白计划\"具体到补给点（哪个点、多少 mg/g），不要只报总量；结合用户日常咖啡因习惯说明耐受——习惯高（>400mg/天）者效应可能减弱、当日总量不超过约 400mg、赛前勿突然停用；习惯低/未填者从 75mg 小剂量起步、留意心悸与睡眠；并解释补给间隔 20-30 分钟的原因（少量多次，匹配小肠约 60 g/h 的碳水吸收上限，单次大剂量易堆积肠胃 [A7][B5]）。",
    "   - 结尾\"需要自带\"清单：按上方携带清单给出能量胶/盐丸/水/咖啡因的数量与总重量，并提示两站间隔长时在官方站带出补给可减负。",
    "   - 禁止新增或改动引擎给出的任何数值。",
    "4. 关键提醒：从引擎警告中选最相关的 1–3 条，用通俗语言复述。",
    "5. 异常预案：肠胃不适、天气变热、错过补给站时如何调整（只给策略调整，不改数值）。肠胃不适时注意：能量胶和运动饮料不一定比固体食物（香蕉/面包）更好消化——胶是高浓度高渗碳水，补水不足反而更刺激胃；正确做法是先减量、把胶配水冲稀、少量多次，优先选用户实测耐受过的形态；严重时只喝低渗液体，并提示回填温度重新计算。",
    "",
    "=== 规则引擎结果（唯一数值来源）===",
    ...summary,
    "",
    "=== 契约 JSON（仅供核对，不要复述）===",
    contractJson,
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
    const isDeepSeek = provider === "deepseek";
    const base = isDeepSeek ? "https://api.deepseek.com/v1" : "https://api.openai.com/v1";
    const payload = {
      model,
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_tokens: 8192,
    };
    if (isDeepSeek) {
      // DeepSeek V4 思考模式默认开启且 effort=high，思考链(reasoning_content)会占满
      // max_tokens 总预算，导致最终回答 content 为空（HTTP 200 但无内容）。
      // 本任务输出结构固定、无需深度推理，显式关闭思考模式以获得稳定最终回答。
      payload.thinking = { type: "disabled" };
    }
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(tf("aiApiFailed", { status: response.status, statusText: response.statusText }));
    }
    const data = await response.json();
    const message = data?.choices?.[0]?.message || {};
    // 只取最终回答 content；思考链（reasoning_content）一律不展示给用户。
    // 若 content 为空则按失败处理（提示重试/调大 max_tokens），而不是回退到思考内容。
    const text = message.content;
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
  { key: "weight", label: { zh: "体重 (kg)", en: "Weight (kg)" }, type: "number", step: "0.1", min: 0, placeholder: "optionalPlaceholder", help: { zh: "当前体重（裸重更佳），用于咖啡因剂量、补液与赛后恢复计算。如已在运动文件中识别会自动带入。", en: "Current body weight (ideally nude). Used for caffeine dosing, fluid and post-race recovery. Auto-filled when recognized from the activity file." } },
  { key: "physiologicalMaxHr", label: { zh: "生物最大心率 (bpm)", en: "physiological max HR (bpm)" }, type: "number", step: "1", min: 0, placeholder: "optionalPlaceholder", help: { zh: "你的真实生理最大心率（而非本次运动峰值）。用于划分心率区间与强度评估；不填则引擎不做该校准。", en: "Your true physiological max heart rate (not this session's peak). Used to set HR zones and assess intensity; leave empty to skip this calibration." } },
  { key: "vo2max", label: { zh: "最大摄氧量 (ml/kg/min)", en: "VO2max (ml/kg/min)" }, type: "number", step: "1", min: 0, placeholder: "optionalPlaceholder", help: { zh: "有氧能力指标（手表/测试可得）。用于能力校验与完赛时间兜底；缺省时引擎降级用其他信号。", en: "Aerobic capacity (from watch or lab test). Used for ability cross-check and finish-time fallback; if missing the engine degrades to other signals." } },
  { key: "itraPoints", label: { zh: "ITRA 积分 (pts)", en: "ITRA points (pts)" }, type: "number", step: "1", min: 0, placeholder: "optionalPlaceholder", help: { zh: "国际越野跑协会按完赛成绩折算的积分（0-1000）。用于能力评估与完赛时间兜底；缺省时降级用其他信号。", en: "International Trail Running Association points (0-1000) derived from race results. Used for ability and finish-time fallback; if missing the engine degrades to other signals." } },
  {
    key: "hrvStatus",
    label: { zh: "HRV 状态", en: "HRV status" },
    type: "select",
    options: [
      { value: "", label: { zh: "请选择", en: "Select" } },
      { value: "balanced", label: { zh: "平衡", en: "Balanced" } },
      { value: "unbalanced", label: { zh: "不平衡", en: "Unbalanced" } },
      { value: "low", label: { zh: "偏低", en: "Low" } },
      { value: "poor", label: { zh: "极差", en: "Poor" } },
      { value: "no_status", label: { zh: "无状态", en: "No status" } },
    ],
    help: { zh: "手表显示的 HRV 恢复状态（普通 FIT 文件不含该数据，需手动选择）。只影响当日发挥修正，不污染能力评估。", en: "HRV recovery status shown on your watch (ordinary FIT files don't contain it; select manually). Only adjusts the day's performance, never the ability estimate." },
  },
  { key: "verifiedChoMax", label: { zh: "已验证碳水上限 (g/h)", en: "Verified CHO ceiling (g/h)" }, type: "number", step: "1", min: 0, placeholder: "optionalPlaceholder", help: { zh: "长距离拉练（≥2h）中实际执行且无胃肠症状的最高每小时碳水摄入（如从 45 g/h 起逐步上调）。", en: "Highest hourly carbohydrate intake sustained without GI symptoms in long runs (≥2h); e.g. build up from 45 g/h." } },
  { key: "sweatRate", label: { zh: "出汗率 (L/h)", en: "Sweat rate (L/h)" }, type: "number", step: "0.01", min: 0, placeholder: "optionalPlaceholder", help: { zh: "体重法：跑前裸重 − 跑后裸重 + 摄入液体 − 尿量，除以运动时长。建议 1 小时稳定强度实测。", en: "Body-weight method: (pre weight − post weight + fluid − urine) / duration. Best measured over a 1 h steady-effort session." } },
  { key: "sweatSodium", label: { zh: "汗液钠浓度 (mg/L)", en: "Sweat sodium (mg/L)" }, type: "number", step: "1", min: 0, placeholder: "optionalPlaceholder", help: { zh: "需专业汗液测试（汗贴/实验室）得出 mg/L；没有则留空，引擎用保守钠区间。", en: "From a professional sweat test (patch/lab) in mg/L; leave empty for conservative sodium defaults." } },
  { key: "caffeineHabit", label: { zh: "咖啡因习惯 (mg/天)", en: "Caffeine habit (mg/day)" }, type: "number", step: "1", min: 0, placeholder: "optionalPlaceholder", help: { zh: "日常平均每天摄入的咖啡因总量：咖啡约 80–150mg/杯、茶约 30–50mg/杯、含咖啡因能量胶 50–100mg/支。", en: "Average daily caffeine intake: coffee ~80–150mg/cup, tea ~30–50mg/cup, caffeinated gel 50–100mg each." } },
  {
    key: "giSensitivity",
    label: { zh: "肠胃敏感度", en: "GI sensitivity" },
    type: "select",
    options: [
      { value: "", label: { zh: "请选择", en: "Select" } },
      { value: "low", label: { zh: "低", en: "Low" } },
      { value: "medium", label: { zh: "中", en: "Medium" } },
      { value: "high", label: { zh: "高", en: "High" } },
    ],
    help: { zh: "主观评估比赛/训练中胃肠不适频率：低=很少不适；中=偶尔；高=经常恶心、胀气或腹泻。", en: "Subjective GI discomfort frequency: low=rare, medium=occasional, high=frequent nausea/bloating/diarrhoea." },
  },
  {
    key: "heatAcclimated",
    label: { zh: "是否热适应", en: "Heat acclimated" },
    type: "select",
    options: [
      { value: "", label: { zh: "请选择", en: "Select" } },
      { value: "no", label: { zh: "否", en: "No" } },
      { value: "yes", label: { zh: "是", en: "Yes" } },
    ],
    help: { zh: "近两周内是否在相似高温环境中训练过。是=高温修正降权，液体估计更可信。", en: "Trained in similar hot conditions within the past two weeks? Yes reduces high-temperature penalty and improves fluid estimates." },
  },
];

const CP_OFFICIAL_COLUMNS = [
  { key: "name", label: { zh: "名称", en: "Name" }, type: "text", flex: 1.3 },
  { key: "distance", label: { zh: "所在距离 (km)", en: "Distance (km)" }, type: "number", step: "0.1", min: 0, flex: 0.55 },
  { key: "cutoff", label: { zh: "关门时间", en: "Cutoff" }, type: "time", flex: 0.9 },
  { key: "climb", label: { zh: "区间爬升 (m)", en: "Climb (m)" }, type: "number", step: "1", min: 0, flex: 0.7 },
  { key: "descent", label: { zh: "区间下降 (m)", en: "Descent (m)" }, type: "number", step: "1", min: 0, flex: 0.7 },
];
const CP_ROUTE_COLUMNS = [
  { key: "type", label: { zh: "类型", en: "Type" }, type: "select", options: [
    { value: "climb", label: { zh: "爬升", en: "Climb" } },
    { value: "descent", label: { zh: "下降", en: "Descent" } },
  ], flex: 0.7 },
  { key: "start", label: { zh: "起点 (km)", en: "Start (km)" }, type: "number", step: "0.1", min: 0, flex: 1 },
  { key: "end", label: { zh: "终点 (km)", en: "End (km)" }, type: "number", step: "0.1", min: 0, flex: 1 },
  { key: "height", label: { zh: "高差 (m)", en: "Height (m)" }, type: "number", step: "1", min: 0, flex: 0.8 },
];

const raceProfileFields = [
  // 左列：基础路线参数
  { key: "distanceKm", label: { zh: "距离 (km)", en: "Distance (km)" }, type: "number", step: "0.1", min: 0, placeholder: "optionalPlaceholder" },
  { key: "ascentM", label: { zh: "总爬升 (m)", en: "Total ascent (m)" }, type: "number", step: "1", min: 0, placeholder: "optionalPlaceholder" },
  { key: "descentM", label: { zh: "总下降 (m)", en: "Total descent (m)" }, type: "number", step: "1", min: 0, placeholder: "optionalPlaceholder" },
  { key: "segmentThresholdM", label: { zh: "爬升/下降阈值 (m)", en: "Climb/descent threshold (m)" }, type: "number", step: "1", min: 0, placeholder: "optionalPlaceholder", help: { zh: "只有高差超过该阈值的路段才会被算作爬升/下降路段；低于阈值的视为平坦。读取目标运动文件时也按此阈值提取路段。", en: "Only segments whose height exceeds this threshold count as climb/descent segments; smaller ones are treated as flat. Segments are also extracted from the target activity file using this threshold." } },
  { key: "expectedFinishH", label: { zh: "期望完赛时间 (h)", en: "Expected finish time (h)" }, type: "number", step: "0.1", min: 0, placeholder: "optionalPlaceholder" },
  { key: "weatherTemp", label: { zh: "预计温度 (°C)", en: "Expected temperature (°C)" }, type: "number", step: "0.1", placeholder: "optionalPlaceholder" },
  { key: "humidity", label: { zh: "预计湿度 (%)", en: "Expected humidity (%)" }, type: "number", step: "1", min: 0, max: 100, placeholder: "optionalPlaceholder" },
  { key: "locationNotes", label: { zh: "线路备注", en: "Route notes" }, type: "textarea", placeholder: "raceNotesPlaceholder" },
  // 右列：官方补给点 + 爬升/下降路段（位置均为距起点相对距离，提示统一在“!”悬浮中）
  { key: "officialCp", label: { zh: "官方补给点", en: "Official aid stations" }, type: "cplist", columns: CP_OFFICIAL_COLUMNS, addLabel: { zh: "新增补给点", en: "Add aid station" }, help: { zh: "FIT 有 CP 点会自动导入；也可手动新增。位置为距起点相对距离 (km)，每站可填名称、所在距离、关门时间、区间爬升与下降。列表从上到下需按距离递增排列。注意：补给点信息仅用于图中标记，不作为绘制海拔曲线的依据（不依据累计爬升/下降绘制图形）。", en: "CP points are auto-imported from FIT; add more manually. Position = relative distance (km) from the start. Each station: name, distance, cutoff, segment climb and descent. Rows must be ordered by increasing distance from top to bottom. Note: aid-station info is only used as chart markers and does not affect the elevation curve (the curve is not drawn from cumulative ascent/descent)." } },
  { key: "routeSegments", label: { zh: "爬升/下降路段", en: "Climb/descent segments" }, type: "cplist", columns: CP_ROUTE_COLUMNS, addLabel: { zh: "新增路段", en: "Add segment" }, help: { zh: "按距离位置从上到下依次设定各爬升/下降路段。每行填写类型（爬升/下降）、起点、终点（距起点相对距离 km）与高差 (m)。爬升段从起点爬升至终点，终点即该段海拔最高处；下降段从起点下降至终点。列表需依次排列且互不重叠。只有高差超过“爬升/下降阈值”的路段才会被算作路段。读取目标运动文件后会自动生成，可手动修改。", en: "Set each climb/descent segment in order by distance, top to bottom. Each row: type (climb/descent), start, end (relative distance in km) and height (m). A climb rises from start to end (its highest point); a descent falls from start to end. Rows must be ordered and must not overlap. Only segments above the climb/descent threshold count. Auto-generated after reading a target activity file; edit manually as needed." } },
];

function renderEditor(container, fields, values) {
  const renderOne = (field) => {
    const value = values?.[field.key] ?? "";
    const enabled = values?.__enabled?.[field.key] ?? hasMeaningfulValue(value);
    const placeholder = escapeAttr(field.placeholder ? t(field.placeholder) : t("optionalPlaceholder"));
    const label = escapeHtml(typeof field.label === "object" ? field.label[state.language] : field.label);
    const help = typeof field.help === "object" ? field.help[state.language] : field.help;
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
          empty[col.key] = col.key === "type" ? "climb" : "";
        });
        cpItems = [empty];
      }
      const en = state.language === "en";
      const header = `
          <span class="cp-head" style="grid-template-columns:${gridTemplate}">${columns.map((col) => `<span>${escapeHtml(colLabel(col))}</span>`).join("")}<span></span></span>`;
      const rows = cpItems.map((cp, index) => {
        const cells = columns.map((col) => {
          const type = colType(col);
          if (type === "select") {
            const opts = (col.options || []).map((option) => {
              const display = escapeHtml(typeof option.label === "object" ? option.label[state.language] : option.label);
              const val = escapeAttr(option.value);
              const sel = String(cp?.[col.key] ?? "") === option.value ? " selected" : "";
              return `<option value="${val}"${sel}>${display}</option>`;
            }).join("");
            return `<select class="cp-input" data-cp-field="${fieldKeyAttr}" data-cp-index="${index}" data-cp-key="${col.key}">${opts}</select>`;
          }
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
      const tooltip = help ? ` data-tooltip="${escapeAttr(help)}"` : "";
      return `
        <label class="field-row" data-row-key="${fieldKeyAttr}">
          <span class="field-topline"><input data-enabled-field="${fieldKeyAttr}" type="checkbox" ${enabled ? "checked" : ""} /> <span>${label}</span>${help ? `<span class="field-info" tabindex="0" role="note" aria-label="${escapeAttr(help)}"${tooltip}>!</span>` : ""}</span>
          <textarea data-field="${fieldKeyAttr}" placeholder="${placeholder}">${valueText}</textarea>
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
      const tooltip = help ? ` data-tooltip="${escapeAttr(help)}"` : "";
      return `
        <label class="field-row" data-row-key="${fieldKeyAttr}">
          <span class="field-topline"><input data-enabled-field="${fieldKeyAttr}" type="checkbox" ${enabled ? "checked" : ""} /> <span>${label}</span>${help ? `<span class="field-info" tabindex="0" role="note" aria-label="${escapeAttr(help)}"${tooltip}>!</span>` : ""}</span>
          <select data-field="${fieldKeyAttr}">
            ${renderedOptions}
          </select>
        </label>`;
    }
    const tooltip = help ? ` data-tooltip="${escapeAttr(help)}"` : "";
    return `
      <label class="field-row" data-row-key="${fieldKeyAttr}">
        <span class="field-topline"><input data-enabled-field="${fieldKeyAttr}" type="checkbox" ${enabled ? "checked" : ""} /> <span>${label}</span>${help ? `<span class="field-info" tabindex="0" role="note" aria-label="${escapeAttr(help)}"${tooltip}>!</span>` : ""}</span>
        <input data-field="${fieldKeyAttr}" type="${fieldTypeAttr}" value="${valueAttr}" step="${stepAttr}" ${minAttr ? `min="${minAttr}"` : ""} ${maxAttr ? `max="${maxAttr}"` : ""} placeholder="${placeholder}" />
      </label>`;
  };
  // 步骤三：普通字段与 cplist（官方补给点/爬升路段）分左右两列独立布局，
  // 两列高度互不影响，避免路段很多时把「预计湿度」与「线路备注」之间挤出大空档
  const leftFields = fields.filter((f) => f.type !== "cplist");
  const rightFields = fields.filter((f) => f.type === "cplist");
  if (rightFields.length) {
    container.innerHTML = `<div class="editor-col-left">${leftFields.map(renderOne).join("")}</div><div class="editor-col-right">${rightFields.map(renderOne).join("")}</div>`;
  } else {
    container.innerHTML = fields.map(renderOne).join("");
  }
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
  const descentM = Math.max(safeFloat(form.descentM) || 0, 0);

  if (safeFloat(form.descentM) !== null && (safeFloat(form.descentM) < 0 || safeFloat(form.descentM) > 30000)) {
    return { ok: false, message: "总下降应在 0–30000 米之间" };
  }

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

  // 路段（爬升/下降整合）：范围检查针对所有填写行；顺序/距离/爬升合计只针对高差 ≥ 阈值的“有效路段”
  let segList = [];
  try {
    const parsed = JSON.parse(String(form.routeSegments || "[]"));
    if (Array.isArray(parsed)) segList = parsed;
  } catch (error) {
    segList = [];
  }
  const segmentThreshold = Math.max(safeFloat(form.segmentThresholdM) || 50, 0);
  const effectiveSegs = [];
  for (let i = 0; i < segList.length; i++) {
    const start = safeFloat(segList[i].start);
    const end = safeFloat(segList[i].end);
    const height = Math.max(safeFloat(segList[i].height) || 0, 0);
    const isDescent = segList[i].type === "descent";
    if (start === null && end === null && height === null && !segList[i].type) continue;
    if (start === null || end === null || start >= end) {
      return { ok: false, message: t("raceSegRangeInvalid") };
    }
    if (height >= segmentThreshold) {
      effectiveSegs.push({ start, end, height, isDescent });
    }
  }
  let prevEnd = -1;
  let totalClimb = 0;
  for (const seg of effectiveSegs) {
    if (seg.start < prevEnd) {
      return { ok: false, message: t("raceSegOrderInvalid") };
    }
    if (seg.end > distanceKm) {
      return { ok: false, message: t("raceSegExceedsDistance") };
    }
    if (!seg.isDescent) {
      totalClimb += seg.height;
    }
    prevEnd = seg.end;
  }
  if (ascentM > 0 && totalClimb > ascentM) {
    return { ok: false, message: t("raceClimbExceedsAscent") };
  }

  return { ok: true };
}

function buildSimulatedElevation(raceProfile) {
  // 不读取 FIT 时，按步骤三爬坡/下降路段绘制：每段线性单调（爬升段终点即该段海拔最高处，下降段单调下降，平坦段水平），起点默认海拔 0
  const points = [{ km: 0, altitude: 0 }];
  let currentKm = 0;
  let currentAltitude = 0;
  for (const [segmentDistance, segmentDelta] of raceProfile.climb_segments) {
    const endKm = currentKm + segmentDistance;
    const endAltitude = currentAltitude + segmentDelta;
    points.push({ km: Number(endKm.toFixed(2)), altitude: Number(endAltitude.toFixed(1)) });
    currentKm = endKm;
    currentAltitude = endAltitude;
  }
  if (points[points.length - 1].km < raceProfile.distance_km) {
    points.push({ km: raceProfile.distance_km, altitude: currentAltitude });
  }
  return points;
}

// 从目标路线 FIT 的海拔记录自动提取爬坡路段（起点/终点/爬升高度），可再手动修改；阈值由“爬升/下降阈值”决定
function extractClimbSegmentsFromFit(decoded, minClimb = 50) {
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
  minClimb = Math.max(safeFloat(minClimb) || 50, 0);
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
      // 梯度约束：段均梯度 ≥30 m/km（3%）（2026-08-21 数据集回归）
      if (rise >= minClimb && length >= minLen && rise / Math.max(length, 0.1) >= 30) {
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

// 从目标路线 FIT 的海拔记录自动提取下降路段（起点/终点/下降高度），可再手动修改；阈值由“爬升/下降阈值”决定
function extractDescentSegmentsFromFit(decoded, minDescent = 50) {
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

  // 峰→谷检测：下降 ≥ minDescent，且谷后回升 ≥ hysteresis 记为一段下降
  minDescent = Math.max(safeFloat(minDescent) || 50, 0);
  const minLen = 0.2;
  const hysteresis = 15;
  const descents = [];
  let peak = 0;
  let valley = 0;
  for (let i = 0; i < sampled.length; i += 1) {
    if (sampled[i].alt > sampled[peak].alt) peak = i;
    if (sampled[i].alt < sampled[valley].alt) valley = i;
    const isLast = i === sampled.length - 1;
    if (sampled[i].alt - sampled[valley].alt >= hysteresis || isLast) {
      const drop = sampled[peak].alt - sampled[valley].alt;
      const length = sampled[valley].km - sampled[peak].km;
      // 梯度约束：段均梯度 ≥30 m/km（3%）（2026-08-21 数据集回归）
      if (drop >= minDescent && length >= minLen && drop / Math.max(length, 0.1) >= 30) {
        descents.push({
          start: Number(sampled[peak].km.toFixed(2)),
          end: Number(sampled[valley].km.toFixed(2)),
          height: Math.round(drop),
        });
      }
      peak = i;
      valley = i;
    }
  }

  // 最多保留 8 段（按高度取最大的），再按起点排序
  return descents
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

// 提取需要在图中标注的爬升/下降路段：仅当步骤三填写了路段时才标注；位置与高度取自画像（与所绘海拔一致），低于阈值的段不标注
function getRouteSegmentsToDraw(raceProfile, wantedType) {
  let hasFormSegs = false;
  try {
    const parsed = JSON.parse(String(state.raceProfileForm?.routeSegments || "[]"));
    hasFormSegs = Array.isArray(parsed) && parsed.length > 0;
  } catch (error) {
    hasFormSegs = false;
  }
  if (!hasFormSegs) return [];
  const threshold = Math.max(safeFloat(state.raceProfileForm?.segmentThresholdM) || 50, 0);
  const segments = [];
  let km = 0;
  for (const [dist, delta] of raceProfile.climb_segments) {
    const isClimb = delta > 0;
    const isDescent = delta < 0;
    if ((wantedType === "climb" ? isClimb : isDescent) && Math.abs(delta) >= threshold) {
      segments.push({ start: Number(km.toFixed(2)), end: Number((km + dist).toFixed(2)), height: Math.round(Math.abs(delta)) });
    }
    km += dist;
  }
  return segments;
}

function getClimbSegmentsToDraw(raceProfile) {
  return getRouteSegmentsToDraw(raceProfile, "climb");
}

function getDescentSegmentsToDraw(raceProfile) {
  return getRouteSegmentsToDraw(raceProfile, "descent");
}

function renderRouteOverview(raceProfile) {
  // 图表只用当前步骤三确认的信息绘制：FIT 模式下用目标运动文件真实海拔轨迹；手动模式下始终用模拟（即使之前读取过 FIT）
  const useFitRoute = state.raceMode === "fit" && Boolean(state.decodedRace);
  const fitRoutePoints = useFitRoute ? buildRoutePointsFromDecoded(state.decodedRace, raceProfile.distance_km) : null;
  const useGpxRoute = state.raceMode === "fit" && Boolean(state.gpxRoutePoints) && !fitRoutePoints;
  const gpxRoutePoints = useGpxRoute
    ? buildRoutePointsFromDecoded(
        {
          record_mesgs: state.gpxRoutePoints.map((point) => ({
            distance: point.km * 1000,
            enhanced_altitude: point.altitude,
          })),
        },
        raceProfile.distance_km
      )
    : null;
  const routePoints = fitRoutePoints || gpxRoutePoints;
  const pathPoints = routePoints || buildSimulatedElevation(raceProfile);
  document.getElementById("step4Note").textContent = routePoints ? t("step4NoteFit") : t("step4NoteSim");
  const climbSegs = getClimbSegmentsToDraw(raceProfile);
  const descentSegs = getDescentSegmentsToDraw(raceProfile);
  const width = 920;
  const height = 280;
  const minAlt = Math.min(...pathPoints.map((point) => point.altitude));
  const maxAlt = Math.max(...pathPoints.map((point) => point.altitude));
  const altRange = Math.max(maxAlt - minAlt, 1);
  const xTicks = 5;
  const yTicks = 4;
  // 左侧边距自适应 Y 轴标签宽度：海拔为 4 位及以上时预留足够空间，避免被 SVG 左缘裁剪
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, index) => minAlt + (altRange / yTicks) * index);
  const maxTickLen = Math.max(...yTickValues.map((v) => String(Math.round(v)).length));
  const padding = Math.max(44, 14 + maxTickLen * 7);
  const xForKm = (km) => padding + (km / Math.max(raceProfile.distance_km, 1)) * (width - padding * 2);
  const yForAlt = (altitude) => height - padding - ((altitude - minAlt) / altRange) * (height - padding * 2);
  const polyline = pathPoints.map((point) => `${xForKm(point.km).toFixed(1)},${yForAlt(point.altitude).toFixed(1)}`).join(" ");
  const areaPolygon = `${polyline} ${xForKm(raceProfile.distance_km).toFixed(1)},${(height - padding).toFixed(1)} ${padding.toFixed(1)},${(height - padding).toFixed(1)}`;

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

  // 路段顶部高度标注文字区（↑/↓ m）作为避让障碍：CP 标签避免盖住它们
  const bandLabelBoxes = [];
  for (const seg of climbSegs) {
    const x1 = xForKm(seg.start);
    const x2 = xForKm(seg.end);
    bandLabelBoxes.push({ x: x1, y: padding, w: Math.max(x2 - x1, 2), h: 42 });
  }
  for (const seg of descentSegs) {
    const x1 = xForKm(seg.start);
    const x2 = xForKm(seg.end);
    bandLabelBoxes.push({ x: x1, y: padding, w: Math.max(x2 - x1, 2), h: 42 });
  }

  // 碰撞避让：优先放标记上方，重叠则试下方，再从上方向下逐段跳到已放置盒下方，保证标记互不重叠
  const intersects = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const placedBoxes = [];
  const sortedChips = [...chipLayouts].sort((a, b) => a.mx - b.mx);
  for (const chip of sortedChips) {
    const aboveY = chip.my - 10 - chip.h;
    const belowY = chip.my + 12;
    const hitsLabel = (box) => bandLabelBoxes.some((p) => intersects(box, p));
    const tryPlace = (yy) => {
      const box = { x: chip.x, y: yy, w: chip.w, h: chip.h };
      // 优先同时避开其他 CP 盒与路段标注文字
      if (placedBoxes.some((p) => intersects(box, p)) || hitsLabel(box)) return null;
      return yy;
    };
    let y = tryPlace(aboveY);
    if (y === null) y = tryPlace(belowY);
    if (y === null) {
      // 找不到完全避让的位置：向下逐段跳，优先避开其他 CP 盒，标注重叠靠透明度兜底
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
      return `<text x="${chip.mx.toFixed(1)}" y="${lineY.toFixed(1)}" text-anchor="middle" font-size="11" fill="#d6ecff"${weight}>${escapeHtml(line)}</text>`;
    }).join("");
    return `
      <g style="pointer-events:none">
        <rect x="${chip.x.toFixed(1)}" y="${chip.y.toFixed(1)}" width="${chip.w.toFixed(1)}" height="${chip.h.toFixed(1)}" rx="6" fill="rgba(9,22,15,0.5)" stroke="rgba(124,192,255,0.55)" stroke-width="1" />
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

  // 下降路段：半透明蓝色带标出范围，标注下降高度
  const renderDescentBands = descentSegs.map((seg) => {
    const x1 = xForKm(seg.start);
    const x2 = xForKm(seg.end);
    const midX = (x1 + x2) / 2;
    return `
      <rect x="${x1.toFixed(1)}" y="${padding}" width="${Math.max(x2 - x1, 2).toFixed(1)}" height="${(height - padding * 2).toFixed(1)}" fill="rgba(79,156,240,0.10)" />
      <text x="${midX.toFixed(1)}" y="${padding + 28}" text-anchor="middle" font-size="11" fill="#6fa9e8">↓${seg.height}m</text>`;
  }).join("");

  const renderXTicks = Array.from({ length: xTicks + 1 }, (_, index) => {
    const km = (raceProfile.distance_km / xTicks) * index;
    const x = xForKm(km);
    return `
      <line x1="${x.toFixed(1)}" y1="${height - padding}" x2="${x.toFixed(1)}" y2="${height - padding + 6}" stroke="rgba(171,219,189,0.4)" stroke-width="1" />
      <text x="${x.toFixed(1)}" y="${height - padding + 20}" text-anchor="middle" font-size="11" fill="#cfe6d6">${km.toFixed(1)}</text>`;
  }).join("");

  const renderYTicks = Array.from({ length: yTicks + 1 }, (_, index) => {
    const altitude = minAlt + ((altRange / yTicks) * index);
    const y = yForAlt(altitude);
    return `
      <line x1="${padding - 6}" y1="${y.toFixed(1)}" x2="${padding}" y2="${y.toFixed(1)}" stroke="rgba(171,219,189,0.4)" stroke-width="1" />
      <text x="${padding - 10}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#cfe6d6">${altitude.toFixed(0)}</text>`;
  }).join("");

  ui.routeOverview.innerHTML = `
    <div class="chart-wrap">
      <div class="chart-meta">
        <span class="pill">${t("routeDistance")} ${raceProfile.distance_km.toFixed(1)} km</span>
        <span class="pill">${t("routeAscent")} ${raceProfile.ascent_m.toFixed(0)} m</span>
        <span class="pill">${t("routeCp")} ${raceProfile.aid_stations_km.length}</span>
        <span class="pill">${t("routeSource")} ${routePoints ? t("routeSourceFit") : t("routeSourceSimulated")}</span>
        <button type="button" id="downloadRouteBtn" class="download-chart-btn" title="${t("downloadRoute")}" aria-label="${t("downloadRoute")}">${t("downloadRouteIcon")}</button>
      </div>
      <svg id="routeSvg" viewBox="0 0 ${width} ${height}" width="100%" height="320" role="img" aria-label="${t("chartAriaLabel")}">
        <defs>
          <linearGradient id="elevFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#f08828" stop-opacity="0.32" />
            <stop offset="100%" stop-color="#f08828" stop-opacity="0.04" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${width}" height="${height}" fill="transparent"></rect>
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(171,219,189,0.35)" stroke-width="1" />
        <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="rgba(171,219,189,0.35)" stroke-width="1" />
        ${renderXTicks}
        ${renderYTicks}
        ${renderClimbBands}
        ${renderDescentBands}
        <polygon points="${areaPolygon}" fill="url(#elevFill)" stroke="none" />
        <polyline fill="none" stroke="rgba(240,136,40,0.25)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" points="${polyline}" />
        <polyline fill="none" stroke="#f7b054" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${polyline}" />
        ${renderMarkers(raceProfile.aid_stations_km, "#4f9cf0")}
        ${renderCpLabels}
        <text x="${padding}" y="${padding - 8}" font-size="12" fill="#cfe6d6">${t("axisElevation")}</text>
        <text x="${width - padding - 36}" y="${height - 8}" font-size="12" fill="#cfe6d6">${t("axisDistance")}</text>
      </svg>
    </div>`;
  const btn = document.getElementById("downloadRouteBtn");
  if (btn) btn.addEventListener("click", downloadRouteChart);
}

// 步骤四：将路线概况 SVG 导出为 PNG 下载
function downloadRouteChart() {
  const svg = document.getElementById("routeSvg");
  if (!svg) return;
  const viewW = 920;
  const viewH = 280;
  const exportScale = 2; // 2x 输出，保证清晰
  const exportW = viewW * exportScale;
  const exportH = viewH * exportScale;
  // 克隆 SVG 并显式设置固定像素尺寸 + 字体，确保独立加载时
  // 坐标刻度文字（x/y 轴）完整渲染、不被裁剪（页面内靠继承字体，独立 SVG 需显式指定）
  const clone = svg.cloneNode(true);
  clone.setAttribute("width", String(viewW));
  clone.setAttribute("height", String(viewH));
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("font-family", "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif");
  // 提高坐标轴刻度文字对比度：把半透明浅绿改为更亮的实色，确保下载图中清晰可见
  clone.querySelectorAll("text").forEach((text) => {
    const fill = text.getAttribute("fill") || "";
    if (fill && fill.includes("rgba(171,219,189")) {
      text.setAttribute("fill", "#cfe6d6");
    }
  });
  // 在 SVG 顶部添加元信息条（距离/爬升/CP 数量/来源）——这些信息原在 SVG 外部，下载图需要包含
  const race = state.raceProfileForm || {};
  const distance = safeFloat(race.distanceKm);
  const ascent = safeFloat(race.ascentM);
  const cpCount = (() => {
    try {
      const parsed = JSON.parse(String(race.officialCp || "[]"));
      return Array.isArray(parsed) ? parsed.filter((cp) => safeFloat(cp.distance) > 0).length : 0;
    } catch {
      return 0;
    }
  })();
  const srcText = state.raceMode === "fit" && (Boolean(state.decodedRace) || Boolean(state.gpxRoutePoints)) ? t("routeSourceFit") : t("routeSourceSimulated");
  const metaText = `${t("routeDistance")} ${(distance || 0).toFixed(1)} km   ${t("routeAscent")} ${ascent || 0} m   ${t("routeCp")} ${cpCount}   ${t("routeSource")} ${srcText}`;
  const meta = document.createElementNS("http://www.w3.org/2000/svg", "text");
  meta.setAttribute("x", "44");
  meta.setAttribute("y", "18");
  meta.setAttribute("font-size", "15");
  meta.setAttribute("font-weight", "600");
  meta.setAttribute("fill", "#f5b968");
  meta.textContent = metaText;
  clone.insertBefore(meta, clone.firstChild);
  const svgXml = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgXml], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = exportW;
    canvas.height = exportH;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0E1511";
    ctx.fillRect(0, 0, exportW, exportH);
    ctx.drawImage(img, 0, 0, exportW, exportH);
    URL.revokeObjectURL(url);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `trail-lab-route-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  img.src = url;
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
  downloadRouteBtn: document.getElementById("downloadRouteBtn"),
  contractOutput: document.getElementById("contractOutput"),
  engineOutput: document.getElementById("engineOutput"),
  engineHints: document.getElementById("engineHints"),
  exportCsvBtn: document.getElementById("exportCsvBtn"),
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
    descentM: "",
    expectedFinishH: "",
    weatherTemp: "",
    humidity: "",
    locationNotes: "",
    segmentThresholdM: "50",
    officialCp: "",
    routeSegments: "",
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
  setLegendItem("legendDescentSeg", "descent", t("legendDescentSeg"));
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
    // 文件校验：运动类型（跑步类）+ 数据有效性 + 数据质量 + CRC + 文件大小
    const validation = validateWebActivityFit(state.decodedActivity, { fileSizeBytes: file.size });
    if (!validation.ok) {
      throw new Error(validation.errors.join("\n"));
    }
    state.manualUserProfile = false;
    const overview = buildActivityOverview(state.decodedActivity);
    state.activitySummaryForm = overview.activitySummary;
    state.userProfileForm = overview.userProfile;
    renderActivitySummaryPreview(state.activitySummaryForm);
    renderEditor(ui.userProfileEditor, userProfileFields, state.userProfileForm);
    refreshProfileStage(state.userProfileForm);
    showOnlyStep(ui.step2Panel);
    seedRaceEditor();
    setStatus(
      validation.warnings.length
        ? t("statusActivityReady") + "\n" + validation.warnings.join("\n")
        : t("statusActivityReady")
    );
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
  ui.engineHints.innerHTML = "";
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
    const isGpx = /\.gpx$/i.test(file.name || "");
    if (isGpx) {
      const text = await file.text();
      const parser = window.TrailGpx;
      if (!parser || typeof parser.parseGpx !== "function") {
        throw new Error("GPX 解析器未加载（gpx.js 缺失）");
      }
      const parsed = parser.parseGpx(text);
      // 复用 FIT 分段提取：把 GPX 海拔剖面构造成虚拟记录
      const fakeDecoded = {
        record_mesgs: parsed.points.map((point) => ({
          distance: point.km * 1000,
          enhanced_altitude: point.altitude,
        })),
      };
      const seenCp = new Set();
      const officialCp = (parsed.waypoints || [])
        .map((w) => ({
          name: w.name || "CP",
          distance: w.km.toFixed(2),
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
      const thresholdInput = ui.raceProfileEditor.querySelector('[data-field="segmentThresholdM"]');
      const segmentThreshold = Math.max(safeFloat(thresholdInput?.value) || 50, 0);
      const autoClimbs = extractClimbSegmentsFromFit(fakeDecoded, segmentThreshold);
      const autoDescents = extractDescentSegmentsFromFit(fakeDecoded, segmentThreshold);
      const autoSegments = [
        ...autoClimbs.map((seg) => ({ type: "climb", ...seg })),
        ...autoDescents.map((seg) => ({ type: "descent", ...seg })),
      ].sort((a, b) => a.start - b.start || a.end - b.end);
      state.decodedRace = null;
      state.gpxRoutePoints = parsed.points;
      const values = {
        distanceKm: parsed.distanceKm.toFixed(2),
        ascentM: parsed.ascentM.toFixed(0),
        descentM: parsed.descentM.toFixed(0),
        expectedFinishH: "",
        weatherTemp: "",
        humidity: "",
        locationNotes: "",
        segmentThresholdM: segmentThreshold ? String(segmentThreshold) : "50",
        officialCp: officialCp.length ? JSON.stringify(officialCp) : "",
        routeSegments: autoSegments.length ? JSON.stringify(autoSegments) : "",
      };
      state.raceProfileForm = values;
      renderEditor(ui.raceProfileEditor, raceProfileFields, values);
      setStatus(officialCp.length ? t("statusGpxReadyWithCp").replace("{n}", officialCp.length) : t("statusGpxReadyNoCp"));
      return;
    }
    state.decodedRace = await decodeFitMessages(await file.arrayBuffer());
    state.gpxRoutePoints = null;
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
    const thresholdInput = ui.raceProfileEditor.querySelector('[data-field="segmentThresholdM"]');
    const segmentThreshold = Math.max(safeFloat(thresholdInput?.value) || 50, 0);
    const autoClimbs = extractClimbSegmentsFromFit(state.decodedRace, segmentThreshold);
    const autoDescents = extractDescentSegmentsFromFit(state.decodedRace, segmentThreshold);
    const autoSegments = [
      ...autoClimbs.map((seg) => ({ type: "climb", ...seg })),
      ...autoDescents.map((seg) => ({ type: "descent", ...seg })),
    ].sort((a, b) => a.start - b.start || a.end - b.end);
    const values = {
      distanceKm: firstField(session, "total_distance") !== null ? (firstField(session, "total_distance") / 1000).toFixed(2) : "",
      ascentM: firstField(session, "total_ascent") !== null ? firstField(session, "total_ascent").toFixed(0) : "",
      descentM: firstField(session, "total_descent") !== null ? firstField(session, "total_descent").toFixed(0) : "",
      expectedFinishH: "",
      weatherTemp: "",
      humidity: "",
      locationNotes: "",
      segmentThresholdM: segmentThreshold ? String(segmentThreshold) : "50",
      officialCp: officialCp.length ? JSON.stringify(officialCp) : "",
      routeSegments: autoSegments.length ? JSON.stringify(autoSegments) : "",
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
      empty[col.key] = col.key === "type" ? "climb" : "";
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

// 第五步：Provider → Model 联动——选 provider 时只显示对应模型的选项，并切到默认模型
function syncModelOptions() {
  const provider = ui.provider.value;
  const modelEl = ui.model;
  const options = Array.from(modelEl.querySelectorAll("option"));
  // 显隐：mock 只显示 mock；其余按 data-provider 过滤
  for (const opt of options) {
    const shown = opt.value === "mock" ? provider === "mock" : opt.dataset.provider === provider;
    opt.hidden = !shown;
  }
  // 默认模型映射
  const defaults = {
    openai: "gpt-4o-mini",
    deepseek: "deepseek-v4-flash",
    gemini: "gemini-2.0-flash",
  };
  const target = provider === "mock" ? "mock" : defaults[provider] || options[0]?.value || "";
  if (target && [...options].some((o) => o.value === target && !o.hidden)) {
    modelEl.value = target;
  }
}
ui.provider.addEventListener("change", syncModelOptions);
syncModelOptions();

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
    ui.engineHints.innerHTML = "";
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
    state.lastRuleOutput = ruleOutput;
    state.lastRaceProfile = raceProfile;
    const language = state.language;

    ui.contractOutput.textContent = JSON.stringify(contract, null, 2);
    ui.engineOutput.textContent = renderRuleEngineOutput(ruleOutput, language);
    attachEngineHints(ruleOutput, language, raceProfile);

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

ui.exportCsvBtn.addEventListener("click", exportPlanCsv);

setRaceMode("manual");
seedRaceEditor();
applyLanguage();
showOnlyStep(ui.step1Panel, false); // 初始进入不滚动，保留介绍信息
refreshProfileStage();
