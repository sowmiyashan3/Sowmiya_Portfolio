/* Utility: prefers-reduced-motion */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Theme handling */
const root = document.documentElement;
function setTheme(theme) {
  if (theme === 'light' || theme === 'dark') {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (_) {}
  } else {
    root.setAttribute('data-theme', 'auto');
    try { localStorage.removeItem('theme'); } catch (_) {}
  }
}

function toggleTheme() {
  const current = root.getAttribute('data-theme');
  if (current === 'dark') setTheme('light');
  else if (current === 'light') setTheme('dark');
  else {
    // auto -> adopt system, then switch
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(systemDark ? 'light' : 'dark');
  }
}

(function initThemeToggle(){
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', toggleTheme);
  window.addEventListener('keydown', (e) => {
    if ((e.key === 't' || e.key === 'T') && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      toggleTheme();
    }
  });
})();

/* Mobile nav toggle */
(function initNavToggle(){
  const nav = document.querySelector('.site-nav');
  const toggle = document.querySelector('.nav-toggle');
  if (!nav || !toggle) return;
  toggle.addEventListener('click', () => {
    const expanded = nav.getAttribute('aria-expanded') === 'true';
    nav.setAttribute('aria-expanded', String(!expanded));
  });
})();

/* Reveal on scroll */
(function initReveal(){
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || prefersReducedMotion) {
    items.forEach(el => el.classList.add('in-view'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach(el => io.observe(el));
})();

/* Tilt effect */
(function initTilt(){
  const cards = document.querySelectorAll('.tilt');
  if (prefersReducedMotion) return;
  cards.forEach(card => {
    let rect;
    function updateRect(){ rect = card.getBoundingClientRect(); }
    updateRect();
    window.addEventListener('resize', updateRect);
    card.addEventListener('mousemove', (e) => {
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rx = (py - 0.5) * -8; // rotateX
      const ry = (px - 0.5) * 10; // rotateY
      card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* Project filters */
(function initFilters(){
  const chips = document.querySelectorAll('.filters .chip');
  const cards = document.querySelectorAll('.projects-grid .card');
  if (!chips.length) return;
  function applyFilter(tag){
    cards.forEach(card => {
      const tags = (card.getAttribute('data-tags') || '').split(',').map(s => s.trim());
      const show = tag === 'all' || tags.includes(tag);
      card.style.display = show ? '' : 'none';
    });
  }
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      applyFilter(chip.dataset.filter || 'all');
    });
  });
})();

/* Command palette */
(function initCommandPalette(){
  const dialog = document.getElementById('command-palette');
  const input = document.getElementById('command-input');
  const list = document.getElementById('command-list');
  const btn = document.getElementById('command-btn');
  if (!dialog || !input || !list || !btn) return;

  const actions = [
    { id: 'go-home', label: 'Go: Home', run: () => document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' }) },
    { id: 'go-about', label: 'Go: About', run: () => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }) },
    { id: 'go-projects', label: 'Go: Projects', run: () => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' }) },
    { id: 'go-experience', label: 'Go: Experience', run: () => document.getElementById('experience')?.scrollIntoView({ behavior: 'smooth' }) },
    { id: 'go-contact', label: 'Go: Contact', run: () => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) },
    { id: 'theme-dark', label: 'Theme: Dark', run: () => setTheme('dark') },
    { id: 'theme-light', label: 'Theme: Light', run: () => setTheme('light') },
    { id: 'theme-auto', label: 'Theme: Auto', run: () => setTheme('auto') },
    { id: 'filter-all', label: 'Filter: All projects', run: () => clickFilter('all') },
    { id: 'filter-web', label: 'Filter: Web', run: () => clickFilter('web') },
    { id: 'filter-design', label: 'Filter: Design', run: () => clickFilter('design') },
    { id: 'filter-data', label: 'Filter: Data', run: () => clickFilter('data') },
    { id: 'filter-oss', label: 'Filter: OSS', run: () => clickFilter('oss') },
  ];

  function clickFilter(tag){
    const chip = document.querySelector(`.filters .chip[data-filter="${tag}"]`);
    if (chip) chip.click();
  }

  function open(){
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
      input.value = '';
      render(actions);
      input.focus();
    }
  }
  function close(){ dialog.close(); }

  function render(items){
    list.innerHTML = '';
    items.forEach((item, i) => {
      const li = document.createElement('li');
      li.textContent = item.label;
      li.setAttribute('role', 'option');
      if (i === 0) li.setAttribute('aria-selected', 'true');
      li.addEventListener('click', () => { item.run(); close(); });
      list.appendChild(li);
    });
  }

  function search(query){
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions
      .map(a => ({ a, score: score(a.label.toLowerCase(), q) }))
      .filter(x => x.score > 0)
      .sort((x, y) => y.score - x.score)
      .map(x => x.a);
  }

  // Simple scoring: contiguous match boosts
  function score(text, query){
    if (text.includes(query)) return query.length + 2;
    let hit = 0, qi = 0;
    for (let i=0;i<text.length && qi<query.length;i++) {
      if (text[i] === query[qi]) { hit++; qi++; }
    }
    return hit;
  }

  btn.addEventListener('click', open);
  window.addEventListener('keydown', (e) => {
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      open();
    } else if (e.key === 'Escape' && dialog.open) {
      close();
    }
  });
  dialog.addEventListener('close', () => { input.value = ''; list.innerHTML = ''; });

  input.addEventListener('input', () => {
    render(search(input.value));
  });

  input.addEventListener('keydown', (e) => {
    const options = Array.from(list.querySelectorAll('li'));
    const currentIndex = options.findIndex(li => li.getAttribute('aria-selected') === 'true');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(options.length - 1, currentIndex + 1);
      options.forEach(li => li.removeAttribute('aria-selected'));
      if (options[next]) options[next].setAttribute('aria-selected', 'true');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(0, currentIndex - 1);
      options.forEach(li => li.removeAttribute('aria-selected'));
      if (options[prev]) options[prev].setAttribute('aria-selected', 'true');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const focused = options.find(li => li.getAttribute('aria-selected') === 'true') || options[0];
      focused?.dispatchEvent(new Event('click'));
    }
  });
})();

/* Canvas background */
(function initCanvas(){
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || prefersReducedMotion) return;
  const ctx = canvas.getContext('2d');
  let width, height, dpr;

  function resize(){
    dpr = Math.min(2, window.devicePixelRatio || 1);
    width = canvas.clientWidth; height = canvas.clientHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const points = Array.from({ length: 48 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight * 0.7,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4
  }));

  function step(){
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < -50) p.x = width + 50; if (p.x > width + 50) p.x = -50;
      if (p.y < -50) p.y = height + 50; if (p.y > height + 50) p.y = -50;
    }
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const a = points[i], b = points[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 140) {
          const alpha = 1 - dist / 140;
          ctx.strokeStyle = `rgba(14,165,233,${alpha * 0.5})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    for (const p of points) {
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 24);
      grd.addColorStop(0, 'rgba(56,189,248,0.35)');
      grd.addColorStop(1, 'rgba(56,189,248,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 24, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(step);
  }
  step();
})();

/* Misc */
(function initYear(){
  const y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());
})();
