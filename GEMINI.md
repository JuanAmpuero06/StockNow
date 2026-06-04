# StockNow Project Guidelines

StockNow is a professional inventory management system built with a modern full-stack architecture. It is designed to be scalable, containerized, and follows high engineering standards.

## Project Overview

*   **Purpose:** Professional inventory management system.
*   **Architecture:** Decoupled Frontend and Backend with dedicated database and cache services.
*   **Tech Stack:**
    *   **Backend:** FastAPI (Python), SQLAlchemy, PostgreSQL, Redis.
    *   **Frontend:** React (TypeScript), Vite, Tailwind CSS v4.
    *   **DevOps:** Docker, Docker Compose.

## Project Structure

```text
StockNow/
backend/            # FastAPI application
│   ├── app/            # Source code
│   │   ├── api/        # API Routes (v1, v2...)
│   │   ├── core/       # Database & Security config
│   │   ├── models/     # SQLAlchemy Models
│   │   ├── repositories/# Data access logic (Repository Pattern)
│   │   └── schemas/    # Pydantic Schemas
│   ├── tests/          # Pytest suite
│   ├── Dockerfile      # Python 3.11-slim build
│   └── main.py         # Application entry point
frontend/           # React application

│   ├── src/            # Application source (TSX)
│   ├── Dockerfile      # Multi-stage Nginx build
│   └── vite.config.ts  # Vite configuration
├── docker-compose.yml  # Orchestration for all services
└── GEMINI.md           # This instructions file
```

## Building and Running

### Using Docker (Recommended)

To build and start the entire stack:
```bash
docker-compose up --build
```
*   **Backend API:** `http://localhost:8000`
*   **API Docs:** `http://localhost:8000/docs`
*   **Frontend UI:** `http://localhost:5173`

### Local Development

#### Backend
```bash
cd backend
# Windows
.\venv\Scripts\activate
# Unix
source venv/bin/activate

pip install -r requirements.txt
python main.py
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Testing

### Backend
Run tests using `pytest` from the `backend` directory:
```bash
cd backend
pytest
```

## Development Conventions

*   **Workflow:** Always work with feature branches (e.g., `feature/name`). Use professional commit messages and merge into `main` using non-fast-forward merges to preserve history.
*   **Backend Styling:** Follow PEP 8. Use Pydantic for data validation and SQLAlchemy for ORM.
*   **Frontend Styling:** Use Tailwind CSS v4 for all styling. Ensure type safety using TypeScript.
*   **Docker:** All environment changes must be reflected in the respective `Dockerfile` or `docker-compose.yml`.
*   **Verification:** Before merging, ensure `docker-compose up --build` succeeds and all tests pass.
