# CivicFix

> **Report it. Track it. Fix it.**

CivicFix is a modern, production-grade, AI-powered civic issue reporting and resolution platform connecting:

**Citizens → Government Departments → Field Officers → Supervisors → Government Managers → Administrators**

The platform enables citizens to report real-world neighborhood issues (potholes, water leaks, streetlight outages, illegal dumping, fallen trees) and equips municipal organizations to manage those incidents from initial triage, through automated AI routing and field crew dispatch, to independent citizen verification and regulatory audit logging.

---

## 🏛️ System Highlights

- **AI-Powered Citizen Reporting**: 5-step mobile-first wizard with multimodal image classification, AI description assistance, geospatial duplicate detection, and interactive Leaflet map pin placement.
- **Independent Citizen Verification**: Solved issues require citizen inspection. Citizens can mark "Yes, fixed" (with celebration) or "No, still exists", triggering automatic reopening and escalation.
- **Field Crew Mobility Console**: Real-time assignment queue for field crews with GPS navigation links, one-tap status toggling (`Start Work`, `Pause Work`, `Mark Resolved`), before/after photo evidence uploads, and AI Copilot safety checklists.
- **Supervisor Operations Triage**: Live department queue with officer workload indicators, one-click dispatch/re-assignment drawers, and SLA deadline countdowns.
- **Executive Analytics & Hotspots**: Cross-department resolution benchmarks, SLA compliance rates, 7-day intake/resolution trend histograms, and real CSV report exports.
- **Automated SLA Engine**: Background worker evaluating resolution deadlines every 60 seconds; automatically creates warnings and escalates overdue tickets according to municipal policy.
- **Full Regulatory Auditability**: Immutable audit trail capturing every state transition, assignment, escalation, and login event.

---

## 🛠️ Technology Stack

### Frontend
- **React 19 & TypeScript**: Component-driven architecture with strict type safety.
- **Vite**: Ultra-fast build tool and development server.
- **Tailwind CSS**: Modern civic design system with light and dark mode persistence.
- **Leaflet & OpenStreetMap**: Interactive geospatial mapping with custom status pins and geolocation.
- **Lucide React**: Clean, accessible iconography.
- **Canvas Confetti**: Visual celebration on citizen verification sign-off.

### Backend & API
- **Express / Node.js Full-Stack Runtime**: Powers the live interactive server at port 3000 with ACID in-memory/JSON relational store.
- **FastAPI (Python 3.11)**: High-performance Python backend alternative with Pydantic v2 schemas and SQLAlchemy 2.0 ORM models.
- **PostgreSQL 16**: Relational schema with foreign keys, constraints, and audit logging.
- **Redis 7 & Celery**: Background worker queue and cache broker.

### Artificial Intelligence
- **Google Gen AI SDK (`@google/genai`)**: Integrated with `gemini-3.8-flash` for multimodal image classification, prompt refining, and officer copilot generation.
- **Resilient Fallback**: Zero broken buttons—graceful domain-heuristic classifiers ensure 100% functionality even when offline or without API keys.

---

## 👥 User Roles & Authentication

CivicFix features real server-validated authentication with dedicated login and registration workflows:

- Public registration grants the **`CITIZEN`** role.
- Government roles can only be created by authorized Administrators via the Admin Console.
- The server determines the user's role upon authentication and redirects to the appropriate dashboard.

| Role | Name | Email | Password | Responsibilities | Default Route |
|---|---|---|---|---|---|
| **Citizen** | Maya Lin | `citizen@civicfix.org` | `civic123` | Submit issues, upload photos, endorse reports, verify fixes | `/citizen/dashboard` (My Reports) |
| **Field Officer** | Marcus Vance | `officer@civicfix.org` | `civic123` | Mobile work orders, navigation, before/after evidence, status updates | `/officer/dashboard` (Field Crew) |
| **Department Supervisor** | Elena Rostova | `supervisor@civicfix.org` | `civic123` | Workload monitoring, triage, officer dispatch, SLA alerts | `/supervisor/dashboard` |
| **Department Manager** | David Sterling | `manager@civicfix.org` | `civic123` | Executive KPI analytics, resolution rates, CSV audit exports | `/manager/dashboard` (Analytics) |
| **Government Admin** | Sarah Chen | `admin@civicfix.org` | `civic123` | Staff creation, departments, categories, SLA policies, audit logs | `/government-admin/dashboard` |
| **Platform Super Admin** | Alex Thorne | `superadmin@civicfix.org` | `civic123` | Complete platform governance, system health, global settings | `/admin/dashboard` |

