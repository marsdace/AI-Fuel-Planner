# AI Fuel Planner

AI Fuel Planner is a fueling strategy generator based on FIT files. It extracts historical Garmin activity data, evaluates an athlete's capability, and produces fueling plans for half marathon, full marathon, or trail run events (including distance and elevation gain).

## Key Features

- Parse FIT files and extract base activity metrics, heart rate, power, elevation, and other key indicators
- Build AI prompts based on historical performance
- Support `openai`, `deepseek`, and `mock` AI providers
- Support both Chinese and English interface/output
- Support three goals: `half_marathon`, `full_marathon`, `trail_run`
- Trail run target supports `--distance` and `--ascent`

## Project Structure

- `fuel_planner.py`: Main program for FIT parsing, AI prompt building, and strategy generation
- `test_fuel_planner.py`: Basic unit tests
- `23231556007_ACTIVITY.fit`: Sample FIT activity file
- `PROJECT_CONTEXT.md` / `PROJECT_CONTEXT_CN.md`: Project context and positioning documentation

## Dependencies

Install required dependencies:

```bash
pip install -r requirements.txt
```

`requirements.txt` includes:

- `fitparse`

If using `openai` provider, you may optionally install the official SDK, but it is not required.

## Usage

From the project directory, run:

```bash
python fuel_planner.py <FIT_FILE> --weight 68 --target full_marathon --provider deepseek --model deepseek-v4-pro --api-key YOUR_KEY --language zh
```

### Main Arguments

- `fit_file`: Path to the FIT activity file
- `--weight`: Athlete body weight in kilograms
- `--target`: Goal type (`half_marathon`, `full_marathon`, `trail_run`)
- `--ascent`: Elevation gain target for trail run, in meters
- `--distance`: Distance target for trail run, in kilometers
- `--provider`: AI provider (`openai`, `deepseek`, `mock`)
- `--model`: Model name, e.g. `gpt-4o-mini` or `deepseek-v4-pro`
- `--api-key`: AI API key
- `--temperature`: Generation temperature
- `--language`: Interface and output language, `zh` or `en`
- `--insecure`: Disable SSL verification if needed

### Examples

Chinese output:

```bash
python fuel_planner.py 23231556007_ACTIVITY.fit --weight 68 --target full_marathon --provider deepseek --model deepseek-v4-pro --api-key YOUR_KEY --language zh
```

English output:

```bash
python fuel_planner.py 23231556007_ACTIVITY.fit --weight 68 --target trail_run --distance 30 --ascent 1200 --provider openai --model gpt-4o-mini --api-key YOUR_KEY --language en
```

### Environment Variable

To avoid passing the API key on the command line:

```bash
export OPENAI_API_KEY=your_openai_key
python fuel_planner.py 23231556007_ACTIVITY.fit --weight 68 --target half_marathon --provider openai --model gpt-4o-mini --language zh
```

> `--api-key` overrides the environment variable.

## Testing

Run tests with:

```bash
pytest
```

If `pytest` is not installed:

```bash
pip install pytest
```

## Notes

Design principles for this project:

- Keep business logic independent from UI, LLM, and third-party APIs
- Use AI only for generating natural language explanations, not for core calculations
- Keep the project simple, maintainable, and replaceable
