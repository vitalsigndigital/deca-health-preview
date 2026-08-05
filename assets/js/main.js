/* DECA Health and Wellness — interactions */
(function () {
  'use strict';

  /* ---- Sticky header shadow ---- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 12);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---- Mobile nav ---- */
  var toggle = document.querySelector('.nav-toggle');
  var mnav = document.querySelector('.mobile-nav');
  var backdrop = document.querySelector('.nav-backdrop');
  var closeBtn = document.querySelector('.mnav-close');

  function openNav() {
    if (!mnav) return;
    mnav.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
    document.body.classList.add('nav-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
  }
  function closeNav() {
    if (!mnav) return;
    mnav.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    document.body.classList.remove('nav-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }
  if (toggle) toggle.addEventListener('click', openNav);
  if (closeBtn) closeBtn.addEventListener('click', closeNav);
  if (backdrop) backdrop.addEventListener('click', closeNav);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });
  if (mnav) {
    mnav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeNav);
    });
  }

  /* ---- Scroll reveal ---- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- FAQ accordion ---- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    var a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.setAttribute('aria-expanded', 'false');
    q.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      // close siblings within same .faq group
      var group = item.closest('.faq');
      if (group) {
        group.querySelectorAll('.faq-item.open').forEach(function (other) {
          if (other !== item) {
            other.classList.remove('open');
            var oa = other.querySelector('.faq-a');
            var oq = other.querySelector('.faq-q');
            if (oa) oa.style.maxHeight = null;
            if (oq) oq.setAttribute('aria-expanded', 'false');
          }
        });
      }
      item.classList.toggle('open', !isOpen);
      q.setAttribute('aria-expanded', String(!isOpen));
      a.style.maxHeight = !isOpen ? a.scrollHeight + 'px' : null;
    });
  });
  window.addEventListener('resize', function () {
    document.querySelectorAll('.faq-item.open .faq-a').forEach(function (a) {
      a.style.maxHeight = a.scrollHeight + 'px';
    });
  });

  /* ---- Year ---- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---- Contact / booking form validation ---- */
  var form = document.querySelector('form[data-appointment]');
  if (form) {
    var setError = function (field, on) {
      field.classList.toggle('invalid', on);
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      form.querySelectorAll('[required]').forEach(function (input) {
        var field = input.closest('.field');
        if (!field) return;
        var ok = true;
        if (input.type === 'email') {
          ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
        } else if (input.type === 'tel') {
          ok = input.value.replace(/\D/g, '').length >= 10;
        } else {
          ok = input.value.trim().length > 0;
        }
        setError(field, !ok);
        if (!ok && valid) { input.focus(); }
        if (!ok) valid = false;
      });
      if (!valid) return;

      var btn = form.querySelector('[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      // Placeholder submit — wire to real booking/endpoint here.
      setTimeout(function () {
        var card = form.closest('.form-card') || document;
        var success = card.querySelector('.form-success');
        var fields = card.querySelector('.form-fields');
        if (success && fields) {
          fields.style.display = 'none';
          success.classList.add('show');
          success.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 900);
    });
    // clear error on input
    form.querySelectorAll('input, select, textarea').forEach(function (input) {
      input.addEventListener('input', function () {
        var field = input.closest('.field');
        if (field) field.classList.remove('invalid');
      });
    });
  }
})();
