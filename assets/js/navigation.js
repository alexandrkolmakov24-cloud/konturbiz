/* KONTURBIZ header navigation — single burger + accordion (v2026-09-19-d) */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var burger = document.getElementById('burger-menu') ||
                 document.querySelector('.burger-menu');
    var nav = document.getElementById('main-nav') ||
              document.querySelector('.header__nav');
    if (!burger || !nav) return;
    if (burger.getAttribute('data-burger-bound') === '1') return;
    burger.setAttribute('data-burger-bound', '1');

    var overlay = document.querySelector('.nav-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'nav-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      document.body.appendChild(overlay);
    }

    function closeNav() {
      nav.classList.remove('is-open');
      burger.classList.remove('is-active');
      burger.setAttribute('aria-expanded', 'false');
      overlay.classList.remove('is-visible');
      document.body.classList.remove('no-scroll');
      nav.querySelectorAll('.dropdown.open').forEach(function (el) {
        el.classList.remove('open');
      });
    }

    function openNav() {
      nav.classList.add('is-open');
      burger.classList.add('is-active');
      burger.setAttribute('aria-expanded', 'true');
      overlay.classList.add('is-visible');
      document.body.classList.add('no-scroll');
    }

    function isMobile() {
      return window.matchMedia('(max-width: 1024px)').matches;
    }

    burger.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (nav.classList.contains('is-open')) closeNav();
      else openNav();
    });

    overlay.addEventListener('click', closeNav);

    /* Level 2 accordion */
    nav.querySelectorAll('.header__menu > .dropdown > .header__nav-link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        if (!isMobile()) return;
        var parent = link.closest('.dropdown');
        if (!parent) return;
        var submenu = parent.querySelector('.dropdown-menu');
        if (!submenu) return;
        e.preventDefault();
        e.stopPropagation();
        var wasOpen = parent.classList.contains('open');
        nav.querySelectorAll('.header__menu > .dropdown.open').forEach(function (el) {
          if (el !== parent) el.classList.remove('open');
        });
        parent.classList.toggle('open', !wasOpen);
      });
    });

    /* Level 3 accordion — Русский цифровой / СКБ Контур */
    nav.querySelectorAll('.dropdown--sub > .dropdown-link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        if (!isMobile()) return;
        var parent = link.closest('.dropdown--sub');
        if (!parent) return;
        var submenu = parent.querySelector('.dropdown-menu');
        if (!submenu) return;
        e.preventDefault();
        e.stopPropagation();
        /* close other level-3 in same parent */
        var grand = parent.parentElement;
        if (grand) {
          grand.querySelectorAll('.dropdown--sub.open').forEach(function (el) {
            if (el !== parent) el.classList.remove('open');
          });
        }
        parent.classList.toggle('open');
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
  });
})();
