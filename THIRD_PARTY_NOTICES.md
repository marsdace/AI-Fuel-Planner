# Third-Party Notices

> 本文件声明 AI Fuel Planner 使用或引用的第三方组件及其许可协议。
> This file declares the third-party components used or referenced by AI Fuel Planner and their licenses.

## 1. Garmin FIT SDK（JavaScript）

- **组件**：`@garmin/fitsdk`（经 esm.sh CDN 加载，当前固定版本 `21.212.0`）
- **用途**：在浏览器端本地解码 Garmin `.fit` 文件
- **许可**：Garmin FIT SDK License（Flexible and Interoperable Data Transfer Protocol License）
- **来源**：https://developer.garmin.com/fit/ · https://github.com/garmin/fit-js-sdk
- **注意**：FIT 协议及 SDK 的知识产权归 Garmin Ltd. 所有；本软件对其的使用受 FIT Protocol License 约束。

## 2. Garmin FIT SDK（Python，已弃用）

- **组件**：`garmin-fit-sdk`（`python_legacy/_vendor/` 内嵌，版本 `21.208.0`）
- **用途**：历史 Python 版原型中的 FIT 解析（不再维护）
- **许可**：Garmin FIT SDK License（FIT Protocol License）
- **来源**：https://github.com/garmin/fit-python-sdk

## 3. Google Fonts

- **组件**：Sora · Noto Sans SC · JetBrains Mono（经 Google Fonts CSS 加载）
- **用途**：页面字体
- **许可**：SIL Open Font License 1.1（OFL-1.1）
- **来源**：https://fonts.google.com

## 4. AI 服务（可选，浏览器端直连调用）

本软件可选择调用以下第三方 AI 服务生成自然语言解释。调用由用户在浏览器端发起，**本软件不托管、不中转这些请求**；使用即受各服务商条款约束：

| 服务 | 用途 | 条款 |
|------|------|------|
| DeepSeek | AI 补给解释（默认可用） | https://platform.deepseek.com/terms |
| OpenAI | AI 补给解释 | https://openai.com/policies/terms-of-use |
| Google Gemini | AI 补给解释 | https://ai.google.dev/terms |

- 不调用 AI（`mock` Provider）时，以上服务不参与运行。

## 5. Python Legacy 依赖（已弃用）

- `streamlit`（Apache-2.0）
- `pytest`（MIT）

## 声明

上述第三方组件均属其各自版权方所有。本文件随软件分发，仅用于许可合规说明；若本文件与各组件官方许可文件存在出入，以官方许可文件为准。
