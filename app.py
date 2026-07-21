import os
import tempfile
from pathlib import Path
from typing import Optional

import streamlit as st

from fuel_planner import (
    call_ai_strategy,
    extract_fit_metrics,
    get_supported_targets,
    parse_fit_activity,
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
        "Use your Garmin FIT file to evaluate training ability and generate fueling guidance for trail, mountain, and hiking events."
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
        target_options = get_supported_targets(language)
        target_choices = [code for code, _ in target_options]
        target_labels = {code: label for code, label in target_options}
        target = st.selectbox("Target", target_choices, format_func=lambda x: target_labels[x])
        ascent = None
        distance = None
        if target in {"trail_run", "mountain_run", "mountain_hike"}:
            distance = st.number_input("Target Distance (km)", min_value=1.0, max_value=200.0, value=30.0)
            ascent = st.number_input("Target Elevation Gain (m)", min_value=0.0, max_value=10000.0, value=1200.0)

        temperature = st.slider("Temperature", min_value=0.0, max_value=1.0, value=0.7, step=0.05)
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

            with st.expander("Performance Metrics"):
                metrics, unavailable = extract_fit_metrics(temp_path)
                st.json(metrics)
                if unavailable:
                    st.markdown("**Missing fields:**")
                    st.write(unavailable)

            target_desc = _render_target_description(target, ascent, distance, language)
            if st.button("Generate Fueling Strategy"):
                if provider != "mock" and not api_key:
                    st.error("API key is required for the selected provider.")
                else:
                    with st.spinner("Calling AI service..."):
                        try:
                            strategy = call_ai_strategy(
                                metrics=metrics,
                                unavailable=unavailable,
                                target_desc=target_desc,
                                provider=provider,
                                model=model,
                                api_key=api_key,
                                weight=weight,
                                temperature=temperature,
                                verify_ssl=not insecure,
                                language=language,
                                weather_temp_c=weather_temp,
                                humidity_pct=humidity,
                            )
                            st.success("Fueling strategy generated successfully.")
                            st.code(strategy, language="text")
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


def _render_target_description(target: str, ascent: Optional[float], distance: Optional[float], language: str) -> str:
    if target == "trail_run":
        if language == "en":
            return f"Target: Trail Run, Distance {distance} km, Elevation Gain {ascent} m"
        return f"目标：越野跑，距离 {distance} 公里，累计爬升 {ascent} 米"
    if target == "mountain_run":
        if language == "en":
            return f"Target: Mountain Run, Distance {distance} km, Elevation Gain {ascent} m"
        return f"目标：山地跑，距离 {distance} 公里，累计爬升 {ascent} 米"
    if target == "mountain_hike":
        if language == "en":
            return f"Target: Mountain Hiking, Distance {distance} km, Elevation Gain {ascent} m"
        return f"目标：山地徒步，距离 {distance} 公里，累计爬升 {ascent} 米"
    return ""


if __name__ == "__main__":
    main()
