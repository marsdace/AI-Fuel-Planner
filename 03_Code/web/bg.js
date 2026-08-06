/* Trail Lab — 山野夜空动态背景 + 交互增强
 * 1) Canvas: 星空闪烁 + 漂浮萤火 + 多层山脊缓慢视差漂移
 * 2) Hero 鼠标视差
 * 3) 面板入场动画（IntersectionObserver + MutationObserver）
 */
(function () {
  "use strict";

  /* ---------------- Canvas 背景 ---------------- */
  const canvas = document.getElementById("bgCanvas");
  const ctx = canvas.getContext("2d");
  let W = 0;
  let H = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  const DAY_NIGHT_SECONDS = 34;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clampValue = (value, low, high) => Math.max(low, Math.min(high, value));

  // 拟人跑者状态：位置与步伐相位（速度随坡度变化）
  let runner = { x: 0, phase: 0 };

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildRidges();
    buildStars();
  }

  /* 星星 */
  let stars = [];
  function buildStars() {
    const count = Math.floor((W * H) / 9000);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H * 0.72,
      r: Math.random() * 1.4 + 0.3,
      baseAlpha: Math.random() * 0.5 + 0.25,
      twinkleSpeed: Math.random() * 1.6 + 0.4,
      phase: Math.random() * Math.PI * 2,
    }));
  }

  /* 萤火 / 能量粒子 —— 向上缓慢漂浮，带横向摆动 */
  const FIREFLY_COUNT = 42;
  const fireflies = Array.from({ length: FIREFLY_COUNT }, () => spawnFirefly(true));

  function spawnFirefly(anywhere) {
    return {
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : H + 20,
      r: Math.random() * 2.2 + 0.8,
      vy: -(Math.random() * 0.28 + 0.08),
      swing: Math.random() * 0.6 + 0.2,
      swingSpeed: Math.random() * 0.012 + 0.004,
      phase: Math.random() * Math.PI * 2,
      hue: Math.random() < 0.72 ? "255, 150, 60" : "140, 220, 170", // 探索橙 / 林间绿光
      pulse: Math.random() * Math.PI * 2,
    };
  }

  /* 山脊层 —— 用确定性噪声生成，三层不同深度与速度 */
  let ridges = [];
  function ridgeNoise(seed) {
    // 简易可复现的值噪声
    return function (x) {
      const xi = Math.floor(x);
      const xf = x - xi;
      const h = (n) => {
        const s = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
        return s - Math.floor(s);
      };
      const u = xf * xf * (3 - 2 * xf);
      return h(xi) * (1 - u) + h(xi + 1) * u;
    };
  }

  function buildRidges() {
    ridges = [
      { seed: 1.7, amp: H * 0.15, base: H * 0.8, freq: 0.0026, speed: 3.2, color: "rgba(20, 42, 30, 0.5)", offset: 0 },
      { seed: 4.3, amp: H * 0.19, base: H * 0.88, freq: 0.0042, speed: 6.0, color: "rgba(15, 32, 24, 0.72)", offset: 0 },
      { seed: 8.9, amp: H * 0.23, base: H * 0.96, freq: 0.006, speed: 10.5, color: "rgba(10, 22, 16, 0.92)", offset: 0 },
    ].map((layer) => ({ ...layer, noise: ridgeNoise(layer.seed) }));
  }

  function drawRidge(layer, time) {
    const drift = (time * layer.speed) % W;
    ctx.beginPath();
    ctx.moveTo(-4, H + 4);
    const step = 6;
    for (let x = -4; x <= W + 4; x += step) {
      const n =
        layer.noise((x + drift) * layer.freq) * 0.68 +
        layer.noise((x + drift) * layer.freq * 3.1 + 40) * 0.32;
      const y = layer.base - n * layer.amp;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W + 4, H + 4);
    ctx.closePath();
    ctx.fillStyle = layer.color;
    ctx.fill();
  }

  let lastTime = 0;
  function frame(now) {
    const time = now / 1000;
    const dt = Math.min(now - lastTime, 50);
    lastTime = now;
    const animTime = prefersReducedMotion ? 0 : time;
    const cycle = (animTime % DAY_NIGHT_SECONDS) / DAY_NIGHT_SECONDS;

    // 日月升降：太阳在前 50% 周期从左到右越过天顶，月亮在后 50% 周期反向升落。
    // 均画在山脊之前，沉入山脊时被山体自然遮挡。
    const horizonY = H * 0.74;
    const arcH = H * 0.34;
    const sunProgress = cycle <= 0.5 ? cycle / 0.5 : 1;
    const moonProgress = cycle >= 0.5 ? (cycle - 0.5) / 0.5 : 0;
    const sunUp = Math.sin(Math.PI * sunProgress);
    const moonUp = Math.sin(Math.PI * moonProgress);
    const sunX = W * sunProgress;
    const sunY = horizonY - sunUp * arcH;
    const moonX = W * moonProgress;
    const moonY = horizonY - moonUp * arcH;
    const daylight = sunUp;
    const nightStrength = 1 - daylight;
    // 星星随日出更快熄灭：太阳一升起即大幅变暗
    const starVisibility = Math.max(0, 1 - daylight * 1.6);
    // 夜间头灯指示：仅夜晚后半段（cycle 0.5–0.95）亮灯
    const nightLamp =
      cycle >= 0.5 && cycle <= 0.95
        ? Math.min((cycle - 0.5) / 0.08, (0.95 - cycle) / 0.08, 1)
        : 0;

    ctx.clearRect(0, 0, W, H);

    // 日照光晕：白天增强背景亮度，夜晚收暗。
    const dayGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, Math.max(W, H) * 0.8);
    dayGlow.addColorStop(0, `rgba(255, 242, 200, ${(0.06 + daylight * 0.62).toFixed(3)})`);
    dayGlow.addColorStop(0.5, `rgba(255, 220, 150, ${(0.02 + daylight * 0.28).toFixed(3)})`);
    dayGlow.addColorStop(1, "rgba(255, 220, 150, 0)");
    ctx.fillStyle = dayGlow;
    ctx.fillRect(0, 0, W, H);

    const nightVeil = ctx.createLinearGradient(0, 0, 0, H);
    nightVeil.addColorStop(0, `rgba(18, 36, 58, ${(0.04 + nightStrength * 0.33).toFixed(3)})`);
    nightVeil.addColorStop(1, `rgba(10, 24, 32, ${(0.02 + nightStrength * 0.24).toFixed(3)})`);
    ctx.fillStyle = nightVeil;
    ctx.fillRect(0, 0, W, H);

    // 白昼整体提亮：太阳升得越高画面越明亮
    if (daylight > 0.01) {
      const dayBright = ctx.createLinearGradient(0, 0, 0, H);
      dayBright.addColorStop(0, `rgba(255, 247, 224, ${(daylight * 0.3).toFixed(3)})`);
      dayBright.addColorStop(0.55, `rgba(255, 238, 196, ${(daylight * 0.2).toFixed(3)})`);
      dayBright.addColorStop(1, `rgba(255, 232, 185, ${(daylight * 0.08).toFixed(3)})`);
      ctx.fillStyle = dayBright;
      ctx.fillRect(0, 0, W, H);
    }

    // 星星
    for (const s of stars) {
      const alpha = s.baseAlpha * (0.45 + 0.55 * Math.sin(time * s.twinkleSpeed + s.phase)) * starVisibility;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(226, 240, 230, ${alpha.toFixed(3)})`;
      ctx.fill();
    }

    // 萤火
    for (let i = 0; i < fireflies.length; i++) {
      const f = fireflies[i];
      f.phase += f.swingSpeed * dt;
      f.pulse += 0.002 * dt;
      f.x += Math.sin(f.phase) * f.swing * 0.12;
      f.y += f.vy * (dt / 16.7);
      if (f.y < -24 || f.x < -30 || f.x > W + 30) fireflies[i] = spawnFirefly(false);

      const glow = 0.45 + 0.55 * Math.abs(Math.sin(f.pulse));
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 6);
      grad.addColorStop(0, `rgba(${f.hue}, ${(0.5 * glow).toFixed(3)})`);
      grad.addColorStop(0.45, `rgba(${f.hue}, ${(0.16 * glow).toFixed(3)})`);
      grad.addColorStop(1, `rgba(${f.hue}, 0)`);
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r * 6, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${f.hue}, ${(0.85 * glow).toFixed(3)})`;
      ctx.fill();
    }

    // 日月（画在山脊之前 → 沉入山后）
    drawSunMoon(ctx, sunX, sunY, sunUp, moonX, moonY, moonUp);

    // 山脊（由远及近）
    for (const layer of ridges) drawRidge(layer, animTime);

    // 拟人跑者（沿最前景山脊奔跑，速度随坡度变化；夜间头灯向前照亮）
    updateRunner(ctx, animTime, prefersReducedMotion ? 0 : dt, nightLamp);

    if (!prefersReducedMotion) requestAnimationFrame(frame);
  }

  /* 日月 —— 山脊之后升降 */
  function drawSunMoon(ctx, sunX, sunY, sunUp, moonX, moonY, moonUp) {
    if (sunUp > 0.02) {
      const r = Math.max(W * 0.03, 24);
      const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, r * 2.1);
      glow.addColorStop(0, `rgba(255, 253, 231, ${(sunUp * 0.9).toFixed(3)})`);
      glow.addColorStop(0.4, `rgba(255, 233, 173, ${(sunUp * 0.6).toFixed(3)})`);
      glow.addColorStop(1, "rgba(255, 208, 118, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, r * 2.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255, 247, 214, ${(sunUp * 0.95).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(sunX, sunY, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    if (moonUp > 0.02) {
      const r = Math.max(W * 0.025, 20);
      const glow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, r * 2.2);
      glow.addColorStop(0, `rgba(233, 240, 255, ${(moonUp * 0.85).toFixed(3)})`);
      glow.addColorStop(0.5, `rgba(213, 226, 255, ${(moonUp * 0.45).toFixed(3)})`);
      glow.addColorStop(1, "rgba(213, 226, 255, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, r * 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(242, 247, 255, ${(moonUp * 0.92).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(moonX, moonY, r * 0.62, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(203, 215, 238, ${(moonUp * 0.5).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(moonX - r * 0.18, moonY - r * 0.14, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(moonX + r * 0.17, moonY + r * 0.18, r * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* 拟人跑者 —— 侧面投影：登山杖垂直下延且杖长恒定、上坡高抬膝折叠、躯干随步幅摆动 */
  function drawRunner(ctx, x, groundY, phase, lean, speedFactor, night) {
    const s = Math.max(W * 0.008, 10); // 略放大，小屏也可见细节
    const cyc = phase;
    const stride = Math.sin(cyc);
    const bob = Math.abs(Math.cos(cyc)) * s * 0.1;
    const fwd = 0.12; // 常态前倾（减小）
    const climb = clampValue(lean, 0, 0.5) / 0.5; // 0=平/下坡，1=陡上坡
    const descent = clampValue(-lean, 0, 0.22) / 0.22; // 0=平/上坡，1=陡下坡
    const trunkRock = Math.sin(cyc) * 0.12; // 躯干随步幅摆动

    ctx.save();
    ctx.globalAlpha = 0.93; // 轻微半透明，融入背景
    ctx.translate(x, groundY);
    ctx.translate(descent * s * 0.2, 0); // 下坡胯部前移（身体整体前送 + 后倾制动）
    const rot = lean + fwd; // 坡度 + 常态前倾
    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);
    ctx.rotate(rot);
    ctx.translate(0, -bob * 0.5);

    // 侧面坐标（面向 +x 前行）
    const headR = s * 0.3;
    const headCX = s * 0.24;
    const headY = -s * 1.12;
    const shoulderX = s * 0.1;
    const shoulderY = -s * 0.86;
    const hipX = -s * 0.02;
    const hipY = -s * 0.46;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // 夜间：头灯向前照亮（暖色光锥，画在身体之前）
    const lampAlpha = night * 0.85;
    if (lampAlpha > 0.05) {
      const lampX = headCX + headR * 0.85;
      const lampY = headY - headR * 0.05;
      const reach = s * 2.4;
      const spread = s * 0.6;
      const beam = ctx.createLinearGradient(lampX, lampY, lampX + reach, lampY);
      beam.addColorStop(0, `rgba(255, 236, 180, ${(lampAlpha * 0.5).toFixed(3)})`);
      beam.addColorStop(1, "rgba(255, 236, 180, 0)");
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(lampX, lampY - spread * 0.15);
      ctx.lineTo(lampX + reach, lampY - spread * 0.7);
      ctx.lineTo(lampX + reach, lampY + spread * 0.7);
      ctx.lineTo(lampX, lampY + spread * 0.15);
      ctx.closePath();
      ctx.fill();
    }

    // ---- 腿与手臂参数（先全算，后分层绘制）----
    const climbMul = 1 + climb * 0.5;
    const strideMul = 1 - climb * 0.2;
    const legH = Math.sin(cyc);
    const nearLift = Math.max(0,  legH);
    const farLift  = Math.max(0, -legH);
    // 近侧腿坐标
    const nLift = nearLift * climbMul;
    const nFootX = hipX + legH * s * 0.42 * strideMul + s * 0.1;
    const nFootY = nLift > 0.04 ? -nLift * s * 0.16 : 0;
    const nKneeX = hipX + legH * s * 0.13 * strideMul + s * 0.1;
    const nKneeY = hipY * 0.38 - nLift * s * 0.1;
    // 远侧腿坐标
    const fLift = farLift * climbMul;
    const fFootX = hipX - legH * s * 0.42 * strideMul + s * 0.1;
    const fFootY = fLift > 0.04 ? -fLift * s * 0.16 : 0;
    const fKneeX = hipX - legH * s * 0.13 * strideMul + s * 0.1;
    const fKneeY = hipY * 0.38 - fLift * s * 0.1;

    function drawOneLeg(fx, fy, kx, ky) {
      const mx = hipX + (kx - hipX) * 0.5;
      const my = hipY + (ky - hipY) * 0.5;
      ctx.strokeStyle = "#202020";
      ctx.lineWidth = s * 0.32;
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(mx, my);
      ctx.stroke();
      ctx.strokeStyle = "#e8c394";
      ctx.lineWidth = s * 0.28;
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(kx, ky);
      ctx.lineTo(fx, fy);
      ctx.stroke();
    }

    // ---- 手臂与登山杖参数 ----
    const trunkC = Math.cos(trunkRock);
    const trunkS = Math.sin(trunkRock);
    const arm = Math.sin(cyc);
    const poleLiftL = Math.max(0, Math.sin(cyc + Math.PI));
    const poleLiftR = Math.max(0, Math.sin(cyc));
    const liftAmp = s * (0.16 + climb * 0.42) * (1 - descent * 0.9);
    const handLeft = { x: shoulderX + arm * s * 0.4, y: shoulderY + s * 0.24 - poleLiftL * liftAmp };
    const elbowLeft = { x: (shoulderX + handLeft.x) * 0.5 + s * 0.05, y: (shoulderY + handLeft.y) * 0.5 - s * 0.06 };
    const handRight = { x: shoulderX - arm * s * 0.4, y: shoulderY + s * 0.24 - poleLiftR * liftAmp };
    const elbowRight = { x: (shoulderX + handRight.x) * 0.5 - s * 0.05, y: (shoulderY + handRight.y) * 0.5 - s * 0.06 };
    const poleLen = s * 0.85;
    const bobX = bob * 0.5 * sinR;
    const bobY = -bob * 0.5 * cosR;
    const lfRel = { x: handLeft.x - hipX, y: handLeft.y - hipY };
    const rtRel = { x: handRight.x - hipX, y: handRight.y - hipY };
    const leftRocked = { x: hipX + lfRel.x * trunkC - lfRel.y * trunkS, y: hipY + lfRel.x * trunkS + lfRel.y * trunkC };
    const rightRocked = { x: hipX + rtRel.x * trunkC - rtRel.y * trunkS, y: hipY + rtRel.x * trunkS + rtRel.y * trunkC };
    const handScreenL = {
      x: x + leftRocked.x * cosR - leftRocked.y * sinR + bobX,
      y: groundY + leftRocked.x * sinR + leftRocked.y * cosR + bobY,
    };
    const handScreenR = {
      x: x + rightRocked.x * cosR - rightRocked.y * sinR + bobX,
      y: groundY + rightRocked.x * sinR + rightRocked.y * cosR + bobY,
    };

    // ===== 分层绘制（远→近）=====

    // 层 1：左登山杖（最远，在左腿之后）
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = "rgba(38, 56, 47, 0.92)";
    ctx.lineWidth = Math.max(1, s * 0.1);
    ctx.beginPath();
    ctx.moveTo(handScreenL.x, handScreenL.y);
    ctx.lineTo(handScreenL.x, handScreenL.y + poleLen);
    ctx.stroke();
    ctx.strokeStyle = "#e8c394";
    ctx.lineWidth = Math.max(1, s * 0.12);
    ctx.beginPath();
    ctx.moveTo(handScreenL.x, handScreenL.y - s * 0.06);
    ctx.lineTo(handScreenL.x, handScreenL.y + s * 0.06);
    ctx.stroke();
    ctx.fillStyle = "#d98145";
    ctx.beginPath();
    ctx.arc(handScreenL.x, handScreenL.y + poleLen, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 层 2：远侧腿 + 鞋
    drawOneLeg(fFootX, fFootY, fKneeX, fKneeY);
    ctx.fillStyle = "#d99655";
    ctx.beginPath();
    ctx.ellipse(fFootX + s * 0.02, fFootY + s * 0.02, s * 0.18, s * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();

    // 层 3：上半身（背包 + 躯干 + 双臂 + 头）
    ctx.save();
    ctx.translate(hipX, hipY);
    ctx.rotate(trunkRock);
    ctx.translate(-hipX, -hipY);
    // 左臂
    ctx.strokeStyle = "#e8c394";
    ctx.lineWidth = s * 0.2;
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(elbowLeft.x, elbowLeft.y);
    ctx.lineTo(handLeft.x, handLeft.y);
    ctx.stroke();
    // 背包
    ctx.fillStyle = "#4a8cbc";
    ctx.beginPath();
    ctx.ellipse(hipX - s * 0.16, (hipY + shoulderY) / 2 - s * 0.02, s * 0.16, s * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#e8c394";
    ctx.lineWidth = Math.max(1, s * 0.08);
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY + s * 0.02);
    ctx.lineTo(hipX - s * 0.02, hipY);
    ctx.stroke();
    ctx.fillStyle = "#d98145";
    ctx.beginPath();
    ctx.arc(hipX - s * 0.16, (hipY + shoulderY) / 2 - s * 0.16, s * 0.05, 0, Math.PI * 2);
    ctx.fill();
    // 躯干
    const bodyGrad = ctx.createLinearGradient(shoulderX - s * 0.05, shoulderY, hipX + s * 0.1, hipY);
    bodyGrad.addColorStop(0, "#d98a52");
    bodyGrad.addColorStop(1, "#c06a36");
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(shoulderX - s * 0.16, shoulderY);
    ctx.quadraticCurveTo(shoulderX + s * 0.3, shoulderY + s * 0.18, hipX + s * 0.2, hipY + s * 0.02);
    ctx.lineTo(hipX - s * 0.1, hipY + s * 0.04);
    ctx.quadraticCurveTo(shoulderX - s * 0.3, shoulderY + s * 0.16, shoulderX - s * 0.16, shoulderY);
    ctx.closePath();
    ctx.fill();
    // 右臂
    ctx.strokeStyle = "#e8c394";
    ctx.lineWidth = s * 0.2;
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(elbowRight.x, elbowRight.y);
    ctx.lineTo(handRight.x, handRight.y);
    ctx.stroke();
    // 头 + 鼻子
    ctx.fillStyle = "#ecd6ad";
    ctx.beginPath();
    ctx.arc(headCX, headY, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e2c094";
    ctx.beginPath();
    ctx.arc(headCX + headR * 0.78, headY + headR * 0.12, headR * 0.16, 0, Math.PI * 2);
    ctx.fill();
    // 遮阳帽
    ctx.fillStyle = "#d98145";
    ctx.beginPath();
    ctx.arc(headCX, headY - headR * 0.22, headR * 0.98, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e89040";
    ctx.beginPath();
    ctx.moveTo(headCX + headR * 0.3, headY - headR * 0.18);
    ctx.quadraticCurveTo(headCX + headR * 1.6, headY - headR * 0.22, headCX + headR * 2.6, headY - headR * 0.06);
    ctx.quadraticCurveTo(headCX + headR * 1.5, headY - headR * 0.02, headCX + headR * 0.35, headY - headR * 0.06);
    ctx.closePath();
    ctx.fill();
    // 头灯
    if (lampAlpha > 0.05) {
      ctx.fillStyle = `rgba(255, 240, 200, ${(lampAlpha * 0.9).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(headCX + headR * 0.7, headY - headR * 0.02, s * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore(); // 回到基础旋转坐标系

    // 层 4：近侧腿 + 鞋
    drawOneLeg(nFootX, nFootY, nKneeX, nKneeY);
    ctx.fillStyle = "#d99655";
    ctx.beginPath();
    ctx.ellipse(nFootX + s * 0.05, nFootY + s * 0.02, s * 0.2, s * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();

    // 层 5：右登山杖（最近，在右腿之前）
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = "rgba(38, 56, 47, 0.92)";
    ctx.lineWidth = Math.max(1, s * 0.1);
    ctx.beginPath();
    ctx.moveTo(handScreenR.x, handScreenR.y);
    ctx.lineTo(handScreenR.x, handScreenR.y + poleLen);
    ctx.stroke();
    ctx.strokeStyle = "#e8c394";
    ctx.lineWidth = Math.max(1, s * 0.12);
    ctx.beginPath();
    ctx.moveTo(handScreenR.x, handScreenR.y - s * 0.06);
    ctx.lineTo(handScreenR.x, handScreenR.y + s * 0.06);
    ctx.stroke();
    ctx.fillStyle = "#d98145";
    ctx.beginPath();
    ctx.arc(handScreenR.x, handScreenR.y + poleLen, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  function noiseAt(layer, x, drift) {
    return (
      layer.noise((x + drift) * layer.freq) * 0.68 +
      layer.noise((x + drift) * layer.freq * 3.1 + 40) * 0.32
    );
  }

  function updateRunner(ctx, time, dt, night) {
    const front = ridges[2];
    if (!front) {
      return;
    }
    const drift = (time * front.speed) % W;
    const dx = 12;
    const n1 = noiseAt(front, runner.x, drift);
    const n2 = noiseAt(front, runner.x + dx, drift);
    const y1 = front.base - n1 * front.amp;
    const y2 = front.base - n2 * front.amp;
    const slope = (y2 - y1) / dx; // 屏幕 dy/dx：负=上坡，正=下坡

    // 整体速度下降 66%（保持 34%）；上坡明显慢、下坡比上坡略快（控速，不过度）
    const speedFactor = clampValue(
      1 / (1 + Math.max(0, -slope) * 3.5) * (1 + Math.max(0, slope) * 0.5),
      0.3,
      1.25
    );
    const speed = Math.max(4, W * 0.03 * 0.34 * speedFactor); // 速度降 66%
    const step = dt / 1000;
    runner.x = (runner.x + speed * step) % W;
    runner.phase += step * (5 + speedFactor * 3); // 步频随速度

    // 上坡前倾减少 / 下坡适度后倾（加大后倾范围）
    const lean = clampValue(-slope * 0.3, -0.22, 0.36);
    drawRunner(ctx, runner.x, y1, runner.phase, lean, speedFactor, night);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(frame);

  /* ---------------- Hero 鼠标视差 ---------------- */
  const hero = document.getElementById("hero");
  const deco = hero ? hero.querySelector(".hero-deco") : null;
  if (hero && deco && !prefersReducedMotion) {
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;
    hero.addEventListener("mousemove", (e) => {
      const rect = hero.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    });
    hero.addEventListener("mouseleave", () => {
      targetX = 0;
      targetY = 0;
    });
    (function parallaxLoop() {
      curX += (targetX - curX) * 0.06;
      curY += (targetY - curY) * 0.06;
      deco.style.transform = `translate3d(${(curX * 18).toFixed(2)}px, ${(curY * 14).toFixed(2)}px, 0)`;
      requestAnimationFrame(parallaxLoop);
    })();
  }

  /* ---------------- 入场动画 ---------------- */
  const revealTargets = () => document.querySelectorAll(".panel:not(.is-hidden), .site-footer");

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -4% 0px" }
  );

  function observeAll() {
    revealTargets().forEach((el) => {
      if (!el.classList.contains("in-view")) io.observe(el);
    });
  }

  // app.js 通过移除 .is-hidden 展示后续面板 —— 监听并触发入场动画
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      const el = m.target;
      if (el.classList && !el.classList.contains("is-hidden") && !el.classList.contains("in-view")) {
        io.observe(el);
      }
    }
  });

  document.querySelectorAll(".panel").forEach((panel) => {
    mo.observe(panel, { attributes: true, attributeFilter: ["class"] });
  });

  observeAll();
})();
