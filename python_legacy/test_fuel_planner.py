import io
import json
import urllib.error

from fuel_planner import (
    RaceInputProfile,
    RaceProfileBuilder,
    TrailLabRuleEngine,
    UserInputProfile,
    UserProfileBuilder,
    create_model_adapter,
    extract_fit_metrics,
    parse_climb_segments,
    parse_fit_activity,
    parse_km_points,
    rule_engine_output_to_contract,
    resolve_api_key,
    resolve_fit_path,
)


def test_parse_fit_activity():
    fit_path = resolve_fit_path("23231556007_ACTIVITY.fit")
    summary = parse_fit_activity(fit_path)
    assert summary.total_timer_time > 0
    assert summary.total_distance >= 0
    assert summary.total_calories >= 0
    assert summary.sport != ""


def test_extract_fit_metrics_warns_without_physiological_max_hr():
    fit_path = resolve_fit_path("23231556007_ACTIVITY.fit")
    metrics, unavailable = extract_fit_metrics(fit_path, physiological_max_hr=None)
    assert "心肺数据" in metrics
    assert any("区间可能偏低" in item for item in unavailable)


def test_extract_fit_metrics_uses_user_physiological_max_hr():
    fit_path = resolve_fit_path("23231556007_ACTIVITY.fit")
    metrics, unavailable = extract_fit_metrics(fit_path, physiological_max_hr=188)
    assert metrics["心肺数据"]["心率区间参考值"] == 188
    assert not any("区间可能偏低" in item for item in unavailable)


def test_parse_points_and_segments():
    points = parse_km_points("8, 16, 24, 24, -2", max_distance_km=30)
    segments = parse_climb_segments("6:200,8:800,10:300,bad")
    assert points == [8.0, 16.0, 24.0]
    assert segments == [(6.0, 200.0), (8.0, 800.0), (10.0, 300.0)]


def test_rule_engine_adds_supplemental_points_for_steep_segments():
    fit_path = resolve_fit_path("23231556007_ACTIVITY.fit")
    user_profile = UserProfileBuilder().build(
        fit_path,
        UserInputProfile(
            weight_kg=68.0,
            irta_points=500,
            recent_env_adaptation=0.6,
            hrv_score=45,
            training_status="ready",
            physiological_max_hr=188,
        ),
    )

    race_profile = RaceProfileBuilder().build(
        RaceInputProfile(
            distance_km=30.0,
            ascent_m=1400.0,
            weather_temp_c=24.0,
            humidity_pct=65.0,
            location_history_notes="technical climbs in mid section",
            cp_points_km=[8.0, 16.0, 24.0],
            manual_climb_segments=[(6.0, 200.0), (8.0, 900.0), (10.0, 300.0), (6.0, 0.0)],
        )
    )
    output = TrailLabRuleEngine().compute(user_profile, race_profile, weight_kg=68.0)

    assert output.estimated_finish_time_h > 0
    assert output.total_carbs_g > 0
    assert len(output.fueling_points) > 0
    assert len(race_profile.supplemental_points_km) > 0
    assert len(race_profile.steep_segments) > 0
    assert any("climb_trigger" in point.get("source", "") for point in output.fueling_points)


def test_rule_engine_time_fallback_caps_interval_between_fueling_points():
    fit_path = resolve_fit_path("23231556007_ACTIVITY.fit")
    user_profile = UserProfileBuilder().build(
        fit_path,
        UserInputProfile(
            weight_kg=68.0,
            irta_points=500,
            recent_env_adaptation=0.6,
            hrv_score=45,
            training_status="ready",
            physiological_max_hr=188,
        ),
    )

    race_profile = RaceProfileBuilder().build(
        RaceInputProfile(
            distance_km=32.0,
            ascent_m=1200.0,
            weather_temp_c=20.0,
            humidity_pct=50.0,
            location_history_notes=None,
            cp_points_km=[],
            manual_climb_segments=[(12.0, 200.0), (10.0, 800.0), (10.0, 200.0)],
            climb_trigger_m=900.0,
            max_interval_min=30.0,
        )
    )
    output = TrailLabRuleEngine().compute(user_profile, race_profile, weight_kg=68.0)

    points = sorted(output.fueling_points, key=lambda item: item["time_h"])
    assert len(points) >= 2
    max_gap_min = max((curr["time_h"] - prev["time_h"]) * 60.0 for prev, curr in zip(points, points[1:]))
    assert max_gap_min <= 30.5
    assert any("time_fallback" in point.get("source", "") for point in output.fueling_points)


def test_rule_engine_contract_has_stable_top_level_keys():
    fit_path = resolve_fit_path("23231556007_ACTIVITY.fit")
    user_profile = UserProfileBuilder().build(
        fit_path,
        UserInputProfile(
            weight_kg=68.0,
            irta_points=500,
            recent_env_adaptation=0.6,
            hrv_score=45,
            training_status="ready",
            physiological_max_hr=188,
        ),
    )
    race_profile = RaceProfileBuilder().build(
        RaceInputProfile(
            distance_km=30.0,
            ascent_m=1400.0,
            weather_temp_c=24.0,
            humidity_pct=65.0,
            location_history_notes="technical climbs in mid section",
            cp_points_km=[8.0, 16.0, 24.0],
            manual_climb_segments=[(6.0, 200.0), (8.0, 900.0), (10.0, 300.0), (6.0, 0.0)],
        )
    )
    output = TrailLabRuleEngine().compute(user_profile, race_profile, weight_kg=68.0)
    contract = rule_engine_output_to_contract(user_profile, race_profile, output)

    assert contract["contract_version"] == "trail_lab_rule_contract_v1"
    assert contract["sport_mode"] == "trail_run"
    assert "trigger_config" in contract
    assert "engine_outputs" in contract
    assert isinstance(contract["engine_outputs"]["fueling_points"], list)


def test_resolve_api_key_prefers_provider_specific_env(monkeypatch):
    monkeypatch.delenv("DEEPSEEK_API_KEY", raising=False)
    monkeypatch.setenv("OPENAI_API_KEY", "openai-key")
    assert resolve_api_key("deepseek") == "openai-key"
    monkeypatch.setenv("DEEPSEEK_API_KEY", "deepseek-key")
    assert resolve_api_key("deepseek") == "deepseek-key"
    assert resolve_api_key("openai") == "openai-key"


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

    result = adapter.generate("hi")
    assert result == "ok"
    assert len(calls) == 2
    assert calls[1].endswith("/v1beta/models/gemini-flash-latest:generateContent?key=test-key")
