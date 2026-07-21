from __future__ import annotations

import argparse
import json
import os
import socket
import ssl
import sys
import urllib.request
import urllib.error
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from fitparse import FitFile


@dataclass
class ActivitySummary:
    start_time: str
    total_timer_time: float
    total_distance: float
    total_calories: float
    avg_heart_rate: Optional[float]
    max_heart_rate: Optional[float]
    avg_power: Optional[float]
    max_power: Optional[float]
    normalized_power: Optional[float]
    avg_speed: Optional[float]
    max_speed: Optional[float]
    avg_cadence: Optional[float]
    max_cadence: Optional[float]
    sport: str
    total_ascent: Optional[float]
    total_descent: Optional[float]


@dataclass
class FuelPlan:
    duration_h: float
    estimated_carbs_g: float
    target_calories_kcal: float
    hourly_carb_rate_g: float
    pre_exercise_cals: float
    during_per_15_min_g: float
    fluid_ml: float
    notes: str


def _safe_float(value: Optional[object]) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _first_field(fields: dict, *names: str) -> Optional[float]:
    for name in names:
        value = fields.get(name)
        if value is not None:
            return _safe_float(value)
    return None


def _get_record_field(record: dict, *names: str) -> Optional[float]:
    for name in names:
        if name in record and record[name] is not None:
            return _safe_float(record[name])
    return None


def _sorted_records(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return sorted(records, key=lambda record: record["timestamp"])


class AIModelAdapter(ABC):
    def __init__(self, api_key: Optional[str], model: str, provider: str, verify_ssl: bool = True, language: str = "zh"):
        self.api_key = api_key
        self.model = model
        self.provider = provider
        self.verify_ssl = verify_ssl
        self.language = language

    @abstractmethod
    def generate(self, prompt: str, temperature: float = 0.7) -> str:
        pass


class OpenAIAdapter(AIModelAdapter):
    def __init__(self, api_key: Optional[str], model: str, provider: str = "openai", base_url: str = "https://api.openai.com/v1", verify_ssl: bool = True, language: str = "zh"):
        super(OpenAIAdapter, self).__init__(api_key, model, provider, verify_ssl=verify_ssl, language=language)
        self.base_url = base_url
        if not self.api_key:
            raise ValueError("OpenAI API key is required for openai provider")

    def generate(self, prompt: str, temperature: float = 0.7) -> str:
        body = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": 3000,
            "top_p": 1.0,
        }
        request_data = json.dumps(body).encode("utf-8")
        request = urllib.request.Request(
            f"{self.base_url}/chat/completions",
            data=request_data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            },
            method="POST",
        )
        ctx = ssl.create_default_context()
        if not self.verify_ssl:
            ctx = ssl._create_unverified_context()
        try:
            with urllib.request.urlopen(request, timeout=30, context=ctx) as response:
                response_body = response.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            raise RuntimeError("AI API request failed: {} {}".format(exc.code, exc.reason))
        except urllib.error.URLError as exc:
            raise RuntimeError("AI API connection failed: {}".format(exc.reason))
        data = json.loads(response_body)
        if "choices" not in data or not data["choices"]:
            raise RuntimeError("AI API returned no choices")
        return str(data["choices"][0]["message"]["content"]).strip()


class MockAIAdapter(AIModelAdapter):
    def __init__(self, api_key: Optional[str], model: str, provider: str = "mock", verify_ssl: bool = True, language: str = "zh"):
        super(MockAIAdapter, self).__init__(api_key, model, provider, verify_ssl=verify_ssl, language=language)

    def generate(self, prompt: str, temperature: float = 0.7) -> str:
        if self.language == "en":
            return (
                "[Mock response] Please configure an AI API key and choose a real model in a production environment."
            )
        return (
            "[Mock response] 请在实际环境中配置 AI API Key 并选择模型。"
        )


class DeepSeekAdapter(AIModelAdapter):
    def __init__(self, api_key: Optional[str], model: str, provider: str = "deepseek", base_url: str = "https://api.deepseek.com", verify_ssl: bool = True, language: str = "zh"):
        super(DeepSeekAdapter, self).__init__(api_key, model, provider, verify_ssl=verify_ssl, language=language)
        self.base_url = base_url.rstrip("/")
        if not self.api_key:
            raise ValueError("DeepSeek API key is required for deepseek provider")

    def generate(self, prompt: str, temperature: float = 0.7) -> str:
        body = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt},
            ],
            "temperature": temperature,
            "max_tokens": 2500,
            "top_p": 1.0,
            "stream": False,
            "reasoning_effort": "high",
            "extra_body": {"thinking": {"type": "enabled"}},
        }
        request_data = json.dumps(body).encode("utf-8")
        request = urllib.request.Request(
            f"{self.base_url}/v1/chat/completions",
            data=request_data,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": f"Bearer {self.api_key}",
                "User-Agent": "DeepSeekPythonClient/1.0",
            },
            method="POST",
        )
        ctx = ssl.create_default_context()
        if not self.verify_ssl:
            ctx = ssl._create_unverified_context()
        try:
            with urllib.request.urlopen(request, timeout=90, context=ctx) as response:
                response_body = response.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as exc:
            raise RuntimeError("AI API request failed: {} {}".format(exc.code, exc.reason))
        except urllib.error.URLError as exc:
            if self.verify_ssl and isinstance(exc.reason, ssl.SSLError):
                insecure_ctx = ssl._create_unverified_context()
                try:
                    with urllib.request.urlopen(request, timeout=90, context=insecure_ctx) as response:
                        response_body = response.read().decode("utf-8", errors="replace")
                except Exception as nested_exc:
                    raise RuntimeError("AI API connection failed: {}".format(nested_exc))
            else:
                raise RuntimeError("AI API connection failed: {}".format(exc))
        except socket.timeout as exc:
            raise RuntimeError("AI API connection timed out: {}".format(exc))
        data = json.loads(response_body)
        if "choices" not in data or not data["choices"]:
            raise RuntimeError("AI API returned no choices")
        return str(data["choices"][0].get("message", {}).get("content", "")).strip()


