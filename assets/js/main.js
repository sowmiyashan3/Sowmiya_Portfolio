(function () {
  const qs = (sel, el = document) => el.querySelector(sel);
  const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  // Mobile nav toggle
  const navToggle = qs('#navToggle');
  const siteNav = qs('#siteNav');
  if (navToggle && siteNav) {
    navToggle.addEventListener('click', () => {
      const open = siteNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    // Close nav on link click (mobile)
    qsa('a', siteNav).forEach((a) => a.addEventListener('click', () => {
      siteNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }));
  }

  // Theme toggle
  const themeToggle = qs('#themeToggle');
  const setTheme = (theme) => document.documentElement.setAttribute('data-theme', theme);
  try {
    const saved = localStorage.getItem('theme');
    if (saved) setTheme(saved);
  } catch (e) {}

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'light' ? 'dark' : 'light';
      setTheme(next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      themeToggle.textContent = next === 'light' ? '🌙' : '☀️';
    });
  }

  // Smooth scroll for in-page links
  qsa('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId.length <= 1) return;
      const target = qs(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', targetId);
      }
    });
  });

  // Scroll spy (active nav link)
  const sections = qsa('main > section[id]');
  const navLinks = qsa('.site-nav a[href^="#"]');
  const setActive = (id) => {
    navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: [0, 1] });
  sections.forEach((sec) => observer.observe(sec));

  // Footer year
  const yearEl = qs('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Project filters
  const filterChips = qsa('.filters .chip');
  const projectCards = qsa('#projects .card');
  const applyFilter = (key) => {
    projectCards.forEach((card) => {
      const tags = (card.getAttribute('data-tags') || '').split(',');
      const show = key === 'all' || tags.includes(key);
      card.style.display = show ? '' : 'none';
    });
  };
  filterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      filterChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const key = chip.getAttribute('data-filter') || 'all';
      applyFilter(key);
    });
  });

  // Project modal
  const modal = qs('#projectModal');
  const modalTitle = qs('#modalTitle', modal);
  const modalDesc = qs('.modal-description', modal);
  const modalTech = qs('.modal-tech', modal);
  const modalDemo = qs('[data-demo]', modal);
  const modalSource = qs('[data-source]', modal);
  const openModal = (data) => {
    if (!modal) return;
    modalTitle.textContent = data.title || '';
    modalDesc.textContent = data.description || '';
    modalTech.textContent = `Tech: ${data.tech || ''}`;
    if (data.demo) modalDemo.setAttribute('href', data.demo);
    if (data.source) modalSource.setAttribute('href', data.source);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };
  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };
  qsa('.card .more').forEach((btn) => {
    btn.addEventListener('click', () => {
      const data = {
        title: btn.getAttribute('data-title'),
        description: btn.getAttribute('data-description'),
        tech: btn.getAttribute('data-tech'),
        demo: btn.getAttribute('data-demo'),
        source: btn.getAttribute('data-source'),
      };
      openModal(data);
    });
  });
  if (modal) {
    qsa('[data-close]', modal).forEach((el) => el.addEventListener('click', closeModal));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
  }

  // Scroll reveal
  const revealEls = qsa('[data-reveal], .card, .skill-card, .timeline-item');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  revealEls.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i * 40, 200)}ms`;
    el.setAttribute('data-reveal', '');
    revealObserver.observe(el);
  });

  // Back to top
  const toTop = qs('#toTop');
  const onScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (toTop) toTop.classList.toggle('visible', y > 500);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Copy email
  const copyBtn = qs('#copyEmail');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const email = copyBtn.getAttribute('data-email') || '';
      try {
        await navigator.clipboard.writeText(email);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy email'; }, 1500);
      } catch (e) {
        copyBtn.textContent = 'Press Ctrl+C to copy';
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(copyBtn);
        sel.removeAllRanges(); sel.addRange(range);
      }
    });
  }

  // Contact form validation (client-side only)
  const contactForm = qs('#contactForm');
  const formStatus = qs('#formStatus');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(contactForm);
      const name = String(fd.get('name') || '').trim();
      const email = String(fd.get('email') || '').trim();
      const message = String(fd.get('message') || '').trim();
      const emailOk = /.+@.+\..+/.test(email);
      if (!name || !emailOk || !message) {
        if (formStatus) formStatus.textContent = 'Please complete all fields with a valid email.';
        return;
      }
      if (formStatus) formStatus.textContent = 'Thanks! I will get back to you shortly.';
      contactForm.reset();
    });
  }
})();
