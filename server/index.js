require('dotenv').config();
const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error('ERROR: ADMIN_PASSWORD no está definido en las variables de entorno.');
  process.exit(1);
}

// Tokens de sesión en memoria (válidos hasta reinicio del servidor)
const activeSessions = new Set();

// ─── Middlewares globales ──────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Rate limit para RSVP: 5 envíos por IP cada 15 minutos
const rsvpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit para login: 10 intentos por IP cada hora
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de acceso. Intenta más tarde.' },
});

// ─── Middleware de autenticación admin ───────────────────────────────────
function requireAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ error: 'No autorizado.' });
  }
  next();
}

// ─── Rutas API ────────────────────────────────────────────────────────────

// POST /api/rsvp — Guardar confirmación
app.post('/api/rsvp', rsvpLimiter, (req, res) => {
  const { nombre, estado, observacion, honeypot } = req.body;

  // Anti-spam: honeypot field debe estar vacío
  if (honeypot) {
    return res.status(200).json({ ok: true }); // Silencioso para bots
  }

  if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
    return res.status(400).json({ error: 'Nombre inválido.' });
  }
  if (!['confirmo', 'no_puedo'].includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido.' });
  }

  const nombreClean = nombre.trim().substring(0, 100);
  const obsClean = (observacion || '').trim().substring(0, 300);

  try {
    db.prepare(
      'INSERT INTO rsvps (nombre, estado, observacion) VALUES (?, ?, ?)'
    ).run(nombreClean, estado, obsClean);

    res.json({ ok: true });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Error guardando. Intenta de nuevo.' });
  }
});

// POST /api/admin/login — Validar contraseña, devolver token
app.post('/api/admin/login', loginLimiter, (req, res) => {
  const { password } = req.body;

  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Contraseña incorrecta.' });
  }

  const token = uuidv4();
  activeSessions.add(token);

  // Token expira en 2 horas
  setTimeout(() => activeSessions.delete(token), 2 * 60 * 60 * 1000);

  res.json({ token });
});

// GET /api/admin/rsvps — Listado protegido
app.get('/api/admin/rsvps', requireAuth, (req, res) => {
  const { filtro } = req.query;
  let query = 'SELECT * FROM rsvps ORDER BY created_at DESC';
  const params = [];

  if (filtro === 'confirmo' || filtro === 'no_puedo') {
    query = 'SELECT * FROM rsvps WHERE estado = ? ORDER BY created_at DESC';
    params.push(filtro);
  }

  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

// GET /api/admin/export — Descarga XLSX protegida
app.get('/api/admin/export', requireAuth, async (req, res) => {
  const ExcelJS = require('exceljs');
  const rows = db.prepare('SELECT * FROM rsvps ORDER BY created_at DESC').all();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Confirmaciones');

  // Cabeceras con estilo
  sheet.columns = [
    { header: 'ID', key: 'id', width: 6 },
    { header: 'Nombre completo', key: 'nombre', width: 30 },
    { header: 'Estado', key: 'estado', width: 18 },
    { header: 'Observación', key: 'observacion', width: 40 },
    { header: 'Fecha de registro', key: 'created_at', width: 22 },
  ];

  // Estilo de cabecera
  sheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  rows.forEach(r => {
    sheet.addRow({
      id: r.id,
      nombre: r.nombre,
      estado: r.estado === 'confirmo' ? 'Confirma asistencia' : 'No puede asistir',
      observacion: r.observacion || '',
      created_at: r.created_at,
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="rsvp_cumpleanos_francisco.xlsx"');

  await workbook.xlsx.write(res);
  res.end();
});

// Fallback: servir index.html para rutas no-API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// ─── Inicio ───────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✓ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`  Admin panel: http://localhost:${PORT} (scroll al final → "Acceso")\n`);
});
