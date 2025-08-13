// SQLite storage helpers for payments configuration
// Keeps a single source of truth for classes, frais annexes and services

import { getActiveYearId } from "./years";
import { db } from './database';

export type Classe = { id: string; nom: string };
export type FraisAnnexe = { id: string; nom: string; montant: number };
export type Service = { id: string; nom: string; montant: number };
export type FeesMap = Record<string, { inscription: number; mensualite: number }>;

export function getClasses(): Classe[] {
  const stmt = db.prepare('SELECT DISTINCT id, nom FROM classes ORDER BY nom');
  return stmt.all() as Classe[];
}

export function setClasses(list: { id: string; nom: string }[]) {
  // This would be managed through ClassManagement - keeping for compatibility
}

export function getStudentFeesMap(): FeesMap {
  const yearId = getActiveYearId();
  const stmt = db.prepare('SELECT class_id, inscription, mensualite FROM fees_per_class WHERE year_id = ?');
  const rows = stmt.all(yearId) as { class_id: string; inscription: number; mensualite: number }[];
  
  const map: FeesMap = {};
  for (const row of rows) {
    map[row.class_id] = { inscription: row.inscription, mensualite: row.mensualite };
  }
  return map;
}

export function getFeesAnnexes(): FraisAnnexe[] {
  const yearId = getActiveYearId();
  const stmt = db.prepare('SELECT id, nom, montant FROM extra_fees WHERE year_id = ?');
  return stmt.all(yearId) as FraisAnnexe[];
}

export function setFeesAnnexes(list: FraisAnnexe[]) {
  const yearId = getActiveYearId();
  const deleteStmt = db.prepare('DELETE FROM extra_fees WHERE year_id = ?');
  const insertStmt = db.prepare('INSERT INTO extra_fees (id, year_id, nom, montant) VALUES (?, ?, ?, ?)');
  
  const transaction = db.transaction(() => {
    deleteStmt.run(yearId);
    for (const fee of list) {
      insertStmt.run(fee.id, yearId, fee.nom, fee.montant);
    }
  });
  
  transaction();
}

export function getServices(): Service[] {
  const yearId = getActiveYearId();
  const stmt = db.prepare('SELECT id, nom, montant FROM services WHERE year_id = ?');
  return stmt.all(yearId) as Service[];
}

export function setServices(list: Service[]) {
  const yearId = getActiveYearId();
  const deleteStmt = db.prepare('DELETE FROM services WHERE year_id = ?');
  const insertStmt = db.prepare('INSERT INTO services (id, year_id, nom, montant) VALUES (?, ?, ?, ?)');
  
  const transaction = db.transaction(() => {
    deleteStmt.run(yearId);
    for (const service of list) {
      insertStmt.run(service.id, yearId, service.nom, service.montant);
    }
  });
  
  transaction();
}

// Copy configuration from one academic year to another (fees map, extra fees, services)
export function copyYearConfig(fromYearId: string, toYearId: string) {
  // fees per class
  const stmt1 = db.prepare('INSERT INTO fees_per_class (year_id, class_id, inscription, mensualite) SELECT ?, class_id, inscription, mensualite FROM fees_per_class WHERE year_id = ?');
  const stmt2 = db.prepare('INSERT INTO extra_fees (id, year_id, nom, montant) SELECT id, ?, nom, montant FROM extra_fees WHERE year_id = ?');
  const stmt3 = db.prepare('INSERT INTO services (id, year_id, nom, montant) SELECT id, ?, nom, montant FROM services WHERE year_id = ?');
  
  const transaction = db.transaction(() => {
    stmt1.run(toYearId, fromYearId);
    stmt2.run(toYearId, fromYearId);
    stmt3.run(toYearId, fromYearId);
  });
  
  transaction();
}

// Payments transactions
export type StudentPayment = {
  id: string;
  studentId: string;
  type: "inscription" | "mensualite" | "frais" | "service";
  classeId?: string;
  mois?: string; // MM
  itemId?: string; // frais/service id
  method?: string;
  amount: number;
  date: string; // ISO
};

export function getStudentPayments(): StudentPayment[] {
  const yearId = getActiveYearId();
  const stmt = db.prepare('SELECT * FROM payments WHERE year_id = ? ORDER BY date DESC');
  const rows = stmt.all(yearId) as any[];
  return rows.map(row => ({
    id: row.id,
    studentId: row.student_id,
    type: row.type,
    classeId: row.class_id,
    mois: row.month,
    itemId: row.item_id,
    method: row.method,
    amount: row.amount,
    date: row.date
  }));
}

export function addStudentPayment(tx: Omit<StudentPayment, "id" | "date"> & { id?: string; date?: string }) {
  const yearId = getActiveYearId();
  const id = tx.id || (typeof crypto !== "undefined" && (crypto as any).randomUUID ? (crypto as any).randomUUID() : String(Date.now()));
  const date = tx.date || new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO payments (id, year_id, student_id, type, class_id, month, item_id, method, amount, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, yearId, tx.studentId, tx.type, tx.classeId, tx.mois, tx.itemId, tx.method, tx.amount, date);
  
  const next: StudentPayment = {
    id,
    date,
    ...tx,
  } as StudentPayment;
  
  return next;
}

export function sumPaidFor(filter: { studentId: string; type: "inscription" | "mensualite" | "frais" | "service"; classeId?: string; mois?: string; itemId?: string }) {
  const yearId = getActiveYearId();
  let query = 'SELECT * FROM payments WHERE year_id = ? AND student_id = ? AND type = ?';
  const params: any[] = [yearId, filter.studentId, filter.type];
  
  if (filter.classeId) {
    query += ' AND class_id = ?';
    params.push(filter.classeId);
  }
  if (filter.mois) {
    query += ' AND month = ?';
    params.push(filter.mois);
  }
  if (filter.itemId) {
    query += ' AND item_id = ?';
    params.push(filter.itemId);
  }
  
  query += ' ORDER BY date';
  
  const stmt = db.prepare(query);
  const list = stmt.all(...params) as any[];
  
  const total = list.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const lastRow = list[list.length - 1];
  const last = lastRow ? {
    id: lastRow.id,
    studentId: lastRow.student_id,
    type: lastRow.type,
    classeId: lastRow.class_id,
    mois: lastRow.month,
    itemId: lastRow.item_id,
    method: lastRow.method,
    amount: lastRow.amount,
    date: lastRow.date
  } as StudentPayment : undefined;
  
  return { total, last };
}
