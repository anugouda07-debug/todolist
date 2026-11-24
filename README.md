# Taskflow — To-Do List Application

A modern, responsive task management dashboard with full CRUD operations, priority and status filtering, search by title, overdue highlighting, completion progress tracking, and persistent SQL database storage.

## Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS (`src/`)
- **Backend**: Node.js + Express REST API (`server.ts`, `server/routes/tasks.ts`)
- **Database**:
  - Live runtime: SQLite via Node.js built-in `node:sqlite` (`data/todo_app.db`)
  - Reference SQL schema: `database/schema.sql` (MySQL `todo_app.tasks` schema)

## REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/tasks` | Create a new task (`201 Created`) |
| `GET` | `/api/tasks` | Retrieve all tasks (supports `?status=`, `?priority=`, `?q=`) |
| `GET` | `/api/tasks/:id` | Retrieve a single task by ID |
| `PUT` | `/api/tasks/:id` | Update task fields or status (`Pending` / `Completed`) |
| `DELETE` | `/api/tasks/:id` | Delete a task by ID |

## Running Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server** (runs Express API + Vite dev middleware on port 3000):
   ```bash
   npm run dev
   ```

3. **Build and run in production**:
   ```bash
   npm run build
   NODE_ENV=production npm start
   ```

4. **Open in browser**:
   Visit `http://localhost:3000`. The SQLite database (`data/todo_app.db`) is automatically initialized on first start.
