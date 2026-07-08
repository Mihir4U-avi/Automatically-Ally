# Automatically - Ally 🚀

**A privacy-first, all-in-one research workspace** combining project management, task tracking, role-based collaboration, and local AI-powered PDF summarization.

## 📖 Overview

Academic researchers, students, and R&D teams often suffer from fragmented workflows—juggling separate tools for task management, literature review, and team communication. 

**Automatically - Ally** solves this by bundling these into one secure workspace. Crucially, it performs AI summarization of research papers **entirely offline on your local machine**. By using a local HuggingFace AI model, sensitive or unpublished documents never leave your computer, ensuring 100% privacy and security.

---

## 🛠️ Tech Stack & Technologies Used

This project is built using a modern, scalable web stack:

### **Backend**
*   **Python 3 & FastAPI:** Provides a high-performance REST API.
*   **SQLAlchemy & Alembic:** Handles database modeling and migrations.
*   **SQLite:** Default local database (`sql_app.db`) to keep everything self-contained (easily swappable to PostgreSQL).
*   **PyMuPDF (`fitz`):** Extracts text from uploaded PDF research papers.
*   **HuggingFace Transformers & PyTorch:** Runs the local AI summarization model (`Falconsai/text_summarization`) on your CPU without needing an internet connection.
*   **JWT & Bcrypt:** Secures user authentication and password hashing.

### **Frontend**
*   **React 19 & TypeScript:** Builds a robust, type-safe user interface.
*   **Vite 8:** Lightning-fast frontend build tool and development server.
*   **TailwindCSS:** Provides the premium, Apple-inspired glassmorphic design system.
*   **Framer Motion:** Handles smooth, hardware-accelerated animations.

---

## 💻 How to Install & Run Locally (Offline)

Because this is a completely local and offline project, you run both the frontend and backend on your own machine. 

### Prerequisites
Before you begin, ensure you have the following installed on your computer:
1. **Python 3.10+**
2. **Node.js (v18+) & npm**

### Initial Setup (First Time Only)

**1. Clone the repository:**
```bash
git clone https://github.com/Mihir4U-avi/Automatically-Ally.git
cd Automatically-Ally
```

**2. Setup the Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd ..
```
*(Note: The very first time you run the AI summarizer, the backend will briefly require an internet connection to download the ~230MB AI model from HuggingFace. After that, it runs 100% offline.)*

**3. Setup the Frontend:**
```bash
cd frontend
npm install
cd ..
```

### Starting the Application

We have included a convenient batch script to start both the frontend and backend simultaneously.

Simply double-click the **`start.bat`** file in the root directory, or run it from your terminal:
```bash
./start.bat
```

This will open two terminal windows:
*   **Frontend UI:** Available at `http://localhost:5173`
*   **Backend API:** Available at `http://localhost:8000/docs`

---

## 🎯 How to Use the Workspace

1. **Create an Account:** When you first launch the app, go to the Register page to create your Admin account.
2. **Manage Projects & Tasks:** Create new research projects and organize your team's workflow using the Kanban board (Todo ➡️ In Progress ➡️ Review ➡️ Done).
3. **Invite Team Members:** Generate real-time invite links to bring in colleagues. You can assign them roles like Researcher, Supervisor, or Admin.
4. **Summarize Literature (Offline AI):** 
   * Navigate to the **Papers & Literature** tab.
   * Drag and drop your PDF research papers (up to 30 at a time).
   * The local AI model will automatically read the PDF and generate an abstract summary.
   * Use the built-in split-screen viewer to read the original document side-by-side with your new AI-generated summary!
