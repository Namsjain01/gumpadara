/* ============================================================
   GUMPADARA — script.js
   ============================================================ */

(function () {
  'use strict';

  /* ——— Scroll Reveal ——— */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
  );
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach((el) => {
    revealObserver.observe(el);
  });

  /* ——— Nav ——— */
  const nav = document.getElementById('main-nav');
  function updateNav() {
    nav.classList.toggle('scrolled', window.scrollY > window.innerHeight * 0.6);
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* ——— Smooth scroll ——— */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - nav.offsetHeight - 8;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ——— Mobile Menu ——— */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(open));
    mobileMenu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  document.querySelectorAll('.mobile-nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  /* ——— Infrastructure Progress Bars ——— */
  const infraObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const fill = entry.target.querySelector('.infra-progress-fill');
          if (fill) {
            const s = entry.target.dataset.status;
            fill.style.width = s === 'in-progress' ? '45%' : s === 'ready' ? '100%' : '12%';
          }
          infraObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );
  document.querySelectorAll('.infra-card').forEach((c) => infraObserver.observe(c));

  /* ——— Network Diagram — add is-visible when section scrolls in ——— */
  const networkSvg = document.getElementById('network-diagram');
  if (networkSvg) {
    const showNetwork = () => networkSvg.classList.add('is-visible');
    const netObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { showNetwork(); netObserver.disconnect(); }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px 0px 0px' }
    );
    netObserver.observe(networkSvg);
  }

  /* ——— Map Lightbox ——— */
  const mapCard = document.querySelector('.asset-card--map');
  if (mapCard) {
    /* Cursor hint */
    mapCard.style.cursor = 'zoom-in';

    /* Create modal */
    const modal = document.createElement('div');
    modal.id = 'map-modal';
    modal.innerHTML = `
      <div class="map-modal-backdrop"></div>
      <div class="map-modal-inner">
        <button class="map-modal-close" aria-label="Close map">✕</button>
        <div class="map-zoom-bar">
          <button class="map-zoom-btn" id="zoom-in"  aria-label="Zoom in">＋</button>
          <button class="map-zoom-btn" id="zoom-out" aria-label="Zoom out">−</button>
          <button class="map-zoom-btn" id="zoom-reset" aria-label="Reset zoom">⤢</button>
        </div>
        <div class="map-viewport" id="map-viewport">
          <img src="media/images/map.jpg" id="map-img" alt="Gumpadara — village map showing all six homestays" draggable="false"/>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    /* State */
    let scale = 1, originX = 0, originY = 0;
    let dragging = false, lastX = 0, lastY = 0;
    const STEP = 0.4, MAX = 4, MIN = 0.8;

    const img      = modal.querySelector('#map-img');
    const viewport = modal.querySelector('#map-viewport');

    function applyTransform() {
      img.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
    }

    function clampOrigin() {
      /* loose clamping — allows panning but not flying off screen */
      const vw = viewport.offsetWidth;
      const vh = viewport.offsetHeight;
      const max = Math.max(0, (scale - 1) * vw * 0.6);
      originX = Math.max(-max, Math.min(max, originX));
      originY = Math.max(-max, Math.min(max, originY));
    }

    /* Open */
    mapCard.addEventListener('click', () => {
      scale = 1; originX = 0; originY = 0;
      applyTransform();
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    });

    /* Close */
    modal.querySelector('.map-modal-close').addEventListener('click', closeModal);
    modal.querySelector('.map-modal-backdrop').addEventListener('click', closeModal);

    function closeModal() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }

    /* Escape key */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });

    /* Zoom buttons */
    modal.querySelector('#zoom-in').addEventListener('click', () => {
      scale = Math.min(MAX, scale + STEP);
      applyTransform();
    });
    modal.querySelector('#zoom-out').addEventListener('click', () => {
      scale = Math.max(MIN, scale - STEP);
      clampOrigin(); applyTransform();
    });
    modal.querySelector('#zoom-reset').addEventListener('click', () => {
      scale = 1; originX = 0; originY = 0;
      applyTransform();
    });

    /* Mouse wheel zoom */
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? STEP * 0.6 : -STEP * 0.6;
      scale = Math.min(MAX, Math.max(MIN, scale + delta));
      clampOrigin(); applyTransform();
    }, { passive: false });

    /* Drag to pan */
    viewport.addEventListener('mousedown', (e) => {
      if (scale <= 1) return;
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      viewport.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      originX += e.clientX - lastX;
      originY += e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      clampOrigin(); applyTransform();
    });
    window.addEventListener('mouseup', () => {
      dragging = false;
      viewport.style.cursor = scale > 1 ? 'grab' : 'default';
    });

    /* Touch pinch-zoom */
    let lastDist = 0;
    viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        lastDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });
    viewport.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const ratio = dist / lastDist;
        scale = Math.min(MAX, Math.max(MIN, scale * ratio));
        lastDist = dist;
        clampOrigin(); applyTransform();
      }
    }, { passive: false });
  }

  /* ——— Seasons strip scroll ——— */
  const seasonsStrip = document.querySelector('.seasons-strip');
  if (seasonsStrip) {
    seasonsStrip.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY) && e.deltaY !== 0) {
        e.preventDefault();
        seasonsStrip.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }

  /* ——— Experiences rail ——— */
  const expRail = document.querySelector('.experiences-rail');
  if (expRail) {
    expRail.addEventListener('wheel', (e) => {
      const atLeft  = expRail.scrollLeft === 0;
      const atRight = expRail.scrollLeft + expRail.offsetWidth >= expRail.scrollWidth - 2;
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        if ((e.deltaY < 0 && atLeft) || (e.deltaY > 0 && atRight)) return;
        e.preventDefault();
        expRail.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }

  /* ——— Parallax on hero ——— */
  const heroMedia = document.querySelector('.hero-media');
  if (heroMedia) {
    window.addEventListener('scroll', () => {
      if (window.scrollY < window.innerHeight)
        heroMedia.style.transform = `translateY(${window.scrollY * 0.3}px)`;
    }, { passive: true });
  }

  /* ——— Touch support for asset card overlays ——— */
  document.querySelectorAll('.asset-card').forEach((card) => {
    card.addEventListener('touchstart', () => {
      document.querySelectorAll('.asset-card').forEach((c) => c.classList.remove('touched'));
      card.classList.add('touched');
    }, { passive: true });
  });

})();
