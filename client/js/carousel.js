/* ── Carrusel con fade + zoom suave ── */
(function () {
  const track  = document.getElementById('carouselTrack');
  const slides = track ? track.querySelectorAll('.carousel__slide') : [];
  const dots   = document.querySelectorAll('.carousel__dot');
  const prev   = document.getElementById('prevBtn');
  const next   = document.getElementById('nextBtn');

  if (!slides.length) return;

  let current   = 0;
  let autoTimer = null;

  function goTo(index) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    dots[current].setAttribute('aria-selected', 'false');

    current = (index + slides.length) % slides.length;

    slides[current].classList.add('active');
    dots[current].classList.add('active');
    dots[current].setAttribute('aria-selected', 'true');
  }

  function startAuto() {
    autoTimer = setInterval(() => goTo(current + 1), 4500);
  }

  function resetAuto() {
    clearInterval(autoTimer);
    startAuto();
  }

  prev.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
  next.addEventListener('click', () => { goTo(current + 1); resetAuto(); });

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      goTo(parseInt(dot.dataset.index));
      resetAuto();
    });
  });

  // Swipe en móvil
  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) { goTo(dx < 0 ? current + 1 : current - 1); resetAuto(); }
  }, { passive: true });

  // Pausa al hacer hover
  track.addEventListener('mouseenter', () => clearInterval(autoTimer));
  track.addEventListener('mouseleave', startAuto);

  startAuto();
})();
