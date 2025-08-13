// Classes management with SQLite
import { db } from './database';
import { getActiveYearId } from './years';

export interface ClassItem {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  createdAt: string;
}

export function getClasses(yearId?: string): ClassItem[] {
  const y = yearId || getActiveYearId();
  const stmt = db.prepare('SELECT * FROM classes WHERE year_id = ? ORDER BY nom');
  const rows = stmt.all(y) as any[];
  
  return rows.map(row => ({
    id: row.id,
    name: row.nom,
    description: row.level || undefined,
    capacity: 30, // Default capacity, can be enhanced later
    createdAt: new Date().toISOString()
  }));
}

export function saveClasses(classes: ClassItem[], yearId?: string) {
  const y = yearId || getActiveYearId();
  const deleteStmt = db.prepare('DELETE FROM classes WHERE year_id = ?');
  const insertStmt = db.prepare('INSERT INTO classes (id, year_id, nom, level) VALUES (?, ?, ?, ?)');
  
  const transaction = db.transaction(() => {
    deleteStmt.run(y);
    for (const cls of classes) {
      insertStmt.run(cls.id, y, cls.name, cls.description || '');
    }
  });
  
  transaction();
}

export function addClass(classData: Omit<ClassItem, 'id' | 'createdAt'>, yearId?: string): ClassItem {
  const y = yearId || getActiveYearId();
  const newClass: ClassItem = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...classData
  };
  
  const stmt = db.prepare('INSERT INTO classes (id, year_id, nom, level) VALUES (?, ?, ?, ?)');
  stmt.run(newClass.id, y, newClass.name, newClass.description || '');
  
  return newClass;
}

export function updateClass(classData: ClassItem, yearId?: string) {
  const y = yearId || getActiveYearId();
  const stmt = db.prepare('UPDATE classes SET nom = ?, level = ? WHERE id = ? AND year_id = ?');
  stmt.run(classData.name, classData.description || '', classData.id, y);
}

export function deleteClass(classId: string, yearId?: string) {
  const y = yearId || getActiveYearId();
  const stmt = db.prepare('DELETE FROM classes WHERE id = ? AND year_id = ?');
  stmt.run(classId, y);
}