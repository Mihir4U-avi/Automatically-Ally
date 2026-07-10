# Automatically — Ally

## Project Documentation

> A privacy-first, all-in-one research workspace combining project management, task tracking, role-based collaboration, and local AI-powered PDF summarization.

### Developed By

| Name | SAP ID |
|------|--------|
| Mihir Kumar Batar | 500126555 |
| Shaswat Sinha | 500125954 |

---

## 1. Overview

Ally solves the fragmentation researchers, students, and R&D teams face when juggling separate tools for task management, literature review, and communication. It bundles these into one workspace, and — critically — performs AI summarization of research papers entirely on the local machine, using an offline HuggingFace model, so sensitive or unpublished documents never leave the user's computer.

### Technology Stack

| Layer | Technology |
|-------|------------|
| Backend | Python, FastAPI, SQLAlchemy, Alembic (migrations) |
| Database | SQLite by default (`sql_app.db`), swappable to PostgreSQL via `DATABASE_URL` |
| Auth | JWT (`python-jose`) with bcrypt password hashing |
| PDF parsing | PyMuPDF (`fitz`) |
| AI summarization | Local HuggingFace model `Falconsai/text_summarization`, run on CPU |
| Frontend | React 19, TypeScript, Vite 8 |
| Frontend state and data | TanStack React Query, React Context (Auth, Project) |
| Frontend styling | TailwindCSS v4, Framer Motion animations |
| Frontend forms | `react-hook-form` with `zod` validation |
| Routing | `react-router-dom` v7 |
| HTTP client | `axios` |

---

## 2. Project Structure

The repository is split cleanly into a backend service and a frontend application:

```
Automatically - Ally/
  start.bat                  One-click launcher for backend and frontend
  documentation.md

  backend/
    main.py                  FastAPI app entrypoint, CORS, router registration
    database.py              SQLAlchemy engine and session setup
    models.py                ORM models: User, Project, Paper, Task, etc.
    schemas.py               Pydantic request and response schemas
    auth_utils.py            Password hashing and JWT creation
    download_model.py        Script to download the local summarization model
    alembic/                 Database migrations (env.py, versions/)
    alembic.ini
    .env                     Environment variables (DATABASE_URL, JWT_SECRET)
    sql_app.db               SQLite database file (default)
    ml_models/summarizer/    Downloaded local model weights and tokenizer
    uploads/                 Uploaded PDF files, stored by UUID filename
    routers/
      auth.py                Register, login, /me, password change, admin transfer
      projects.py            CRUD for research projects and membership
      papers.py              PDF upload, background summarization, download, delete
      tasks.py               Kanban-style task CRUD scoped to a project
      invites.py             Email-based invite token generation and acceptance

  frontend/
    package.json
    vite.config.ts
    index.html, index.css
    src/
      main.tsx
      App.tsx                Router setup: public and protected routes
      context/
        AuthContext.tsx       Current-user state, login/logout, token storage
        ProjectContext.tsx    Active-project selection state
      components/
        ProtectedRoute.tsx
        layout/DashboardLayout.tsx
      pages/
        Login.tsx, Register.tsx
        Dashboard.tsx
        Projects.tsx
        Papers.tsx
        Tasks.tsx
        Settings.tsx
      lib/api.ts             Axios instance, auto-attaches JWT bearer token
```

---

## 3. Data Model

Defined in `backend/models.py` using SQLAlchemy ORM.

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | Accounts | `email`, `hashed_password`, `role` (Admin, Student, Researcher, Supervisor), `is_active` |
| `research_projects` | A research effort | `title`, `topic`, `objective`, `description`, `keywords`, `completion_percentage` |
| `project_members` | Many-to-many join between users and projects | `user_id`, `project_id` |
| `research_papers` | Uploaded PDFs and their AI summary | `title`, `file_path`, `status`, `summary`, `project_id` |
| `research_tasks` | Kanban tasks | `title`, `description`, `status`, `project_id`, `assignee_id` |
| `admin_requests` | Admin-role transfer requests | `requester_id`, `status` |
| `system_invites` | Invite-by-email tokens | `email`, `token`, `status`, `invited_by_id` |

The `ResearchProject` model also exposes computed properties `paper_count` and `task_count`, derived from its related papers and tasks.

---

## 4. API Reference

**Base URL:** `http://<host>:8000`. All protected routes require an `Authorization` header with a Bearer token.

