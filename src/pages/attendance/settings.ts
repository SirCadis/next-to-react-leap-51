export type SpecialDayType = 'holiday' | 'celebration';
export interface SpecialDay { id: string; date: string; type: SpecialDayType; appliesToAll: boolean; classIds?: string[] }
export interface AttendanceSettings { lockFutureDays: boolean; specials: SpecialDay[] }

import { db } from '../../lib/database';
import { getActiveYearId } from '../../lib/years';

export function loadSettings(): AttendanceSettings {
  try {
    const yearId = getActiveYearId();
    const stmt = db.prepare('SELECT lockFutureDays, specials FROM attendance_settings WHERE year_id = ?');
    const row = stmt.get(yearId) as { lockFutureDays: number; specials: string } | undefined;
    
    if (row) {
      const specials = JSON.parse(row.specials || '[]');
      return { 
        lockFutureDays: Boolean(row.lockFutureDays), 
        specials: Array.isArray(specials) ? specials : [] 
      };
    }
    return { lockFutureDays: false, specials: [] };
  } catch {
    return { lockFutureDays: false, specials: [] };
  }
}

export function saveSettings(settings: AttendanceSettings) {
  const yearId = getActiveYearId();
  const stmt = db.prepare(`
    INSERT INTO attendance_settings (year_id, lockFutureDays, specials)
    VALUES (?, ?, ?)
    ON CONFLICT(year_id) DO UPDATE SET
      lockFutureDays = excluded.lockFutureDays,
      specials = excluded.specials
  `);
  stmt.run(yearId, settings.lockFutureDays ? 1 : 0, JSON.stringify(settings.specials));
}
