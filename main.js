/* NightThreadShop — vanilla JS interactions */
(() => {
  const doc = document.documentElement;
  doc.classList.add('js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* Year */
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  /* Sticky nav state + active link */
  const nav = $('.nav');
  const onScrollNav = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  const links = $$('.nav__links a');
  const sections = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => io.observe(s));
  }

  /* Mobile menu */
  const burger = $('.burger'), menu = $('#mobile-menu');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('is-open')); document.body.style.overflow = 'hidden'; }
    else { menu.classList.remove('is-open'); document.body.style.overflow = ''; setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 350); }
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* Reveal on scroll */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const ro = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); ro.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(el => ro.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-in'));
  }

  /* Copy discount code */
  const toast = $('.toast');
  let tt;
  const showToast = msg => { toast.textContent = msg; toast.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('is-on'), 2200); };
  $$('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
    const code = btn.dataset.copy;
    try { await navigator.clipboard.writeText(code); }
    catch { const t = document.createElement('textarea'); t.value = code; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch {} t.remove(); }
    showToast(`Code ${code} copied — use it at Etsy checkout`);
    const lbl = $('[data-copy-label]', btn); if (lbl) { lbl.textContent = 'Copied ✓'; setTimeout(() => lbl.textContent = 'Tap to copy', 2000); }
  }));

  /* Product cards: front/back toggle */
  $$('[data-card]').forEach(card => {
    const btns = $$('.card__toggle button', card);
    const set = back => {
      card.classList.toggle('show-back', back);
      btns.forEach(b => { const on = (b.dataset.view === 'back') === back; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
    };
    btns.forEach(b => b.addEventListener('click', e => { e.stopPropagation(); set(b.dataset.view === 'back'); }));
    $('.card__media', card).addEventListener('click', () => set(!card.classList.contains('show-back')));
    // Desktop hover preview of the other side
    if (window.matchMedia('(hover: hover)').matches) {
      let hoverTimer;
      card.querySelector('.card__media').addEventListener('mouseenter', () => { hoverTimer = setTimeout(() => set(true), 450); });
      card.querySelector('.card__media').addEventListener('mouseleave', () => { clearTimeout(hoverTimer); set(false); });
    }
  });

  /* Hero parallax (pointer) + scroll parallax */
  const root = $('[data-parallax-root]');
  const layers = root ? $$('[data-depth]', root) : [];
  const arts = $$('[data-speed]');
  if (!reduce) {
    let mx = 0, my = 0, cx = 0, cy = 0;
    if (window.matchMedia('(hover: hover)').matches && root) {
      window.addEventListener('pointermove', e => {
        mx = (e.clientX / window.innerWidth - 0.5) * 2;
        my = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });
    }
    const tick = () => {
      cx += (mx - cx) * 0.06; cy += (my - cy) * 0.06;
      const sy = window.scrollY;
      layers.forEach(l => {
        const d = parseFloat(l.dataset.depth);
        l.style.transform = `translate3d(${cx * d * -24}px, ${cy * d * -18 + sy * d * 0.25}px, 0)`;
      });
      if (window.innerWidth > 700) {
        arts.forEach(a => {
          const r = a.getBoundingClientRect();
          const off = Math.max(-40, Math.min(40, (r.top + r.height / 2 - window.innerHeight / 2) * parseFloat(a.dataset.speed)));
          a.style.setProperty('--py', off.toFixed(1) + 'px');
        });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* Neon rain canvas in hero */
  const cv = $('#rain');
  if (cv && !reduce) {
    const ctx = cv.getContext('2d');
    let w, h, drops = [], visible = true;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(110, w / 12));
      drops = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, l: 10 + Math.random() * 26, v: 4 + Math.random() * 7, c: Math.random() < 0.5 ? '181,107,255' : '34,228,255', a: 0.15 + Math.random() * 0.45 }));
    };
    resize(); window.addEventListener('resize', resize);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(cv);
    const draw = () => {
      if (visible) {
        ctx.clearRect(0, 0, w, h);
        for (const d of drops) {
          const g = ctx.createLinearGradient(d.x, d.y, d.x - d.l * 0.18, d.y + d.l);
          g.addColorStop(0, `rgba(${d.c},0)`); g.addColorStop(1, `rgba(${d.c},${d.a})`);
          ctx.strokeStyle = g; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.l * 0.18, d.y + d.l); ctx.stroke();
          d.y += d.v; d.x -= d.v * 0.18;
          if (d.y > h) { d.y = -d.l; d.x = Math.random() * (w + 100); }
        }
      }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  /* Reels: play only while visible */
  const vids = $$('video[data-autoplay]');
  if ('IntersectionObserver' in window) {
    const vo = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const v = e.target;
        if (e.isIntersecting && !reduce) { v.preload = 'auto'; const p = v.play(); if (p) p.catch(() => {}); }
        else v.pause();
      });
    }, { threshold: 0.35 });
    vids.forEach(v => vo.observe(v));
  }
})();
