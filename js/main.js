/* =========================================================
   INTERACTIONS DU SITE
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Mode sombre ---------- */
  var themeBtn = document.getElementById('theme-toggle');

  function updateThemeLabel() {
    var dark = root.getAttribute('data-theme') === 'dark';
    themeBtn.setAttribute('aria-label', dark ? 'Activer le mode clair' : 'Activer le mode sombre');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0f0e13' : '#fcfcfd');
  }

  themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    updateThemeLabel();
  });
  updateThemeLabel();

  /* ---------- 2. Étoiles (visibles en mode sombre) ---------- */
  var stars = document.getElementById('stars');
  if (stars) {
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 60; i++) {
      var s = document.createElement('span');
      s.className = 'star';
      s.style.left = (Math.random() * 100).toFixed(2) + '%';
      s.style.top = (Math.random() * 100).toFixed(2) + '%';
      s.style.animationDelay = (-Math.random() * 3).toFixed(2) + 's';
      s.style.animationDuration = (2 + Math.random() * 3).toFixed(2) + 's';
      if (Math.random() > 0.8) { s.style.width = s.style.height = '3px'; }
      frag.appendChild(s);
    }
    stars.appendChild(frag);
  }

  /* ---------- 3. Menu mobile ---------- */
  var burger = document.getElementById('nav-burger');
  var menu = document.getElementById('nav-menu');

  function closeMenu() {
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Ouvrir le menu');
  }
  burger.addEventListener('click', function () {
    var open = menu.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  });
  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- 4. Barre de navigation au défilement ---------- */
  var nav = document.getElementById('nav');
  function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 10); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 5. Lien actif selon la section visible ---------- */
  var links = document.querySelectorAll('.nav__link');
  var sections = document.querySelectorAll('main section[id]');
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (l) {
          l.classList.toggle('is-active', l.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- 6. Apparition au défilement + compteurs ---------- */
  function animateCount(el) {
    var target = parseInt(el.dataset.count, 10) || 0;
    if (reduceMotion) { el.textContent = target; return; }
    var start = null, duration = 1600;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        entry.target.querySelectorAll('[data-count]').forEach(animateCount);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
    document.querySelectorAll('[data-count]').forEach(animateCount);
  }

  /* ---------- 7. Texte qui s'écrit tout seul ---------- */
  var typed = document.getElementById('typed');
  // Modifie ces phrases comme tu veux :
  var roles = [
    'Développeuse Systèmes d\'Information',
    'Développeuse web full-stack',
    'Symfony · .NET · React',
    'En recherche de stage PFE'
  ];
  if (typed && !reduceMotion) {
    var r = 0, c = roles[0].length, deleting = true;
    function tick() {
      var word = roles[r];
      if (deleting) {
        c--;
        if (c <= 0) { deleting = false; r = (r + 1) % roles.length; }
      } else {
        c++;
      }
      word = roles[r];
      typed.textContent = word.slice(0, c);
      var delay = deleting ? 40 : 85;
      if (!deleting && c >= word.length) { deleting = true; delay = 2200; }
      setTimeout(tick, delay);
    }
    setTimeout(tick, 2200);
  }

  /* ---------- 8. Filtres des projets ---------- */
  var filters = document.querySelectorAll('.filter');
  var projects = document.querySelectorAll('.project');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.dataset.filter;
      filters.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      projects.forEach(function (p) {
        var show = f === 'all' || p.dataset.category === f;
        p.classList.toggle('is-hidden', !show);
        if (show) p.classList.add('is-visible');
      });
    });
  });

  /* ---------- 9. Formulaire de contact ---------- */
  var form = document.getElementById('contact-form');
  var toast = document.getElementById('toast');
  var errorBox = document.getElementById('form-error');

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(showToast.t);
    showToast.t = setTimeout(function () { toast.classList.remove('is-visible'); }, 4000);
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fName = document.getElementById('f-name');
      var fEmail = document.getElementById('f-email');
      var fMessage = document.getElementById('f-message');
      var name = fName.value.trim();
      var email = fEmail.value.trim();
      var message = fMessage.value.trim();
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      [fName, fEmail, fMessage].forEach(function (f) { f.classList.remove('is-invalid'); });

      if (!name || !emailOk || !message) {
        if (!name) fName.classList.add('is-invalid');
        if (!emailOk) fEmail.classList.add('is-invalid');
        if (!message) fMessage.classList.add('is-invalid');
        errorBox.textContent = !emailOk && email ? 'Cette adresse e-mail ne semble pas valide.' : 'Merci de remplir tous les champs.';
        return;
      }
      errorBox.textContent = '';

      var to = form.dataset.email;
      var subject = 'Message de ' + name + ' via ton portfolio';
      var body = message + '\n\n— ' + name + ' (' + email + ')';
      window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      showToast('Votre application e-mail s\'ouvre avec le message prêt à envoyer.');
      form.reset();
    });
  }

  /* ---------- 10. Année du pied de page ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
