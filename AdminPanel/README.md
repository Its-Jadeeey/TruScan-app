# TruScan Admin Panel

A web admin panel for TruScan — built with **HTML, CSS, vanilla JavaScript**
on the frontend and **FastAPI** (no Flask) on the backend.

Screens: splash/hero, admin login, dashboard (system metrics, flagged scams,
risk indicators), reports (case overview, intrusions table, scam checker),
and settings (profile, preferences, support, about) — matching the provided
TruScan mockups.

## Project structure

```
truscan-admin/
├── main.py              # FastAPI app + page routes
├── security.py           # cookie session helpers
├── database.py            # in-memory mock data (swap for a real DB)
├── requirements.txt
├── models/
│   └── schemas.py         # Pydantic request/response models
├── routes/
│   ├── auth.py            # POST /api/auth/login, /api/auth/logout
│   ├── dashboard.py        # GET /api/dashboard
│   ├── reports.py          # GET /api/reports, POST /api/reports/scam-check
│   └── settings.py         # GET/PUT /api/settings
├── templates/              # Jinja2 templates (server-rendered shells)
│   ├── base.html, _logo.html, _sidebar.html
│   ├── index.html (hero splash)
│   ├── login.html
│   ├── dashboard.html
│   ├── reports.html
│   └── settings.html
└── static/
    ├── css/style.css        # shared dark theme
    └── js/                  # hero.js, login.js, common.js, dashboard.js,
                              # reports.js, settings.js
```

## Setup

```bash
cd truscan-admin
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Open **http://127.0.0.1:8000/** — it shows the splash screen, then redirects
to `/login`.

**Demo credentials:** `admin` / `admin123` (hardcoded in `database.py` —
replace with a real user store + hashed passwords before shipping this
anywhere real).

## How it works

- Pages (`/`, `/login`, `/dashboard`, `/reports`, `/settings`) are rendered
  server-side with Jinja2 as static shells; each page's JS then calls the
  JSON API under `/api/...` to fill in data. This keeps the FastAPI routes
  reusable if you later want a separate frontend (mobile app, React, etc.)
  talking to the same API.
- Auth is a simple signed cookie session (`security.py`). Any `/api/...`
  route (other than login) requires the session cookie, and any page route
  redirects to `/login` if you're not authenticated.
- `database.py` is a stand-in "database" using plain Python dicts/lists —
  it's the only file you need to touch to plug in a real database
  (Postgres, MongoDB, Firebase, etc.) later; every route already goes
  through its functions rather than touching data directly.
- The **Scam Checker** on the Reports page uses a small keyword-based
  heuristic in `database.analyze_scam_text()` — a placeholder you can swap
  for a real ML model or external API.

## Notes / next steps

- Passwords are stored/compared in plain text for the demo — hash them
  (e.g. with `passlib`) before using this for anything real.
- Sessions are stored in memory (`security.SESSIONS`), so they reset if you
  restart the server — swap in Redis or a DB table for persistence across
  restarts.
- The `firebase.js` service and Android/React Native frontend hinted at in
  your project screenshot aren't included here since you asked specifically
  for the **web admin panel** — happy to wire up Firebase or the mobile
  side next if useful.
