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
from typing import Any, Dict, List, Optional, Tuple, Union

try:
    from garmin_fit_sdk import Decoder, Stream  # type: ignore[reportMissingImports]
except ModuleNotFoundError:
    _vendor_dir = Path(__file__).resolve().parent / "_vendor"
    if _vendor_dir.exists():
        sys.path.insert(0, str(_vendor_dir))
    from garmin_fit_sdk import Decoder, Stream  # type: ignore[reportMissingImports]


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


@dataclass
class UserInputProfile:
    weight_kg: float
    irta_points: Optional[float]
    recent_env_adaptation: Optional[float]
    hrv_score: Optional[float]
    training_status: Optional[str]
    physiological_max_hr: Optional[float]


@dataclass
class UserProfile:
    ability_score: float
    fatigue_risk: str
    hr_zone_reference: Optional[float]
    hr_zone_warning: Optional[str]
    metrics: Dict[str, Dict[str, Optional[float]]]
    unavailable: List[str]


@dataclass
class RaceInputProfile:
    distance_km: float
    ascent_m: float
    weather_temp_c: Optional[float]
    humidity_pct: Optional[float]
    location_history_notes: Optional[str]
    cp_points_km: List[float]
    manual_climb_segments: List[Tuple[float, float]]
    climb_trigger_m: float = 250.0
    max_interval_min: float = 45.0


@dataclass
class RaceProfile:
    distance_km: float
    ascent_m: float
    aid_stations_km: List[float]
    climb_segments: List[Tuple[float, float]]
    steep_segments: List[Tuple[float, float, float]]
    supplemental_points_km: List[float]
    climb_trigger_m: float
    max_interval_min: float
    weather_temp_c: Optional[float]
    humidity_pct: Optional[float]
    location_history_notes: Optional[str]


@dataclass
class RuleEngineOutput:
    contract_version: str
    estimated_finish_time_h: float
    carbs_per_hour_g: float
    fluid_per_hour_ml: float
    sodium_per_hour_mg: float
    total_carbs_g: float
    total_fluid_ml: float
    total_sodium_mg: float
    fueling_points: List[Dict[str, Any]]
    trigger_config: Dict[str, float]
    warnings: List[str]


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


def resolve_fit_path(fit_path: Union[str, Path]) -> Path:
    """Resolve a FIT path from the current working directory or the code folder."""
    path = Path(fit_path)
    if path.is_absolute():
        return path

    candidates = [
        Path.cwd() / path,
        Path(__file__).resolve().parent / path,
        Path(__file__).resolve().parent.parent / path,
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate.resolve()
    return path.resolve()


def _decode_fit_messages(fit_path: Union[str, Path]) -> Dict[str, List[Dict[str, Any]]]:
    """Decode FIT binary data with Garmin official SDK and return grouped messages."""
    resolved_path = resolve_fit_path(fit_path)
    stream = Stream.from_file(str(resolved_path))
    decoder = Decoder(stream)
    messages, errors = decoder.read(
        apply_scale_and_offset=True,
        convert_datetimes_to_dates=True,
        convert_types_to_strings=True,
        enable_crc_check=True,
        expand_sub_fields=True,
        expand_components=True,
        merge_heart_rates=True,
    )

    if not isinstance(messages, dict):
        raise ValueError("Failed to decode FIT file: unexpected Garmin SDK output")
    if not messages:
        raise ValueError("Failed to decode FIT file: no messages were decoded")

    # Garmin SDK returns errors list for non-fatal decode issues; we continue to keep robustness.
    if errors:
        pass

    return messages


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

    def _continuation_prompt(self) -> str:
        if self.language == "en":
            return "Continue exactly from where you stopped. Do not repeat any previous content."
        return "请从刚才中断处继续输出，不要重复之前已经输出的内容。"


class OpenAIAdapter(AIModelAdapter):
    def __init__(self, api_key: Optional[str], model: str, provider: str = "openai", base_url: str = "https://api.openai.com/v1", verify_ssl: bool = True, language: str = "zh"):
        super(OpenAIAdapter, self).__init__(api_key, model, provider, verify_ssl=verify_ssl, language=language)
        self.base_url = base_url
        if not self.api_key:
            raise ValueError("OpenAI API key is required for openai provider")

    def _request(self, messages: List[Dict[str, str]], temperature: float, max_tokens: int) -> Tuple[str, Optional[str]]:
        body = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
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
        text = str(data["choices"][0].get("message", {}).get("content", "")).strip()
        finish_reason = data["choices"][0].get("finish_reason")
        return text, str(finish_reason) if finish_reason is not None else None

    def generate(self, prompt: str, temperature: float = 0.7) -> str:
        messages: List[Dict[str, str]] = [{"role": "user", "content": prompt}]
        segments: List[str] = []
        max_rounds = 4

        for _ in range(max_rounds):
            chunk, finish_reason = self._request(messages, temperature=temperature, max_tokens=8192)
            if chunk:
                segments.append(chunk)
            if finish_reason != "length":
                break
            messages.append({"role": "assistant", "content": chunk})
            messages.append({"role": "user", "content": self._continuation_prompt()})

        full_text = "\n".join(part for part in segments if part).strip()
        if not full_text:
            raise RuntimeError("AI API returned empty text content")
        return full_text


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

    def _request(self, messages: List[Dict[str, str]], temperature: float, max_tokens: int) -> Tuple[str, Optional[str]]:
        body = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
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
        text = str(data["choices"][0].get("message", {}).get("content", "")).strip()
        finish_reason = data["choices"][0].get("finish_reason")
        return text, str(finish_reason) if finish_reason is not None else None

    def generate(self, prompt: str, temperature: float = 0.7) -> str:
        messages: List[Dict[str, str]] = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt},
        ]
        segments: List[str] = []
        max_rounds = 4

        for _ in range(max_rounds):
            chunk, finish_reason = self._request(messages, temperature=temperature, max_tokens=8192)
            if chunk:
                segments.append(chunk)
            if finish_reason != "length":
                break
            messages.append({"role": "assistant", "content": chunk})
            messages.append({"role": "user", "content": self._continuation_prompt()})

        full_text = "\n".join(part for part in segments if part).strip()
        if not full_text:
            raise RuntimeError("AI API returned empty text content")
        return full_text