---

## 🚀 Running the Application

### Option A: Local Full-Stack Development (Node.js)

```bash
# 1. Install dependencies
npm install

# 2. Start full-stack development server on port 3000
npm run dev
```

Visit `http://localhost:3000` to interact with the application.

### Option B: Docker Compose (Full Production Stack)

```bash
# Start all containers (App, FastAPI, PostgreSQL, Redis)
docker-compose up --build -d
```

- Web Console: `http://localhost:3000`
- FastAPI Documentation: `http://localhost:8000/docs`

---

## 🧪 Testing & Quality Assurance

```bash
# Run TypeScript compilation and lint checks
npm run lint

# Run automated backend test suite
pytest tests/ -v
```

---

## 📂 Project Structure

```text
civicfix/
├── .github/
│   └── workflows/
│       └── ci.yml               # CI/CD pipeline (Lint, Typecheck, Build, Tests)
├── backend/                     # Python FastAPI alternative backend
│   ├── config.py                # Pydantic configuration
│   ├── database.py              # SQLAlchemy engine
│   ├── Dockerfile               # Backend container definition
│   ├── main.py                  # FastAPI application entrypoint
│   ├── models.py                # Relational database models
│   ├── requirements.txt         # Python dependencies
│   └── schemas.py               # Pydantic request/response schemas
├── docs/                        # Complete architecture and API documentation
│   ├── ai.md
│   ├── api.md
│   ├── architecture.md
│   ├── database.md
│   ├── deployment.md
│   ├── security.md
│   └── user-roles.md
├── server/                      # Full-stack server modules
│   ├── aiService.ts             # Gemini 3.8 Flash SDK integration
│   ├── apiRouter.ts             # Express REST API routes
│   ├── db.ts                    # Relational data store & realistic seed data
│   └── slaEngine.ts             # Background SLA checker & auto-escalator
├── src/                         # Frontend application
│   ├── components/              # Reusable UI components
│   │   ├── InteractiveMap.tsx   # Leaflet map with GPS & pin dropping
│   │   ├── IssueDetailModal.tsx # Issue inspection, comments, actions & verification
│   │   ├── Navbar.tsx           # Navigation bar with role switcher
│   │   ├── NotificationDropdown.tsx # Real-time notification center
│   │   ├── PriorityBadge.tsx    # Semantic priority indicators
│   │   └── StatusBadge.tsx      # Semantic lifecycle badges
│   ├── context/                 # Application context
│   │   ├── AuthContext.tsx      # Authentication & persona state
│   │   └── ThemeContext.tsx     # Dark/light mode persistence
│   ├── lib/
│   │   └── api.ts               # Typed client-side API layer
│   ├── types/
│   │   └── index.ts             # Shared TypeScript interfaces
│   ├── views/                   # Main portal views
│   │   ├── AdminView.tsx        # Administration & audit logs
│   │   ├── CitizenTrackerView.tsx # Citizen report tracking & verification
│   │   ├── ExploreMapView.tsx   # Geospatial map explorer & filters
│   │   ├── FieldOfficerView.tsx # Field officer mobile dispatch queue
│   │   ├── LandingView.tsx      # Public landing page & value props
│   │   ├── ManagerAnalyticsView.tsx # Executive dashboard & charts
│   │   ├── ReportWizardView.tsx # 5-step citizen reporting wizard
│   │   └── SupervisorView.tsx   # Supervisor operations center
│   ├── App.tsx                  # Root application
│   ├── index.css                # Tailwind CSS v4 styling
│   └── main.tsx                 # React entrypoint
├── tests/                       # Automated test suite
│   └── test_api.py
├── .env.example                 # Environment variables specification
├── docker-compose.yml           # Multi-service container orchestration
├── Dockerfile                   # Node.js production container definition
├── metadata.json                # Project capabilities metadata
├── package.json                 # Node dependencies and scripts
├── server.ts                    # Full-stack dev & production server
└── tsconfig.json                # TypeScript strict configuration
```

---

## 📄 License

Apache-2.0 License. Built for modern civic governance and transparent municipal infrastructure.
