import tempfile
from pathlib import Path
from typing import Optional

import streamlit as st

from fuel_planner import (
    call_ai_strategy,
    extract_fit_metrics,
    parse_fit_activity,
    recommend_fuel,
    render_activity_summary,
)


def get_api_key(provider: str) -> Optional[str]:
    if provider == "deepseek":
        return st.secrets.get("DEEPSEEK_API_KEY")
    if provider == "openai":
        return st.text_input("OpenAI API Key", type="password")
    return None


def main() -> None:
    st.set_page_config(page_title="AI Fuel Planner", layout="wide")
    st.title("AI Fuel Planner")
    st.markdown(
        "Use your Garmin FIT file to evaluate training ability and generate fueling strategy for a chosen target event."
    )

    with st.sidebar:
        st.header("Configuration")
        provider = st.selectbox("AI Provider", ["openai", "deepseek", "mock"], index=1)
        model = st.text_input("Model", value="deepseek-v4-pro" if provider == "deepseek" else "gpt-4o-mini")
        language = st.selectbox("Language", ["zh", "en"], index=0)
        weight = st.number_input("Athlete Weight (kg)", min_value=30.0, max_value=200.0, value=70.0)
        target = st.selectbox(
            "Target",
            ["half_marathon", "full_marathon", "trail_run"],
            format_func=lambda x: {
                "half_marathon": "Half Marathon",
                "full_marathon": "Full Marathon",
                "trail_run": "Trail Run",
            }[x],
        )
        ascent = None
        distance = None
        if target == "trail_run":
            distance = st.number_input("Target Distance (km)", min_value=1.0, max_value=200.0, value=30.0)
            ascent = st.number_input("Target Elevation Gain (m)", min_value=0.0, max_value=10000.0, value=1200.0)

        temperature = st.slider("Temperature", min_value=0.0, max_value=1.0, value=0.7, step=0.05)
        insecure = st.checkbox("Disable SSL verification (for local testing)")
        api_key = get_api_key(provider)

        if provider == "deepseek":
            if api_key:
                st.success("DeepSeek API key loaded from st.secrets.")
            else:
                st.warning(
                    "DeepSeek API key not found in st.secrets. Please add DEEPSEEK_API_KEY to your Streamlit secrets."
                )
        elif provider == "openai":
            if not api_key:
                st.warning("Please enter an OpenAI API key in the sidebar.")

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
                            )
                            st.success("Fueling strategy generated successfully.")
                            st.code(strategy, language="text")
                        except Exception as exc:
                            st.error(f"Failed to generate strategy: {exc}")
        finally:
            try:
                temp_path.unlink()
            except OSError:
                pass

    st.markdown("---")
    st.markdown(
        "**Note:** DeepSeek API key should be stored in `st.secrets` as `DEEPSEEK_API_KEY`."
    )


def _render_target_description(target: str, ascent: Optional[float], distance: Optional[float], language: str) -> str:
    if target == "half_marathon":
        return "Target: Half Marathon" if language == "en" else "目标：半程马拉松"
    if target == "full_marathon":
        return "Target: Full Marathon" if language == "en" else "目标：全程马拉松"
    if target == "trail_run":
        if language == "en":
            return f"Target: Trail Run, Distance {distance} km, Elevation Gain {ascent} m"
        return f"目标：累计爬升跑，距离 {distance} 公里，累计爬升 {ascent} 米"
    return ""


if __name__ == "__main__":
    main()
