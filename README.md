# 🎉 RSVP — Cumpleaños 40 de Francisco Manotas

Landing page estática con backend Node.js para confirmar asistencia y panel privado de administración.

---

## Estructura del proyecto

```
birthday-rsvp/
├── client/
│   ├── assets/          ← Aquí van tus fotos (photo1.jpg … photo4.jpg)
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── carousel.js
│   │   ├── rsvp.js
│   │   └── admin.js
│   └── index.html
├── server/
│   ├── index.js         ← Servidor Express
│   └── db.js            ← Configuración SQLite
├── data/                ← Se crea automáticamente (aquí queda rsvps.db)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 1. Instalación

```bash
# Clonar o descomprimir el proyecto, luego:
cd birthday-rsvp
npm install
```

---

## 2. Variables de entorno

Copia el archivo `.env.example` como `.env` y edítalo:

```bash
cp .env.example .env
```

Contenido de `.env`:

```env
ADMIN_PASSWORD=tu_contraseña_segura_aqui
PORT=3000
NODE_ENV=development
```

> ⚠️ Nunca subas el archivo `.env` al repositorio.

---

## 3. Fotos del carrusel

Coloca tus fotos en `/client/assets/` con estos nombres exactos:

```
client/assets/photo1.jpg
client/assets/photo2.jpg
client/assets/photo3.jpg
client/assets/photo4.jpg
```

Formatos admitidos: `.jpg`, `.jpeg`, `.png`, `.webp`  
Tamaño recomendado: ancho ≥ 1400px, relación 16:9

Si quieres cambiar los nombres, edita los `src` en `client/index.html` (sección `.carousel__slide`).

---

## 4. Correr en local

```bash
npm run dev
```

Abre en el navegador: **http://localhost:3000**

---

## 5. Acceso al panel de administración

- Baja al final del todo en la landing.
- Hay un campo pequeño con la etiqueta **"Acceso"**.
- Ingresa la contraseña que configuraste en `ADMIN_PASSWORD`.
- Se abrirá el panel con la tabla de confirmaciones y el botón para exportar a Excel.

---

## 6. Endpoints disponibles

| Método | Ruta                  | Descripción                          | Protección          |
|--------|-----------------------|--------------------------------------|---------------------|
| POST   | `/api/rsvp`           | Guardar confirmación                 | Rate limit + honeypot |
| POST   | `/api/admin/login`    | Validar contraseña → devuelve token  | Rate limit          |
| GET    | `/api/admin/rsvps`    | Listado de confirmaciones            | Token de sesión     |
| GET    | `/api/admin/export`   | Descargar Excel `.xlsx`              | Token de sesión     |

---

## 7. Despliegue en Render (recomendado para SQLite)

SQLite requiere un sistema de archivos persistente. **Render** con disco persistente es la opción ideal.

### Pasos en Render:

1. Crea una cuenta en [render.com](https://render.com)
2. **New → Web Service** → conecta tu repo de GitHub
3. Configuración:
   - **Build Command:** `npm install`
   - **Start Command:** `node server/index.js`
   - **Environment:** Node
4. En **Environment Variables**, agrega:
   - `ADMIN_PASSWORD` = tu contraseña
   - `NODE_ENV` = production
   - `PORT` = 10000 (Render lo asigna automáticamente)
5. En **Disks** (plan Starter o superior):
   - Mount Path: `/var/data`
   - Luego edita `server/db.js` para que `dbPath` apunte a `/var/data/rsvps.db`

### Alternativa sin disco persistente (Railway):

Railway ofrece SQLite con volúmenes en planes gratuitos. El proceso es similar.

---

## 8. Despliegue en Vercel (con JSON en vez de SQLite)

Si prefieres Vercel, cambia la persistencia a un archivo JSON en `/tmp` (efímero entre deploys) o usa una base de datos externa como **PlanetScale**, **Supabase**, o **Turso** (SQLite en la nube).

Para Vercel serverless, reorganiza `server/index.js` en `api/` con funciones individuales (`api/rsvp.js`, `api/admin/login.js`, etc.).

---

## 9. Seguridad implementada

- ✅ Rate limiting en RSVP (5 req / 15 min por IP)
- ✅ Rate limiting en login (10 req / hora por IP)
- ✅ Honeypot anti-bot en el formulario
- ✅ Token de sesión UUID para endpoints admin
- ✅ Token expira automáticamente en 2 horas
- ✅ Contraseña solo en variable de entorno (nunca en código)
- ✅ Validaciones en servidor (no solo en cliente)
- ✅ `noindex, nofollow` en el HTML para evitar indexación
- ✅ SQLite con WAL para mayor robustez

---

## 10. Personalización rápida

| Qué cambiar              | Dónde                          |
|--------------------------|--------------------------------|
| Fecha / hora / lugar     | `client/index.html`            |
| Nombre del festejado     | `client/index.html`            |
| Colores y tipografía     | `client/css/style.css` (variables en `:root`) |
| Número de fotos          | `client/index.html` (sección `.carousel`) + `client/js/carousel.js` (dots) |
| Tiempo del autoplay      | `client/js/carousel.js` → `setInterval(..., 4500)` |
| Nombre del archivo Excel | `server/index.js` → `Content-Disposition` |

---

## Soporte

Proyecto generado con ♥ para el cumpleaños 40 de Francisco Manotas.
