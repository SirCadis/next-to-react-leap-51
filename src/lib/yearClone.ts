// Yearly data cloning utility for SQLite
// Clones configuration data from one academic year to another.
// After cloning, it purges per-year rosters (enrollments and teacher assignments)
// in the target year to start with empty students/teachers for that year.

import { db } from "./database";
import { copyYearConfig } from "./paymentsLocal";

export function cloneYearData(fromYearId: string, toYearId: string) {
  if (!fromYearId || !toYearId || fromYearId === toYearId) return;
  
  try {
    // Clone configuration data (fees, extra fees, services)
    copyYearConfig(fromYearId, toYearId);
    
    // Clone attendance settings
    const stmt1 = db.prepare('INSERT OR REPLACE INTO attendance_settings (year_id, lockFutureDays, specials) SELECT ?, lockFutureDays, specials FROM attendance_settings WHERE year_id = ?');
    stmt1.run(toYearId, fromYearId);
    
    // Clone fees per class
    const stmt2 = db.prepare('INSERT OR REPLACE INTO fees_per_class (year_id, class_id, inscription, mensualite) SELECT ?, class_id, inscription, mensualite FROM fees_per_class WHERE year_id = ?');
    stmt2.run(toYearId, fromYearId);
    
    // Purge per-year rosters for the new year (start with empty rosters)
    const deleteEnrollments = db.prepare('DELETE FROM enrollments WHERE year_id = ?');
    const deleteAssignments = db.prepare('DELETE FROM teacher_assignments WHERE year_id = ?');
    const deleteActivations = db.prepare('DELETE FROM student_fee_activations WHERE year_id = ?');
    const deleteServiceActivations = db.prepare('DELETE FROM student_service_activations WHERE year_id = ?');
    const deletePayments = db.prepare('DELETE FROM payments WHERE year_id = ?');
    
    const transaction = db.transaction(() => {
      deleteEnrollments.run(toYearId);
      deleteAssignments.run(toYearId);
      deleteActivations.run(toYearId);
      deleteServiceActivations.run(toYearId);
      deletePayments.run(toYearId);
    });
    
    transaction();
  } catch (error) {
    console.error('Error cloning year data:', error);
  }
}
