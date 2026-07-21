# AI Fuel Planner

> English version available in README_EN.md

AI Fuel Planner is a FIT-based fueling guidance tool for outdoor endurance events. It extracts historical Garmin activity data（.fit）, evaluates an athlete's capability, and generates fueling recommendations for trail running, mountain running, and mountain hiking.

## Key Features

- Parse FIT files and extract base activity metrics, heart rate, power, elevation, and other key indicators
- Build AI prompts based on historical performance
- Support openai, deepseek, and mock AI providers
- Support both Chinese and English interface/output
- Support three goals: trail_run, mountain_run, and mountain_hike
- Trail and mountain targets support --distance and --ascent

## Project Structure

- fuel_planner.py: Main program for FIT parsing, AI prompt building, and strategy generation
- app.py: Streamlit web app entry point
- test_fuel_planner.py: Basic unit tests
- 23231556007_ACTIVITY.fit: Sample FIT activity file

## Dependencies

Install required dependencies:

```bash
pip install -r requirements.txt
```

requirements.txt includes:

- fitparse

If using the openai provider, you may optionally install the official SDK, but it is not required.

## Usage

From the project directory, run:

```bash
python fuel_planner.py <FIT_FILE> --weight 68 --target trail_run --distance 30 --ascent 1200 --provider deepseek --model deepseek-v4-pro --api-key YOUR_KEY --language en
```

### Main Arguments

- fit_file: Path to the FIT activity file
- --weight: Athlete body weight in kilograms
- --target: Goal type (trail_run, mountain_run, mountain_hike)
- --ascent: Elevation gain target for trail or mountain events, in meters
- --distance: Distance target for trail or mountain events, in kilometers
- --provider: AI provider (openai, deepseek, mock)
- --model: Model name, e.g. gpt-4o-mini or deepseek-v4-pro
- --api-key: AI API key
- --temperature: Generation temperature
- --language: Interface and output language, zh or en
- --insecure: Disable SSL verification if needed

### Examples

Chinese output:

```bash
python fuel_planner.py 23231556007_ACTIVITY.fit --weight 68 --target mountain_run --distance 25 --ascent 1800 --provider deepseek --model deepseek-v4-pro --api-key YOUR_KEY --language zh
```

English output:

```bash
python fuel_planner.py 23231556007_ACTIVITY.fit --weight 68 --target mountain_hike --distance 20 --ascent 1500 --provider openai --model gpt-4o-mini --api-key YOUR_KEY --language en
```

## Streamlit App

The project provides a pre-configured Streamlit setup and a free DEEPSEEK_API_KEY (please do not waste it, as the quota is limited), available at: https://ai-fuel-planner-3ojkuqgmh5o93otmjmpc64.streamlit.app/

It also provides app.py so you can build your own Streamlit web app locally:

```bash
streamlit run app.py
```

In the Streamlit app:

- Upload a FIT file
- Choose the AI provider, model, language, and target type
- Review the activity summary and performance metrics
- Click Generate Fueling Strategy to produce a fueling plan

### DeepSeek API Key

If you use the deepseek provider, place your key in .streamlit/secrets.toml:

```toml
DEEPSEEK_API_KEY = "your_deepseek_api_key_here"
```

Streamlit reads the value via st.secrets.

### Environment Variable

To avoid passing the API key on the command line:

```bash
export OPENAI_API_KEY=your_openai_key
python fuel_planner.py 23231556007_ACTIVITY.fit --weight 68 --target trail_run --distance 30 --ascent 1200 --provider openai --model gpt-4o-mini --language en
```

> --api-key overrides the environment variable.

## Data and Privacy

- This project does not save user FIT files, body weight, or generated results to a long-term database.
- Uploaded FIT files are only used for temporary analysis in the current session and are cleaned up afterward.
- Whether AI providers retain request data depends on the provider you choose and its privacy policy.

## Feedback and Suggestions

To help improve this project, you are welcome to contribute your own FIT files (packed as .zip), fueling strategy content, or feedback on issues. No special format is required. The information will be used only for project improvement and will not be used for other purposes. Thank you very much!
If you run into issues, find a bug, or want to suggest new outdoor fueling scenarios, please leave feedback in GitHub Issues.

## Testing

Run tests with:

```bash
pytest
```

If pytest is not installed:

```bash
pip install pytest
```
