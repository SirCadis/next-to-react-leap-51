// SQLite storage helpers for activations of fees and services per student (namespaced by academic year)
// Default is disabled; we only store active entries

import { getActiveYearId } from "./years";
import { db } from './database';

// Fees activations (per active academic year)
export function getActiveFeeKeys(yearId: string = getActiveYearId()): string[] {
  const stmt = db.prepare('SELECT student_id, extra_fee_id FROM student_fee_activations WHERE year_id = ?');
  const rows = stmt.all(yearId) as { student_id: string; extra_fee_id: string }[];
  return rows.map(r => feeKey(r.student_id, r.extra_fee_id));
}

export function setActiveFeeKeys(keys: string[], yearId: string = getActiveYearId()) {
  const deleteStmt = db.prepare('DELETE FROM student_fee_activations WHERE year_id = ?');
  const insertStmt = db.prepare('INSERT INTO student_fee_activations (student_id, year_id, extra_fee_id) VALUES (?, ?, ?)');
  
  const transaction = db.transaction(() => {
    deleteStmt.run(yearId);
    const uniqueKeys = Array.from(new Set(keys));
    for (const key of uniqueKeys) {
      const [studentId, feeId] = key.split('|');
      if (studentId && feeId) {
        insertStmt.run(studentId, yearId, feeId);
      }
    }
  });
  
  transaction();
}

export function feeKey(studentId: string, feeId: string) {
  return `${studentId}|${feeId}`;
}

export function isFeeActive(studentId: string, feeId: string, yearId: string = getActiveYearId()) {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM student_fee_activations WHERE student_id = ? AND year_id = ? AND extra_fee_id = ?');
  const result = stmt.get(studentId, yearId, feeId) as { count: number };
  return result.count > 0;
}

export function setFeeActive(studentId: string, feeId: string, active: boolean, yearId: string = getActiveYearId()) {
  if (active) {
    const stmt = db.prepare('INSERT OR REPLACE INTO student_fee_activations (student_id, year_id, extra_fee_id) VALUES (?, ?, ?)');
    stmt.run(studentId, yearId, feeId);
  } else {
    const stmt = db.prepare('DELETE FROM student_fee_activations WHERE student_id = ? AND year_id = ? AND extra_fee_id = ?');
    stmt.run(studentId, yearId, feeId);
  }
  return active;
}

export function bulkSetFeeActive(studentIds: string[], feeId: string, active: boolean, yearId: string = getActiveYearId()) {
  if (active) {
    const stmt = db.prepare('INSERT OR REPLACE INTO student_fee_activations (student_id, year_id, extra_fee_id) VALUES (?, ?, ?)');
    const transaction = db.transaction(() => {
      for (const studentId of studentIds) {
        stmt.run(studentId, yearId, feeId);
      }
    });
    transaction();
  } else {
    const stmt = db.prepare('DELETE FROM student_fee_activations WHERE student_id = ? AND year_id = ? AND extra_fee_id = ?');
    const transaction = db.transaction(() => {
      for (const studentId of studentIds) {
        stmt.run(studentId, yearId, feeId);
      }
    });
    transaction();
  }
}

// Services activations (month-specific, per academic year)
export function getActiveServiceKeys(yearId: string = getActiveYearId()): string[] {
  const stmt = db.prepare('SELECT student_id, service_id, month FROM student_service_activations WHERE year_id = ?');
  const rows = stmt.all(yearId) as { student_id: string; service_id: string; month: string }[];
  return rows.map(r => serviceKey(r.student_id, r.service_id, r.month));
}

export function setActiveServiceKeys(keys: string[], yearId: string = getActiveYearId()) {
  const deleteStmt = db.prepare('DELETE FROM student_service_activations WHERE year_id = ?');
  const insertStmt = db.prepare('INSERT INTO student_service_activations (student_id, year_id, service_id, month) VALUES (?, ?, ?, ?)');
  
  const transaction = db.transaction(() => {
    deleteStmt.run(yearId);
    const uniqueKeys = Array.from(new Set(keys));
    for (const key of uniqueKeys) {
      const [studentId, serviceId, month] = key.split('|');
      if (studentId && serviceId && month) {
        insertStmt.run(studentId, yearId, serviceId, month);
      }
    }
  });
  
  transaction();
}

export function serviceKey(studentId: string, serviceId: string, mois: string) {
  return `${studentId}|${serviceId}|${mois}`;
}

export function isServiceActive(studentId: string, serviceId: string, mois: string, yearId: string = getActiveYearId()) {
  if (!mois) return false;
  const stmt = db.prepare('SELECT COUNT(*) as count FROM student_service_activations WHERE student_id = ? AND year_id = ? AND service_id = ? AND month = ?');
  const result = stmt.get(studentId, yearId, serviceId, mois) as { count: number };
  return result.count > 0;
}

export function setServiceActive(studentId: string, serviceId: string, mois: string, active: boolean, yearId: string = getActiveYearId()) {
  if (active) {
    const stmt = db.prepare('INSERT OR REPLACE INTO student_service_activations (student_id, year_id, service_id, month) VALUES (?, ?, ?, ?)');
    stmt.run(studentId, yearId, serviceId, mois);
  } else {
    const stmt = db.prepare('DELETE FROM student_service_activations WHERE student_id = ? AND year_id = ? AND service_id = ? AND month = ?');
    stmt.run(studentId, yearId, serviceId, mois);
  }
  return active;
}

export function bulkSetServiceActive(studentIds: string[], serviceId: string, mois: string, active: boolean, yearId: string = getActiveYearId()) {
  if (active) {
    const stmt = db.prepare('INSERT OR REPLACE INTO student_service_activations (student_id, year_id, service_id, month) VALUES (?, ?, ?, ?)');
    const transaction = db.transaction(() => {
      for (const studentId of studentIds) {
        stmt.run(studentId, yearId, serviceId, mois);
      }
    });
    transaction();
  } else {
    const stmt = db.prepare('DELETE FROM student_service_activations WHERE student_id = ? AND year_id = ? AND service_id = ? AND month = ?');
    const transaction = db.transaction(() => {
      for (const studentId of studentIds) {
        stmt.run(studentId, yearId, serviceId, mois);
      }
    });
    transaction();
  }
}
