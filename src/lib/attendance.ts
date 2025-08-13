// Attendance records management with SQLite
import { db } from './database';
import { getActiveYearId } from './years';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  subject?: string;
  teacherId?: string;
  notes?: string;
  createdAt: string;
  entries?: Array<{ studentId: string; status: string; comment: string }>;
  locked?: boolean;
  scheduleBlockId?: string;
}

export function getAttendanceRecords(yearId?: string): AttendanceRecord[] {
  const y = yearId || getActiveYearId();
  const stmt = db.prepare('SELECT * FROM attendance_records WHERE year_id = ? ORDER BY date DESC');
  return stmt.all(y) as AttendanceRecord[];
}

export function saveAttendanceRecords(records: AttendanceRecord[], yearId?: string) {
  const y = yearId || getActiveYearId();
  const deleteStmt = db.prepare('DELETE FROM attendance_records WHERE year_id = ?');
  const insertStmt = db.prepare(`
    INSERT INTO attendance_records (id, year_id, studentId, classId, date, status, subject, teacherId, notes, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const transaction = db.transaction(() => {
    deleteStmt.run(y);
    for (const record of records) {
      insertStmt.run(
        record.id,
        y,
        record.studentId,
        record.classId,
        record.date,
        record.status,
        record.subject,
        record.teacherId,
        record.notes,
        record.createdAt
      );
    }
  });
  
  transaction();
}

export function addAttendanceRecord(record: Omit<AttendanceRecord, 'id' | 'createdAt'>, yearId?: string): AttendanceRecord {
  const y = yearId || getActiveYearId();
  const newRecord: AttendanceRecord = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...record
  };
  
  const stmt = db.prepare(`
    INSERT INTO attendance_records (id, year_id, studentId, classId, date, status, subject, teacherId, notes, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    newRecord.id,
    y,
    newRecord.studentId,
    newRecord.classId,
    newRecord.date,
    newRecord.status,
    newRecord.subject,
    newRecord.teacherId,
    newRecord.notes,
    newRecord.createdAt
  );
  
  return newRecord;
}

// Initialize attendance table
db.exec(`
  CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY,
    year_id TEXT NOT NULL,
    studentId TEXT NOT NULL,
    classId TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    subject TEXT,
    teacherId TEXT,
    notes TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (year_id) REFERENCES academic_years(id),
    FOREIGN KEY (studentId) REFERENCES students(id),
    FOREIGN KEY (teacherId) REFERENCES teachers(id)
  );
`);