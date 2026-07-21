import os
from pathlib import Path

from fuel_planner import get_supported_targets, parse_fit_activity, recommend_fuel, resolve_api_key


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
