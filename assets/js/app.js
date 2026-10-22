/**
 * KONTURBIZ — app.js v2.9-PREMIUM
 * Только загрузка компонентов. Меню — исключительно navigation.js
 */
(function () {
    'use strict';

    var COMPONENTS = {
        header: {
            id: 'header',
            path: '/components/header.html',
            scripts: ['/assets/js/navigation.js']
        },
        footer: {
            id: 'footer',
            path: '/components/footer.html',
            scripts: []
        }
    };

    var componentCache = {};

    function loadComponent(config) {
        var el = document.getElementById(config.id);
        if (!el) {
            console.warn('[KONTURBIZ] #' + config.id + ' не найден');
            return;
        }
        if (componentCache[config.id]) {
            renderComponent(el, config.id, componentCache[config.id], config.scripts);
            return;
        }
        var xhr = new XMLHttpRequest();
        xhr.open('GET', config.path, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) return;
            if (xhr.status === 200 || xhr.status === 0) {
                componentCache[config.id] = xhr.responseText;
                renderComponent(el, config.id, xhr.responseText, config.scripts);
            } else {
                console.error('[KONTURBIZ] Ошибка ' + config.id + ':', xhr.status);
            }
        };
        xhr.send();
    }

    function renderComponent(el, id, html, scripts) {
        el.innerHTML = html;
        console.log('[KONTURBIZ] Компонент #' + id + ' загружен');
        if (id === 'header') {
            activateCurrentLink();
            loadScripts(scripts || [], function () {
                if (window.KONTURBIZ_NAV && typeof window.KONTURBIZ_NAV.init === 'function') {
                    window.KONTURBIZ_NAV.init();
                }
            });
        } else {
            loadScripts(scripts || []);
        }
    }

    function loadScripts(scripts, onDone) {
        if (!scripts || !scripts.length) {
            if (onDone) onDone();
            return;
        }
        var left = scripts.length;
        scripts.forEach(function (src) {
            var existing = document.querySelector('script[src="' + src + '"]');
            if (existing) {
                left -= 1;
                if (left === 0 && onDone) onDone();
                return;
            }
            var s = document.createElement('script');
            s.src = src;
            s.onload = s.onerror = function () {
                left -= 1;
                if (left === 0 && onDone) onDone();
            };
            document.body.appendChild(s);
        });
    }

    function activateCurrentLink() {
        var path = (window.location.pathname || '/').replace(/\/$/, '') || '/';
        document.querySelectorAll('.header__nav-link, .dropdown-link').forEach(function (link) {
            var href = link.getAttribute('href');
            if (!href || href === '#') return;
            var hp = href.replace(/\/$/, '');
            if (hp === path || (hp.length > 1 && path.indexOf(hp) === 0)) {
                link.classList.add('active');
                if (link.classList.contains('dropdown-link')) {
                    link.classList.add('dropdown-link--active');
                }
            }
        });
    }

    function init() {
        console.log('[KONTURBIZ] app.js · компоненты');
        Object.keys(COMPONENTS).forEach(function (k) {
            loadComponent(COMPONENTS[k]);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
