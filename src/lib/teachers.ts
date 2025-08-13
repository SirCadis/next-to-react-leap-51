// Teachers registry (global) + yearly assignments (SQLite)
import { getActiveYearId } from "./years";
import { db } from './database';

export type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  subject?: string;
};

export function getTeachers(): Teacher[] {
  const stmt = db.prepare('SELECT * FROM teachers ORDER BY lastName, firstName');
  return stmt.all() as Teacher[];
}

export function getAssignedTeacherIds(yearId: string = getActiveYearId()): string[] {
  const stmt = db.prepare('SELECT DISTINCT teacher_id FROM teacher_assignments WHERE year_id = ?');
  const rows = stmt.all(yearId) as { teacher_id: string }[];
  return rows.map(r => r.teacher_id);
}

export function setAssignedTeacherIds(ids: string[], yearId: string = getActiveYearId()) {
  const deleteStmt = db.prepare('DELETE FROM teacher_assignments WHERE year_id = ?');
  const insertStmt = db.prepare('INSERT INTO teacher_assignments (id, teacher_id, year_id) VALUES (?, ?, ?)');
  
  const transaction = db.transaction(() => {
    deleteStmt.run(yearId);
    const uniqueIds = Array.from(new Set(ids));
    for (const teacherId of uniqueIds) {
      const id = `assignment_${teacherId}_${yearId}`;
      insertStmt.run(id, teacherId, yearId);
    }
  });
  
  transaction();
}

export function isTeacherAssigned(teacherId: string, yearId: string = getActiveYearId()) {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM teacher_assignments WHERE teacher_id = ? AND year_id = ?');
  const result = stmt.get(teacherId, yearId) as { count: number };
  return result.count > 0;
}

export function setTeacherAssigned(teacherId: string, assigned: boolean, yearId: string = getActiveYearId()) {
  if (assigned) {
    const stmt = db.prepare(`
      INSERT INTO teacher_assignments (id, teacher_id, year_id)
      VALUES (?, ?, ?)
      ON CONFLICT DO NOTHING
    `);
    const id = `assignment_${teacherId}_${yearId}`;
    stmt.run(id, teacherId, yearId);
  } else {
    const stmt = db.prepare('DELETE FROM teacher_assignments WHERE teacher_id = ? AND year_id = ?');
    stmt.run(teacherId, yearId);
  }
  return assigned;
}

export function addTeacher(teacher: Omit<Teacher, 'id'>) {
  const newTeacher: Teacher = {
    id: Date.now().toString(),
    ...teacher
  };
  
  const stmt = db.prepare(`
    INSERT INTO teachers (id, firstName, lastName, email, phone, subject)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(newTeacher.id, newTeacher.firstName, newTeacher.lastName, newTeacher.email, newTeacher.phone, newTeacher.subject);
  
  return newTeacher;
}

export function updateTeacher(teacher: Teacher) {
  const stmt = db.prepare(`
    UPDATE teachers SET 
      firstName = ?, lastName = ?, email = ?, phone = ?, subject = ?
    WHERE id = ?
  `);
  stmt.run(teacher.firstName, teacher.lastName, teacher.email, teacher.phone, teacher.subject, teacher.id);
}

export function deleteTeacher(teacherId: string) {
  const deleteTeacherStmt = db.prepare('DELETE FROM teachers WHERE id = ?');
  const deleteAssignmentsStmt = db.prepare('DELETE FROM teacher_assignments WHERE teacher_id = ?');
  
  const transaction = db.transaction(() => {
    deleteAssignmentsStmt.run(teacherId);
    deleteTeacherStmt.run(teacherId);
  });
  
  transaction();
}
