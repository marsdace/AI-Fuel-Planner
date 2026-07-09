# AI Fuel Planner

> English version available in `README_EN.md`

AI Fuel Planner 是一个基于 FIT 文件的运动补给策略生成器。它从 Garmin 运动历史文件提取训练数据，评估运动员能力，并生成半程马拉松、全程马拉松或越野跑（含距离与累计爬升）目标的补给方案。

## 核心功能

- 解析 FIT 文件，提取基础运动数据、心率、功率、海拔和其他关键指标
- 基于历史运动能力，构建补给策略提示词
- 支持 `openai`、`deepseek` 与 `mock` 三种 AI 提供商
- 支持中文/英文界面与输出语言
- 支持三种目标：`half_marathon`、`full_marathon`、`trail_run`
- 越野跑目标可输入 `--distance` 和 `--ascent`

## 目录结构

- `fuel_planner.py`：主程序，负责 FIT 解析、AI Prompt 构建和策略生成
- `23231556007_ACTIVITY.fit`：示例 FIT 活动文件


## 依赖

只需安装 FIT 解析依赖：

```bash
pip install -r requirements.txt
```

`requirements.txt` 包含：

- `fitparse`

如果你使用 `openai` 提供商，也可以选择安装官方 SDK，但不是必须。

## 使用说明

在项目目录下运行：

```bash
python fuel_planner.py <FIT_FILE> --weight 68 --target full_marathon --provider deepseek --model deepseek-v4-pro --api-key YOUR_KEY --language zh
```

### 主要参数

- `fit_file`：FIT 活动文件路径
- `--weight`：运动员体重（kg）
- `--target`：目标类型 (`half_marathon`, `full_marathon`, `trail_run`)
- `--ascent`：越野跑目标累计爬升（米）
- `--distance`：越野跑目标距离（公里）
- `--provider`：AI 提供商 (`openai`, `deepseek`, `mock`)
- `--model`：模型名称，例如 `gpt-4o-mini` 或 `deepseek-v4-pro`
- `--api-key`：AI API Key
- `--temperature`：生成温度
- `--language`：界面与输出语言，`zh` 或 `en`
- `--insecure`：如果遇到 SSL 证书问题，可禁用证书验证

### 例子

中文输出：

```bash
python fuel_planner.py 23231556007_ACTIVITY.fit --weight 68 --target full_marathon --provider deepseek --model deepseek-v4-pro --api-key YOUR_KEY --language zh
```

英文输出：

```bash
python fuel_planner.py 23231556007_ACTIVITY.fit --weight 68 --target trail_run --distance 30 --ascent 1200 --provider openai --model gpt-4o-mini --api-key YOUR_KEY --language en
```
## Streamlit 应用

项目已提供 `app.py`，可直接运行 Streamlit Web 应用：

```bash
streamlit run app.py
```

在 Streamlit 应用中：

- 上传 FIT 文件
- 选择 AI provider、模型、语言、目标类型
- 展示活动摘要和性能指标
- 点击“Generate Fueling Strategy”生成补给策略

### DeepSeek API Key

如果使用 `deepseek` provider，请将密钥填入 `.streamlit/secrets.toml`：

```toml
DEEPSEEK_API_KEY = "your_deepseek_api_key_here"
```

Streamlit 会通过 `st.secrets` 读取该值。
### 环境变量

如果不想在命令行中输入 API Key，可通过环境变量传入：

```bash
export OPENAI_API_KEY=your_openai_key
python fuel_planner.py 23231556007_ACTIVITY.fit --weight 68 --target half_marathon --provider openai --model gpt-4o-mini --language zh
```

> `--api-key` 优先于环境变量。

## 测试

运行测试：

```bash
pytest
```

如果未安装 `pytest`，请先安装：

```bash
pip install pytest
```



