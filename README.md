# Hajj & Umrah Comments Sentiment Analysis System

This package contains two parts:

## 1. frontend/
`HajjUmrahSystem.jsx` — the full React UI (Dashboard, Analyze Comment,
Comments, Analytics, Reports, Users, Profile, Settings). Bilingual
(Arabic/English, RTL/LTR) with Dark/Light mode. Ready to drop into any
React + Tailwind + recharts + lucide-react project, or open directly as a
Claude artifact.

## 2. backend/
A real Flask API + scikit-learn (TF-IDF + Naive Bayes) sentiment model +
SQLite database. See `backend/README.md` for full setup steps in VS Code:

    cd backend
    python -m venv venv
    venv\Scripts\activate        (Windows)   /   source venv/bin/activate   (Mac/Linux)
    pip install -r requirements.txt
    python app.py

The API runs at http://localhost:5000.

## Connecting them
Currently the frontend analyzes comments locally in the browser (a
JavaScript keyword-based approximation) so it works standalone with zero
setup. To use the *real* trained ML backend instead, replace the
`analyzeText()` calls in `frontend/HajjUmrahSystem.jsx` with `fetch()` calls
to the Flask API — see the "Connect the React frontend" section in
`backend/README.md` for the exact code.
