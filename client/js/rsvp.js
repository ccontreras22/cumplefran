/* ── Lógica del formulario RSVP ── */
(function () {
  const form      = document.getElementById('rsvpForm');
  const success   = document.getElementById('rsvpSuccess');
  const submitBtn = document.getElementById('submitBtn');

  if (!form) return;

  function showError(el, msg) {
    el.textContent = msg;
    el.previousElementSibling?.classList.add('error'); // input
  }

  function clearError(el) {
    el.textContent = '';
    el.previousElementSibling?.classList.remove('error');
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.classList.toggle('loading', loading);
  }

  function validate() {
    let valid = true;

    const nombreInput = document.getElementById('nombre');
    const nombreError = document.getElementById('nombreError');
    const nombre = nombreInput.value.trim();

    clearError(nombreError);
    if (nombre.length < 2) {
      showError(nombreError, 'Por favor ingresa tu nombre completo.');
      nombreInput.classList.add('error');
      valid = false;
    } else {
      nombreInput.classList.remove('error');
    }

    const estadoError  = document.getElementById('estadoError');
    const estadoChecked = form.querySelector('input[name="estado"]:checked');
    clearError(estadoError);
    if (!estadoChecked) {
      estadoError.textContent = 'Por favor selecciona una opción.';
      valid = false;
    }

    return valid;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const data = {
      nombre:      document.getElementById('nombre').value.trim(),
      estado:      form.querySelector('input[name="estado"]:checked').value,
      observacion: document.getElementById('observacion').value.trim(),
      honeypot:    document.getElementById('honeypot').value, // debe estar vacío
    };

    try {
      const res = await fetch('/api/rsvp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Error al enviar.');
      }

      // Mostrar éxito con animación
      form.style.transition = 'opacity 0.4s ease';
      form.style.opacity    = '0';
      setTimeout(() => {
        form.hidden    = true;
        success.hidden = false;
      }, 400);

    } catch (err) {
      const nombreError = document.getElementById('nombreError');
      nombreError.textContent = err.message || 'Algo salió mal. Intenta de nuevo.';
      setLoading(false);
    }
  });

  // Limpiar errores al escribir
  document.getElementById('nombre').addEventListener('input', () => {
    document.getElementById('nombre').classList.remove('error');
    document.getElementById('nombreError').textContent = '';
  });

  form.querySelectorAll('input[name="estado"]').forEach(r => {
    r.addEventListener('change', () => {
      document.getElementById('estadoError').textContent = '';
    });
  });
})();
