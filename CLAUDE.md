# StockNow - Claude Guidelines

This file serves as the onboarding and reference guide for Claude in the StockNow project.

## Project Overview
StockNow is a professional inventory management system with secure authentication, a decoupled FastAPI/React architecture, and dedicated caching.

* **Tech Stack:**
  * **Backend:** FastAPI (Python), SQLAlchemy, PostgreSQL, Redis (Cache-Aside Strategy).
  * **Frontend:** React (TypeScript), Vite, Tailwind CSS v4, TanStack React Query, Axios.
  * **DevOps:** Docker, Docker Compose.

---

## Commands

### Environment & Run
* Run entire stack (recommended):
  ```bash
  docker compose up --build -d
  ```
* Stop services:
  ```bash
  docker compose down
  ```
* View backend logs:
  ```bash
  docker compose logs -f backend
  ```

### Testing
* Run all backend tests:
  ```bash
  docker compose exec backend pytest
  ```
* Run specific test file:
  ```bash
  docker compose exec backend pytest tests/test_jwt_logic.py
  ```
* Run all frontend tests (Vitest + JSDOM):
  ```bash
  npm run test
  ```

### Database & Migrations
* Generate automatic Alembic migration:
  ```bash
  docker compose exec backend alembic revision --autogenerate -m "description"
  ```
* Run migrations:
  ```bash
  docker compose exec backend alembic upgrade head
  ```

---

## Coding Conventions

### Backend (FastAPI & Python)
* **Structure:** Use the repository pattern. `app/api` for routes, `app/models` for SQLAlchemy tables, `app/schemas` for Pydantic validation models, and `app/repositories` for data access.
* **Security:** Use JWT for authentication. Perform Bcrypt hashing for passwords.
* **Caching (Redis):** Implement the Cache-Aside pattern. Always invalidate/delete Redis keys matching `products:all:*` whenever products are added, updated, or deleted.

### Frontend (React & TypeScript)
* **Routing & State:** Manage server state using TanStack React Query.
* **Styling:** Use Tailwind CSS v4. Focus on responsive, modern design.
* **Types:** Keep strict typing; avoid the use of `any`.

### Role-Based Access Control (RBAC) Rules
* **user**: Client/Buyer. Allowed to view catalog, use commercial cart, and place orders (`POST /orders/`).
* **operator**: Warehouse staff. Allowed to view catalog, adjust physical stock, and process/dispatch orders.
* **manager**: Inventory manager. Allowed to view catalog, create/edit products, adjust stock, and process orders.
* **admin**: System administrator. Allowed to delete products, manage user roles/accounts, and perform all operator/manager duties.
