(function () {
  'use strict';

  var KEY = 'hfp_cookie_consent';
  var CATEGORIES = [
    {
      id: 'necessary',
      title: 'Unbedingt erforderliche Cookies',
      text: 'Diese Cookies werden für grundlegende Funktionen wie Sicherheit, Identitätsprüfung und Netzwerkmanagement benötigt. Sie können daher nicht deaktiviert werden.',
      locked: true
    },
    {
      id: 'marketing',
      title: 'Marketing-Cookies',
      text: 'Diese Cookies werden verwendet, um die Effektivität von Werbung zu messen, einen personalisierten Service zu bieten und Werbeanzeigen an Besucherbedürfnisse anzupassen.'
    },
    {
      id: 'functional',
      title: 'Funktionale Cookies',
      text: 'Diese Cookies werden verwendet, um Nutzerangaben zu speichern und ein verbessertes und personalisiertes Nutzererlebnis anzubieten. Dazu zählen eingebettete Inhalte wie die Google-Maps-Karte.'
    },
    {
      id: 'analytics',
      title: 'Analytics-Cookies',
      text: 'Diese Cookies werden verwendet, um zu verstehen, wie Besucher mit unserer Website interagieren, um Fehler zu entdecken und verbesserte Analysedaten zu bieten.'
    }
  ];

  var dialog = null;
  var lastFocus = null;

  function readConsent() {
    var raw;
    try { raw = localStorage.getItem(KEY); } catch (e) { return null; }
    if (!raw) return null;
    if (raw === 'accepted') return { functional: true, marketing: true, analytics: true };
    if (raw === 'declined') return { functional: false, marketing: false, analytics: false };
    try {
      var o = JSON.parse(raw);
      return { functional: !!o.functional, marketing: !!o.marketing, analytics: !!o.analytics };
    } catch (e) {
      return null;
    }
  }

  function hasCookieConsent(category) {
    var c = readConsent();
    return !!(c && c[category || 'analytics']);
  }
  window.hasCookieConsent = hasCookieConsent;

  function save(consent) {
    try { localStorage.setItem(KEY, JSON.stringify(consent)); } catch (e) { }
    var banner = document.getElementById('cookie-banner');
    if (banner) banner.hidden = true;
    renderMaps();
    document.dispatchEvent(new CustomEvent('cookie-consent:changed', { detail: consent }));
    if (consent.functional || consent.marketing || consent.analytics) {
      document.dispatchEvent(new CustomEvent('cookie-consent:accepted', { detail: consent }));
    }
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function buildDialog() {
    var d = el('dialog', 'cc-dialog');
    d.setAttribute('aria-labelledby', 'cc-title');

    var close = el('button', 'cc-dialog__close');
    close.type = 'button';
    close.setAttribute('aria-label', 'Einstellungen schließen');
    close.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    close.addEventListener('click', function () { d.close(); });

    var title = el('h2', 'cc-dialog__title', 'Erweiterte Cookie-Einstellungen');
    title.id = 'cc-title';

    var list = el('div', 'cc-dialog__list');
    var current = readConsent() || { functional: false, marketing: false, analytics: false };

    CATEGORIES.forEach(function (cat) {
      var row = el('div', 'cc-row');
      var head = el('div', 'cc-row__head');
      var h3 = el('h3', 'cc-row__title', cat.title);
      var sw = el('label', 'cc-switch');
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.name = cat.id;
      input.setAttribute('aria-label', cat.title);
      if (cat.locked) { input.checked = true; input.disabled = true; }
      else { input.checked = !!current[cat.id]; }
      sw.appendChild(input);
      sw.appendChild(el('span', 'cc-switch__track'));
      head.appendChild(h3);
      head.appendChild(sw);
      row.appendChild(head);
      row.appendChild(el('p', 'cc-row__text', cat.text));
      list.appendChild(row);
    });

    var foot = el('div', 'cc-dialog__foot');
    var confirm = el('button', 'cc-dialog__confirm', 'Auswahl bestätigen');
    confirm.type = 'button';
    confirm.addEventListener('click', function () {
      var chosen = { functional: false, marketing: false, analytics: false };
      list.querySelectorAll('input[type=checkbox]:not(:disabled)').forEach(function (i) {
        chosen[i.name] = i.checked;
      });
      save(chosen);
      d.close();
    });
    foot.appendChild(confirm);

    d.appendChild(close);
    d.appendChild(title);
    d.appendChild(list);
    d.appendChild(foot);

    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    d.addEventListener('close', function () {
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    });

    document.body.appendChild(d);
    return d;
  }

  function openCookieSettings(opener) {
    lastFocus = opener || document.activeElement;
    if (dialog) dialog.remove();
    dialog = buildDialog();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }
  window.openCookieSettings = openCookieSettings;

  function mapUrl(query) {
    return 'https://www.google.com/maps?q=' + encodeURIComponent(query) + '&hl=de&z=15&output=embed';
  }

  function renderMaps() {
    var allowed = hasCookieConsent('functional');
    document.querySelectorAll('.gmap').forEach(function (box) {
      var query = box.getAttribute('data-map-query');
      var label = box.getAttribute('data-map-label') || query;
      box.textContent = '';

      if (allowed) {
        var frame = document.createElement('iframe');
        frame.className = 'gmap__frame';
        frame.src = mapUrl(query);
        frame.title = 'Karte: ' + label;
        frame.loading = 'lazy';
        frame.referrerPolicy = 'no-referrer-when-downgrade';
        frame.setAttribute('allowfullscreen', '');
        box.appendChild(frame);
        return;
      }

      var ph = el('div', 'gmap__placeholder');
      ph.appendChild(el('p', 'gmap__title', 'Karte: ' + label));
      ph.appendChild(el('p', 'gmap__text',
        'Für die Anzeige der Google-Maps-Karte werden Daten an Google übertragen und Cookies gesetzt. ' +
        'Dafür ist deine Zustimmung zu funktionalen Cookies nötig.'));
      var actions = el('div', 'gmap__actions');
      var load = el('button', 'gmap__btn', 'Karte laden');
      load.type = 'button';
      load.addEventListener('click', function () {
        var c = readConsent() || { functional: false, marketing: false, analytics: false };
        c.functional = true;
        save(c);
      });
      var settings = el('button', 'gmap__link', 'Cookie-Einstellungen');
      settings.type = 'button';
      settings.addEventListener('click', function () { openCookieSettings(settings); });
      var ext = el('a', 'gmap__link', 'Auf Google Maps öffnen');
      ext.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);
      ext.target = '_blank';
      ext.rel = 'noopener';
      actions.appendChild(load);
      actions.appendChild(settings);
      actions.appendChild(ext);
      ph.appendChild(actions);
      box.appendChild(ph);
    });
  }

  function initCookieBanner() {
    var banner = document.getElementById('cookie-banner');
    if (banner) {
      if (!readConsent()) banner.hidden = false;

      var accept = document.getElementById('cookie-accept');
      var decline = document.getElementById('cookie-decline');
      var settings = document.getElementById('cookie-settings');
      if (accept) accept.addEventListener('click', function () {
        save({ functional: true, marketing: true, analytics: true });
      });
      if (decline) decline.addEventListener('click', function () {
        save({ functional: false, marketing: false, analytics: false });
      });
      if (settings) settings.addEventListener('click', function () { openCookieSettings(settings); });
    }

    document.querySelectorAll('[data-cookie-settings]').forEach(function (b) {
      b.addEventListener('click', function () { openCookieSettings(b); });
    });

    renderMaps();
  }

  document.addEventListener('DOMContentLoaded', initCookieBanner);
})();