class GeminiAdapter(AIModelAdapter):
    def __init__(self, api_key: Optional[str], model: str, provider: str = "gemini", base_url: str = "https://generativelanguage.googleapis.com", verify_ssl: bool = True, language: str = "zh"):
        super(GeminiAdapter, self).__init__(api_key, model, provider, verify_ssl=verify_ssl, language=language)
        self.base_url = base_url.rstrip("/")
        if not self.api_key:
            raise ValueError("Gemini API key is required for gemini provider")

    def _request(self, contents: List[Dict[str, Any]], temperature: float, model_name: str, max_output_tokens: int = 8192) -> Tuple[str, Optional[str]]:
        body = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_output_tokens,
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
        text_chunks = [str(part.get("text", "")) for part in parts if part.get("text")]
        full_text = "\n".join(chunk.strip() for chunk in text_chunks if chunk.strip()).strip()
        if not full_text:
            raise RuntimeError("AI API returned empty text content")
        finish_reason = data["candidates"][0].get("finishReason")
        return full_text, str(finish_reason) if finish_reason is not None else None

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
                contents: List[Dict[str, Any]] = [{"role": "user", "parts": [{"text": prompt}]}]
                segments: List[str] = []
                max_rounds = 4

                for _ in range(max_rounds):
                    chunk, finish_reason = self._request(contents, temperature, model_name)
                    if chunk:
                        segments.append(chunk)
                    finish_reason_text = (finish_reason or "").upper()
                    if finish_reason_text not in {"MAX_TOKENS", "LENGTH"}:
                        break
                    contents.append({"role": "model", "parts": [{"text": chunk}]})
                    contents.append({"role": "user", "parts": [{"text": self._continuation_prompt()}]})

                full_text = "\n".join(part for part in segments if part).strip()
                if not full_text:
                    raise RuntimeError("AI API returned empty text content")
                return full_text
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


