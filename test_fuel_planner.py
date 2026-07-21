import io
import json
import os
import urllib.error
from pathlib import Path

from fuel_planner import (
    build_prompt,
    create_model_adapter,
    get_supported_targets,
    parse_fit_activity,
    recommend_fuel,
    resolve_api_key,
)


def test_parse_fit_activity():
    fit_path = Path("23231556007_ACTIVITY.fit")
    summary = parse_fit_activity(fit_path)
    assert summary.total_timer_time > 0
    assert summary.total_distance >= 0
    assert summary.total_calories >= 0
    assert summary.sport != ""


def test_recommend_fuel():
    summary = type(
        "Summary",
        (),
        {
            "total_timer_time": 5400,
            "total_distance": 20000,
            "total_calories": 900,
            "avg_heart_rate": 145,
            "max_heart_rate": 170,
            "avg_power": None,
            "max_power": None,
            "normalized_power": None,
            "avg_speed": 5.6,
            "max_speed": 8.2,
            "avg_cadence": 85,
            "max_cadence": 92,
            "sport": "running",
            "total_ascent": 180,
            "total_descent": 180,
        },
    )
    plan = recommend_fuel(summary, body_weight_kg=68.0)
    assert plan.estimated_carbs_g >= 20
    assert plan.hourly_carb_rate_g > 0
    assert plan.fluid_ml > 0


def test_supported_targets_focus_on_outdoor_categories():
    targets = get_supported_targets("en")
    assert targets == [
        ("trail_run", "Trail Run"),
        ("mountain_run", "Mountain Run"),
        ("mountain_hike", "Mountain Hiking"),
    ]


def test_resolve_api_key_prefers_provider_specific_env(monkeypatch):
    monkeypatch.delenv("DEEPSEEK_API_KEY", raising=False)
    monkeypatch.setenv("OPENAI_API_KEY", "openai-key")
    assert resolve_api_key("deepseek") == "openai-key"
    monkeypatch.setenv("DEEPSEEK_API_KEY", "deepseek-key")
    assert resolve_api_key("deepseek") == "deepseek-key"
    assert resolve_api_key("openai") == "openai-key"


def test_build_prompt_includes_weather_context():
    prompt = build_prompt({}, [], "目标：越野跑", 68.0, "zh", weather_temp_c=24.0, humidity_pct=55.0)
    assert "24.0°C" in prompt
    assert "55.0%" in prompt


def test_create_gemini_adapter():
    adapter = create_model_adapter("gemini", "gemini-2.0-flash", api_key="test-key")
    assert adapter.provider == "gemini"


def test_gemini_adapter_uses_large_output_token_budget(monkeypatch):
    captured = {}

    class FakeResponse:
        def __init__(self, body: bytes):
            self._body = body

        def read(self):
            return self._body

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

    def fake_urlopen(request, timeout=60, context=None):
        payload = json.loads(request.data.decode("utf-8"))
        captured["max_output_tokens"] = payload["generationConfig"]["maxOutputTokens"]
        return FakeResponse(json.dumps({"candidates": [{"content": {"parts": [{"text": "ok"}]}}]}).encode("utf-8"))

    monkeypatch.setattr("fuel_planner.urllib.request.urlopen", fake_urlopen)
    adapter = create_model_adapter("gemini", "gemini-flash-latest", api_key="test-key")
    adapter.generate("hi")

    assert captured["max_output_tokens"] >= 3000


def test_gemini_adapter_falls_back_to_latest_model(monkeypatch):
    class FakeResponse:
        def __init__(self, body: bytes):
            self._body = body

        def read(self):
            return self._body

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

    calls = []

    def fake_urlopen(request, timeout=60, context=None):
        calls.append(request.full_url)
        if len(calls) == 1:
            raise urllib.error.HTTPError(
                request.full_url,
                404,
                "Not Found",
                hdrs=None,
                fp=io.BytesIO(b'{"error": {"message": "model not found"}}'),
            )
        return FakeResponse(
            json.dumps({"candidates": [{"content": {"parts": [{"text": "ok"}]}}]}).encode("utf-8")
        )

    monkeypatch.setattr("fuel_planner.urllib.request.urlopen", fake_urlopen)
    adapter = create_model_adapter("gemini", "gemini-2.0-flash", api_key="test-key")

    assert adapter.generate("hi") == "ok"
    assert len(calls) == 2
    assert calls[1].endswith("/v1beta/models/gemini-flash-latest:generateContent?key=test-key")
