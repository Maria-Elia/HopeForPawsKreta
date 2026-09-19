(function () {
  'use strict';
  var els = document.querySelectorAll('[data-reveal]');
  if (!els.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var root = document.documentElement;
  var alive = false;

  function show(el) { el.classList.add('is-revealed'); }
  function showAll() { els.forEach(show); }

  root.classList.add('reveal-ready');
  var io = new IntersectionObserver(function (entries) {
    alive = true;
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      show(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.2 });
  els.forEach(function (el) { io.observe(el); });

  setTimeout(function () { if (!alive) showAll(); }, 1500);
})();
