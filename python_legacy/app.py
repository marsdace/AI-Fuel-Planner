import os
import tempfile
from pathlib import Path
from typing import Optional

import streamlit as st

from fuel_planner import (
    AIPlanner,
    RaceInputProfile,
    RaceProfileBuilder,
    TrailLabRuleEngine,
    UserInputProfile,
    UserProfileBuilder,
    parse_fit_activity,
    parse_climb_segments,
    parse_km_points,
    render_rule_engine_contract_json,
    render_rule_engine_output,
    render_activity_summary,
)


def get_api_key(provider: str, manual_key: Optional[str]) -> Optional[str]:
    if provider == "deepseek":
        secret_value = None
        try:
            secret_value = st.secrets.get("DEEPSEEK_API_KEY")
        except Exception:
            secret_value = None
        return manual_key or secret_value or os.environ.get("DEEPSEEK_API_KEY") or os.environ.get("OPENAI_API_KEY")
    if provider == "openai":
        secret_value = None
        try:
            secret_value = st.secrets.get("OPENAI_API_KEY")
        except Exception:
            secret_value = None
        return manual_key or secret_value or os.environ.get("OPENAI_API_KEY")
    if provider == "gemini":
        secret_value = None
        try:
            secret_value = st.secrets.get("GEMINI_API_KEY")
        except Exception:
            secret_value = None
        return manual_key or secret_value or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    return None


