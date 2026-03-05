const Database = require('better-sqlite3');
const path = require('path');

// La base de datos se guarda en la raíz del proyecto
const dbPath = path.join(__dirname, '../data/rsvps.db');

// Crear directorio si no existe
const fs = require('fs');
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const db = new Database(dbPath);

// Habilitar WAL para mejor concurrencia
db.pragma('journal_mode = WAL');

// Crear tabla si no existe
db.exec(`
  CREATE TABLE IF NOT EXISTS rsvps (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre     TEXT    NOT NULL,
    estado     TEXT    NOT NULL CHECK(estado IN ('confirmo', 'no_puedo')),
    observacion TEXT   DEFAULT '',
    created_at TEXT    DEFAULT (datetime('now', 'localtime'))
  )
`);

module.exports = db;
