import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { Task, TaskPriority, TaskStatus } from '../src/types/task.ts';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'todo_app.db');

let dbInstance: DatabaseSync | null = null;

function formatLocalDateOffset(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function initializeDatabase(db: DatabaseSync): void {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      due_date TEXT NULL,
      priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
      status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed')),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const seededRow = db
    .prepare("SELECT value FROM app_meta WHERE key = 'initial_seed_v1'")
    .get() as { value: string } | undefined;

  if (!seededRow) {
    const countRow = db
      .prepare('SELECT COUNT(*) as count FROM tasks')
      .get() as { count: number };

    if (countRow.count === 0) {
      const insertStmt = db.prepare(`
        INSERT INTO tasks (title, description, due_date, priority, status)
        VALUES (?, ?, ?, ?, ?)
      `);

      const seedTasks: Array<[string, string, string | null, TaskPriority, TaskStatus]> = [
        [
          'Submit quarterly architecture review',
          'Finalize system diagrams, latency benchmarks, and database migration notes for engineering sign-off.',
          formatLocalDateOffset(-2),
          'High',
          'Pending',
        ],
        [
          'Prepare sprint planning agenda',
          'Prioritize backlog items, estimate story points with team leads, and confirm capacity for next cycle.',
          formatLocalDateOffset(0),
          'High',
          'Pending',
        ],
        [
          'Audit API validation error messages',
          'Ensure all REST endpoints return clear field-level validation messages and consistent HTTP status codes.',
          formatLocalDateOffset(2),
          'Medium',
          'Pending',
        ],
        [
          'Update onboarding checklist documentation',
          'Refresh local environment setup steps and verify database seed instructions for new hires.',
          formatLocalDateOffset(5),
          'Low',
          'Pending',
        ],
        [
          'Configure automated database backups',
          'Verified daily snapshot schedule and tested point-in-time recovery in staging.',
          formatLocalDateOffset(-1),
          'Medium',
          'Completed',
        ],
      ];

      for (const task of seedTasks) {
        insertStmt.run(task[0], task[1], task[2], task[3], task[4]);
      }
    }

    db.prepare(
      "INSERT OR REPLACE INTO app_meta (key, value) VALUES ('initial_seed_v1', 'done')"
    ).run();
  }
}

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(dbPath);
    initializeDatabase(dbInstance);
  }
  return dbInstance;
}

export function listTasks(filters?: {
  status?: string;
  priority?: string;
  search?: string;
}): Task[] {
  const db = getDb();
  const conditions: string[] = [];
  const params: Array<string> = [];

  if (filters?.status && (filters.status === 'Pending' || filters.status === 'Completed')) {
    conditions.push('status = ?');
    params.push(filters.status);
  }

  if (
    filters?.priority &&
    (filters.priority === 'Low' || filters.priority === 'Medium' || filters.priority === 'High')
  ) {
    conditions.push('priority = ?');
    params.push(filters.priority);
  }

  if (filters?.search && filters.search.trim().length > 0) {
    conditions.push('LOWER(title) LIKE ?');
    params.push(`%${filters.search.trim().toLowerCase()}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT id, title, description, due_date, priority, status, created_at
    FROM tasks
    ${whereClause}
    ORDER BY
      CASE WHEN status = 'Pending' THEN 0 ELSE 1 END ASC,
      CASE WHEN due_date IS NULL THEN 1 ELSE 0 END ASC,
      due_date ASC,
      id DESC
  `;

  return db.prepare(query).all(...params) as unknown as Task[];
}

export function getTaskById(id: number): Task | null {
  const db = getDb();
  const row = db
    .prepare(
      'SELECT id, title, description, due_date, priority, status, created_at FROM tasks WHERE id = ?'
    )
    .get(id) as unknown as Task | undefined;

  return row ?? null;
}

export function createTask(input: {
  title: string;
  description: string;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
}): Task {
  const db = getDb();
  const result = db
    .prepare(`
      INSERT INTO tasks (title, description, due_date, priority, status)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(input.title, input.description, input.due_date, input.priority, input.status);

  const insertedId = Number(result.lastInsertRowid);
  const created = getTaskById(insertedId);
  if (!created) {
    throw new Error('Failed to load newly created task');
  }
  return created;
}

export function updateTask(
  id: number,
  input: {
    title: string;
    description: string;
    due_date: string | null;
    priority: TaskPriority;
    status: TaskStatus;
  }
): Task | null {
  const db = getDb();
  const result = db
    .prepare(`
      UPDATE tasks
      SET title = ?, description = ?, due_date = ?, priority = ?, status = ?
      WHERE id = ?
    `)
    .run(input.title, input.description, input.due_date, input.priority, input.status, id);

  if (result.changes === 0) {
    return null;
  }
  return getTaskById(id);
}

export function deleteTask(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return result.changes > 0;
}
