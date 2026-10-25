/* KB MOTION v1 (2026-10-22) — без библиотек. Прогрессивное улучшение:
   если скрипт не загрузится, сайт работает как раньше. */
(function () {
  'use strict';
  var d = document, w = window, root = d.documentElement;
  var mq = function (q) { return w.matchMedia ? w.matchMedia(q).matches : false; };
  var reduce = mq('(prefers-reduced-motion: reduce)');
  var fine = mq('(hover: hover) and (pointer: fine)');
  var small = w.innerWidth < 760;
  var HERO = '.page-hero,.kb-hero,.k-hero,.rp-hero,.samo-hero,.rdo-hero,.bc-hero,.ao-hero,.hero';
  var raf = w.requestAnimationFrame || function (f) { return setTimeout(f, 16); };

  function ready(fn) { d.readyState === 'loading' ? d.addEventListener('DOMContentLoaded', fn) : fn(); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ---------- прогресс прокрутки + стеклянная шапка ---------- */
  function scrollUi() {
    var bar = d.createElement('div'); bar.className = 'kb-progress'; bar.setAttribute('aria-hidden', 'true');
    d.body.appendChild(bar);
    var header = d.querySelector('header.header'), tick = false;
    function upd() {
      tick = false;
      var h = root.scrollHeight - w.innerHeight, y = w.pageYOffset || root.scrollTop;
      bar.style.transform = 'scaleX(' + (h > 0 ? clamp(y / h, 0, 1) : 0) + ')';
      if (header) header.classList.toggle('kb-scrolled', y > 12);
    }
    w.addEventListener('scroll', function () { if (!tick) { tick = true; raf(upd); } }, { passive: true });
    w.addEventListener('resize', upd); upd();
  }

  /* ---------- сцена «стопка контура» (изометрия, canvas) ----------
     15 тонких пластин на ребре, высоты «дышат» волной. Пять пластин — направления
     цифрового контура; пластина текущей страницы горит золотом, остальные по очереди
     подсвечиваются синим. Пластина под курсором приподнимается. */
  var NAMED = [[1, 'Бренд'], [4, 'Сайт'], [7, 'CRM'], [10, 'Лояльность'], [13, 'Аналитика']];
  function activeKey() {
    var p = (w.location.pathname || '').toLowerCase();
    if (/branding|brand|design|smm/.test(p)) return 0;
    if (/web-development|sites|site/.test(p)) return 1;
    if (/crm/.test(p)) return 2;
    if (/loyalty|rc-pay|rc-bonus|rcbiz|wallet/.test(p)) return 3;
    if (/analytics|diagnostic|audit|geo|konturscan/.test(p)) return 4;
    return -1;
  }
  function Scene(canvas, stage, key) {
    var ctx = canvas.getContext('2d'), dpr = Math.min(w.devicePixelRatio || 1, 2);
    var N = 15, STEP = 17, PW = 210, TH = 4, HMAX = 128, COS = .8660254, SIN = .5;
    var CW = 0, CH = 0, K = 1, OX = 0, OY = 0, running = false, id = 0, t0 = 0;
    var lift = [], mouse = { x: -999, y: -999 }, hover = -1, i;
    for (i = 0; i < N; i++) lift.push(0);
    var font = '600 11px ' + (w.getComputedStyle(d.body).fontFamily || 'Inter, system-ui, sans-serif');
    var namedIdx = {}; NAMED.forEach(function (n, k) { namedIdx[n[0]] = k; });

    function size() {
      var r = stage.getBoundingClientRect(); CW = Math.max(1, r.width); CH = Math.max(1, r.height);
      canvas.width = Math.round(CW * dpr); canvas.height = Math.round(CH * dpr);
      var D = N * STEP, sw = (PW + D) * COS, sh = (PW + D) * SIN + HMAX;
      K = Math.min(Math.min(CW * .44, 540) / sw, CH * .90 / sh);
      OX = CW * .84 - sw * K;
      OY = CH * .53 - sh * K / 2 + (PW * SIN + HMAX) * K;
    }
    function P(x, y, z) { return [OX + (x + y) * COS * K, OY + ((y - x) * SIN - z) * K]; }
    function poly(pts) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (var q = 1; q < pts.length; q++) ctx.lineTo(pts[q][0], pts[q][1]); ctx.closePath(); }
    function ease(v) { v = clamp(v, 0, 1); return 1 - Math.pow(1 - v, 3); }

    function frame(now) {
      if (!running) return;
      if (!t0) t0 = now; var t = (now - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, CW, CH);
      var rov = Math.floor(t / 2.6) % NAMED.length; if (rov === key) rov = (rov + 1) % NAMED.length;
      var newHover = -1, active = key >= 0 ? NAMED[key][0] : -9, rovIdx = NAMED[rov][0];
      var pulse = .85 + .15 * Math.sin(t * 2.2), labels = [];
      for (i = 0; i < N; i++) {
        var env = .40 + .60 * Math.pow(1 - i / (N - 1), .9);
        var h = HMAX * env * (.62 + .38 * (.5 + .5 * Math.sin(t * 1.1 - i * .52)));
        h *= ease((t - i * .07) / 1.1);                                   // появление при загрузке
        var isAct = i === active, isRov = i === rovIdx && key < 0 ? true : i === rovIdx;
        h += HMAX * ((isAct ? .24 * pulse : 0) + (isRov && !isAct ? .20 : 0)) + lift[i] * HMAX * .34;
        var y = i * STEP, c0 = P(0, y, 0), c1 = P(PW, y, 0), c2 = P(PW, y, h), c3 = P(0, y, h);
        var t0p = P(0, y + TH, h), t1p = P(PW, y + TH, h), s0 = P(PW, y + TH, 0), s1 = P(PW, y + TH, h);
        var col = isAct ? 'gold' : (isRov ? 'blue' : 'dim');
        // боковая грань и верхняя грань (толщина пластины)
        poly([c1, s0, s1, c2]); ctx.fillStyle = 'rgba(1,6,20,.98)'; ctx.fill();
        ctx.strokeStyle = col === 'gold' ? 'rgba(230,200,119,.55)' : col === 'blue' ? 'rgba(120,180,255,.5)' : 'rgba(150,175,215,.20)'; ctx.lineWidth = 1; ctx.stroke();
        poly([c3, c2, t1p, t0p]); ctx.fillStyle = 'rgba(8,22,52,.98)'; ctx.fill(); ctx.stroke();
        // лицевая грань
        poly([c0, c1, c2, c3]);
        var g = ctx.createLinearGradient(0, c3[1], 0, c0[1]);
        if (col === 'gold') { g.addColorStop(0, 'rgba(58,44,14,.98)'); g.addColorStop(1, 'rgba(8,16,38,.98)'); }
        else if (col === 'blue') { g.addColorStop(0, 'rgba(14,38,82,.98)'); g.addColorStop(1, 'rgba(3,10,30,.98)'); }
        else { g.addColorStop(0, 'rgba(7,18,44,.97)'); g.addColorStop(1, 'rgba(2,8,24,.97)'); }
        ctx.fillStyle = g; ctx.fill();
        if (mouse.x > -900 && ctx.isPointInPath(mouse.x * dpr, mouse.y * dpr)) newHover = i;
        ctx.save();
        if (col !== 'dim') { ctx.shadowColor = col === 'gold' ? 'rgba(230,200,119,.85)' : 'rgba(110,170,255,.85)'; ctx.shadowBlur = 14; }
        ctx.strokeStyle = col === 'gold' ? 'rgba(236,208,128,.98)' : col === 'blue' ? 'rgba(140,196,255,.95)' : 'rgba(165,188,228,.34)';
        ctx.lineWidth = col === 'dim' ? 1 : 1.4; ctx.stroke(); ctx.restore();
        // верхняя кромка ярче
        ctx.beginPath(); ctx.moveTo(c3[0], c3[1]); ctx.lineTo(c2[0], c2[1]);
        ctx.strokeStyle = col === 'gold' ? 'rgba(255,232,160,1)' : col === 'blue' ? 'rgba(190,225,255,.95)' : 'rgba(205,222,255,.50)'; ctx.stroke();
        // «интерфейс» на горящей пластине
        if (col !== 'dim' && h > 40) {
          ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.4, 2.2 * K);
          ctx.strokeStyle = col === 'gold' ? 'rgba(236,208,128,.55)' : 'rgba(140,196,255,.45)';
          [[.10, .22, .68], [.10, .36, .48], [.10, .50, .82], [.10, .64, .40]].forEach(function (b) {
            var qa = P(b[0] * PW, y, h * (1 - b[1])), qb = P(b[2] * PW, y, h * (1 - b[1]));
            ctx.beginPath(); ctx.moveTo(qa[0], qa[1]); ctx.lineTo(qb[0], qb[1]); ctx.stroke();
          });
          var dot = P(.86 * PW, y, h * .80); ctx.fillStyle = col === 'gold' ? 'rgba(255,226,140,.95)' : 'rgba(170,214,255,.95)';
          ctx.beginPath(); ctx.arc(dot[0], dot[1], 2.4 * K + 1, 0, 6.2832); ctx.fill();
        }
        // подпись направления (рисуем после всех пластин, чтобы не перекрывались)
        if (namedIdx[i] !== undefined) labels.push({ t: NAMED[namedIdx[i]][1], p: P(PW, y, h), c: col });
      }
      ctx.font = font; ctx.textBaseline = 'middle';
      labels.forEach(function (L) {
        ctx.fillStyle = L.c === 'gold' ? 'rgba(244,218,140,1)' : L.c === 'blue' ? 'rgba(190,222,255,.98)' : 'rgba(190,208,238,.58)';
        ctx.beginPath(); ctx.arc(L.p[0] + 9, L.p[1] - 7, 2.2, 0, 6.2832); ctx.fill();
        ctx.fillText(L.t, L.p[0] + 16, L.p[1] - 7);
      });
      if (newHover !== hover) hover = newHover;
      for (i = 0; i < N; i++) lift[i] += ((i === hover ? 1 : 0) - lift[i]) * .14;
      id = raf(frame);
    }
    this.start = function () { if (!running) { running = true; id = raf(frame); } };
    this.stop = function () { running = false; };
    this.move = function (x, y) { mouse.x = x; mouse.y = y; };
    this.size = size; size();
  }

  function heroFx() {
    var heroes = d.querySelectorAll(HERO), key = activeKey();
    Array.prototype.forEach.call(heroes, function (hero) {
      if (hero.querySelector(':scope > .kb-fx')) return;
      var cs = w.getComputedStyle(hero);
      if (cs.position === 'static') hero.style.position = 'relative';
      var hasMedia = !!hero.querySelector('img,video,picture,[class*="__visual"],[class*="__media"]');
      var fx = d.createElement('div'); fx.className = 'kb-fx'; fx.setAttribute('aria-hidden', 'true');
      fx.innerHTML = '<div class="kb-fx__ambient"></div><div class="kb-fx__stage"><div class="kb-fx__grid"></div><div class="kb-fx__scan"></div></div>';
      var stage = fx.querySelector('.kb-fx__stage'), spot = null, scene = null, canvas = null;
      if (!hasMedia) {
        hero.classList.add('kb-nomedia');
        fx.classList.add('has-scene'); canvas = d.createElement('canvas'); canvas.className = 'kb-fx__scene'; stage.appendChild(canvas);
      }
      if (fine) { spot = d.createElement('div'); spot.className = 'kb-fx__spot'; stage.appendChild(spot); }
      // слой эффектов кладём ПОСЛЕ фоновых блоков hero (они непрозрачные), но до содержимого
      var bgs = Array.prototype.filter.call(hero.children, function (c) { return /__bg|__media|__visual|__overlay/.test(String(c.className)); });
      var anchor = bgs.length ? bgs[bgs.length - 1] : null;
      if (anchor) anchor.insertAdjacentElement('afterend', fx); else hero.insertBefore(fx, hero.firstChild);

      var visible = true;
      if (canvas && w.innerWidth >= 1100) {
        scene = new Scene(canvas, stage, key);
        if ('IntersectionObserver' in w) {
          new IntersectionObserver(function (e) { visible = e[0].isIntersecting; visible && !d.hidden ? scene.start() : scene.stop(); }, { threshold: 0 }).observe(hero);
        } else scene.start();
        d.addEventListener('visibilitychange', function () { d.hidden ? scene.stop() : (visible && scene.start()); });
        if ('ResizeObserver' in w) new ResizeObserver(function () { scene.size(); }).observe(stage);
        else w.addEventListener('resize', scene.size);
      }
      if (fine) {
        var hasImg = !!hero.querySelector('.page-hero__media img,.kb-hero__media img');
        if (hasImg) hero.classList.add('kb-has-parallax');
        hero.addEventListener('pointermove', function (ev) {
          var hr = hero.getBoundingClientRect(), sr = stage.getBoundingClientRect(), x = ev.clientX - sr.left, y = ev.clientY - sr.top;
          fx.classList.add('is-active'); spot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
          if (scene) scene.move(x, y);
          if (hasImg) {
            hero.style.setProperty('--px', (((ev.clientX - hr.left) / hr.width - .5) * -16).toFixed(1) + 'px');
            hero.style.setProperty('--py', (((ev.clientY - hr.top) / hr.height - .5) * -10).toFixed(1) + 'px');
          }
        }, { passive: true });
        hero.addEventListener('pointerleave', function () {
          fx.classList.remove('is-active'); if (scene) scene.move(-999, -999);
          hero.style.setProperty('--px', '0px'); hero.style.setProperty('--py', '0px');
        });
      }
    });
  }

  /* ---------- появление блоков при прокрутке ---------- */
  function reveal() {
    if (!('IntersectionObserver' in w)) return;
    var SEL = 'main h2,main .section__header,main .section-header,main .card,main .kb-card,main .p-card,main .price-card,' +
      'main .product-card,main .competency-card,main .gr-card,main .step,main .process-step,main details,main figure,main table,main blockquote';
    var all = Array.prototype.slice.call(d.querySelectorAll(SEL));
    var set = all.filter(function (el) {
      if (el.closest(HERO) || el.closest('header') || el.closest('footer') || el.closest('nav')) return false;
      var r = el.getBoundingClientRect();
      if (r.width < 30 || r.height < 20) return false;
      if (r.top < w.innerHeight * .92 && r.bottom > 0) return false;       // уже на первом экране
      var p = el.parentElement;
      while (p && p !== d.body) { if (all.indexOf(p) !== -1) return false; p = p.parentElement; } // без вложенных
      var pos = w.getComputedStyle(el).position; return pos !== 'fixed' && pos !== 'sticky';
    });
    var groups = new Map();
    set.forEach(function (el) {
      var i = groups.get(el.parentElement) || 0; groups.set(el.parentElement, i + 1);
      el.style.setProperty('--d', Math.min(i, 5) * 85 + 'ms'); el.classList.add('kb-r');
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target; io.unobserve(el); el.classList.add('kb-in');
        setTimeout(function () { el.classList.remove('kb-r', 'kb-in'); el.style.removeProperty('--d'); }, 1500);
      });
    }, { threshold: .1, rootMargin: '0px 0px -6% 0px' });
    set.forEach(function (el) { io.observe(el); });
    /* страховка: то, что пользователь уже пролистал мимо, показываем сразу, без анимации */
    var idle = 0;
    w.addEventListener('scroll', function () {
      clearTimeout(idle);
      idle = setTimeout(function () {
        set.forEach(function (el) {
          if (el.classList.contains('kb-r') && el.getBoundingClientRect().bottom < -40) {
            io.unobserve(el); el.classList.remove('kb-r', 'kb-in'); el.style.removeProperty('--d');
          }
        });
      }, 300);
    }, { passive: true });
  }

  /* ---------- счётчики ---------- */
  function counters() {
    if (!('IntersectionObserver' in w)) return;
    var re = /^[\s\u00a0]*(\d[\d\s\u00a0]*)([.,]\d+)?[\s\u00a0]*([+%×x]?)[\s\u00a0]*$/;
    var els = Array.prototype.filter.call(d.querySelectorAll('main [class*="stat"],main [class*="kpi"],main [class*="metric"],main [class*="counter"]'), function (el) {
      if (el.children.length || el.closest('a,button,nav')) return false;
      var m = re.exec(el.textContent); if (!m) return false;
      var num = parseFloat((m[1] + (m[2] || '')).replace(/[\s\u00a0]/g, '').replace(',', '.'));
      return isFinite(num) && num > 9 && !(num >= 1900 && num <= 2100 && !/[\s\u00a0]/.test(m[1]));
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; var el = e.target; io.unobserve(el);
        var orig = el.textContent, m = re.exec(orig), sepM = /[\s\u00a0]/.exec(m[1].trim()), sep = sepM ? sepM[0] : '';
        var dec = m[2] || '', target = parseFloat((m[1] + dec).replace(/[\s\u00a0]/g, '').replace(',', '.'));
        var t0 = null, dur = 1500, decN = dec ? dec.length - 1 : 0; el.classList.add('kb-count');
        function fmt(v) {
          var s = v.toFixed(decN), parts = s.split('.');
          if (sep) parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, sep);
          return parts.join(dec ? dec[0] : '.') + (m[3] || '');
        }
        function step(t) {
          if (t0 === null) t0 = t; var p = clamp((t - t0) / dur, 0, 1), k = 1 - Math.pow(1 - p, 3);
          el.textContent = p < 1 ? fmt(target * k) : orig;
          if (p < 1) raf(step);
        }
        raf(step);
      });
    }, { threshold: .6 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- наклон карточек ---------- */
  function tilt() {
    if (!fine) return;
    Array.prototype.forEach.call(d.querySelectorAll('main .card--interactive,main .p-card,main .price-card,main .product-card,main .kb-card'), function (el) {
      if (el.closest(HERO)) return;
      el.classList.add('kbm-tilt'); var t = false, ev;
      el.addEventListener('pointermove', function (e) {
        ev = e; if (t) return; t = true;
        raf(function () {
          t = false; var r = el.getBoundingClientRect();
          el.style.setProperty('--ry', (((ev.clientX - r.left) / r.width - .5) * 7).toFixed(2) + 'deg');
          el.style.setProperty('--rx', ((.5 - (ev.clientY - r.top) / r.height) * 6).toFixed(2) + 'deg');
        });
      }, { passive: true });
      el.addEventListener('pointerenter', function () { el.classList.add('is-hover'); });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('is-hover'); el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
      });
    });
  }

  ready(function () {
    root.classList.add('kb-motion');
    scrollUi();
    if (reduce) return;
    heroFx(); reveal(); counters(); tilt();
  });
})();
