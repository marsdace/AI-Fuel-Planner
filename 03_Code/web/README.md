# Fuel Planner JS Browser Version

This folder contains a browser-based JavaScript implementation of the existing fuel planner pipeline:

- User Profile
- Route Profile
- Trail Lab Rule Engine
- AI Planner (explanation only)

## Files

- index.html: UI page
- app.js: logic pipeline + FIT parsing + AI calls
- styles.css: page styles

## How to run

1. Open `index.html` directly in a modern browser, or
2. Serve this folder with a simple static server for best compatibility.

On macOS with Python:

```bash
cd 03_Code/web
python3 -m http.server 8080
```

Then open:

- http://localhost:8080

## FIT parser

This browser version uses Garmin official JavaScript FIT SDK `@garmin/fitsdk` from esm.sh CDN to decode FIT files on the client side.

## Notes

- Trail running is the only sport mode (as required).
- `physiological_max_hr` is optional; if not provided, warning is shown.
- AI calls from browser may fail due to CORS or provider security policies.
- Use `mock` provider to validate the full local pipeline first.
