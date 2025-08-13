// Schedule management with SQLite
import { db } from './database';
import { getActiveYearId } from './years';

export interface ScheduleBlock {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacherId: string;
  classId: string;
  color: string;
  createdAt: string;
}

export function getSchedules(yearId?: string): ScheduleBlock[] {
  const y = yearId || getActiveYearId();
  const stmt = db.prepare(`
    SELECT * FROM schedules WHERE year_id = ? ORDER BY day, startTime
  `);
  return stmt.all(y) as ScheduleBlock[];
}

export function saveSchedules(schedules: ScheduleBlock[], yearId?: string) {
  const y = yearId || getActiveYearId();
  const deleteStmt = db.prepare('DELETE FROM schedules WHERE year_id = ?');
  const insertStmt = db.prepare(`
    INSERT INTO schedules (id, year_id, day, startTime, endTime, subject, teacherId, classId, color, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const transaction = db.transaction(() => {
    deleteStmt.run(y);
    for (const schedule of schedules) {
      insertStmt.run(
        schedule.id,
        y,
        schedule.day,
        schedule.startTime,
        schedule.endTime,
        schedule.subject,
        schedule.teacherId,
        schedule.classId,
        schedule.color,
        schedule.createdAt
      );
    }
  });
  
  transaction();
}

export function addSchedule(scheduleData: Omit<ScheduleBlock, 'id' | 'createdAt'>, yearId?: string): ScheduleBlock {
  const y = yearId || getActiveYearId();
  const newSchedule: ScheduleBlock = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...scheduleData
  };
  
  const stmt = db.prepare(`
    INSERT INTO schedules (id, year_id, day, startTime, endTime, subject, teacherId, classId, color, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    newSchedule.id,
    y,
    newSchedule.day,
    newSchedule.startTime,
    newSchedule.endTime,
    newSchedule.subject,
    newSchedule.teacherId,
    newSchedule.classId,
    newSchedule.color,
    newSchedule.createdAt
  );
  
  return newSchedule;
}

export function updateSchedule(scheduleData: ScheduleBlock, yearId?: string) {
  const y = yearId || getActiveYearId();
  const stmt = db.prepare(`
    UPDATE schedules SET 
      day = ?, startTime = ?, endTime = ?, subject = ?, 
      teacherId = ?, classId = ?, color = ?
    WHERE id = ? AND year_id = ?
  `);
  stmt.run(
    scheduleData.day,
    scheduleData.startTime,
    scheduleData.endTime,
    scheduleData.subject,
    scheduleData.teacherId,
    scheduleData.classId,
    scheduleData.color,
    scheduleData.id,
    y
  );
}

export function deleteSchedule(scheduleId: string, yearId?: string) {
  const y = yearId || getActiveYearId();
  const stmt = db.prepare('DELETE FROM schedules WHERE id = ? AND year_id = ?');
  stmt.run(scheduleId, y);
}

// Initialize schedules table
db.exec(`
  CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    year_id TEXT NOT NULL,
    day TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    subject TEXT NOT NULL,
    teacherId TEXT NOT NULL,
    classId TEXT NOT NULL,
    color TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (year_id) REFERENCES academic_years(id),
    FOREIGN KEY (teacherId) REFERENCES teachers(id)
  );
`);