def extract_fit_metrics(fit_path: Union[str, Path], physiological_max_hr: Optional[float] = None) -> Tuple[Dict[str, Dict[str, Optional[float]]], List[str]]:
    """Extract a broad set of metrics from a FIT file and list any missing fields."""
    decoded = _decode_fit_messages(fit_path)

    session_messages = decoded.get("session_mesgs", [])
    lap_messages = decoded.get("lap_mesgs", [])
    zone_target_messages = decoded.get("zones_target_mesgs", [])
    record_messages = decoded.get("record_mesgs", [])

    session_fields = session_messages[0] if session_messages else {}
    lap_fields = lap_messages[0] if lap_messages else {}
    zones_fields = zone_target_messages[0] if zone_target_messages else {}
    records = [record for record in record_messages if isinstance(record, dict) and record.get("timestamp") is not None]

    unavailable = []
    metrics = {
        "基础数据": {},
        "耐力数据": {},
        "心肺数据": {},
        "动态数据": {},
        "功率数据": {},
        "环境数据": {},
    }

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
    hr_reference = physiological_max_hr
    if hr_reference is None:
        fit_hr_max = max_heart_rate or (max(heart_rate_values) if heart_rate_values else None)
        hr_reference = fit_hr_max
        if fit_hr_max is not None:
            unavailable.append("心肺数据: 未输入生理最大心率，区间可能偏低")
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
        metrics["心肺数据"]["心率区间参考值"] = hr_reference
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


def parse_fit_activity(fit_path: Union[str, Path]) -> ActivitySummary:
    """Parse a FIT file and return a summary of the recorded session."""
    decoded = _decode_fit_messages(fit_path)
    session_messages = decoded.get("session_mesgs", [])
    if not session_messages:
        raise ValueError("No session message found in FIT file")

    fields = session_messages[0]
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


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def parse_km_points(raw_points: Optional[str], max_distance_km: Optional[float] = None) -> List[float]:
    if not raw_points:
        return []
    points: List[float] = []
    for token in raw_points.split(","):
        token = token.strip()
        if not token:
            continue
        try:
            km = float(token)
        except ValueError:
            continue
        if km <= 0:
            continue
        if max_distance_km is not None and km >= max_distance_km:
            continue
        points.append(round(km, 2))
    return sorted(set(points))


def parse_climb_segments(raw_segments: Optional[str]) -> List[Tuple[float, float]]:
    """Parse manual segments from format 'distance:ascent,distance:ascent' in km/m."""
    if not raw_segments:
        return []
    segments: List[Tuple[float, float]] = []
    for token in raw_segments.split(","):
        token = token.strip()
        if not token or ":" not in token:
            continue
        dist_text, ascent_text = token.split(":", 1)
        try:
            distance_km = float(dist_text.strip())
            ascent_m = float(ascent_text.strip())
        except ValueError:
            continue
        if distance_km <= 0:
            continue
        segments.append((distance_km, max(ascent_m, 0.0)))
    return segments


class UserProfileBuilder:
    def build(self, fit_path: Union[str, Path], user_input: UserInputProfile) -> UserProfile:
        metrics, unavailable = extract_fit_metrics(fit_path, physiological_max_hr=user_input.physiological_max_hr)
        base_metrics = metrics.get("基础数据", {})

        pace_min_per_km: Optional[float] = None
        pace = base_metrics.get("配速")
        if isinstance(pace, float):
            pace_min_per_km = pace

        irta_component = 0.5
        if user_input.irta_points is not None:
            irta_component = _clamp(user_input.irta_points / 1000.0, 0.2, 1.0)

        pace_component = 0.5
        if pace_min_per_km is not None and pace_min_per_km > 0:
            pace_component = _clamp(8.5 / pace_min_per_km, 0.2, 1.0)

        env_component = 0.5
        if user_input.recent_env_adaptation is not None:
            env_component = _clamp(user_input.recent_env_adaptation, 0.0, 1.0)

        ability_score = round((irta_component * 0.35 + pace_component * 0.45 + env_component * 0.20) * 100.0, 1)

        fatigue_risk = "medium"
        hrv = user_input.hrv_score
        if hrv is not None:
            if hrv < 35:
                fatigue_risk = "high"
            elif hrv >= 60:
                fatigue_risk = "low"

        status = (user_input.training_status or "").lower()
        if any(keyword in status for keyword in ["over", "过度", "fatigue", "疲劳"]):
            fatigue_risk = "high"
        elif any(keyword in status for keyword in ["ready", "充分", "恢复良好", "fresh"]):
            fatigue_risk = "low"

        hr_warning = None
        if user_input.physiological_max_hr is None:
            hr_warning = "未输入 physiological_max_hr，心率区间可能偏低"

        return UserProfile(
            ability_score=ability_score,
            fatigue_risk=fatigue_risk,
            hr_zone_reference=user_input.physiological_max_hr,
            hr_zone_warning=hr_warning,
            metrics=metrics,
            unavailable=unavailable,
        )