### Auth — `/auth`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create a new user. Default role is Researcher. |
| POST | `/auth/login` | OAuth2 password flow login. Returns a JWT. |
| GET | `/auth/me` | Get the current authenticated user. |
| PUT | `/auth/password` | Change password. Requires the current password. |
| POST | `/auth/request-admin` | Request the Admin role. Auto-promotes if no admin exists yet, otherwise creates a pending request. |
| GET | `/auth/admin-requests` | Admin only. List pending admin-transfer requests. |
| PUT | `/auth/approve-admin/{request_id}` | Admin only. Approves a request, swaps roles, demotes the approver to Researcher, and rejects other pending requests. |

### Projects — `/projects`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects/` | Create a project. Creator is automatically added as a member. |
| GET | `/projects/` | List projects. Admins and Supervisors see all; others see only their own memberships. |
| GET | `/projects/{id}` | Get a single project, access-checked. |
| GET | `/projects/{id}/members` | List members of a project. |
| PUT | `/projects/{id}` | Update project fields. |
| DELETE | `/projects/{id}` | Delete a project, cascading to its members, tasks, and papers. |

### Papers — `/projects/{project_id}/papers`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/upload` | Upload up to 30 PDFs. Each is saved under a UUID filename and queued for background summarization. |
| GET | `/` | List papers belonging to a project. |
| GET | `/{paper_id}/download` | Download the original PDF. |
| POST | `/bulk-delete` | Delete multiple papers by ID, removing both the database row and the file. |

#### Summarization Pipeline

Each uploaded paper is processed in a FastAPI background task (`process_paper`), which:

1. Extracts text from the PDF using PyMuPDF (`fitz`).
2. Loads the local model and tokenizer from `./ml_models/summarizer`.
3. Truncates the extracted text to roughly 900 words and prefixes it with `"summarize: "`.
4. Generates a summary using beam search, with a maximum length of 500 tokens and a minimum length of 150.
5. Stores the result in the paper's `summary` field and sets its `status` to `completed`, or to `failed` with an error message if generation fails, or falls back to a truncated excerpt of the original text if the model itself errors.

### Tasks — `/projects/{project_id}/tasks`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List tasks. Admins and Supervisors get read-only access without needing membership. |
| POST | `/` | Create a task, assigned to the creator. |
| PUT | `/{task_id}` | Update a task. |
| DELETE | `/{task_id}` | Delete a task. |

### Invites — `/invites`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Generate an invite token for an email address, blocking duplicates and already-registered users. Currently simulates email sending by printing the invite link to the backend console. |
| GET | `/accept/{token}` | Validate an invite token. |

---

## 5. Authentication and Authorization

- Passwords are hashed with **bcrypt**.
- JWT tokens are signed with **HS256** and remain valid for **7 days**.
- The signing secret is read from the `JWT_SECRET` environment variable, falling back to a hardcoded value in `auth_utils.py` if unset.
- Four roles exist: **Admin**, **Student**, **Researcher**, and **Supervisor**. Admins and Supervisors get elevated read access across all projects; other roles are scoped to projects they belong to.
- The first user to call `/auth/request-admin` is promoted automatically if no admin exists yet. After that, becoming an admin requires the current admin to approve a request, which swaps the two users' roles.

---

## 6. Frontend Architecture

- **Routing (`App.tsx`):** Public routes for `/login` and `/register`; all other routes are wrapped in `ProtectedRoute` and `DashboardLayout`, covering dashboard, papers, projects, tasks, and settings.
- **Auth state (`AuthContext.tsx`):** The JWT is stored in `localStorage`. On mount, the app calls `/auth/me` to hydrate the current user. Logging in redirects to `/dashboard`; logging out clears the token and redirects to `/login`.
- **Project state (`ProjectContext.tsx`):** Tracks the currently selected project across pages.
- **API client (`lib/api.ts`):** An axios instance pointed at the current hostname on port 8000, with a request interceptor that automatically attaches the `Authorization` bearer header.
- **Data fetching:** TanStack React Query handles server-state caching and mutations.
- **UI:** TailwindCSS v4 and Framer Motion produce a glassmorphic, animated interface; `react-dropzone` handles drag-and-drop PDF uploads; `react-hook-form` and `zod` handle form validation.

---

## 7. Running the Project

### Prerequisites

- Python 3.x with a virtual environment set up at `backend/venv`
- Node.js and npm
- Backend dependencies installed in the venv: FastAPI, SQLAlchemy, transformers, torch, PyMuPDF, python-jose, bcrypt, python-dotenv, alembic
- The local summarizer model downloaded once by running `download_model.py` from the backend folder

### Quick Start (Windows)

Run `start.bat` from the project root. It opens two terminals: the backend, served with uvicorn on port 8000 with interactive docs at `/docs`, and the frontend, served with the Vite dev server on port 5173.

### Manual Start

