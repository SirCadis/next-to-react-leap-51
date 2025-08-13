// Gestion des années scolaires (SQLite)
// Année active globale + liste des années

import { db } from './database';

export type AcademicYear = {
  id: string; // ex: 2024-2025
  nom: string; // ex: Année scolaire 2024-2025
  debut: string; // ISO date YYYY-MM-DD
  fin: string; // ISO date YYYY-MM-DD
  closed?: boolean;
};

let activeYearId: string | null = null;

export function listYears(): AcademicYear[] {
  const stmt = db.prepare('SELECT * FROM academic_years ORDER BY debut');
  return stmt.all() as AcademicYear[];
}

export function saveYears(list: AcademicYear[]) {
  const deleteStmt = db.prepare('DELETE FROM academic_years');
  const insertStmt = db.prepare('INSERT INTO academic_years (id, nom, debut, fin, closed) VALUES (?, ?, ?, ?, ?)');
  
  const transaction = db.transaction(() => {
    deleteStmt.run();
    for (const year of list) {
      insertStmt.run(year.id, year.nom, year.debut, year.fin, year.closed || false);
    }
  });
  
  transaction();
}

export function getActiveYearId(): string {
  if (!activeYearId) {
    const y = ensureDefaultYear();
    activeYearId = y.id;
  }
  return activeYearId;
}

export function setActiveYear(id: string) {
  activeYearId = id;
  // Notify listeners if needed
  if (typeof window !== 'undefined') {
    try {
      setTimeout(() => {
        try {
          window.dispatchEvent(new StorageEvent("storage", { key: 'activeYearId', newValue: id } as any));
        } catch {}
      }, 0);
    } catch {}
  }
}

export function getActiveYear(): AcademicYear | undefined {
  const id = getActiveYearId();
  return listYears().find((y) => y.id === id);
}

export function addYear(input?: Partial<AcademicYear>): AcademicYear {
  const years = listYears();
  const base = createDefaultYear();
  const next: AcademicYear = {
    id: input?.id || base.id,
    nom: input?.nom || base.nom,
    debut: input?.debut || base.debut,
    fin: input?.fin || base.fin,
    closed: input?.closed || false,
  };
  
  const exists = years.find((y) => y.id === next.id);
  if (!exists) {
    const stmt = db.prepare('INSERT INTO academic_years (id, nom, debut, fin, closed) VALUES (?, ?, ?, ?, ?)');
    stmt.run(next.id, next.nom, next.debut, next.fin, next.closed || false);
  }
  
  if (!activeYearId) setActiveYear(next.id);
  return next;
}

function createDefaultYear(): AcademicYear {
  const today = new Date();
  const month = today.getMonth() + 1; // 1..12
  const year = today.getFullYear();
  // Sept -> Août
  const startYear = month >= 9 ? year : year - 1;
  const endYear = startYear + 1;
  return {
    id: `${startYear}-${endYear}`,
    nom: `Année scolaire ${startYear}-${endYear}`,
    debut: `${startYear}-09-01`,
    fin: `${endYear}-08-31`,
  };
}

export function ensureDefaultYear(): AcademicYear {
  const years = listYears();
  if (years.length === 0) {
    const y = createDefaultYear();
    const stmt = db.prepare('INSERT INTO academic_years (id, nom, debut, fin, closed) VALUES (?, ?, ?, ?, ?)');
    stmt.run(y.id, y.nom, y.debut, y.fin, false);
    setActiveYear(y.id);
    return y;
  }
  if (!activeYearId) setActiveYear(years[0].id);
  return years[0];
}

// Utilitaire pour namespacer des clés par année
export function keyForYear(baseKey: string, yearId?: string) {
  const y = yearId || getActiveYearId();
  return `${baseKey}__${y}`;
}
