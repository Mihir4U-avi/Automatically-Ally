# Automatically - Ally: Project Documentation

## 1. Problem Statement
Academic researchers, students, and professional R&D teams often suffer from severely fragmented workflows. When conducting extensive research, teams are forced to juggle multiple disparate tools: one platform for task management (like Jira or Trello), another for reading and managing literature (like Mendeley or Zotero), and entirely separate communication channels. Furthermore, leveraging AI to summarize massive PDF papers usually requires uploading sensitive, unpublished research to third-party cloud providers (like OpenAI), which poses massive privacy and intellectual property risks.

## 2. Why This Project Was Built
"Automatically - Ally" was built to solve this fragmentation by providing an all-in-one, privacy-first research workspace. It brings together role-based access control, kanban-style task boards, project management, and automated literature summarization into a single cohesive environment. 

Crucially, it is built with **local, offline AI summarization    ""Falconsai/text_summarization""**. By downloading and running a small-scale HuggingFace Machine Learning model directly on the user's CPU, it guarantees that proprietary research documents never leave the local machine, ensuring 100% privacy and security while still offering cutting-edge AI assistance.

## 3. How It Is Used
The application is split into a robust FastAPI backend and a beautiful, Apple-inspired glassmorphic React frontend. 

**Core Workflows:**
- **Administration & Roles:** A workspace is governed by an Admin. Members can be invited via real-time generated links. Users operate as Researchers, Supervisors, or Admins, with UI elements dynamically adapting to their permissions.
- **Projects & Tasks:** Users can create Projects and manage them via a Kanban board (Todo, In Progress, Review, Done).
- **Literature Summarization:** In the "Papers & Literature" tab, users can drag-and-drop up to 30 PDFs at once. The backend parses the text and feeds it through a local Transformer model to generate an abstract summary. A built-in split-screen PDF viewer allows users to read the original document side-by-side with the AI summary.

## 4. Maintenance and Architecture
The project architecture is deliberately modular to ensure long-term maintainability.
- **Backend:** Python, FastAPI, and SQLAlchemy. Data is stored locally using SQLite (`ally.db`). Machine Learning is handled by `PyMuPDF` (for text extraction) and `transformers` / `torch` for AI processing.
- **Frontend:** TypeScript, React, Vite, and TailwindCSS. The UI relies on `framer-motion` for fluid, hardware-accelerated animations. 

**Maintaining the System:**
- **Database:** SQLAlchemy handles all ORM mapping. If the project needs to scale to a cloud environment, simply changing the `DATABASE_URL` in `backend/database.py` to a PostgreSQL string will seamlessly migrate the system.
- **Dependencies:** Python dependencies are managed in a virtual environment (`venv`). Frontend packages are managed via `npm`. 

## 5. How It Can Be Extended By Other Developers
Any developer familiar with modern web stacks can easily extend this project:
1. **Upgrading the AI Model:** The current summarization model (`Falconsai/text_summarization`) is optimized for low-end CPUs. A developer with access to powerful GPUs can swap this out for a massive LLM (like Llama 3) simply by changing the model string in `backend/download_model.py` and updating the pipeline logic in `backend/routers/papers.py`.
2. **Adding New API Features:** To add a new feature (e.g., a real-time chat), a developer would:
   - Define the database table in `backend/models.py`.
   - Create data validators in `backend/schemas.py`.
   - Add a new router (e.g., `routers/chat.py`) and include it in `main.py`.
3. **Frontend Extensions:** The UI is highly componentized. New pages can be added to the `frontend/src/pages/` directory and registered in the `App.tsx` router. The pre-built design system (using the `glass` Tailwind classes) ensures any new components will instantly match the premium aesthetic.
