// SQLite Database Service for School Management System
import Database from 'better-sqlite3';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';
const dbPath = isDev 
  ? path.join(process.cwd(), 'school.db')
  : path.join(process.cwd(), 'school.db'); // Will be in app bundle for production

export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initializeDatabase() {
  // Global tables (no year_id)
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      birthDate TEXT,
      birthPlace TEXT,
      contact TEXT,
      gender TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      subject TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS academic_years (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      debut TEXT NOT NULL,
      fin TEXT NOT NULL,
      closed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Year-specific tables
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT,
      year_id TEXT,
      nom TEXT NOT NULL,
      level TEXT,
      main_teacher_id TEXT,
      PRIMARY KEY (id, year_id),
      FOREIGN KEY (year_id) REFERENCES academic_years(id),
      FOREIGN KEY (main_teacher_id) REFERENCES teachers(id)
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      year_id TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, year_id),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (year_id) REFERENCES academic_years(id)
    );

    CREATE TABLE IF NOT EXISTS teacher_assignments (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      year_id TEXT NOT NULL,
      class_id TEXT,
      subject_id TEXT,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id),
      FOREIGN KEY (year_id) REFERENCES academic_years(id)
    );

    CREATE TABLE IF NOT EXISTS fees_per_class (
      year_id TEXT,
      class_id TEXT,
      inscription INTEGER DEFAULT 0,
      mensualite INTEGER DEFAULT 0,
      PRIMARY KEY (year_id, class_id),
      FOREIGN KEY (year_id) REFERENCES academic_years(id)
    );

    CREATE TABLE IF NOT EXISTS extra_fees (
      id TEXT,
      year_id TEXT,
      nom TEXT NOT NULL,
      montant INTEGER NOT NULL,
      PRIMARY KEY (id, year_id),
      FOREIGN KEY (year_id) REFERENCES academic_years(id)
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT,
      year_id TEXT,
      nom TEXT NOT NULL,
      montant INTEGER NOT NULL,
      PRIMARY KEY (id, year_id),
      FOREIGN KEY (year_id) REFERENCES academic_years(id)
    );

    CREATE TABLE IF NOT EXISTS student_fee_activations (
      student_id TEXT,
      year_id TEXT,
      extra_fee_id TEXT,
      PRIMARY KEY (student_id, year_id, extra_fee_id),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (year_id) REFERENCES academic_years(id)
    );

    CREATE TABLE IF NOT EXISTS student_service_activations (
      student_id TEXT,
      year_id TEXT,
      service_id TEXT,
      month TEXT,
      PRIMARY KEY (student_id, year_id, service_id, month),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (year_id) REFERENCES academic_years(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      year_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      type TEXT NOT NULL,
      class_id TEXT,
      month TEXT,
      item_id TEXT,
      method TEXT,
      amount INTEGER NOT NULL,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (year_id) REFERENCES academic_years(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS attendance_settings (
      year_id TEXT PRIMARY KEY,
      lockFutureDays BOOLEAN DEFAULT 0,
      specials TEXT DEFAULT '[]',
      FOREIGN KEY (year_id) REFERENCES academic_years(id)
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_enrollments_student_year ON enrollments(student_id, year_id);
    CREATE INDEX IF NOT EXISTS idx_enrollments_class_year ON enrollments(class_id, year_id);
    CREATE INDEX IF NOT EXISTS idx_payments_student_year ON payments(student_id, year_id);
    CREATE INDEX IF NOT EXISTS idx_teacher_assignments_year ON teacher_assignments(teacher_id, year_id);
  `);
}

// Initialize on import
initializeDatabase();