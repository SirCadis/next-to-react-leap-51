// Registre global des élèves + inscriptions par année (SQLite)
import { getActiveYearId, listYears } from "./years";
import { db } from './database';

export type Student = {
  id: string; // immuable sur toute la scolarité
  firstName: string;
  lastName: string;
  birthDate?: string;
  birthPlace?: string;
  contact?: string;
  gender?: string;
  // Champs legacy possibles
  classId?: string; // pour compatibilité avec anciennes données
};

export type Enrollment = {
  studentId: string;
  yearId: string;
  classId: string;
  status?: "active" | "transferred" | "graduated" | "left";
  date?: string; // ISO
};

export function getStudents(): Student[] {
  const stmt = db.prepare('SELECT * FROM students ORDER BY lastName, firstName');
  return stmt.all() as Student[];
}

export function upsertStudent(student: Student) {
  const stmt = db.prepare(`
    INSERT INTO students (id, firstName, lastName, birthDate, birthPlace, contact, gender)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      firstName = excluded.firstName,
      lastName = excluded.lastName,
      birthDate = excluded.birthDate,
      birthPlace = excluded.birthPlace,
      contact = excluded.contact,
      gender = excluded.gender
  `);
  stmt.run(student.id, student.firstName, student.lastName, student.birthDate, student.birthPlace, student.contact, student.gender);
}

export function getEnrollments(yearId?: string): Enrollment[] {
  const y = yearId || getActiveYearId();
  const stmt = db.prepare('SELECT * FROM enrollments WHERE year_id = ?');
  return stmt.all(y) as Enrollment[];
}

export function saveEnrollments(list: Enrollment[], yearId?: string) {
  const y = yearId || getActiveYearId();
  const deleteStmt = db.prepare('DELETE FROM enrollments WHERE year_id = ?');
  const insertStmt = db.prepare('INSERT INTO enrollments (id, student_id, class_id, year_id, status, date) VALUES (?, ?, ?, ?, ?, ?)');
  
  const transaction = db.transaction(() => {
    deleteStmt.run(y);
    for (const enrollment of list) {
      const id = `enrollment_${Date.now()}_${Math.random()}`;
      insertStmt.run(id, enrollment.studentId, enrollment.classId, enrollment.yearId, enrollment.status || 'active', enrollment.date || new Date().toISOString());
    }
  });
  
  transaction();
}

export function getEnrollmentForStudent(studentId: string, yearId?: string): Enrollment | undefined {
  const y = yearId || getActiveYearId();
  const stmt = db.prepare('SELECT * FROM enrollments WHERE student_id = ? AND year_id = ?');
  return stmt.get(studentId, y) as Enrollment | undefined;
}

export function enrollStudent({ studentId, classId, yearId }: { studentId: string; classId: string; yearId?: string }) {
  const y = yearId || getActiveYearId();
  const now = new Date().toISOString();
  const id = `enrollment_${studentId}_${y}`;
  
  const stmt = db.prepare(`
    INSERT INTO enrollments (id, student_id, class_id, year_id, status, date)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(student_id, year_id) DO UPDATE SET
      class_id = excluded.class_id,
      status = excluded.status,
      date = excluded.date
  `);
  
  stmt.run(id, studentId, classId, y, 'active', now);
  
  const rec: Enrollment = { studentId, yearId: y, classId, status: "active", date: now };
  return rec;
}

export function getStudentHistory(studentId: string): Enrollment[] {
  const stmt = db.prepare('SELECT * FROM enrollments WHERE student_id = ? ORDER BY year_id');
  return stmt.all(studentId) as Enrollment[];
}

export function deleteStudent(studentId: string) {
  const deleteStudentStmt = db.prepare('DELETE FROM students WHERE id = ?');
  const deleteEnrollmentsStmt = db.prepare('DELETE FROM enrollments WHERE student_id = ?');
  const deleteActivationsStmt = db.prepare('DELETE FROM student_fee_activations WHERE student_id = ?');
  const deleteServiceActivationsStmt = db.prepare('DELETE FROM student_service_activations WHERE student_id = ?');
  const deletePaymentsStmt = db.prepare('DELETE FROM payments WHERE student_id = ?');
  
  const transaction = db.transaction(() => {
    deleteActivationsStmt.run(studentId);
    deleteServiceActivationsStmt.run(studentId);
    deletePaymentsStmt.run(studentId);
    deleteEnrollmentsStmt.run(studentId);
    deleteStudentStmt.run(studentId);
  });
  
  transaction();
}
