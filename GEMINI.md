# StockNow Project Guidelines

StockNow is a professional inventory management system built with a modern full-stack architecture. It is designed to be scalable, containerized, and follows high engineering standards.

## Project Overview

*   **Purpose:** Professional inventory management system.
*   **Architecture:** Decoupled Frontend and Backend with dedicated database and cache services.
*   **Tech Stack:**
    *   **Backend:** FastAPI (Python), SQLAlchemy, PostgreSQL, Redis (Cache-Aside Strategy).
    *   **Frontend:** React (TypeScript), Vite, Tailwind CSS v4, TanStack React Query, Axios.
    *   **DevOps:** Docker, Docker Compose.

## Project Structure

```text
StockNow/
backend/            # FastAPI application
│   ├── app/            # Source code
│   │   ├── api/        # API Routes (v1, v2...)
│   │   ├── core/       # Database & Redis config
│   │   ├── models/     # SQLAlchemy Models
│   │   ├── repositories/# Data access logic (Repository Pattern)
│   │   └── schemas/    # Pydantic Schemas
│   ├── tests/          # Pytest suite
│   ├── Dockerfile      # Python 3.11-slim build
│   └── main.py         # Application entry point
frontend/           # React application
│   ├── src/            # Application source (TSX)
│   │   ├── api/        # Axios client & API calls
│   │   ├── components/ # Shared UI components (Cart, Modals)
│   │   ├── hooks/      # Custom React Query hooks (CRUD, Orders)
│   │   ├── pages/      # View components (Dashboard)
│   │   └── types/      # TypeScript definitions
│   ├── Dockerfile      # Multi-stage Nginx build
│   └── vite.config.ts  # Vite configuration
├── docker-compose.yml  # Orchestration for all services
└── GEMINI.md           # This instructions file
```

## Key Features

*   **Product Management:** Full CRUD (Create, Read, Update, Delete) for products and inventory.
*   **Order System:** Transactional order creation with stock reservation and cache invalidation.
*   **Caching Strategy:** Cache-Aside with Redis for product listings to optimize performance.
*   **Modern UI:** Responsive dashboard with real-time feedback, product modals, and a commercial cart system.

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
*Tests include coverage for core logic, products CRUD, and order cache invalidation.*

## Development Conventions

*   **Workflow:** Always work with feature branches. Use professional commit messages.
*   **Backend Styling:** PEP 8 compliance. Use Pydantic v2 for validation and SQLAlchemy with `joinedload` for Eager Loading optimization.
*   **Frontend Styling:** Tailwind CSS v4 for utility-first styling. TanStack React Query for server state management.
*   **Caching:** Any modification to products (Create, Update, Delete) or new orders must invalidate the relevant Redis keys (`products:all:*`).
*   **Verification:** Ensure `docker-compose up --build` succeeds and all tests pass before pushing changes.