class RaceProfileBuilder:
    def _normalize_segments(self, distance_km: float, ascent_m: float, raw_segments: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
        if raw_segments:
            total_dist = sum(seg[0] for seg in raw_segments)
            total_ascent = sum(seg[1] for seg in raw_segments)
            if total_dist > 0:
                dist_scale = distance_km / total_dist
            else:
                dist_scale = 1.0
            if total_ascent > 0:
                ascent_scale = ascent_m / total_ascent
            else:
                ascent_scale = 0.0
            return [(round(d * dist_scale, 2), round(a * ascent_scale, 1)) for d, a in raw_segments]

        return [
            (round(distance_km * 0.35, 2), round(ascent_m * 0.25, 1)),
            (round(distance_km * 0.35, 2), round(ascent_m * 0.50, 1)),
            (round(distance_km * 0.30, 2), round(ascent_m * 0.25, 1)),
        ]

    def build(self, race_input: RaceInputProfile) -> RaceProfile:
        distance_km = max(race_input.distance_km, 1.0)
        ascent_m = max(race_input.ascent_m, 0.0)

        segments = self._normalize_segments(distance_km, ascent_m, race_input.manual_climb_segments)

        cumulative = 0.0
        steep_segments: List[Tuple[float, float, float]] = []
        supplemental_points: List[float] = []
        for segment_distance, segment_ascent in segments:
            start_km = cumulative
            end_km = cumulative + segment_distance
            gradient = segment_ascent / max(segment_distance, 0.1)
            if gradient >= 80.0:
                steep_segments.append((round(start_km, 2), round(end_km, 2), round(gradient, 1)))
                pre_climb_point = max(start_km - 0.6, 0.8)
                if pre_climb_point < distance_km:
                    supplemental_points.append(round(pre_climb_point, 2))
            cumulative = end_km

        cp_points = parse_km_points(",".join(str(p) for p in race_input.cp_points_km), max_distance_km=distance_km)
        if not cp_points:
            cp_points = [round(km, 1) for km in [distance_km * 0.25, distance_km * 0.5, distance_km * 0.75] if 0 < km < distance_km]

        aid_stations = sorted(set(cp_points))
        supplemental_points = sorted(set(p for p in supplemental_points if p not in aid_stations and p < distance_km))

        return RaceProfile(
            distance_km=distance_km,
            ascent_m=ascent_m,
            aid_stations_km=aid_stations,
            climb_segments=segments,
            steep_segments=steep_segments,
            supplemental_points_km=supplemental_points,
            climb_trigger_m=max(race_input.climb_trigger_m, 100.0),
            max_interval_min=max(race_input.max_interval_min, 20.0),
            weather_temp_c=race_input.weather_temp_c,
            humidity_pct=race_input.humidity_pct,
            location_history_notes=race_input.location_history_notes,
        )


class TrailLabRuleEngine:
    def _build_climb_trigger_points(self, race_profile: RaceProfile, climb_trigger_m: float) -> List[float]:
        if climb_trigger_m <= 0:
            return []

        points: List[float] = []
        next_trigger_m = climb_trigger_m
        accumulated_ascent = 0.0
        cumulative_km = 0.0

        for segment_distance, segment_ascent in race_profile.climb_segments:
            if segment_distance <= 0:
                continue

            seg_start_ascent = accumulated_ascent
            seg_end_ascent = accumulated_ascent + max(segment_ascent, 0.0)
            seg_start_km = cumulative_km
            seg_end_km = cumulative_km + segment_distance

            while next_trigger_m <= seg_end_ascent and seg_end_ascent > seg_start_ascent:
                ratio = (next_trigger_m - seg_start_ascent) / (seg_end_ascent - seg_start_ascent)
                trigger_km = seg_start_km + ratio * (seg_end_km - seg_start_km)
                if 0.5 <= trigger_km < race_profile.distance_km:
                    points.append(round(trigger_km, 2))
                next_trigger_m += climb_trigger_m

            accumulated_ascent = seg_end_ascent
            cumulative_km = seg_end_km

        return sorted(set(points))

    def _build_time_fallback_points(self, race_profile: RaceProfile, finish_time_h: float, max_interval_min: float) -> List[float]:
        if max_interval_min <= 0:
            return []

        finish_time_min = max(finish_time_h * 60.0, 1.0)
        distance_per_min = race_profile.distance_km / finish_time_min
        interval_km = max(distance_per_min * max_interval_min, 0.8)

        points: List[float] = []
        km = interval_km
        while km < race_profile.distance_km:
            if km >= 0.5:
                points.append(round(km, 2))
            km += interval_km
        return sorted(set(points))

    def compute(self, user_profile: UserProfile, race_profile: RaceProfile, weight_kg: float) -> RuleEngineOutput:
        ability_scale = _clamp(user_profile.ability_score / 100.0, 0.35, 1.0)
        base_pace_min_per_km = 8.8 - ability_scale * 2.2

        climb_factor = race_profile.ascent_m / max(race_profile.distance_km, 1.0)
        climb_penalty = 1.0 + _clamp((climb_factor - 30.0) / 120.0, 0.0, 0.6)

        fatigue_penalty = 1.0
        if user_profile.fatigue_risk == "high":
            fatigue_penalty = 1.12
        elif user_profile.fatigue_risk == "low":
            fatigue_penalty = 0.96

        finish_time_h = (race_profile.distance_km * base_pace_min_per_km / 60.0) * climb_penalty * fatigue_penalty
        finish_time_h = round(max(finish_time_h, 1.0), 2)

        carbs_per_hour = 55.0 + (1.0 - ability_scale) * 8.0 + _clamp((climb_factor - 35.0) / 12.0, 0.0, 10.0)
        if user_profile.fatigue_risk == "high":
            carbs_per_hour += 4.0

        fluid_per_hour = 550.0
        if race_profile.weather_temp_c is not None:
            fluid_per_hour += max(0.0, race_profile.weather_temp_c - 15.0) * 18.0
        if race_profile.humidity_pct is not None:
            fluid_per_hour += max(0.0, race_profile.humidity_pct - 55.0) * 3.0
        fluid_per_hour = _clamp(fluid_per_hour, 450.0, 1100.0)

        sodium_per_hour = 450.0
        if race_profile.weather_temp_c is not None and race_profile.weather_temp_c >= 24.0:
            sodium_per_hour += 120.0
        if race_profile.humidity_pct is not None and race_profile.humidity_pct >= 70.0:
            sodium_per_hour += 80.0

        total_carbs = round(carbs_per_hour * finish_time_h, 1)
        total_fluid = round(fluid_per_hour * finish_time_h, 1)
        total_sodium = round(sodium_per_hour * finish_time_h, 1)

        climb_trigger_m = race_profile.climb_trigger_m
        max_interval_min = race_profile.max_interval_min
        climb_trigger_points = self._build_climb_trigger_points(race_profile, climb_trigger_m)
        time_fallback_points = self._build_time_fallback_points(race_profile, finish_time_h, max_interval_min)

        fueling_km = set(race_profile.aid_stations_km)
        fueling_km.update(race_profile.supplemental_points_km)
        fueling_km.update(climb_trigger_points)
        fueling_km.update(time_fallback_points)

        sorted_km = sorted(point for point in fueling_km if 0.5 <= point < race_profile.distance_km)
        if not sorted_km:
            sorted_km = [round(race_profile.distance_km / 2.0, 1)]

        carb_per_event = round(total_carbs / len(sorted_km), 1)
        fluid_per_event = round(total_fluid / len(sorted_km), 1)
        sodium_per_event = round(total_sodium / len(sorted_km), 1)

        fueling_points: List[Dict[str, Any]] = []
        for point_km in sorted_km:
            time_h = finish_time_h * (point_km / race_profile.distance_km)
            sources: List[str] = []
            if any(abs(point_km - cp) <= 0.05 for cp in race_profile.aid_stations_km):
                sources.append("cp")
            if any(abs(point_km - sp) <= 0.05 for sp in race_profile.supplemental_points_km):
                sources.append("supplemental")
            if any(abs(point_km - cp) <= 0.05 for cp in climb_trigger_points):
                sources.append("climb_trigger")
            if any(abs(point_km - tf) <= 0.05 for tf in time_fallback_points):
                sources.append("time_fallback")

            fueling_points.append(
                {
                    "km": round(point_km, 2),
                    "time_h": round(time_h, 2),
                    "carbs_g": carb_per_event,
                    "fluid_ml": fluid_per_event,
                    "sodium_mg": sodium_per_event,
                    "source": "+".join(sorted(set(sources))) if sources else "auto",
                }
            )

        warnings: List[str] = []
        if user_profile.hr_zone_warning:
            warnings.append(user_profile.hr_zone_warning)

        return RuleEngineOutput(
            contract_version="trail_lab_rule_contract_v1",
            estimated_finish_time_h=finish_time_h,
            carbs_per_hour_g=round(carbs_per_hour, 1),
            fluid_per_hour_ml=round(fluid_per_hour, 1),
            sodium_per_hour_mg=round(sodium_per_hour, 1),
            total_carbs_g=total_carbs,
            total_fluid_ml=total_fluid,
            total_sodium_mg=total_sodium,
            fueling_points=fueling_points,
            trigger_config={
                "climb_trigger_m": climb_trigger_m,
                "max_interval_min": max_interval_min,
            },
            warnings=warnings,
        )


class AIPlanner:
    def __init__(self, provider: str, model: str, api_key: Optional[str], temperature: float = 0.6, verify_ssl: bool = True, language: str = "zh"):
        self.provider = provider
        self.model = model
        self.api_key = api_key
        self.temperature = temperature
        self.verify_ssl = verify_ssl
        self.language = language

    def _build_prompt(self, user_profile: UserProfile, race_profile: RaceProfile, rule_output: RuleEngineOutput) -> str:
        contract_json = json.dumps(rule_engine_output_to_contract(user_profile, race_profile, rule_output), ensure_ascii=False, indent=2)
        if self.language == "en":
            return (
                "You are AI Planner and explainer only. Do not recompute core numbers.\n"
                "Use the fixed Rule Engine outputs to explain and sequence fueling actions.\n"
                "Sport mode is trail running only.\n"
                f"User ability score: {user_profile.ability_score}\n"
                f"User fatigue risk: {user_profile.fatigue_risk}\n"
                f"Route distance: {race_profile.distance_km} km, ascent: {race_profile.ascent_m} m\n"
                f"Aid stations (km): {race_profile.aid_stations_km}\n"
                f"Supplemental points (km): {race_profile.supplemental_points_km}\n"
                f"Rule estimated finish time (h): {rule_output.estimated_finish_time_h}\n"
                f"Rule carbs/hour: {rule_output.carbs_per_hour_g}\n"
                f"Rule fluid/hour (ml): {rule_output.fluid_per_hour_ml}\n"
                f"Rule sodium/hour (mg): {rule_output.sodium_per_hour_mg}\n"
                f"Fueling points: {rule_output.fueling_points}\n"
                f"Warnings: {rule_output.warnings}\n"
                f"Rule contract JSON:\n{contract_json}\n"
                "You must not output any number outside the contract JSON unless explicitly marked as assumption."
                " Output a practical timeline checklist with concise explanations."
            )

        return (
            "你是 AI Planner，只负责规划与解释，不重新计算规则引擎数值。\n"
            "请严格基于 Rule Engine 的固定结果安排补给时间点并解释原因。\n"
            "运动模式仅为越野跑。\n"
            f"用户能力分: {user_profile.ability_score}\n"
            f"用户疲劳风险: {user_profile.fatigue_risk}\n"
            f"线路距离: {race_profile.distance_km} km，爬升: {race_profile.ascent_m} m\n"
            f"CP/补给站 (km): {race_profile.aid_stations_km}\n"
            f"补充补给点 (km): {race_profile.supplemental_points_km}\n"
            f"规则引擎完赛时间(h): {rule_output.estimated_finish_time_h}\n"
            f"规则引擎碳水(g/h): {rule_output.carbs_per_hour_g}\n"
            f"规则引擎液体(ml/h): {rule_output.fluid_per_hour_ml}\n"
            f"规则引擎钠(mg/h): {rule_output.sodium_per_hour_mg}\n"
            f"补给点清单: {rule_output.fueling_points}\n"
            f"警告: {rule_output.warnings}\n"
            f"规则契约 JSON:\n{contract_json}\n"
            "除非明确标注为假设，否则不得输出契约 JSON 之外的新数值。"
            " 请输出可执行的时间轴清单（赛前/赛中/赛后），并给出每个阶段的简要解释。"
        )

    def plan_and_explain(self, user_profile: UserProfile, race_profile: RaceProfile, rule_output: RuleEngineOutput) -> str:
        prompt = self._build_prompt(user_profile, race_profile, rule_output)
        adapter = create_model_adapter(
            provider=self.provider,
            model=self.model,
            api_key=self.api_key,
            verify_ssl=self.verify_ssl,
            language=self.language,
        )
        return adapter.generate(prompt, temperature=self.temperature)


def rule_engine_output_to_contract(user_profile: UserProfile, race_profile: RaceProfile, rule_output: RuleEngineOutput) -> Dict[str, Any]:
    return {
        "contract_version": rule_output.contract_version,
        "sport_mode": "trail_run",
        "user_profile": {
            "ability_score": user_profile.ability_score,
            "fatigue_risk": user_profile.fatigue_risk,
            "hr_zone_reference": user_profile.hr_zone_reference,
            "hr_zone_warning": user_profile.hr_zone_warning,
        },
        "race_profile": {
            "distance_km": race_profile.distance_km,
            "ascent_m": race_profile.ascent_m,
            "aid_stations_km": race_profile.aid_stations_km,
            "supplemental_points_km": race_profile.supplemental_points_km,
            "steep_segments": race_profile.steep_segments,
            "weather_temp_c": race_profile.weather_temp_c,
            "humidity_pct": race_profile.humidity_pct,
        },
        "trigger_config": rule_output.trigger_config,
        "engine_outputs": {
            "estimated_finish_time_h": rule_output.estimated_finish_time_h,
            "carbs_per_hour_g": rule_output.carbs_per_hour_g,
            "fluid_per_hour_ml": rule_output.fluid_per_hour_ml,
            "sodium_per_hour_mg": rule_output.sodium_per_hour_mg,
            "total_carbs_g": rule_output.total_carbs_g,
            "total_fluid_ml": rule_output.total_fluid_ml,
            "total_sodium_mg": rule_output.total_sodium_mg,
            "fueling_points": rule_output.fueling_points,
            "warnings": rule_output.warnings,
        },
    }


def render_rule_engine_contract_json(user_profile: UserProfile, race_profile: RaceProfile, rule_output: RuleEngineOutput) -> str:
    return json.dumps(
        rule_engine_output_to_contract(user_profile, race_profile, rule_output),
        ensure_ascii=False,
        indent=2,
        sort_keys=True,
    )


def render_rule_engine_output(rule_output: RuleEngineOutput, language: str = "zh") -> str:
    if language == "en":
        lines = [
            "Trail Lab Rule Engine Output",
            f"- Estimated finish time: {rule_output.estimated_finish_time_h:.2f} h",
            f"- Carbohydrate: {rule_output.carbs_per_hour_g:.1f} g/h (total {rule_output.total_carbs_g:.1f} g)",
            f"- Fluid: {rule_output.fluid_per_hour_ml:.0f} ml/h (total {rule_output.total_fluid_ml:.0f} ml)",
            f"- Sodium: {rule_output.sodium_per_hour_mg:.0f} mg/h (total {rule_output.total_sodium_mg:.0f} mg)",
            "- Fueling points:",
        ]
        for fp in rule_output.fueling_points:
            lines.append(
                f"  km {fp['km']:.1f} (~{fp['time_h']:.2f} h): {fp['carbs_g']:.1f} g carbs, {fp['fluid_ml']:.0f} ml fluid, {fp['sodium_mg']:.0f} mg sodium"
            )
    else:
        lines = [
            "Trail Lab Rule Engine 输出",
            f"- 预计完赛时间: {rule_output.estimated_finish_time_h:.2f} h",
            f"- 碳水: {rule_output.carbs_per_hour_g:.1f} g/h（总量 {rule_output.total_carbs_g:.1f} g）",
            f"- 液体: {rule_output.fluid_per_hour_ml:.0f} ml/h（总量 {rule_output.total_fluid_ml:.0f} ml）",
            f"- 钠: {rule_output.sodium_per_hour_mg:.0f} mg/h（总量 {rule_output.total_sodium_mg:.0f} mg）",
            "- 补给点:",
        ]
        for fp in rule_output.fueling_points:
            lines.append(
                f"  km {fp['km']:.1f}（约 {fp['time_h']:.2f} h）: 碳水 {fp['carbs_g']:.1f} g, 液体 {fp['fluid_ml']:.0f} ml, 钠 {fp['sodium_mg']:.0f} mg"
            )

    if rule_output.warnings:
        lines.append("- Warnings:" if language == "en" else "- 警告:")
        for warning in rule_output.warnings:
            lines.append(f"  - {warning}")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="AI Fuel Planner: User Profile -> Race Profile -> Trail Lab Rule Engine -> AI Planner")
    parser.add_argument("fit_file", type=Path, help="Path to the FIT activity file.")
    parser.add_argument("--weight", type=float, default=70.0, help="Athlete body weight in kilograms.")
    parser.add_argument("--distance-km", type=float, default=30.0, help="Target trail distance in km.")
    parser.add_argument("--ascent-m", type=float, default=1200.0, help="Target trail total ascent in meters.")
    parser.add_argument("--cp-km", type=str, default="", help="Manual CP points in km, comma-separated. Example: 8,16,24")
    parser.add_argument("--segment-gain", type=str, default="", help="Manual climb segments in 'distance:ascent' pairs, comma-separated. Example: 6:200,8:800,10:300")
    parser.add_argument("--climb-trigger-m", type=float, default=250.0, help="Trigger fueling every N meters of cumulative ascent.")
    parser.add_argument("--max-interval-min", type=float, default=45.0, help="Fallback trigger: maximum minutes allowed between fueling events.")
    parser.add_argument("--physiological-max-hr", type=float, default=None, help="Physiological maximum HR from lab/interval testing.")
    parser.add_argument("--irta-points", type=float, default=None, help="IRTA score/points to calibrate capability.")
    parser.add_argument("--env-adaptation", type=float, default=None, help="Recent environment adaptation score, range 0~1.")
    parser.add_argument("--hrv", type=float, default=None, help="Recent HRV score.")
    parser.add_argument("--training-status", type=str, default=None, help="Current training status, e.g. overreaching/ready.")
    parser.add_argument("--location-notes", type=str, default=None, help="Historical notes for this course location.")
    parser.add_argument("--provider", type=str, default="openai", choices=["openai", "deepseek", "gemini", "mock"], help="AI provider name, e.g. openai, deepseek, gemini or mock.")
    parser.add_argument("--model", type=str, default="gpt-4o-mini", help="AI model name to use.")
    parser.add_argument("--api-key", type=str, default=None, help="AI API key, if required by provider.")
    parser.add_argument("--temperature", type=float, default=0.7, help="AI generation temperature.")
    parser.add_argument("--language", type=str, default="zh", choices=["zh", "en"], help="Interface and output language: zh or en.")
    parser.add_argument("--insecure", action="store_true", help="Disable SSL certificate verification for AI API calls.")
    parser.add_argument("--weather-temp", type=float, default=None, help="Expected event-day temperature in Celsius.")
    parser.add_argument("--humidity", type=float, default=None, help="Expected event-day humidity percentage.")
    parser.add_argument("--output-file", type=Path, default=None, help="Optional path to save the full strategy text.")
    args = parser.parse_args()

    api_key = resolve_api_key(args.provider, args.api_key)
    user_input = UserInputProfile(
        weight_kg=args.weight,
        irta_points=args.irta_points,
        recent_env_adaptation=args.env_adaptation,
        hrv_score=args.hrv,
        training_status=args.training_status,
        physiological_max_hr=args.physiological_max_hr,
    )
    race_input = RaceInputProfile(
        distance_km=args.distance_km,
        ascent_m=args.ascent_m,
        weather_temp_c=args.weather_temp,
        humidity_pct=args.humidity,
        location_history_notes=args.location_notes,
        cp_points_km=parse_km_points(args.cp_km, max_distance_km=args.distance_km),
        manual_climb_segments=parse_climb_segments(args.segment_gain),
        climb_trigger_m=args.climb_trigger_m,
        max_interval_min=args.max_interval_min,
    )

    user_profile = UserProfileBuilder().build(args.fit_file, user_input)
    race_profile = RaceProfileBuilder().build(race_input)
    rule_output = TrailLabRuleEngine().compute(user_profile, race_profile, weight_kg=args.weight)

    planner = AIPlanner(
        provider=args.provider,
        model=args.model,
        api_key=api_key,
        temperature=args.temperature,
        verify_ssl=not args.insecure,
        language=args.language,
    )
    strategy = planner.plan_and_explain(user_profile, race_profile, rule_output)

    print("Rule Contract JSON")
    print(render_rule_engine_contract_json(user_profile, race_profile, rule_output))
    print()
    print(render_rule_engine_output(rule_output, language=args.language))
    print("\n" + ("AI Planner Output" if args.language == "en" else "AI Planner 输出"))
    print(strategy)

    if args.output_file is not None:
        output_path = args.output_file.expanduser().resolve()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(strategy, encoding="utf-8")
        print(f"Full strategy saved to: {output_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
