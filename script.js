(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const works = {
    inner: {
      file: 'Inner_Map.png', title: 'Inner Map', type: 'PAINT / CANVAS', img: 'assets/Inner_Map.png',
      desc: 'Farby na płótnie. Czarno-biała postać z układem linii, który przypomina mapę albo schemat.'
    },
    ink: {
      file: 'Ink_Figure.png', title: 'Ink Figure', type: 'PAINT / CANVAS', img: 'assets/Ink_Figure.png',
      desc: 'Farby na płótnie. Druga praca z podobnym podejściem: gruby kontur, uproszczona postać i mocny gest.'
    },
    flowers: {
      file: 'Flowers.jpg', title: 'Flowers', type: 'PAINT / CANVAS', img: 'assets/Flowers.jpg',
      desc: 'Farby na płótnie. Mały obraz z kwiatami, spokojniejszy niż reszta prac.'
    },
    mannequin: {
      file: 'Mannequin_Study.pdf', title: 'Mannequin Study', type: 'PENCIL / STILL LIFE', img: 'assets/Mannequin_Study.jpg',
      desc: 'Ołówek. Rysunek z martwej natury: dwa manekiny, proporcje i światło.'
    },
    taste: {
      file: 'Taste_The_Call.psd', title: 'Taste The Call', type: 'POSTER / PHOTOSHOP', img: 'assets/Taste_The_Call.jpg',
      desc: 'Photoshop. Szkolny projekt plakatu. Miał wyglądać jak reklama z magazynu, tylko trochę bardziej absurdalna i przesadzona.'
    },
    marty: {
      file: 'Marty_Supreme.psd', title: 'Marty Supreme', type: 'POSTER / PHOTOSHOP', img: 'assets/Marty_Supreme.jpg',
      desc: 'Photoshop. Szkolny projekt plakatu filmowego. Tytuł, kadr, tagline i kredyty miały działać jak gotowy materiał promocyjny do fikcyjnego filmu.'
    }
  };

  const order = ['inner', 'ink', 'flowers', 'mannequin', 'taste', 'marty'];
  let activeIndex = 0;

  function updateClock() {
    const el = $('#clock');
    if (!el) return;
    el.textContent = new Date().toLocaleTimeString('pl-PL', { hour12: false });
  }

  function updateProgress() {
    const progress = $('#scrollProgress');
    if (!progress) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = max > 0 ? `${(window.scrollY / max) * 100}%` : '0%';
  }

  function openPanel(panel) {
    if (!panel) return;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
  }

  function closePanel(panel) {
    if (!panel) return;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  }

  const contact = $('#contactPanel');
  const notice = $('#archiveNotice');
  const modal = $('#modal');
  const modalImg = $('#modalImg');
  const modalFile = $('#modalFile');
  const modalTitle = $('#modalTitle');
  const modalType = $('#modalType');
  const modalDesc = $('#modalDesc');

  function openModal(key) {
    if (!modal || !works[key]) return;
    activeIndex = Math.max(0, order.indexOf(key));
    const w = works[key];
    if (modalImg) { modalImg.src = w.img; modalImg.alt = w.title; }
    if (modalFile) modalFile.textContent = w.file;
    if (modalTitle) modalTitle.textContent = w.title;
    if (modalType) modalType.textContent = w.type;
    if (modalDesc) modalDesc.textContent = w.desc;
    openPanel(modal);
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal) return;
    closePanel(modal);
    document.body.style.overflow = '';
  }

  function openByIndex(index) {
    const nextIndex = (index + order.length) % order.length;
    openModal(order[nextIndex]);
  }

  // Clock + scroll progress
  updateClock();
  window.setInterval(updateClock, 1000);
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);

  // Smooth scroll buttons
  $$('[data-scroll]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = $(btn.dataset.scroll);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Contact panel
  $('#openContact')?.addEventListener('click', () => openPanel(contact));
  $('#closeContact')?.addEventListener('click', (e) => {
    e.stopPropagation();
    closePanel(contact);
  });

  // Archive notice panel: appears after 1s and can be closed
  if (notice) {
    window.setTimeout(() => openPanel(notice), 1000);
  }
  $('#closeNotice')?.addEventListener('click', (e) => {
    e.stopPropagation();
    closePanel(notice);
  });

  // Work modals
  $$('.modal-item').forEach((item) => {
    item.addEventListener('click', () => openModal(item.dataset.key));
  });
  $('#modalClose')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  $('#nextWork')?.addEventListener('click', () => openByIndex(activeIndex + 1));
  $('#prevWork')?.addEventListener('click', () => openByIndex(activeIndex - 1));

  // Video controls
  const video = $('#portfolioVideo');
  const play = $('#playPause');
  const mute = $('#muteToggle');
  if (video && play) {
    play.addEventListener('click', async () => {
      if (video.paused) {
        try {
          await video.play();
          play.textContent = 'PAUSE';
        } catch (err) {
          console.warn('[portfolio] video play blocked:', err);
        }
      } else {
        video.pause();
        play.textContent = 'PLAY';
      }
    });
    video.addEventListener('click', () => play.click());
    video.addEventListener('ended', () => { play.textContent = 'PLAY'; });
  }
  if (video && mute) {
    mute.addEventListener('click', () => {
      video.muted = !video.muted;
      mute.textContent = video.muted ? 'UNMUTE' : 'MUTE';
    });
  }

  // Sketchbook drag / inspect. No modal attached to sketchbook.
  const sketch = $('#sketchCard');
  let dragging = false;
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let dx = 0;
  let dy = 0;
  let raf = null;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function setSketch(x = dx, y = dy, clientX = null, clientY = null) {
    if (!sketch) return;
    const rect = sketch.getBoundingClientRect();
    const px = clientX == null ? 0 : ((clientX - rect.left) / rect.width - 0.5);
    const py = clientY == null ? 0 : ((clientY - rect.top) / rect.height - 0.5);
    const rotY = clamp((px * 10) + (x / 45), -10, 10);
    const rotX = clamp((-py * 8) + (-y / 55), -8, 8);
    const rotZ = clamp(x / 130, -3.5, 3.5);
    sketch.style.transform = `translate3d(${x}px, ${y}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`;
  }

  function scheduleSketch(clientX, clientY) {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      setSketch(dx, dy, clientX, clientY);
      raf = null;
    });
  }

  if (sketch) {
    sketch.addEventListener('pointerdown', (e) => {
      if (e.button != null && e.button !== 0) return;
      dragging = true;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      dx = 0;
      dy = 0;
      sketch.classList.add('is-dragging');
      sketch.setPointerCapture?.(e.pointerId);
      setSketch(0, 0, e.clientX, e.clientY);
      e.preventDefault();
    });

    sketch.addEventListener('pointermove', (e) => {
      if (!dragging || e.pointerId !== pointerId) return;
      dx = clamp(e.clientX - startX, -110, 110);
      dy = clamp(e.clientY - startY, -78, 78);
      scheduleSketch(e.clientX, e.clientY);
    });

    const releaseSketch = (e) => {
      if (!dragging || (e && e.pointerId !== pointerId)) return;
      dragging = false;
      pointerId = null;
      sketch.classList.remove('is-dragging');
      dx = 0;
      dy = 0;
      requestAnimationFrame(() => setSketch(0, 0));
    };

    sketch.addEventListener('pointerup', releaseSketch);
    sketch.addEventListener('pointercancel', releaseSketch);
    sketch.addEventListener('lostpointercapture', releaseSketch);
  }

  // Keyboard + reset
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeModal();
    closePanel(contact);
    closePanel(notice);
  });

  $('#resetView')?.addEventListener('click', () => {
    closeModal();
    closePanel(contact);
    closePanel(notice);
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    if (play) play.textContent = 'PLAY';
    dx = 0;
    dy = 0;
    setSketch(0, 0);
    $('#top')?.scrollIntoView({ behavior: 'smooth' });
  });

  console.log('[portfolio] script loaded OK');
})();