def main() -> None:
    st.set_page_config(page_title="AI Fuel Planner", layout="wide")
    st.title("AI Fuel Planner")
    st.markdown(
        "Trail mode only: User Profile -> Race Profile -> Trail Lab Rule Engine -> AI Planner."
    )

    with st.sidebar:
        st.header("Configuration")
        provider = st.selectbox("AI Provider", ["openai", "deepseek", "gemini", "mock"], index=1)
        model = st.text_input(
            "Model",
            value=("gemini-flash-latest" if provider == "gemini" else "deepseek-v4-pro" if provider == "deepseek" else "gpt-4o-mini"),
        )
        language = st.selectbox("Language", ["zh", "en"], index=0)
        weight = st.number_input("Athlete Weight (kg)", min_value=30.0, max_value=200.0, value=70.0)
        st.caption("Sport mode is fixed: Trail Run")
        distance_km = st.number_input("Target Distance (km)", min_value=1.0, max_value=300.0, value=30.0)
        ascent_m = st.number_input("Target Elevation Gain (m)", min_value=0.0, max_value=15000.0, value=1200.0)
        cp_km_text = st.text_input("Manual CP points (km, comma-separated)", value="8,16,24")
        segment_gain_text = st.text_input(
            "Manual climb segments (distance:ascent, comma-separated)",
            value="6:200,8:800,10:300",
            help="Example: 6:200,8:800 means 6 km with 200 m climb, then 8 km with 800 m climb.",
        )
        climb_trigger_m = st.number_input("Climb trigger (m gain per fueling event)", min_value=100.0, max_value=800.0, value=250.0, step=10.0)
        max_interval_min = st.number_input("Max fueling interval (minutes, fallback)", min_value=20.0, max_value=90.0, value=45.0, step=1.0)

        physiological_max_hr = st.number_input("physiological_max_hr", min_value=0.0, max_value=260.0, value=0.0)
        irta_points = st.number_input("IRTA points", min_value=0.0, max_value=2000.0, value=0.0)
        env_adaptation = st.slider("Recent environment adaptation (0~1)", min_value=0.0, max_value=1.0, value=0.5, step=0.05)
        hrv = st.number_input("HRV", min_value=0.0, max_value=200.0, value=0.0)
        training_status = st.text_input("Training status", value="ready")
        location_notes = st.text_area("Location historical notes", value="")

        temperature = st.slider(
            "AI Response Variability",
            min_value=0.0,
            max_value=1.0,
            value=0.7,
            step=0.05,
            help="Controls how deterministic or creative the AI output is. Lower = more stable, higher = more diverse.",
        )
        weather_temp = st.number_input("Expected temperature (°C)", min_value=-30.0, max_value=60.0, value=20.0, step=1.0)
        humidity = st.number_input("Expected humidity (%)", min_value=0.0, max_value=100.0, value=50.0, step=1.0)
        insecure = st.checkbox("Disable SSL verification (for local testing)")
        manual_api_key = st.text_input(
            "API Key",
            type="password",
            help="Paste your API key here for the selected provider. This also works when secrets are not configured.",
        )
        api_key = get_api_key(provider, manual_api_key)

        if provider == "deepseek":
            if api_key:
                st.success("DeepSeek API key is ready.")
            else:
                st.warning(
                    "DeepSeek API key not found. Please enter it above or add DEEPSEEK_API_KEY to your Streamlit secrets."
                )
        elif provider == "openai":
            if not api_key:
                st.warning("Please enter an OpenAI API key above or add OPENAI_API_KEY to your Streamlit secrets.")
        elif provider == "gemini":
            if not api_key:
                st.warning("Please enter a Gemini API key above or add GEMINI_API_KEY to your Streamlit secrets.")

    file_upload = st.file_uploader("Upload FIT file", type=["fit"])

    if file_upload is not None:
        st.success(f"Uploaded: {file_upload.name}")

        with tempfile.NamedTemporaryFile(delete=False, suffix=".fit") as tmp_file:
            tmp_file.write(file_upload.getbuffer())
            temp_path = Path(tmp_file.name)

        try:
            with st.expander("Activity Summary"):
                summary = parse_fit_activity(temp_path)
                st.text(render_activity_summary(summary))

            if st.button("Generate Fueling Strategy"):
                if provider != "mock" and not api_key:
                    st.error("API key is required for the selected provider.")
                else:
                    with st.spinner("Calling AI service..."):
                        try:
                            user_profile = UserProfileBuilder().build(
                                temp_path,
                                UserInputProfile(
                                    weight_kg=weight,
                                    irta_points=(irta_points if irta_points > 0 else None),
                                    recent_env_adaptation=env_adaptation,
                                    hrv_score=(hrv if hrv > 0 else None),
                                    training_status=training_status,
                                    physiological_max_hr=(physiological_max_hr if physiological_max_hr > 0 else None),
                                ),
                            )
                            race_profile = RaceProfileBuilder().build(
                                RaceInputProfile(
                                    distance_km=distance_km,
                                    ascent_m=ascent_m,
                                    weather_temp_c=weather_temp,
                                    humidity_pct=humidity,
                                    location_history_notes=location_notes or None,
                                    cp_points_km=parse_km_points(cp_km_text, max_distance_km=distance_km),
                                    manual_climb_segments=parse_climb_segments(segment_gain_text),
                                    climb_trigger_m=climb_trigger_m,
                                    max_interval_min=max_interval_min,
                                )
                            )
                            rule_output = TrailLabRuleEngine().compute(user_profile, race_profile, weight_kg=weight)
                            strategy = AIPlanner(
                                provider=provider,
                                model=model,
                                api_key=api_key,
                                temperature=temperature,
                                verify_ssl=not insecure,
                                language=language,
                            ).plan_and_explain(user_profile, race_profile, rule_output)

                            st.markdown("### Rule Engine")
                            st.text(render_rule_engine_output(rule_output, language=language))
                            with st.expander("Rule Contract JSON"):
                                st.code(render_rule_engine_contract_json(user_profile, race_profile, rule_output), language="json")
                            st.markdown("### AI Planner")
                            st.success("Fueling strategy generated successfully.")
                            st.code(strategy, language="text")
                            if user_profile.hr_zone_warning:
                                st.warning(user_profile.hr_zone_warning)

                            with st.expander("User Profile (debug)"):
                                st.json(
                                    {
                                        "ability_score": user_profile.ability_score,
                                        "fatigue_risk": user_profile.fatigue_risk,
                                        "hr_zone_warning": user_profile.hr_zone_warning,
                                        "unavailable": user_profile.unavailable,
                                    }
                                )

                            with st.expander("Race Profile (debug)"):
                                st.json(
                                    {
                                        "distance_km": race_profile.distance_km,
                                        "ascent_m": race_profile.ascent_m,
                                        "aid_stations_km": race_profile.aid_stations_km,
                                        "supplemental_points_km": race_profile.supplemental_points_km,
                                        "climb_trigger_m": race_profile.climb_trigger_m,
                                        "max_interval_min": race_profile.max_interval_min,
                                        "steep_segments": race_profile.steep_segments,
                                    }
                                )
                        except Exception as exc:
                            message = str(exc)
                            if "401" in message or "Unauthorized" in message.lower():
                                st.error(
                                    "Authentication failed. The API key may be invalid, expired, or missing for the selected provider."
                                )
                            else:
                                st.error(f"Failed to generate strategy: {exc}")
        finally:
            try:
                temp_path.unlink()
            except OSError:
                pass

    st.markdown("---")
    st.markdown(
        "**Note:** For DeepSeek, store the key in `st.secrets` as `DEEPSEEK_API_KEY`. For Gemini, use `GEMINI_API_KEY`."
    )


if __name__ == "__main__":
    main()
