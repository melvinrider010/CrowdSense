# CrowdSense AI - Final Project Integration & Verification Report

This report presents a complete architectural review, verification log, and deployment guide for the **CrowdSense AI** system.

---

## 1. Project Structure

```
CrowdSense/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py          # JWT register, login, refresh tokens
│   │   │   ├── devices.py       # Device listings, edit status, delete nodes
│   │   │   ├── events.py        # Blynk replacement endpoint, WS triggers
│   │   │   ├── notifications.py # Unreads, logs, acknowledgments
│   │   │   └── reports.py       # Datasets filter query, CSV stream responses
│   │   ├── core/
│   │   │   ├── auth.py          # Cryptography, PBKDF2 hashing, JWT signing
│   │   │   ├── config.py        # Pydantic settings, key configs
│   │   │   ├── errors.py        # Exception wrappers
│   │   │   ├── logging.py       # Console styling
│   │   │   ├── notifications.py # Mock SMTP triggers
│   │   │   └── websocket.py     # Registry broadcast pipelines
│   │   ├── database/
│   │   │   ├── database.py      # SQLAlchemy engine and pool sizes
│   │   │   └── models.py        # DB schemas (Users, Devices, Events, etc)
│   │   ├── schemas/
│   │   │   ├── auth.py          # Registration payload shapes
│   │   │   └── event.py         # Telemetry validation schemas
│   │   └── main.py              # App lifespan, route bindings, WS endpoint
│   ├── alembic/                 # Migration checkpoints
│   ├── alembic.ini              # Alembic config
│   └── .env                     # Local environment settings
└── frontend/
    ├── app/
    │   ├── page.tsx             # Interactive dashboard (Live/Analytics/Devices/Reports)
    │   ├── layout.tsx           # Global Next.js HTML wrapper
    │   └── globals.css          # CSS styles & print rules
    ├── components/
    │   ├── GlassCard.tsx        # Styled glass container
    │   ├── StatusBadge.tsx      # Hazard tags
    │   ├── LiveChart.tsx        # Sparkline renderer
    │   └── AnalyticsCharts.tsx  # Dynamic dashboard graphs
    ├── package.json             # NPM dependencies
    └── tsconfig.json            # TypeScript options
```

---

## 2. Fixed Issues Log

| Category | Description | Fix Implemented |
| :--- | :--- | :--- |
| **TypeScript / JS** | Hydration mismatches on timestamp formatting, scope errors on `handleLogout` | Fixed component layout, ensured consistent client-side renders, and declared `handleLogout` globally in page scope. |
| **FastAPI / Routers** | Duplicate endpoints and unregistered router loops | Centralized routes inside `main.py` using cleanly separated prefixes and tags. |
| **SQLAlchemy** | Connection exhaustion during high-volume pings | Bound pool sizes to `pool_size=10` and `max_overflow=20` to guarantee scale safety. |
| **WebSockets** | Browser connection limits and unauthorized listening | Implemented token-based authentication via URL query string query parameter constraints. |
| **CORS / Security** | Standard cross-origin blocks | Set explicit CORS origins matching deployment expectations. |

---

## 3. Database Schema Details (PostgreSQL)

- **`users`**: Manages operators and admins (`username`, `email`, `hashed_password`, `role`).
- **`devices`**: Lists hardware sensor nodes (`device_id`, `status`, `location`).
- **`events`**: Houses telemetry metrics from ESP8266 (`distance`, `status`, `location`, `timestamp`).
- **`notifications`**: Stores alert logs and read statuses (`title`, `message`, `is_read`).
- **`audit_logs`**: Tracks actions (`action`, `operator_id`, `timestamp`).

---

## 4. API Endpoint Matrix

| Method | Endpoint | Description | Role Required |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Register operator | Public |
| **POST** | `/api/auth/login` | Secure JWT generation | Public |
| **POST** | `/api/events` | Telemetry Blynk replacement | API Key |
| **GET** | `/api/devices` | Query active sensor list | Admin/Operator/Viewer |
| **POST** | `/api/devices` | Register a new IoT node | Admin/Operator |
| **GET** | `/api/notifications` | Fetch system alert history | Admin/Operator/Viewer |
| **GET** | `/api/reports/csv` | Streams CSV report sheets | Admin/Operator |
| **WS** | `/ws/events` | Real-time broadcast channel | Token validated |

---

## 5. Production Deployment Steps

### Step 1: Database Migration
Setup PostgreSQL database and apply schemas:
```bash
cd backend
alembic upgrade head
```

### Step 2: Launch FastAPI Server
Run backend with Uvicorn:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 3: Compile and Serve Frontend
Build the optimized Next.js client layout:
```bash
cd ../frontend
npm run build
npm run start
```
The application will launch on `http://localhost:3000`.
