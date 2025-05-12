import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('nycsubwaychallenge.db');

function init() {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS visited_stops (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT,
        time TEXT,
        pending INTEGER
      );`
    );
  });
}

init();

export function addVisitedStop(stop: { id: string, name: string, time: string }) {
  return new Promise<void>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO visited_stops (id, name, time, pending) VALUES (?, ?, ?, 1);',
        [stop.id, stop.name, stop.time],
        () => resolve(),
        (_, error) => { reject(error); return false; }
      );
    });
  });
}

export function getVisitedStops() {
  return new Promise<any[]>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM visited_stops ORDER BY time DESC;',
        [],
        (_, { rows }) => {
          resolve(rows._array.map(row => ({ ...row, pending: !!row.pending })));
        },
        (_, error) => { reject(error); return false; }
      );
    });
  });
}

export function markStopAsSynced(id: string) {
  return new Promise<void>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'UPDATE visited_stops SET pending = 0 WHERE id = ?;',
        [id],
        () => resolve(),
        (_, error) => { reject(error); return false; }
      );
    });
  });
}

// Placeholder for backend sync
export async function syncPendingStops() {
  const stops = await new Promise<any[]>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM visited_stops WHERE pending = 1;',
        [],
        (_, { rows }) => resolve(rows._array),
        (_, error) => { reject(error); return false; }
      );
    });
  });
  // TODO: Replace with real API call
  for (const stop of stops) {
    // Simulate successful sync
    await markStopAsSynced(stop.id);
  }
} 