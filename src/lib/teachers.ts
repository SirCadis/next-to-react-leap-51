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
