/**
 * KONTURBIZ — Конструктор цифрового контура
 * Версия: 1.0
 */
(function () {
  'use strict';

  var CONFIG = {
    dataUrl: '/data/contour.json',
    storageKey: 'konturbiz_contour',
    circumference: 603
  };

  var state = {
    modules: [],
    levels: [],
    selected: [],
    percent: 0,
    total: 0,
    level: null,
    nextId: null
  };

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  var dom = {};

  function cacheDom() {
    dom.modulesGrid = $('#contourModules');
    dom.circle = $('#contourCircle');
    dom.percent = $('#contourPercent');
    dom.levelLabel = $('#contourLevelLabel');
    dom.levelDesc = $('#contourLevelDesc');
    dom.selectedCount = $('#selectedCount');
    dom.totalPrice = $('#totalPrice');
    dom.recommendation = $('#contourRecommendation');
    dom.resetButton = $('#resetButton');
    dom.requestButton = $('#requestButton');
    dom.dialog = $('#requestDialog');
    dom.dialogClose = $('#dialogClose');
    dom.dialogPercent = $('#dialogPercent');
    dom.dialogModules = $('#dialogModules');
    dom.dialogPrice = $('#dialogPrice');
    dom.contourData = $('#contourData');
    dom.requestForm = $('#requestForm');
  }

  function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  }

  function getLevel(percent) {
    var levels = state.levels || [];
    for (var i = 0; i < levels.length; i++) {
      var lv = levels[i];
      if (percent >= lv.min && percent <= lv.max) return lv;
    }
    return { label: '—', description: '' };
  }

  function getModule(id) {
    for (var i = 0; i < state.modules.length; i++) {
      if (state.modules[i].id === id) return state.modules[i];
    }
    return null;
  }

  function getSelectedModules() {
    var result = [];
    for (var i = 0; i < state.selected.length; i++) {
      var m = getModule(state.selected[i]);
      if (m) result.push(m);
    }
    return result;
  }

  function getNextRecommendation() {
    var selectedIds = {};
    for (var i = 0; i < state.selected.length; i++) {
      selectedIds[state.selected[i]] = true;
    }

    var available = state.modules.filter(function (m) {
      return !selectedIds[m.id];
    });
    if (!available.length) return null;

    if (state.selected.length > 0) {
      var lastId = state.selected[state.selected.length - 1];
      var lastModule = getModule(lastId);
      if (lastModule && lastModule.recommendedNext) {
        for (var j = 0; j < lastModule.recommendedNext.length; j++) {
          var nextId = lastModule.recommendedNext[j];
          if (!selectedIds[nextId]) {
            var nextModule = getModule(nextId);
            if (nextModule) return nextModule;
          }
        }
      }
    }

    return available[0] || null;
  }

  function recalc() {
    var selectedModules = getSelectedModules();
    state.percent = selectedModules.reduce(function (sum, m) {
      return sum + (m.weight || 0);
    }, 0);
    if (state.percent > 100) state.percent = 100;
    state.total = selectedModules.reduce(function (sum, m) {
      return sum + (m.price || 0);
    }, 0);
    state.level = getLevel(state.percent);
    var next = getNextRecommendation();
    state.nextId = next ? next.id : null;
    return { selectedModules: selectedModules, next: next };
  }

  function render() {
    var result = recalc();
    var selectedModules = result.selectedModules;
    var next = result.next;

    var offset = CONFIG.circumference - (state.percent / 100) * CONFIG.circumference;
    if (dom.circle) {
      dom.circle.style.strokeDashoffset = String(Math.max(0, offset));
    }
    if (dom.percent) dom.percent.textContent = state.percent + '%';

    if (state.level) {
      if (dom.levelLabel) dom.levelLabel.textContent = state.level.label;
      if (dom.levelDesc) dom.levelDesc.textContent = state.level.description;
    }

    if (!dom.modulesGrid) return;
    dom.modulesGrid.innerHTML = '';

    state.modules.forEach(function (module) {
      var isSelected = state.selected.indexOf(module.id) !== -1;
      var isRecommended = state.nextId === module.id && !isSelected;

      var card = document.createElement('article');
      card.className = 'contour-module';
      if (isSelected) card.classList.add('contour-module--selected');
      if (isRecommended) card.classList.add('contour-module--recommended');
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute(
        'aria-pressed',
        isSelected ? 'true' : 'false'
      );
      card.setAttribute('aria-label', module.title + (isSelected ? ' — выбрано' : ''));

      card.innerHTML =
        '<div class="contour-module__category">' + (module.category || '') + '</div>' +
        '<div class="contour-module__title">' + module.title + '</div>' +
        '<div class="contour-module__desc">' + (module.description || '') + '</div>' +
        '<div class="contour-module__meta">' +
        '<span class="contour-module__price">' + formatPrice(module.price) + '</span>' +
        '<span class="contour-module__weight">+' + (module.weight || 0) + '%</span>' +
        '</div>' +
        '<div class="contour-module__status">' +
        (isSelected ? '✓ Выбрано' : (isRecommended ? '→ Рекомендуется' : '')) +
        '</div>' +
        (isSelected
          ? '<button type="button" class="contour-module__remove" data-id="' + module.id + '" aria-label="Убрать ' + module.title + '">✕</button>'
          : '');

      if (!isSelected) {
        card.addEventListener('click', function () {
          addModule(module.id);
        });
        card.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            addModule(module.id);
          }
        });
      }

      var removeBtn = card.querySelector('.contour-module__remove');
      if (removeBtn) {
        removeBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          removeModule(module.id);
        });
      }

      dom.modulesGrid.appendChild(card);
    });

    if (dom.recommendation) {
      if (next) {
        dom.recommendation.classList.add('contour-modules__recommendation--visible');
        dom.recommendation.innerHTML =
          '<div class="rec-label">Следующий логичный шаг</div>' +
          '<div class="rec-title">' + next.title + '</div>' +
          '<div class="rec-desc">' + (next.description || '') + '</div>' +
          '<div class="rec-actions">' +
          '<span class="rec-price">' + formatPrice(next.price) + '</span>' +
          '<button type="button" class="button button--gold button--sm" data-id="' + next.id + '">Добавить</button>' +
          '</div>';
        var addBtn = dom.recommendation.querySelector('button');
        if (addBtn) {
          addBtn.addEventListener('click', function () {
            addModule(next.id);
          });
        }
      } else {
        dom.recommendation.classList.remove('contour-modules__recommendation--visible');
        dom.recommendation.innerHTML = '';
      }
    }

    if (dom.selectedCount) dom.selectedCount.textContent = String(selectedModules.length);
    if (dom.totalPrice) dom.totalPrice.textContent = formatPrice(state.total);

    saveState();
  }

  function addModule(id) {
    if (state.selected.indexOf(id) !== -1) return;
    if (!getModule(id)) return;
    state.selected.push(id);
    render();
  }

  function removeModule(id) {
    state.selected = state.selected.filter(function (mid) {
      return mid !== id;
    });
    render();
  }

  function resetContour() {
    if (state.selected.length === 0) return;
    if (!window.confirm('Начать новую конфигурацию? Выбранные модули будут сняты.')) return;
    state.selected = [];
    render();
  }

  function saveState() {
    try {
      localStorage.setItem(
        CONFIG.storageKey,
        JSON.stringify({ modules: state.selected, timestamp: Date.now() })
      );
    } catch (e) { /* ignore */ }
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(CONFIG.storageKey);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (data.modules && Array.isArray(data.modules)) {
        state.selected = data.modules.filter(function (id) {
          return !!getModule(id);
        });
      }
    } catch (e) { /* ignore */ }
  }

  function encodeState() {
    var data = { m: state.selected };
    return btoa(encodeURIComponent(JSON.stringify(data)));
  }

  function decodeState(encoded) {
    try {
      var json = decodeURIComponent(atob(encoded));
      var data = JSON.parse(json);
      if (data.m && Array.isArray(data.m)) return data.m;
    } catch (e) { /* ignore */ }
    return null;
  }

  function loadFromURL() {
    var params = new URLSearchParams(window.location.search);
    var encoded = params.get('c');
    if (!encoded) return false;
    var ids = decodeState(encoded);
    if (!ids || !ids.length) return false;
    var valid = ids.filter(function (id) {
      return !!getModule(id);
    });
    if (!valid.length) return false;
    state.selected = valid;
    render();
    return true;
  }

  function shareURL() {
    var encoded = encodeState();
    return window.location.href.split('?')[0] + '?c=' + encoded;
  }

  function openDialog() {
    var selected = getSelectedModules();
    if (!selected.length) {
      window.alert('Выберите хотя бы один модуль.');
      return;
    }

    if (dom.dialogPercent) dom.dialogPercent.textContent = state.percent + '%';
    if (dom.dialogModules) {
      dom.dialogModules.innerHTML = selected
        .map(function (m) {
          return '<li>' + m.title + ' — ' + formatPrice(m.price) + '</li>';
        })
        .join('');
    }
    if (dom.dialogPrice) dom.dialogPrice.textContent = formatPrice(state.total);

    if (dom.contourData) {
      dom.contourData.value = JSON.stringify({
        modules: state.selected,
        percent: state.percent,
        total: state.total,
        share: shareURL()
      });
    }

    if (dom.dialog && typeof dom.dialog.showModal === 'function') {
      dom.dialog.showModal();
    }
  }

  function closeDialog() {
    if (dom.dialog && typeof dom.dialog.close === 'function') {
      dom.dialog.close();
    }
  }

  function submitForm(e) {
    e.preventDefault();
    var form = dom.requestForm;
    if (!form) return;

    // Backend endpoint may be absent in static MVP — fallback to contacts
    var data = new FormData(form);
    if (dom.contourData) data.set('contour', dom.contourData.value);

    var action = form.getAttribute('action') || '';
    if (!action || action.indexOf('/api/') === 0) {
      // Статический fallback: mailto / contacts
      closeDialog();
      var summary =
        'Контур: ' + state.percent + '%\n' +
        'Модули: ' + state.selected.join(', ') + '\n' +
        'Ориентир: ' + formatPrice(state.total);
      try {
        sessionStorage.setItem('konturbiz_contour_lead', summary);
      } catch (err) { /* ignore */ }
      window.location.href = '/pages/about/contacts.html?from=contour';
      return;
    }

    fetch(action, { method: form.method || 'POST', body: data })
      .then(function (response) {
        if (response.ok) {
          closeDialog();
          window.alert('Заявка отправлена. Мы свяжемся с вами в ближайшее время.');
        } else {
          window.alert('Не удалось отправить заявку. Попробуйте позже или напишите нам.');
        }
      })
      .catch(function () {
        window.alert('Ошибка сети. Проверьте подключение и попробуйте снова.');
      });
  }

  function init() {
    cacheDom();

    fetch(CONFIG.dataUrl)
      .then(function (res) {
        if (!res.ok) throw new Error('Не удалось загрузить данные');
        return res.json();
      })
      .then(function (data) {
        state.modules = data.modules || [];
        state.levels = data.levels || [];

        var fromUrl = loadFromURL();
        if (!fromUrl) loadState();
        render();

        window.__contourShare = shareURL;
      })
      .catch(function (err) {
        console.error('[KONTURBIZ Contour]', err);
        if (dom.modulesGrid) {
          dom.modulesGrid.innerHTML =
            '<p style="color:#E53E3E;">Не удалось загрузить модули. Обновите страницу.</p>';
        }
      });

    if (dom.resetButton) dom.resetButton.addEventListener('click', resetContour);
    if (dom.requestButton) dom.requestButton.addEventListener('click', openDialog);
    if (dom.dialogClose) dom.dialogClose.addEventListener('click', closeDialog);
    if (dom.dialog) {
      dom.dialog.addEventListener('click', function (e) {
        if (e.target === dom.dialog) closeDialog();
      });
    }
    if (dom.requestForm) dom.requestForm.addEventListener('submit', submitForm);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && dom.dialog && dom.dialog.open) closeDialog();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
