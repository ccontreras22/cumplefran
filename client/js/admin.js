/* ── Panel de administración ── */
(function () {
  let adminToken   = null;
  let allRsvps     = [];
  let activeFilter = 'todos';

  const loginBtn   = document.getElementById('adminLoginBtn');
  const pwdInput   = document.getElementById('adminPwd');
  const adminError = document.getElementById('adminError');
  const modal      = document.getElementById('adminModal');
  const closeBtn   = document.getElementById('modalClose');
  const tableBody  = document.getElementById('adminTableBody');
  const exportBtn  = document.getElementById('exportBtn');
  const statsEl    = document.getElementById('adminStats');
  const filterBtns = document.querySelectorAll('.filter-btn');

  // ─── Login ──────────────────────────────────────────
  async function doLogin() {
    const pwd = pwdInput.value.trim();
    if (!pwd) return;

    adminError.textContent = '';
    loginBtn.disabled = true;

    try {
      const res = await fetch('/api/admin/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password: pwd }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Contraseña incorrecta.');

      adminToken = json.token;
      pwdInput.value = '';
      openPanel();

    } catch (err) {
      adminError.textContent = err.message;
    } finally {
      loginBtn.disabled = false;
    }
  }

  loginBtn.addEventListener('click', doLogin);
  pwdInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

  // ─── Panel ──────────────────────────────────────────
  function openPanel() {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
    loadRsvps();
  }

  function closePanel() {
    modal.hidden = true;
    document.body.style.overflow = '';
    pwdInput.focus();
  }

  closeBtn.addEventListener('click', closePanel);

  // Cerrar con Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) closePanel();
  });

  // Cerrar al hacer clic fuera del modal
  modal.addEventListener('click', e => {
    if (e.target === modal) closePanel();
  });

  // ─── Carga de datos ─────────────────────────────────
  async function loadRsvps(filtro) {
    tableBody.innerHTML = '<tr><td colspan="5" class="table-loading">Cargando…</td></tr>';

    const params = filtro && filtro !== 'todos' ? `?filtro=${filtro}` : '';

    try {
      const res = await fetch(`/api/admin/rsvps${params}`, {
        headers: { 'x-admin-token': adminToken },
      });

      if (res.status === 401) {
        closePanel();
        adminError.textContent = 'Sesión expirada. Vuelve a iniciar sesión.';
        adminToken = null;
        return;
      }

      allRsvps = await res.json();
      renderTable(allRsvps);
      renderStats(allRsvps);

    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="5" class="table-loading">Error al cargar datos.</td></tr>`;
    }
  }

  // ─── Render tabla ────────────────────────────────────
  function renderTable(rows) {
    if (!rows.length) {
      tableBody.innerHTML = '<tr><td colspan="5" class="table-loading">Sin registros.</td></tr>';
      return;
    }

    tableBody.innerHTML = rows.map((r, i) => `
      <tr>
        <td>${r.id}</td>
        <td>${escHtml(r.nombre)}</td>
        <td>
          <span class="badge badge--${r.estado}">
            ${r.estado === 'confirmo' ? 'Confirma' : 'No puede'}
          </span>
        </td>
        <td>${escHtml(r.observacion || '—')}</td>
        <td>${formatDate(r.created_at)}</td>
      </tr>
    `).join('');
  }

  // ─── Stats ───────────────────────────────────────────
  function renderStats(rows) {
    const total     = rows.length;
    const confirman = rows.filter(r => r.estado === 'confirmo').length;
    const noPueden  = rows.filter(r => r.estado === 'no_puedo').length;

    statsEl.innerHTML = `
      Total: <span>${total}</span>
      &nbsp;·&nbsp; Confirman: <span>${confirman}</span>
      &nbsp;·&nbsp; No pueden: <span>${noPueden}</span>
    `;
  }

  // ─── Filtros ─────────────────────────────────────────
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      loadRsvps(activeFilter);
    });
  });

  // ─── Exportar Excel ─────────────────────────────────
  exportBtn.addEventListener('click', () => {
    // Abrir la URL de descarga con el token en el header no es posible directamente
    // Solución: crear un link temporal con fetch y blob
    exportBtn.textContent = 'Generando…';
    exportBtn.disabled = true;

    fetch('/api/admin/export', {
      headers: { 'x-admin-token': adminToken },
    })
      .then(res => {
        if (!res.ok) throw new Error('No autorizado');
        return res.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = 'rsvp_cumpleanos_francisco.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch(() => {
        alert('Error al exportar. Inicia sesión de nuevo.');
      })
      .finally(() => {
        exportBtn.textContent = 'Descargar Excel ↓';
        exportBtn.disabled    = false;
      });
  });

  // ─── Utilidades ──────────────────────────────────────
  function escHtml(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

  function formatDate(str) {
    if (!str) return '—';
    const d = new Date(str.replace(' ', 'T'));
    if (isNaN(d)) return str;
    return d.toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
})();
