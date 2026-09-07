# GeoWise — The Self-Learning Watershed Brain

Premium **demo** geospatial command center: a **real** Leaflet basemap (OpenStreetMap or Esri satellite imagery) plus **deterministic GeoWise intelligence** for India (fields, NDVI/NDWI overlays, triage, verification, Jal Saheli, credits, optional Gemini photo analysis).

This is **not** live government data, Bhuvan, Srishti, Telegram, IMD weather, or a retraining ML model.

## Run locally

```bash
npm install
npm run dev
```

Windows: `run.bat`

App: [http://localhost:43173](http://localhost:43173)

Environment: **DEMO**

Optional vision: copy `.env.example` to `.env.local` and set `VITE_GEMINI_API_KEY`. Without it, Field capture uses DemoVisionProvider.

## Judge path

1. Command Center (national map + Chittoor story field)
2. Real basemap — overlays are demo
3. All GeoWise Data
4. Select Area 01
5. View detailed analysis (Geo AI)
6. Why was this flagged? (XAI)
7. Send to triage
8. Confirm verification
9. Recommendation (Farm pond 87%)
10. Jal Saheli
11. Jal Credits
12. Closed-loop learning
13. Return to Command Center (counts update)

## Stack

Vite, React, TypeScript, Tailwind, Leaflet, Recharts. No backend.
