/* ═══════════════════════════════════════════════════════════════
   SAMU TRANSPORTES | Interacciones y animaciones

   Dependencias (CDN, opcionales): GSAP + ScrollTrigger, Lenis.
   Si alguna no carga, la página sigue funcionando sin los efectos de
   scroll. Todo respeta prefers-reduced-motion.

   Cada animación tiene un propósito:
   - Loader: comunica que algo se prepara y oculta la carga de recursos.
   - Hero: jerarquía (primero el mensaje, luego el logo).
   - Palabras del manifiesto: guían la lectura a ritmo del scroll.
   - Carril de servicios y ruta del proceso: cuentan la historia en orden.
   - Zoom final: lleva la atención al llamado a la acción.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';
  window.__samuOk = true;

  /* ───────── Utilidades ───────── */
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  const WA_MAIN = '523332281284';
  const waUrl = (text, num = WA_MAIN) => `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  const openWhatsApp = (url) => {
    const w = window.open(url, '_blank', 'noopener');
    if (!w) window.location.href = url; // si el navegador bloquea la pestaña nueva
  };

  let lenis = null;
  let menuOpen = false;

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  /* ───────── Loader tipo velocímetro ───────── */
  function runLoader(onReveal) {
    const el = $('#loader');
    if (!el) { onReveal(); return; }

    const arc = $('#ldArc');
    const pctEl = $('#ldPct');
    const statusEl = $('#ldStatus');
    const g = $('#ldTicks');
    const NS = 'http://www.w3.org/2000/svg';
    const N = 54;
    const ticks = [];

    for (let i = 0; i <= N; i++) {
      const a = (135 + i * (270 / N)) * Math.PI / 180;
      const major = i % 6 === 0;
      const r1 = major ? 85 : 87;
      const r2 = major ? 96 : 93;
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', (100 + r1 * Math.cos(a)).toFixed(2));
      line.setAttribute('y1', (100 + r1 * Math.sin(a)).toFixed(2));
      line.setAttribute('x2', (100 + r2 * Math.cos(a)).toFixed(2));
      line.setAttribute('y2', (100 + r2 * Math.sin(a)).toFixed(2));
      line.setAttribute('class', 'ld-tick' + (major ? ' is-major' : ''));
      g.appendChild(line);
      ticks.push(line);
    }

    const messages = ['Preparando la ruta', 'Asegurando la carga', 'Coordinando la salida', 'Todo listo'];
    const MIN_MS = reduce ? 350 : 2200;
    const t0 = performance.now();
    let loaded = document.readyState === 'complete';
    if (!loaded) window.addEventListener('load', () => { loaded = true; }, { once: true });
    setTimeout(() => { loaded = true; }, 7000); // no esperar recursos lentos indefinidamente

    let shown = 0;
    let msgIdx = -1;

    const paint = (p) => {
      arc.style.strokeDasharray = `${(p * 2.7).toFixed(2)} 360`;
      pctEl.textContent = Math.round(p);
      const on = Math.floor((p / 100) * N);
      ticks.forEach((t, i) => t.classList.toggle('on', i <= on && p > 0));
      const idx = Math.min(messages.length - 1, Math.floor(p / 26));
      if (idx !== msgIdx) { msgIdx = idx; statusEl.textContent = messages[idx]; }
    };

    const finish = () => {
      paint(100);
      statusEl.textContent = 'Todo listo';
      setTimeout(() => {
        el.classList.add('is-done');
        root.classList.remove('is-loading');
        onReveal();
        setTimeout(() => el.classList.add('is-gone'), 1300);
      }, 420);
    };

    const frame = (now) => {
      const t = clamp((now - t0) / MIN_MS, 0, 1);
      let target = (1 - Math.pow(1 - t, 3)) * 100;
      if (!loaded) target = Math.min(target, 90);
      shown += (target - shown) * 0.14;
      const p = Math.min(100, shown);
      paint(p);
      if (loaded && t >= 1 && p > 99.4) { finish(); return; }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  /* ───────── Scroll suave (Lenis) ───────── */
  function initSmooth() {
    if (reduce || typeof window.Lenis === 'undefined') return;
    lenis = new window.Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true
    });
    if (hasGSAP) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add((time) => lenis.raf(time * 1000));
      window.gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    lenis.stop(); // detenido hasta que termine el loader
  }

  /* ───────── Anclas ───────── */
  function initAnchors() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      if (menuOpen) setMenu(false);
      if (lenis) lenis.scrollTo(target, { duration: 1.6, offset: 0 });
      else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* ───────── Navegación y menú móvil ───────── */
  const nav = $('#nav');
  const burger = $('#burger');
  const menu = $('#menu');

  function setMenu(open) {
    menuOpen = open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    menu.inert = !open;
    nav.classList.remove('is-hidden');
    if (lenis) { open ? lenis.stop() : lenis.start(); }
    else root.style.overflow = open ? 'hidden' : '';
  }

  function initMenu() {
    if (!burger || !menu) return;
    menu.inert = true;
    $$('.menu__links a', menu).forEach((a, i) => a.style.setProperty('--n', i));
    burger.addEventListener('click', () => setMenu(!menuOpen));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) { setMenu(false); burger.focus(); } });
  }

  function initNav() {
    if (hasGSAP) {
      window.ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: (self) => {
          const y = self.scroll();
          nav.classList.toggle('is-scrolled', y > 40);
          nav.classList.toggle('is-hidden', self.direction === 1 && y > 520 && !menuOpen);
        }
      });
      window.gsap.to('.nav__progress i', {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: document.body, start: 0, end: 'max', scrub: 0.3 }
      });
    } else if ('IntersectionObserver' in window) {
      const sentinel = document.createElement('div');
      sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:40px;pointer-events:none';
      document.body.prepend(sentinel);
      new IntersectionObserver(([en]) => nav.classList.toggle('is-scrolled', !en.isIntersecting)).observe(sentinel);
    }
  }

  /* ───────── Reveals por scroll (IntersectionObserver) ───────── */
  function initReveals() {
    const els = $$('[data-reveal]');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    els.forEach((e) => io.observe(e));
  }

  /* ───────── Hero: palabra que rota ───────── */
  function initCycle() {
    const el = $('#cycle');
    const hero = $('#inicio');
    if (!el || reduce || !el.animate) return;
    const words = ['sin estrés.', 'a tu horario.', 'con precisión.', 'a donde sea.'];
    let i = 0;
    let busy = false;
    let timer = null;
    let heroVisible = true;

    const next = async () => {
      if (busy || !heroVisible || document.hidden) return;
      busy = true;
      const out = el.animate(
        [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-75%)', opacity: 0 }],
        { duration: 420, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' }
      );
      await out.finished.catch(() => {});
      i = (i + 1) % words.length;
      el.textContent = words[i];
      const inn = el.animate(
        [{ transform: 'translateY(75%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
        { duration: 760, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' }
      );
      out.cancel();
      await inn.finished.catch(() => {});
      busy = false;
    };

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => { heroVisible = en.isIntersecting; }, { threshold: 0.1 }).observe(hero);
    }
    setTimeout(() => { timer = setInterval(next, 3200); }, 3600);
    window.addEventListener('pagehide', () => clearInterval(timer));
  }

  /* ───────── Hero: partículas y líneas de velocidad (canvas) ───────── */
  function initFX() {
    const c = $('#fx');
    const hero = $('#inicio');
    if (!c || !c.getContext) return;
    const ctx = c.getContext('2d');
    let w = 0, h = 0, raf = 0, last = 0, mx = 0, my = 0, tx = 0, ty = 0;
    let streaks = [], dust = [];
    const rnd = (a, b) => a + Math.random() * (b - a);

    const mkStreak = (init) => {
      const depth = Math.random();
      return {
        x: init ? rnd(-200, w) : w + rnd(0, 320),
        y: rnd(h * 0.16, h * 0.97),
        len: rnd(70, 260) * (0.5 + depth),
        v: rnd(2.2, 6.5) * (0.4 + depth * 1.3),
        a: rnd(0.12, 0.42) * (0.5 + depth),
        lw: rnd(0.8, 2) * (0.6 + depth * 0.6),
        red: Math.random() < 0.4
      };
    };
    const mkDust = () => ({
      x: rnd(0, w), y: rnd(0, h), r: rnd(0.5, 1.9),
      vx: rnd(-0.26, -0.05), vy: rnd(-0.12, 0.12), a: rnd(0.15, 0.5), ph: rnd(0, 6.28), d: rnd(0.3, 1.2)
    });

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = c.clientWidth; h = c.clientHeight;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const ns = clamp(Math.round(w * h / 36000), 10, 44);
      const nd = clamp(Math.round(w * h / 15000), 24, 90);
      streaks = Array.from({ length: ns }, () => mkStreak(true));
      dust = Array.from({ length: nd }, mkDust);
    };

    const draw = (t, k) => {
      mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of dust) {
        p.x += p.vx * k; p.y += p.vy * k;
        if (p.x < -4) p.x = w + 4;
        if (p.y < -4) p.y = h + 4;
        if (p.y > h + 4) p.y = -4;
        const tw = 0.6 + 0.4 * Math.sin(t * 0.0015 + p.ph);
        ctx.fillStyle = `rgba(255,255,255,${(p.a * tw).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x + mx * p.d * 14, p.y + my * p.d * 10, p.r, 0, 6.283);
        ctx.fill();
      }
      ctx.lineCap = 'round';
      for (const s of streaks) {
        s.x -= s.v * k;
        if (s.x + s.len < 0) Object.assign(s, mkStreak(false));
        const x = s.x + mx * s.v * 1.5;
        const y = s.y + my * 6;
        const col = s.red ? '255,60,72' : '255,255,255';
        const g = ctx.createLinearGradient(x, y, x + s.len, y);
        g.addColorStop(0, `rgba(${col},${s.a.toFixed(3)})`);
        g.addColorStop(1, `rgba(${col},0)`);
        ctx.strokeStyle = g; ctx.lineWidth = s.lw;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + s.len, y); ctx.stroke();
      }
    };

    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(40, t - last || 16.7);
      last = t;
      draw(t, dt / 16.67);
    };
    const start = () => { if (!raf && !reduce) { last = 0; raf = requestAnimationFrame(loop); } };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };

    build();
    if (reduce) { draw(0, 0); }

    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { build(); if (reduce) draw(0, 0); }, 150); }, { passive: true });

    if (finePointer && !reduce) {
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      }, { passive: true });
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => { en.isIntersecting ? start() : stop(); }, { threshold: 0.02 }).observe(hero);
    } else start();
    document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });
  }

  /* ───────── Hero: inclinación 3D del logo con el puntero ───────── */
  function initTilt() {
    if (!hasGSAP || !finePointer || reduce) return;
    const stage = $('#stage');
    const logo = $('.hero__logo');
    if (!stage || !logo) return;
    const gsap = window.gsap;
    gsap.set(logo, { transformPerspective: 900, transformOrigin: '50% 60%' });
    const rx = gsap.quickTo(logo, 'rotationX', { duration: 0.9, ease: 'power3.out' });
    const ry = gsap.quickTo(logo, 'rotationY', { duration: 0.9, ease: 'power3.out' });
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 16);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 11);
    });
    stage.addEventListener('pointerleave', () => { ry(0); rx(0); });
  }

  /* ───────── Efectos de scroll (GSAP ScrollTrigger) ───────── */
  function splitWords(node) {
    const walk = (n) => {
      Array.from(n.childNodes).forEach((c) => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const s = document.createElement('span');
            s.className = 'w';
            s.textContent = part;
            frag.appendChild(s);
          });
          n.replaceChild(frag, c);
        } else if (c.nodeType === 1) { walk(c); }
      });
    };
    walk(node);
  }

  function initScroll() {
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);
    root.classList.add('gsap-on');

    const mm = gsap.matchMedia();
    mm.add({ motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 1024px)' }, (ctx) => {
      const { motion, desktop } = ctx.conditions;
      const cleanups = [];

      /* Sin movimiento: todo visible y estático */
      if (!motion) {
        $$('.step').forEach((s) => s.classList.add('is-active'));
        return;
      }

      /* 1. Hero: el logo y el texto se alejan al hacer scroll (profundidad) */
      const heroTrig = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
      gsap.to('.hero__stage', { yPercent: -9, scale: 1.08, ease: 'none', scrollTrigger: heroTrig });
      gsap.to('.hero__copy', { yPercent: -12, opacity: 0.15, ease: 'none', scrollTrigger: heroTrig });
      gsap.to('.hero__ghost', { xPercent: -9, ease: 'none', scrollTrigger: heroTrig });
      gsap.to('.road', { yPercent: 14, ease: 'none', scrollTrigger: heroTrig });

      /* 2. Manifiesto: las palabras se encienden al leer */
      const st = $('#statement');
      if (st) {
        const original = st.innerHTML;
        splitWords(st);
        gsap.to($$('.w', st), {
          opacity: 1, ease: 'none', stagger: 0.12,
          scrollTrigger: { trigger: st, start: 'top 82%', end: 'bottom 55%', scrub: 0.4 }
        });
        cleanups.push(() => { st.innerHTML = original; });
      }

      /* 3. Parallax de imágenes */
      $$('[data-parallax]').forEach((img) => {
        gsap.fromTo(img, { yPercent: -6 }, {
          yPercent: 6, ease: 'none',
          scrollTrigger: { trigger: img.closest('.px'), start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });

      /* 4. Pie: el rótulo gigante sube con el scroll */
      gsap.fromTo('.footer__big', { yPercent: 22 }, {
        yPercent: 0, ease: 'none',
        scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true }
      });

      if (desktop) {
        /* 5. Servicios: carril horizontal fijado */
        const track = $('#svcTrack');
        const bar = $('#svcBar');
        if (track) {
          const dist = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
          const pan = gsap.to(track, {
            x: () => -dist(), ease: 'none',
            scrollTrigger: {
              trigger: '.services__pin', start: 'top top', end: () => '+=' + dist(),
              pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
              onUpdate: (self) => { if (bar) bar.style.transform = `scaleX(${self.progress.toFixed(4)})`; }
            }
          });
          $$('[data-parallax-x]').forEach((img) => {
            gsap.fromTo(img, { xPercent: -5 }, {
              xPercent: 5, ease: 'none',
              scrollTrigger: { trigger: img.closest('.svc'), containerAnimation: pan, start: 'left right', end: 'right left', scrub: true }
            });
          });
          cleanups.push(() => { if (bar) bar.style.transform = ''; });
        }

        /* 6. Proceso: la ruta se dibuja y la camioneta avanza de paso en paso */
        const path = $('#routeFg');
        const pin = $('.process__pin');
        const marker = $('#routeMarker');
        const stopsG = $('#routeStops');
        const steps = $$('.step');
        if (path && pin && marker && stopsG) {
          const L = path.getTotalLength();
          const NS = 'http://www.w3.org/2000/svg';
          const labels = ['Origen', 'Plan', 'Ruta', 'Destino'];
          const ends = [[90, 50], [430, 270], [90, 500], [430, 680]];

          // fracción del recorrido donde cae cada parada (escaneo del trazo)
          const fracs = ends.map(([ex, ey]) => {
            let best = 0, bestD = Infinity;
            for (let s = 0; s <= L; s += 2) {
              const p = path.getPointAtLength(s);
              const d = (p.x - ex) ** 2 + (p.y - ey) ** 2;
              if (d < bestD) { bestD = d; best = s; }
            }
            return best / L;
          });
          fracs[0] = 0; fracs[3] = 1;

          stopsG.innerHTML = '';
          const stops = ends.map(([ex, ey], i) => {
            const c = document.createElementNS(NS, 'circle');
            c.setAttribute('class', 'route__stop');
            c.setAttribute('cx', ex); c.setAttribute('cy', ey); c.setAttribute('r', 15);
            const t = document.createElementNS(NS, 'text');
            t.setAttribute('class', 'route__label');
            const rightSide = ex > 260;
            t.setAttribute('x', ex + (rightSide ? -30 : 30));
            t.setAttribute('y', ey + 5);
            t.setAttribute('text-anchor', rightSide ? 'end' : 'start');
            t.textContent = labels[i];
            stopsG.append(c, t);
            return c;
          });

          path.style.strokeDasharray = L;
          path.style.strokeDashoffset = L;
          $('#proceso').classList.add('process--pinned');

          let active = -1;
          const update = (p) => {
            path.style.strokeDashoffset = L * (1 - p);
            const pt = path.getPointAtLength(L * p);
            marker.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
            stops.forEach((c, i) => c.classList.toggle('on', p >= fracs[i] - 0.001));
            let idx = 0, bestD = Infinity;
            fracs.forEach((f, i) => { const d = Math.abs(p - f); if (d < bestD) { bestD = d; idx = i; } });
            if (idx !== active) {
              active = idx;
              steps.forEach((s, i) => s.classList.toggle('is-active', i === idx));
            }
          };
          update(0);

          ScrollTrigger.create({
            trigger: pin, start: 'top top', end: '+=260%', pin: true, scrub: true, anticipatePin: 1,
            onUpdate: (self) => update(self.progress)
          });

          cleanups.push(() => {
            $('#proceso').classList.remove('process--pinned');
            path.style.strokeDasharray = ''; path.style.strokeDashoffset = '';
            stopsG.innerHTML = '';
            steps.forEach((s, i) => s.classList.toggle('is-active', i === 0));
          });
        }

        /* 7. Zoom: la ventana se abre hasta ocupar la pantalla y aparece el llamado a la acción */
        const frame = $('#zoomFrame');
        const content = $('#zoomContent');
        if (frame && content) {
          gsap.set(frame, { clipPath: 'inset(26% 34% 26% 34% round 20px)' });
          gsap.set(content, { opacity: 0, y: 50 });
          const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: { trigger: '.zoom__pin', start: 'top top', end: '+=190%', pin: true, scrub: 0.6, anticipatePin: 1 }
          });
          tl.to(frame, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1 }, 0)
            .fromTo('#zoomFrame img', { scale: 1.4 }, { scale: 1, duration: 1 }, 0)
            .to('.zoom__side--l', { xPercent: -95, opacity: 0, duration: 0.85 }, 0)
            .to('.zoom__side--r', { xPercent: 95, opacity: 0, duration: 0.85 }, 0)
            .to(content, { opacity: 1, y: 0, duration: 0.45 }, 0.72);
        }
      } else {
        /* Móvil / tablet: el riel del proceso se llena y los pasos se activan al llegar */
        const list = $('#steps');
        if (list) {
          gsap.fromTo(list, { '--rail': 0 }, {
            '--rail': 1, ease: 'none',
            scrollTrigger: { trigger: list, start: 'top 68%', end: 'bottom 62%', scrub: true }
          });
          $$('.step').forEach((s, i) => {
            if (i === 0) return;
            ScrollTrigger.create({ trigger: s, start: 'top 68%', toggleClass: { targets: s, className: 'is-active' } });
          });
        }
      }

      return () => cleanups.forEach((fn) => fn());
    });

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }

  /* ───────── Botones magnéticos ───────── */
  function initMagnetic() {
    if (!finePointer || reduce) return;
    $$('[data-magnetic]').forEach((el) => {
      let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;
      const loop = () => {
        cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
        el.style.translate = `${cx.toFixed(2)}px ${cy.toFixed(2)}px`;
        raf = (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) ? requestAnimationFrame(loop) : 0;
      };
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        tx = (e.clientX - (r.left + r.width / 2)) * 0.22;
        ty = (e.clientY - (r.top + r.height / 2)) * 0.34;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      el.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
    });
  }

  /* ───────── Bento: luz que sigue al cursor ───────── */
  function initSpotlight() {
    if (!finePointer) return;
    $$('.cell').forEach((cell) => {
      cell.addEventListener('pointermove', (e) => {
        const r = cell.getBoundingClientRect();
        cell.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        cell.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ───────── Cobertura: pestañas local / foráneo ───────── */
  function initTabs() {
    const stage = $('#panel-cover');
    const tabs = $$('.tab');
    if (!stage || !tabs.length) return;

    const set = (mode, focus) => {
      tabs.forEach((t) => {
        const on = t.dataset.mode === mode;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      stage.dataset.mode = mode;
      stage.setAttribute('aria-labelledby', 'tab-' + mode);
      $$('.cover__img').forEach((img) => img.classList.toggle('is-on', img.dataset.for === mode));
      $$('.cover__copy').forEach((c) => {
        const show = c.dataset.for === mode;
        const wasHidden = c.hidden;
        c.hidden = !show;
        if (show && wasHidden && c.animate && !reduce) {
          c.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' });
        }
      });
    };

    tabs.forEach((t, i) => {
      t.addEventListener('click', () => set(t.dataset.mode));
      t.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const nextI = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        set(tabs[nextI].dataset.mode, true);
      });
    });
  }

  /* ───────── Preguntas frecuentes ───────── */
  function initAccordion() {
    const items = $$('.acc__item');
    if (!items.length) return;
    const setOpen = (item, open) => {
      item.classList.toggle('is-open', open);
      $('.acc__btn', item).setAttribute('aria-expanded', String(open));
    };
    items.forEach((item) => {
      $('.acc__btn', item).addEventListener('click', () => {
        const open = !item.classList.contains('is-open');
        items.forEach((o) => { if (o !== item) setOpen(o, false); });
        setOpen(item, open);
        if (hasGSAP) setTimeout(() => window.ScrollTrigger.refresh(), 650);
      });
    });
    setOpen(items[0], true);
  }

  /* ───────── Formularios → WhatsApp ───────── */
  function setError(input, msg) {
    const field = input.closest('.field');
    const err = $('.field__err', field);
    field.classList.toggle('has-error', !!msg);
    if (err) err.textContent = msg || '';
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  function bindClear(form) {
    $$('input, select, textarea', form).forEach((i) => i.addEventListener('input', () => setError(i, '')));
  }

  function formatDate(v) {
    if (!v) return '';
    const [y, m, d] = v.split('-');
    return `${d}/${m}/${y}`;
  }

  function initQuoteForm() {
    const form = $('#quoteForm');
    if (!form) return;
    const btn = $('#submitBtn');
    const label = $('.btn__label', btn);
    const status = $('#formStatus');
    bindClear(form);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = form.elements;
      const nombre = f.nombre.value.trim();
      const tel = f.telefono.value.replace(/\D/g, '');
      const tipo = f.tipo.value;
      let first = null;
      const fail = (input, msg) => { setError(input, msg); if (!first) first = input; };

      if (nombre.length < 2) fail(f.nombre, 'Escribe tu nombre.'); else setError(f.nombre, '');
      if (tel.length < 10 || tel.length > 13) fail(f.telefono, 'Escribe un teléfono de 10 dígitos.'); else setError(f.telefono, '');
      if (!tipo) fail(f.tipo, 'Elige qué necesitas mover.'); else setError(f.tipo, '');

      if (first) {
        status.textContent = 'Revisa los campos marcados.';
        status.classList.add('is-error');
        first.focus();
        return;
      }
      status.classList.remove('is-error');

      const lines = ['*Solicitud de cotización | SAMU Transportes*', '', `Nombre: ${nombre}`, `Teléfono: ${f.telefono.value.trim()}`, `Servicio: ${tipo}`];
      if (f.origen.value.trim()) lines.push(`Origen: ${f.origen.value.trim()}`);
      if (f.destino.value.trim()) lines.push(`Destino: ${f.destino.value.trim()}`);
      if (f.fecha.value) lines.push(`Fecha aproximada: ${formatDate(f.fecha.value)}`);
      if (f.mensaje.value.trim()) lines.push(`Detalles: ${f.mensaje.value.trim()}`);

      btn.classList.add('is-loading');
      label.textContent = 'Abriendo WhatsApp...';
      status.textContent = 'Te llevamos a WhatsApp para enviar tu solicitud.';
      openWhatsApp(waUrl(lines.join('\n')));

      setTimeout(() => {
        btn.classList.remove('is-loading');
        label.textContent = 'Enviar mi solicitud';
        status.textContent = 'Listo. Si WhatsApp no se abrió, escríbenos al 33 3228 1284.';
        form.reset();
      }, 2200);
    });
  }

  function initRouteForm() {
    const form = $('#routeForm');
    if (!form) return;
    bindClear(form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const from = $('#rf-from');
      const to = $('#rf-to');
      let first = null;
      const check = (input, msg) => {
        if (input.value.trim().length < 2) { setError(input, msg); if (!first) first = input; }
        else setError(input, '');
      };
      check(from, 'Indica el origen.');
      check(to, 'Indica el destino.');
      if (first) { first.focus(); return; }
      const text = `Hola SAMU Transportes, quiero cotizar una ruta.\nDesde: ${from.value.trim()}\nHasta: ${to.value.trim()}`;
      openWhatsApp(waUrl(text));
    });
  }

  /* ───────── WhatsApp flotante: aviso breve ───────── */
  function initWaTip() {
    const wa = $('#wa');
    if (!wa) return;
    setTimeout(() => {
      wa.classList.add('is-tip');
      setTimeout(() => wa.classList.remove('is-tip'), 6000);
    }, 8000);
  }

  /* ───────── Arranque ───────── */
  function afterLoader() {
    root.classList.add('is-ready');
    if (lenis) lenis.start();
    initReveals();
    initCycle();
    initFX();
    if (hasGSAP) {
      initScroll();
      initNav();
      initTilt();
      setTimeout(() => window.ScrollTrigger.refresh(), 250);
    } else {
      initNav();
    }
    initWaTip();
  }

  initSmooth();
  initAnchors();
  initMenu();
  initMagnetic();
  initSpotlight();
  initTabs();
  initAccordion();
  initQuoteForm();
  initRouteForm();
  runLoader(afterLoader);
})();