**Backend:**
```bash
cd backend
.\venv\Scripts\activate.bat
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend (separate terminal):**
```bash
cd frontend
npm install
npm run dev
```

### Configuration

`backend/.env` should define:

```env
DATABASE_URL=sqlite:///./sql_app.db
JWT_SECRET=<your-secret>
```

---

## 8. Database Migrations

Alembic is configured under `backend/alembic/`. Two migrations currently exist:

1. `5b6421e47069_initial_migration.py` — the initial schema
2. `273110cb84c7_add_status_and_summary_to_researchpaper.py` — adds `status` and `summary` fields to `research_papers`

Migrations are applied by running `alembic upgrade head` from the backend folder.

---

## 9. Known Gaps and Areas to Improve

- Invite emails are only simulated, not actually sent. The link is printed to the backend console in `routers/invites.py`; a real provider such as SMTP or SendGrid would need to be integrated.
- There is a hardcoded fallback JWT secret in `auth_utils.py`. This should always be overridden through the environment in any real deployment, and the fallback should likely be removed entirely for production.
- CORS origins are hardcoded to `localhost:5173` and `127.0.0.1:5173` in `main.py`, which will need updating for any non-local deployment.
- No automated test suite is present in the codebase.
- Uploaded PDFs and the SQLite database file are stored directly inside the backend folder rather than in a dedicated storage layer.

---

## 10. Extending the Project

- **Swap the AI model:** Change the model name in `download_model.py` and the model-loading logic in `routers/papers.py`, for example to a larger LLM if GPU resources become available.
- **Add a new feature or API:** Define a table in `models.py`, add a schema in `schemas.py`, create a new router module, and register it in `main.py`.
- **Add a new frontend page:** Create a component under `frontend/src/pages/` and register its route in `App.tsx`.
- **Move to PostgreSQL:** Change `DATABASE_URL` in `backend/.env` — SQLAlchemy and Alembic handle the rest.

---

## 11. Deployment Notice — Why This Project Cannot Be Hosted on Cloud Platforms

> **⚠️ IMPORTANT: This application is designed to run locally and cannot be deployed on cloud hosting platforms such as Vercel, Render, Netlify, Railway, or Heroku.**

### Reasons

1. **Embedded Machine Learning Model (~230 MB):**
   The core AI summarization feature relies on the `Falconsai/text_summarization` HuggingFace model, which is downloaded locally (via `download_model.py`) into `backend/ml_models/summarizer/`. The model weights file (`model.safetensors`) alone is approximately **242 MB**. Combined with the PyTorch and HuggingFace Transformers dependencies, the total backend footprint exceeds **2 GB** — far beyond the limits of free-tier cloud services. Additionally, running ML inference requires persistent CPU/memory resources that serverless and free-tier platforms do not provide.

2. **ML Model is Not on GitHub:**
   The `backend/ml_models/` directory is listed in `.gitignore` and is **not pushed to GitHub**. This is intentional because Git and GitHub are not designed for large binary files (the 242 MB model file exceeds GitHub's 100 MB file size limit). The model must be downloaded separately on each machine by running the `download_model.py` script, which requires a one-time internet connection to pull the model from HuggingFace Hub.

3. **SQLite File-Based Database:**
   The application uses SQLite (`sql_app.db`) as its default database, which is a local file stored on disk. Cloud platforms use ephemeral file systems that are wiped on every deploy or restart, meaning all data (users, projects, papers, tasks) would be lost after each deployment cycle.

4. **Local File System for PDF Storage:**
   Uploaded research papers (PDFs) are saved to the `backend/uploads/` directory on the local file system. Cloud platforms do not provide persistent writable disk storage on free tiers, so uploaded files would be lost on redeployment.

5. **CORS and API URL Hardcoded to Localhost:**
   The backend CORS policy only allows requests from `http://localhost:5173`, and the frontend API client dynamically constructs the backend URL using the browser's hostname on port 8000. Neither of these configurations supports a split frontend/backend cloud deployment where the two services would be on entirely different domains.

6. **Privacy-First Architecture by Design:**
   This project was intentionally built as a **local-only, offline-capable** application. The primary value proposition is that sensitive research documents and unpublished papers **never leave the user's machine**. Cloud deployment would fundamentally contradict this design principle.

### How to Use This Project

This project is meant to be **cloned from GitHub and run locally** on your own machine. Please refer to **Section 7 (Running the Project)** above for setup and launch instructions. The source code is fully available on GitHub for review, contribution, and local execution:

🔗 **GitHub Repository:** [https://github.com/Mihir4U-avi/Automatically-Ally](https://github.com/Mihir4U-avi/Automatically-Ally)
