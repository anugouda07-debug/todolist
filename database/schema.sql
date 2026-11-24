-- MySQL Schema Reference for Taskflow (todo_app)
-- Note: The live AI Studio runtime uses an equivalent SQLite table in data/todo_app.db
-- exposed through the Express REST API (/api/tasks).

CREATE DATABASE IF NOT EXISTS todo_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE todo_app;

CREATE TABLE IF NOT EXISTS tasks (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  due_date DATE NULL,
  priority ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
  status ENUM('Pending', 'Completed') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_tasks_status (status),
  INDEX idx_tasks_priority (priority),
  INDEX idx_tasks_due_date (due_date)
);