class GeminiAdapter(AIModelAdapter):
    def __init__(self, api_key: Optional[str], model: str, provider: str = "gemini", base_url: str = "https://generativelanguage.googleapis.com", verify_ssl: bool = True, language: str = "zh"):
        super(GeminiAdapter, self).__init__(api_key, model, provider, verify_ssl=verify_ssl, language=language)
        self.base_url = base_url.rstrip("/")
        if not self.api_key:
            raise ValueError("Gemini API key is required for gemini provider")

    def _request(self, prompt: str, temperature: float, model_name: str) -> str:
        body = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": 4000,
            },
        }
        request_data = json.dumps(body).encode("utf-8")
        request = urllib.request.Request(
            f"{self.base_url}/v1beta/models/{model_name}:generateContent?key={self.api_key}",
            data=request_data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        ctx = ssl.create_default_context()
        if not self.verify_ssl:
            ctx = ssl._create_unverified_context()
        try:
            with urllib.request.urlopen(request, timeout=60, context=ctx) as response:
                response_body = response.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            raise RuntimeError("AI API request failed: {} {}".format(exc.code, exc.reason))
        except urllib.error.URLError as exc:
            raise RuntimeError("AI API connection failed: {}".format(exc.reason))
        data = json.loads(response_body)
        if "candidates" not in data or not data["candidates"]:
            raise RuntimeError("AI API returned no candidates")
        parts = data["candidates"][0].get("content", {}).get("parts", [])
        if not parts:
            raise RuntimeError("AI API returned no text content")
        return str(parts[0].get("text", "")).strip()

    def generate(self, prompt: str, temperature: float = 0.7) -> str:
        attempted_models = []
        model_names = []
        requested = self.model.strip()
        if requested:
            model_names.append(requested)
        if requested and not requested.startswith("models/"):
            model_names.append(f"models/{requested}")
        model_names.extend(["gemini-flash-latest", "models/gemini-flash-latest"])

        seen = set()
        ordered_models = []
        for model_name in model_names:
            normalized = model_name.replace("models/", "", 1)
            if normalized not in seen:
                seen.add(normalized)
                ordered_models.append(normalized)

        for model_name in ordered_models:
            attempted_models.append(model_name)
            try:
                return self._request(prompt, temperature, model_name)
            except RuntimeError as exc:
                message = str(exc)
                if "404" not in message and "Not Found" not in message:
                    raise
        if len(attempted_models) > 1:
            raise RuntimeError(
                "AI API request failed for all Gemini models (tried: {}). Please verify the API key and use a newer model name.".format(
                    ", ".join(attempted_models)
                )
            )
        raise RuntimeError("AI API request failed: Gemini model unavailable")


def create_model_adapter(provider: str, model: str, api_key: Optional[str] = None, verify_ssl: bool = True, language: str = "zh") -> AIModelAdapter:
    provider = provider.lower()
    if provider == "openai":
        return OpenAIAdapter(api_key=api_key, model=model, provider=provider, verify_ssl=verify_ssl, language=language)
    if provider == "deepseek":
        return DeepSeekAdapter(api_key=api_key, model=model, provider=provider, verify_ssl=verify_ssl, language=language)
    if provider == "gemini":
        return GeminiAdapter(api_key=api_key, model=model, provider=provider, verify_ssl=verify_ssl, language=language)
    if provider == "mock":
        return MockAIAdapter(api_key=api_key, model=model, provider=provider, verify_ssl=verify_ssl, language=language)
    raise ValueError("Unsupported AI provider: {}".format(provider))


def build_prompt(metrics: Dict[str, Dict[str, Optional[float]]], unavailable: List[str], target_desc: str, weight: float, language: str, weather_temp_c: Optional[float] = None, humidity_pct: Optional[float] = None) -> str:
    if language == "en":
        lines = [
            "You are a fueling strategy generator. Please use the FIT activity data below to assess the athlete's fitness and then create a fueling plan for the selected event target.",
            "Note: The FIT file data is only used to evaluate the athlete's ability and fitness level, not to represent the actual route or environment of the target event.",
            "Please output a complete, structured, and directly usable fueling strategy in English and do not include unrelated information.",
            "If any data is unavailable, note it or provide a reasonable estimate.",
            "Make sure the response includes complete pre-event, during-event, and post-event recommendations with explicit carbohydrate, calorie, fluid, and pacing guidance.",
            "\nEvent target:",
            f"  - {target_desc}",
            f"  - Athlete body weight: {weight} kg",
            "  - Note: FIT data is used as a capability baseline, and the fueling strategy should be based on the selected event type.",
        ]
        if weather_temp_c is not None:
            lines.append(f"  - Expected weather temperature: {weather_temp_c:.1f}°C")
        if humidity_pct is not None:
            lines.append(f"  - Expected humidity: {humidity_pct:.1f}%")
        lines.append("\nFitness assessment data (only include available fields):")
    else:
        lines = [
            "你是一个运动补给策略生成器。请根据下面的 FIT 运动数据评估运动员的运动能力，然后为所选目标制定补给策略。",
            "注意：FIT 文件数据仅用于评估运动员的能力和体能水平，而不是代表目标赛事的实际路线或环境。",
            "请输出一份完整、结构化且可直接执行的补给策略，不要输出任何无关说明。",
            "如果某项数据不可用，请说明该项缺失或给出合理估计。",
            "请确保输出内容包含完整的赛前、赛中、赛后建议，以及具体的碳水、热量、液体与节奏安排。",
            "\n运动目标：",
            f"  - {target_desc}",
            f"  - 运动员体重: {weight} kg",
            "  - 说明：FIT 数据用作能力评估基准，目标赛事补给策略应基于所选目标类型。",
        ]
        if weather_temp_c is not None:
            lines.append(f"  - 预计天气温度: {weather_temp_c:.1f}°C")
        if humidity_pct is not None:
            lines.append(f"  - 预计湿度: {humidity_pct:.1f}%")
        lines.append("\n运动能力评估数据（仅列出可用数据）：")
    for category, values in metrics.items():
        lines.append(f"{category}:")
        for name, value in values.items():
            lines.append(f"  - {name}: {value}")
    if unavailable:
        if language == "en":
            lines.append("\nThe following data could not be extracted from the FIT file:")
        else:
            lines.append("\n以下数据无法从 FIT 文件中提取：")
        for field in unavailable:
            lines.append(f"  - {field}")
    if language == "en":
        lines.extend([
            "\nPlease provide:",
            "1. Overall fueling strategy (carbohydrates, calories, fluids, pacing).",
            "2. Pre-event, during-event, and post-event fueling recommendations.",
            "3. Athlete guidance for the target event type, weight, intensity, duration, elevation, and expected weather conditions.",
            "4. If data is missing, explain and propose reasonable estimates.",
            "5. Organize the response with clear headings or bullet points so the strategy is complete and easy to follow.",
            "\nAnswer only with the fueling strategy text in English.",
        ])
    else:
        lines.extend([
            "\n请基于以上信息给出：",
            "1. 补给总体策略（碳水、热量、液体、补给节奏）。",
            "2. 赛前、赛中、赛后补给建议。",
            "3. 目标赛事说明（例如目标类型、体重、强度、时长、爬升和预计天气等）。",
            "4. 如数据缺失，请说明并提出合理估计。",
            "5. 以分段小标题或清晰列表形式输出，确保内容完整且便于执行。",
            "\n请仅输出补给策略文本，不要输出其他无关内容。",
        ])
    return "\n".join(lines)
    for category, values in metrics.items():
        lines.append(f"{category}:")
        for name, value in values.items():
            lines.append(f"  - {name}: {value}")
    if unavailable:
        lines.append("\n以下数据无法从 FIT 文件中提取：")
        for field in unavailable:
            lines.append(f"  - {field}")
    lines.extend([
        "\n请基于以上信息给出：",
        "1. 补给总体策略（碳水、热量、液体、补给节奏）。",
        "2. 赛前、赛中、赛后补给建议。",
        "3. 目标人群说明（例如目标类型、体重、强度、时长、爬升等）。",
        "4. 如数据缺失，请说明并提出合理估计。",
        "\nPlease answer only with the fueling strategy text in both Chinese and English. Chinese first, then English.",
    ])
    return "\n".join(lines)


def call_ai_strategy(metrics: Dict[str, Dict[str, Optional[float]]], unavailable: List[str], target_desc: str, provider: str, model: str, api_key: Optional[str], weight: float, temperature: float = 0.7, verify_ssl: bool = True, language: str = "zh", weather_temp_c: Optional[float] = None, humidity_pct: Optional[float] = None) -> str:
    prompt = build_prompt(metrics, unavailable, target_desc, weight, language, weather_temp_c=weather_temp_c, humidity_pct=humidity_pct)
    adapter = create_model_adapter(provider, model, api_key=api_key, verify_ssl=verify_ssl, language=language)
    return adapter.generate(prompt, temperature=temperature)


def resolve_api_key(provider: str, explicit_key: Optional[str] = None) -> Optional[str]:
    provider = provider.lower()
    if explicit_key:
        return explicit_key
    if provider == "deepseek":
        return os.environ.get("DEEPSEEK_API_KEY") or os.environ.get("OPENAI_API_KEY")
    if provider == "openai":
        return os.environ.get("OPENAI_API_KEY")
    if provider == "gemini":
        return os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    return None


def extract_fit_metrics(fit_path: Path) -> Tuple[Dict[str, Dict[str, Optional[float]]], List[str]]:
    """Extract a broad set of metrics from a FIT file and list any missing fields."""
    with fit_path.open("rb") as fit_file:
        fit = FitFile(fit_file)
        session = next(fit.get_messages("session"), None)
        lap = next(fit.get_messages("lap"), None)
        zones_target = next(fit.get_messages("zones_target"), None)
        records = [
            {field.name: field.value for field in record.fields}
            for record in fit.get_messages("record")
            if any(field.name == "timestamp" for field in record.fields)
        ]

    unavailable = []
    metrics = {
        "基础数据": {},
        "耐力数据": {},
        "心肺数据": {},
        "动态数据": {},
        "功率数据": {},
        "环境数据": {},
    }

    session_fields = {field.name: field.value for field in session.fields} if session else {}
    lap_fields = {field.name: field.value for field in lap.fields} if lap else {}
    record_samples = _sorted_records(records)

    # 基础数据
    total_distance = _first_field(session_fields, "total_distance")
    if total_distance is not None:
        metrics["基础数据"]["距离"] = total_distance
    else:
        unavailable.append("基础数据: 距离")

    total_timer_time = _first_field(session_fields, "total_timer_time")
    total_elapsed_time = _first_field(session_fields, "total_elapsed_time")
    if total_timer_time is not None:
        metrics["基础数据"]["时间"] = total_timer_time
    elif total_elapsed_time is not None:
        metrics["基础数据"]["时间"] = total_elapsed_time
    else:
        unavailable.append("基础数据: 时间")

    avg_speed = _first_field(session_fields, "enhanced_avg_speed", "avg_speed")
    if avg_speed is not None:
        metrics["基础数据"]["平均速度"] = avg_speed
        if avg_speed > 0:
            metrics["基础数据"]["配速"] = 60.0 / (avg_speed * 3.6)
        else:
            unavailable.append("基础数据: 配速")
    else:
        unavailable.append("基础数据: 平均速度")
        unavailable.append("基础数据: 配速")

    total_ascent = _first_field(session_fields, "total_ascent")
    if total_ascent is not None:
        metrics["基础数据"]["爬升"] = total_ascent
    else:
        unavailable.append("基础数据: 爬升")

    avg_heart_rate = _first_field(session_fields, "avg_heart_rate")
    if avg_heart_rate is not None:
        metrics["基础数据"]["平均心率"] = avg_heart_rate
    else:
        unavailable.append("基础数据: 平均心率")

    max_heart_rate = _first_field(session_fields, "max_heart_rate")
    if max_heart_rate is not None:
        metrics["基础数据"]["最大心率"] = max_heart_rate
    else:
        unavailable.append("基础数据: 最大心率")

    total_calories = _first_field(session_fields, "total_calories")
    if total_calories is not None:
        metrics["基础数据"]["热量"] = total_calories
    else:
        unavailable.append("基础数据: 热量")

    # 耐力数据
    if total_ascent is not None and record_samples:
        uphill_intervals = []
        downhill_speeds = []
        for prev, curr in zip(record_samples, record_samples[1:]):
            prev_alt = _get_record_field(prev, "enhanced_altitude")
            curr_alt = _get_record_field(curr, "enhanced_altitude")
            delta_time = (curr["timestamp"] - prev["timestamp"]).total_seconds()
            if delta_time <= 0 or prev_alt is None or curr_alt is None:
                continue
            if curr_alt > prev_alt:
                uphill_intervals.append(delta_time)
            elif curr_alt < prev_alt:
                speed = _get_record_field(prev, "enhanced_speed", "speed")
                if speed is not None:
                    downhill_speeds.append(speed)

        uphill_time = sum(uphill_intervals)
        if uphill_time > 0:
            metrics["耐力数据"]["平均爬升速度"] = total_ascent / uphill_time
            metrics["耐力数据"]["上坡时间比例"] = uphill_time / total_timer_time if total_timer_time else None
        else:
            unavailable.append("耐力数据: 平均爬升速度")
            unavailable.append("耐力数据: 上坡时间比例")

        if downhill_speeds:
            metrics["耐力数据"]["下坡速度"] = sum(downhill_speeds) / len(downhill_speeds)
        else:
            unavailable.append("耐力数据: 下坡速度")
    else:
        unavailable.append("耐力数据: 平均爬升速度")
        unavailable.append("耐力数据: 上坡时间比例")
        unavailable.append("耐力数据: 下坡速度")

    if total_timer_time is not None:
        metrics["耐力数据"]["实际运动时间"] = total_timer_time
    else:
        unavailable.append("耐力数据: 实际运动时间")

    if total_elapsed_time is not None:
        metrics["耐力数据"]["总耗时"] = total_elapsed_time
        if total_timer_time is not None:
            metrics["耐力数据"]["停留时间"] = total_elapsed_time - total_timer_time
        else:
            unavailable.append("耐力数据: 停留时间")
    else:
        unavailable.append("耐力数据: 总耗时")
        unavailable.append("耐力数据: 停留时间")

    # 心肺数据
    if avg_heart_rate is not None:
        metrics["心肺数据"]["平均心率"] = avg_heart_rate
    if max_heart_rate is not None:
        metrics["心肺数据"]["最大心率"] = max_heart_rate

    heart_rate_values = [
        _get_record_field(record, "heart_rate")
        for record in record_samples
        if _get_record_field(record, "heart_rate") is not None
    ]
    hr_reference = max_heart_rate or (max(heart_rate_values) if heart_rate_values else None)
    if heart_rate_values and hr_reference is not None:
        zones = {
            "心率区间1": 0.0,
            "心率区间2": 0.0,
            "心率区间3": 0.0,
            "心率区间4": 0.0,
            "心率区间5": 0.0,
        }
        for prev, curr in zip(record_samples, record_samples[1:]):
            hr = _get_record_field(prev, "heart_rate")
            if hr is None:
                continue
            delta_time = (curr["timestamp"] - prev["timestamp"]).total_seconds()
            intensity = hr / hr_reference if hr_reference else 0.0
            if intensity < 0.6:
                zones["心率区间1"] += delta_time
            elif intensity < 0.7:
                zones["心率区间2"] += delta_time
            elif intensity < 0.8:
                zones["心率区间3"] += delta_time
            elif intensity < 0.9:
                zones["心率区间4"] += delta_time
            else:
                zones["心率区间5"] += delta_time
        metrics["心肺数据"]["心率区间时间"] = zones
    else:
        unavailable.append("心肺数据: 心率区间时间")

    if heart_rate_values and total_timer_time:
        metrics["心肺数据"]["心率飘逸"] = (heart_rate_values[-1] - heart_rate_values[0]) / (total_timer_time / 3600.0)
    else:
        unavailable.append("心肺数据: 心率飘逸")

    unavailable.append("心肺数据: 心率恢复")

    # 动态数据
    avg_running_cadence = _first_field(session_fields, "avg_running_cadence")
    if avg_running_cadence is not None:
        metrics["动态数据"]["步频"] = avg_running_cadence
    else:
        unavailable.append("动态数据: 步频")

    avg_stance_time = _first_field(session_fields, "avg_stance_time")
    if avg_stance_time is not None:
        metrics["动态数据"]["触地时间"] = avg_stance_time
    else:
        unavailable.append("动态数据: 触地时间")

    avg_vertical_oscillation = _first_field(session_fields, "avg_vertical_oscillation")
    if avg_vertical_oscillation is not None:
        metrics["动态数据"]["垂直振幅"] = avg_vertical_oscillation
    else:
        unavailable.append("动态数据: 垂直振幅")

    avg_vertical_ratio = _first_field(session_fields, "avg_vertical_ratio")
    if avg_vertical_ratio is not None:
        metrics["动态数据"]["跑姿效率"] = avg_vertical_ratio
    else:
        unavailable.append("动态数据: 跑姿效率")

    avg_step_length = _first_field(session_fields, "avg_step_length")
    if avg_step_length is not None:
        metrics["动态数据"]["步幅"] = avg_step_length
    else:
        unavailable.append("动态数据: 步幅")

    # 功率数据
    avg_power = _first_field(session_fields, "avg_power")
    max_power = _first_field(session_fields, "max_power")
    if avg_power is not None:
        metrics["功率数据"]["平均功率"] = avg_power
    else:
        unavailable.append("功率数据: 平均功率")
    if max_power is not None:
        metrics["功率数据"]["最大功率"] = max_power
    else:
        unavailable.append("功率数据: 最大功率")

    ftp = None
    if zones_target:
        zones_fields = {field.name: field.value for field in zones_target.fields}
        ftp = _first_field(zones_fields, "functional_threshold_power")
    power_samples = [
        _get_record_field(record, "power")
        for record in record_samples
        if _get_record_field(record, "power") is not None
    ]
    if ftp and power_samples and len(record_samples) > 1:
        power_zones = {
            "功率区间1": 0.0,
            "功率区间2": 0.0,
            "功率区间3": 0.0,
            "功率区间4": 0.0,
            "功率区间5": 0.0,
            "功率区间6": 0.0,
        }
        thresholds = [0.55, 0.75, 0.9, 1.05, 1.2]
        for prev, curr in zip(record_samples, record_samples[1:]):
            power = _get_record_field(prev, "power")
            if power is None:
                continue
            dt = (curr["timestamp"] - prev["timestamp"]).total_seconds()
            if dt <= 0:
                continue
            ratio = power / ftp
            if ratio < thresholds[0]:
                power_zones["功率区间1"] += dt
            elif ratio < thresholds[1]:
                power_zones["功率区间2"] += dt
            elif ratio < thresholds[2]:
                power_zones["功率区间3"] += dt
            elif ratio < thresholds[3]:
                power_zones["功率区间4"] += dt
            elif ratio < thresholds[4]:
                power_zones["功率区间5"] += dt
            else:
                power_zones["功率区间6"] += dt
        metrics["功率数据"]["功率区间"] = power_zones

        if avg_power is not None and total_timer_time:
            intensity_factor = avg_power / ftp
            metrics["功率数据"]["TSS"] = round(
                (total_timer_time * avg_power * intensity_factor) / (ftp * 3600.0) * 100.0,
                1,
            )
    else:
        unavailable.append("功率数据: 功率区间")
        unavailable.append("功率数据: TSS")

    # 环境数据
    enhanced_max_altitude = _first_field(lap_fields, "enhanced_max_altitude")
    enhanced_min_altitude = _first_field(lap_fields, "enhanced_min_altitude")
    record_altitudes = [
        _get_record_field(record, "enhanced_altitude") for record in record_samples if _get_record_field(record, "enhanced_altitude") is not None
    ]
    if enhanced_max_altitude is not None and enhanced_min_altitude is not None:
        metrics["环境数据"]["海拔最高"] = enhanced_max_altitude
        metrics["环境数据"]["海拔最低"] = enhanced_min_altitude
    elif record_altitudes:
        metrics["环境数据"]["海拔最高"] = max(record_altitudes)
        metrics["环境数据"]["海拔最低"] = min(record_altitudes)
        metrics["环境数据"]["海拔平均"] = sum(record_altitudes) / len(record_altitudes)
    else:
        unavailable.append("环境数据: 海拔")

    unavailable.extend([
        "环境数据: 温度",
        "环境数据: 湿度",
        "环境数据: 气压",
        "环境数据: 天气",
    ])

    # 清理空字段
    for category, values in list(metrics.items()):
        if not values:
            del metrics[category]

    return metrics, unavailable


def parse_fit_activity(fit_path: Path) -> ActivitySummary:
    """Parse a FIT file and return a summary of the recorded session."""
    with fit_path.open("rb") as fit_file:
        fit = FitFile(fit_file)
        session = next(fit.get_messages("session"), None)
        if session is None:
            raise ValueError("No session message found in FIT file")

        fields = {field.name: field.value for field in session.fields}

        total_timer_time = _first_field(fields, "total_timer_time", "total_elapsed_time") or 0.0
        total_distance = _first_field(fields, "total_distance") or 0.0
        total_calories = _first_field(fields, "total_calories") or 0.0

        return ActivitySummary(
            start_time=str(fields.get("start_time") or fields.get("timestamp") or ""),
            total_timer_time=total_timer_time,
            total_distance=total_distance,
            total_calories=total_calories,
            avg_heart_rate=_first_field(fields, "avg_heart_rate"),
            max_heart_rate=_first_field(fields, "max_heart_rate"),
            avg_power=_first_field(fields, "avg_power"),
            max_power=_first_field(fields, "max_power"),
            normalized_power=_first_field(fields, "normalized_power"),
            avg_speed=_first_field(fields, "enhanced_avg_speed", "avg_speed"),
            max_speed=_first_field(fields, "enhanced_max_speed", "max_speed"),
            avg_cadence=_first_field(fields, "avg_running_cadence", "avg_cadence", "avg_fractional_cadence"),
            max_cadence=_first_field(fields, "max_running_cadence", "max_cadence", "max_fractional_cadence"),
            sport=str(fields.get("sport") or fields.get("sub_sport") or "unknown"),
            total_ascent=_first_field(fields, "total_ascent"),
            total_descent=_first_field(fields, "total_descent"),
        )


def recommend_fuel(summary: ActivitySummary, body_weight_kg: float = 70.0) -> FuelPlan:
    """Calculate a fueling strategy based on activity history."""
    duration_h = max(summary.total_timer_time / 3600.0, 0.01)

    intensity = 0.0
    if summary.avg_heart_rate is not None:
        intensity = min(max((summary.avg_heart_rate - 120.0) / 60.0, 0.0), 1.0)
    elif summary.avg_power is not None:
        intensity = min(max((summary.avg_power - 120.0) / 120.0, 0.0), 1.0)

    if duration_h <= 1.0:
        carb_base = 30.0 + 10.0 * intensity
    elif duration_h <= 2.0:
        carb_base = 45.0 + 15.0 * intensity
    else:
        carb_base = 55.0 + 20.0 * intensity + 10.0 * (duration_h - 2.0)

    if summary.total_calories >= 1800.0:
        carb_base += 8.0
    if summary.avg_power is not None and summary.avg_power >= 220.0:
        carb_base += 6.0
    if summary.avg_heart_rate is not None and summary.avg_heart_rate >= 155.0:
        carb_base += 5.0

    estimated_carbs_g = round(max(carb_base, 20.0), 1)
    hourly_carb_rate_g = round(estimated_carbs_g / duration_h, 1)
    during_per_15_min_g = round(hourly_carb_rate_g * 0.25, 1)

    if duration_h <= 1.0:
        pre_exercise_cals = 0.0
    elif duration_h <= 1.5:
        pre_exercise_cals = 150.0
    else:
        pre_exercise_cals = min(300.0, 4.0 * body_weight_kg)

    fluid_ml = round(500.0 + 250.0 * duration_h)
    target_calories_kcal = round(summary.total_calories or (estimated_carbs_g * 4.0))

    notes = (
        "Use the activity summary to shape a fuel plan. "
        "For lasting performance, focus on carbohydrate intake at regular intervals, "
        "and keep hydration consistent through the workout. "
        "Choose easily digestible sources such as gels, chews, bars, or a sports drink."
    )

    if duration_h <= 1.0:
        notes = (
            "This session is short, so a light carbohydrate snack before or after the activity "
            "is more important than large during-event fueling. "
            + notes
        )
    else:
        notes = (
            "For a session longer than one hour, spread carbohydrate intake evenly across the duration. "
            + notes
        )

    return FuelPlan(
        duration_h=round(duration_h, 2),
        estimated_carbs_g=estimated_carbs_g,
        target_calories_kcal=target_calories_kcal,
        hourly_carb_rate_g=hourly_carb_rate_g,
        pre_exercise_cals=round(pre_exercise_cals, 1),
        during_per_15_min_g=during_per_15_min_g,
        fluid_ml=fluid_ml,
        notes=notes,
    )


def render_activity_summary(summary: ActivitySummary) -> str:
    """Create a readable activity summary for the user."""
    distance_km = summary.total_distance / 1000.0 if summary.total_distance else 0.0
    avg_speed_kmh = summary.avg_speed * 3.6 if summary.avg_speed else None
    max_speed_kmh = summary.max_speed * 3.6 if summary.max_speed else None

    lines = [
        f"Start time: {summary.start_time}",
        f"Duration: {summary.total_timer_time / 60:.1f} minutes",
        f"Distance: {distance_km:.2f} km",
        f"Calories: {summary.total_calories:.0f} kcal",
        f"Sport: {summary.sport}",
    ]

    if summary.avg_heart_rate is not None:
        lines.append(f"Average HR: {summary.avg_heart_rate:.0f} bpm")
    if summary.max_heart_rate is not None:
        lines.append(f"Max HR: {summary.max_heart_rate:.0f} bpm")
    if avg_speed_kmh is not None:
        lines.append(f"Average speed: {avg_speed_kmh:.1f} km/h")
    if max_speed_kmh is not None:
        lines.append(f"Max speed: {max_speed_kmh:.1f} km/h")
    if summary.avg_power is not None:
        lines.append(f"Average power: {summary.avg_power:.0f} W")
    if summary.max_power is not None:
        lines.append(f"Max power: {summary.max_power:.0f} W")
    if summary.total_ascent is not None:
        lines.append(f"Total ascent: {summary.total_ascent:.0f} m")
    if summary.total_descent is not None:
        lines.append(f"Total descent: {summary.total_descent:.0f} m")

    return "\n".join(lines)


def render_fuel_plan(plan: FuelPlan) -> str:
    """Create a readable fueling recommendation."""
    lines = [
        f"Estimated fueling plan for {plan.duration_h:.2f} h:",
        f"  - Target carbohydrate intake: {plan.estimated_carbs_g:.1f} g",
        f"  - Target workout calories to support: {plan.target_calories_kcal:.0f} kcal",
        f"  - Equivalent hourly carbohydrate rate: {plan.hourly_carb_rate_g:.1f} g/h",
        f"  - Recommended carbohydrate every 15 min: {plan.during_per_15_min_g:.1f} g",
        f"  - Pre-exercise fuel: {plan.pre_exercise_cals:.0f} kcal",
        f"  - Hydration goal: {plan.fluid_ml:.0f} mL",
        "Notes:",
        f"  {plan.notes}",
    ]
    return "\n".join(lines)


def generate_recommendation_text(summary: ActivitySummary, plan: FuelPlan) -> str:
    """Generate a deterministic natural-language recommendation string."""
    carb_sentence = (
        f"Based on the historical activity, your estimated carbohydrate need is {plan.estimated_carbs_g:.0f} g "
        f"over {plan.duration_h:.2f} hours."
    )
    timing_sentence = (
        f"Aim for roughly {plan.during_per_15_min_g:.0f} g of carbohydrate every 15 minutes "
        f"and drink about {plan.fluid_ml:.0f} mL of fluids during the session."
    )
    pre_sentence = (
        f"If the workout lasts longer than one hour, include {plan.pre_exercise_cals:.0f} kcal of easy carbs before start."
        if plan.pre_exercise_cals > 0
        else "For a short session, prioritize light fueling and recovery nutrition rather than large pre-workout meals."
    )
    decision_sentence = (
        "This recommendation is driven by your session duration, calories burned, and intensity signals from heart rate and power."
    )
    return "\n".join([carb_sentence, timing_sentence, pre_sentence, decision_sentence, plan.notes])


def get_supported_targets(language: str = "zh") -> List[Tuple[str, str]]:
    if language == "en":
        return [
            ("trail_run", "Trail Run"),
            ("mountain_run", "Mountain Run"),
            ("mountain_hike", "Mountain Hiking"),
        ]
    return [
        ("trail_run", "越野跑"),
        ("mountain_run", "山地跑"),
        ("mountain_hike", "山地徒步"),
    ]


def _format_target_description(target: str, ascent: Optional[float], distance: Optional[float], language: str) -> str:
    if language == "en":
        if target == "trail_run":
            return f"Target: Trail Run, Distance {distance} km, Elevation Gain {ascent} m"
        if target == "mountain_run":
            return f"Target: Mountain Run, Distance {distance} km, Elevation Gain {ascent} m"
        if target == "mountain_hike":
            return f"Target: Mountain Hiking, Distance {distance} km, Elevation Gain {ascent} m"
        return "Target: Outdoor Adventure"

    if target == "trail_run":
        return f"目标：越野跑，距离 {distance} 公里，累计爬升 {ascent} 米"
    if target == "mountain_run":
        return f"目标：山地跑，距离 {distance} 公里，累计爬升 {ascent} 米"
    if target == "mountain_hike":
        return f"目标：山地徒步，距离 {distance} 公里，累计爬升 {ascent} 米"
    return "目标：户外运动"


def _resolve_target(args, language: str) -> str:
    if language == "en":
        mapping = {
            "trail_run": "Target: Trail Run",
            "mountain_run": "Target: Mountain Run",
            "mountain_hike": "Target: Mountain Hiking",
        }
        prompt_ascent = "Enter target elevation gain (meters): "
        prompt_distance = "Enter target distance (kilometers): "
        choose_text = "Select fueling target:"
        options = ["1. Trail Run", "2. Mountain Run", "3. Mountain Hiking"]
        input_prompt = "Enter 1/2/3: "
    else:
        mapping = {
            "trail_run": "目标：越野跑",
            "mountain_run": "目标：山地跑",
            "mountain_hike": "目标：山地徒步",
        }
        prompt_ascent = "请输入目标累计爬升（米）: "
        prompt_distance = "请输入目标距离（公里）: "
        choose_text = "请选择补给目标："
        options = ["1. 越野跑", "2. 山地跑", "3. 山地徒步"]
        input_prompt = "输入 1/2/3: "

    if args.target:
        if args.target in {"trail_run", "mountain_run", "mountain_hike"}:
            ascent = args.ascent
            distance = args.distance
            if ascent is None:
                ascent = float(input(prompt_ascent).strip())
            if distance is None:
                distance = float(input(prompt_distance).strip())
            return _format_target_description(args.target, ascent, distance, language)
        return mapping.get(args.target, args.target)

    print(choose_text)
    for opt in options:
        print(opt)
    choice = input(input_prompt).strip()
    if choice == "1":
        return mapping["trail_run"]
    if choice == "2":
        return mapping["mountain_run"]
    if choice == "3":
        ascent = args.ascent
        distance = args.distance
        if ascent is None:
            ascent = float(input(prompt_ascent).strip())
        if distance is None:
            distance = float(input(prompt_distance).strip())
        return _format_target_description("mountain_hike", ascent, distance, language)
    return mapping["trail_run"]


def main() -> int:
    parser = argparse.ArgumentParser(description="AI Fuel Planner: extract FIT data and generate a fueling strategy via AI.")
    parser.add_argument("fit_file", type=Path, help="Path to the FIT activity file.")
    parser.add_argument("--weight", type=float, default=70.0, help="Athlete body weight in kilograms.")
    parser.add_argument("--target", type=str, choices=["trail_run", "mountain_run", "mountain_hike"], default=None, help="补给目标类型: trail_run, mountain_run, mountain_hike")
    parser.add_argument("--ascent", type=float, default=None, help="如果目标是累计爬升跑，请输入目标累计爬升米数")
    parser.add_argument("--distance", type=float, default=None, help="如果目标是累计爬升跑，请输入目标距离，单位为公里")
    parser.add_argument("--provider", type=str, default="openai", choices=["openai", "deepseek", "gemini", "mock"], help="AI provider name, e.g. openai, deepseek, gemini or mock.")
    parser.add_argument("--model", type=str, default="gpt-4o-mini", help="AI model name to use.")
    parser.add_argument("--api-key", type=str, default=None, help="AI API key, if required by provider.")
    parser.add_argument("--temperature", type=float, default=0.7, help="AI generation temperature.")
    parser.add_argument("--language", type=str, default="zh", choices=["zh", "en"], help="Interface and output language: zh or en.")
    parser.add_argument("--insecure", action="store_true", help="Disable SSL certificate verification for AI API calls.")
    parser.add_argument("--weather-temp", type=float, default=None, help="Expected event-day temperature in Celsius.")
    parser.add_argument("--humidity", type=float, default=None, help="Expected event-day humidity percentage.")
    args = parser.parse_args()

    api_key = resolve_api_key(args.provider, args.api_key)
    target_desc = _resolve_target(args, args.language)
    metrics, unavailable = extract_fit_metrics(args.fit_file)

    strategy = call_ai_strategy(
        metrics=metrics,
        unavailable=unavailable,
        target_desc=target_desc,
        provider=args.provider,
        model=args.model,
        api_key=api_key,
        weight=args.weight,
        temperature=args.temperature,
        verify_ssl=not args.insecure,
        language=args.language,
        weather_temp_c=args.weather_temp,
        humidity_pct=args.humidity,
    )
    print(strategy)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
