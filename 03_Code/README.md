# AI Fuel Planner

> English version available in README_EN.md

AI Fuel Planner 是一个基于 FIT 文件的户外运动补给策略生成器。它从 Garmin 运动历史文件（.fit文件）中提取训练数据，通过AI评估运动员能力，并为越野跑、山地跑和山地徒步场景生成补给建议。

## 核心功能

- 解析 FIT 文件，提取基础运动数据、心率、功率、海拔和其他关键指标
- 基于历史运动能力，构建补给策略提示词
- 支持 openai、deepseek 与 mock 三种 AI 提供商
- 支持中文/英文界面与输出语言
- 支持三种目标：trail_run、mountain_run、mountain_hike
- 越野/山地类目标可输入 --distance 和 --ascent

## 目录结构

- fuel_planner.py：主程序，负责 FIT 解析、AI Prompt 构建和策略生成
- app.py：Streamlit Web 应用入口
- test_fuel_planner.py：基础单元测试
- 23231556007_ACTIVITY.fit：示例 FIT 活动文件

## 依赖

只需安装 FIT 解析依赖：

```bash
pip install -r requirements.txt
```

requirements.txt 包含：

- fitparse

如果你使用 openai 提供商，也可以选择安装官方 SDK，但不是必须。

## 使用说明

在项目目录下运行：

```bash
python fuel_planner.py <FIT_FILE> --weight 68 --target trail_run --distance 30 --ascent 1200 --provider deepseek --model deepseek-v4-pro --api-key YOUR_KEY --language zh
```

### 主要参数

- fit_file：FIT 活动文件路径
- --weight：运动员体重（kg）
- --target：目标类型（trail_run、mountain_run、mountain_hike）
- --ascent：山地/越野类目标累计爬升（米）
- --distance：山地/越野类目标距离（公里）
- --provider：AI 提供商（openai、deepseek、mock）
- --model：模型名称，例如 gpt-4o-mini 或 deepseek-v4-pro
- --api-key：AI API Key
- --temperature：生成温度
- --language：界面与输出语言，zh 或 en
- --insecure：如果遇到 SSL 证书问题，可禁用证书验证

### 示例

中文输出：

```bash
python fuel_planner.py 23231556007_ACTIVITY.fit --weight 68 --target mountain_run --distance 25 --ascent 1800 --provider deepseek --model deepseek-v4-pro --api-key YOUR_KEY --language zh
```

英文输出：

```bash
python fuel_planner.py 23231556007_ACTIVITY.fit --weight 68 --target mountain_hike --distance 20 --ascent 1500 --provider openai --model gpt-4o-mini --api-key YOUR_KEY --language en
```

## Streamlit 应用

项目提供了已经搭建完成的Streamlit，并提供了免费的DEEPSEEK_API_KEY（额度有限，请勿浪费），其网址为：https://ai-fuel-planner-3ojkuqgmh5o93otmjmpc64.streamlit.app/
项目也提供了 app.py，可自行搭建 Streamlit Web 应用：

```bash
cd 03_Code
streamlit run app.py
```

在 Streamlit 应用中：

- 上传 FIT 文件
- 选择 AI provider、模型、语言和目标类型
- 展示活动摘要和性能指标
- 点击 Generate Fueling Strategy 生成补给策略

### DeepSeek API Key

如果使用 deepseek provider，请将密钥填入 .streamlit/secrets.toml：

```toml
DEEPSEEK_API_KEY = "your_deepseek_api_key_here"
```

Streamlit 会通过 st.secrets 读取该值。

### 环境变量

如果不想在命令行中输入 API Key，可通过环境变量传入：

```bash
export OPENAI_API_KEY=your_openai_key
python fuel_planner.py 23231556007_ACTIVITY.fit --weight 68 --target trail_run --distance 30 --ascent 1200 --provider openai --model gpt-4o-mini --language zh
```

> --api-key 会优先于环境变量。

## 数据与隐私

- 本项目不会保存用户的 FIT 文件、个人体重或生成结果到长期数据库。
- 上传的 FIT 文件仅在当前会话中用于临时分析，处理完成后会被清理。
- 生成策略依赖 AI 服务，具体数据是否被服务商记录，取决于你所选择的提供商和其隐私政策。

## 反馈与建议

为了更好的改进此项目，欢迎大家贡献自己的fit文件（打包为.zip）、补给策略内容、反馈的问题等信息发送到issues中，无特殊格式。相关内容只用户项目改进，不用于其他目的。十分感谢！
如果你在使用过程中遇到问题、发现错误，或希望提出新的户外补给场景建议，欢迎在 GitHub Issues 中反馈。

## 测试

运行测试：

```bash
pytest
```

如果未安装 pytest，请先安装：

```bash
pip install pytest
```



