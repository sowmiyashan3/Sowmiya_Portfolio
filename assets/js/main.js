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
})();
