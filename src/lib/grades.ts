// Grades management with SQLite
import { db } from './database';
import { getActiveYearId } from './years';

export interface Subject {
  id: string;
  name: string;
  coefficient: number;
  isOptional: boolean;
  languageType?: "LV1" | "LV2" | null;
  studentIds: string[];
}

export interface ClassSubjects {
  id: string;
  classId: string;
  semester: "premier" | "deuxieme";
  subjects: Subject[];
  createdAt: string;
}

export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  classId: string;
  semester: "premier" | "deuxieme";
  devoir1?: number;
  devoir2?: number;
  composition?: number;
  createdAt: string;
}

export function getClassSubjects(yearId?: string): ClassSubjects[] {
  const y = yearId || getActiveYearId();
  const stmt = db.prepare('SELECT * FROM class_subjects WHERE year_id = ?');
  const rows = stmt.all(y) as any[];
  
  return rows.map(row => ({
    id: row.id,
    classId: row.class_id,
    semester: row.semester,
    subjects: JSON.parse(row.subjects || '[]'),
    createdAt: row.created_at
  }));
}

export function saveClassSubjects(classSubjects: ClassSubjects[], yearId?: string) {
  const y = yearId || getActiveYearId();
  const deleteStmt = db.prepare('DELETE FROM class_subjects WHERE year_id = ?');
  const insertStmt = db.prepare(`
    INSERT INTO class_subjects (id, year_id, class_id, semester, subjects, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const transaction = db.transaction(() => {
    deleteStmt.run(y);
    for (const cs of classSubjects) {
      insertStmt.run(
        cs.id,
        y,
        cs.classId,
        cs.semester,
        JSON.stringify(cs.subjects),
        cs.createdAt
      );
    }
  });
  
  transaction();
}

export function getGrades(yearId?: string): Grade[] {
  const y = yearId || getActiveYearId();
  const stmt = db.prepare('SELECT * FROM grades WHERE year_id = ?');
  const rows = stmt.all(y) as any[];
  
  return rows.map(row => ({
    id: row.id,
    studentId: row.student_id,
    subjectId: row.subject_id,
    classId: row.class_id,
    semester: row.semester,
    devoir1: row.devoir1,
    devoir2: row.devoir2,
    composition: row.composition,
    createdAt: row.created_at
  }));
}

export function saveGrades(grades: Grade[], yearId?: string) {
  const y = yearId || getActiveYearId();
  const deleteStmt = db.prepare('DELETE FROM grades WHERE year_id = ?');
  const insertStmt = db.prepare(`
    INSERT INTO grades (id, year_id, student_id, subject_id, class_id, semester, devoir1, devoir2, composition, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const transaction = db.transaction(() => {
    deleteStmt.run(y);
    for (const grade of grades) {
      insertStmt.run(
        grade.id,
        y,
        grade.studentId,
        grade.subjectId,
        grade.classId,
        grade.semester,
        grade.devoir1,
        grade.devoir2,
        grade.composition,
        grade.createdAt
      );
    }
  });
  
  transaction();
}

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS class_subjects (
    id TEXT PRIMARY KEY,
    year_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    semester TEXT NOT NULL,
    subjects TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (year_id) REFERENCES academic_years(id)
  );

  CREATE TABLE IF NOT EXISTS grades (
    id TEXT PRIMARY KEY,
    year_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    semester TEXT NOT NULL,
    devoir1 REAL,
    devoir2 REAL,
    composition REAL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (year_id) REFERENCES academic_years(id),
    FOREIGN KEY (student_id) REFERENCES students(id)
  );
`);