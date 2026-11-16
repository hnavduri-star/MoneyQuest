import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// Built-in SQLite (Node 22.13+): no native add-on to compile. Loaded this way so test bundlers leave it alone.
const { DatabaseSync } = process.getBuiltinModule('node:sqlite');

/** Open (and migrate) the SQLite database. Use ':memory:' for tests. */
export function openDb(file) {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS families (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      pin_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS devices (
      token_hash TEXT PRIMARY KEY,
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      last_seen INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      nickname TEXT NOT NULL,
      age_tier TEXT NOT NULL,
      meta TEXT NOT NULL,
      state TEXT NOT NULL,
      summary TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS profiles_family ON profiles(family_id);
  `);
  return db;
}
