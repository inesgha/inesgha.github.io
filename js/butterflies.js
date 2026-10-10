/* =========================================================
   PAPILLONS ANIMÉS
   - Des papillons volent librement sur la page
   - Ils s'écartent quand la souris s'approche
   - Un clic sur une zone vide fait apparaître un nouveau papillon
   - Les éléments [data-butterfly] reçoivent un papillon "posé"
   ========================================================= */
(function () {
  'use strict';

  // Couleurs des ailes (dégradé de la couleur 1 vers la couleur 2)
  var PALETTES = [
    ['#c4b5fd', '#f9a8d4'], // lilas → rose
    ['#f0abfc', '#a78bfa'], // orchidée → violet
    ['#fbcfe8', '#c4b5fd'], // rose pâle → lavande
    ['#a78bfa', '#f472b6'], // violet → rose vif
    ['#e9d5ff', '#f9a8d4']  // lavande → rose
  ];

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var uid = 0;

  function rand(min, max) { return min + Math.random() * (max - min); }

  /* ---------- Dessin d'un papillon ---------- */
  function wingSVG(c1, c2) {
    var id = 'bfg' + (uid++);
    return (
      '<svg viewBox="0 0 50 64" aria-hidden="true">' +
        '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/>' +
        '</linearGradient></defs>' +
        // aile du haut
        '<path fill="url(#' + id + ')" stroke="rgba(76,29,149,.28)" stroke-width=".8" ' +
          'd="M0 30C4 10 26-4 44 4c10 5 6 22-8 27-12 3-26 2-36 1Z"/>' +
        // aile du bas
        '<path fill="url(#' + id + ')" stroke="rgba(76,29,149,.28)" stroke-width=".8" ' +
          'd="M0 33c14 1 34 5 36 17 1 10-12 16-22 8C6 52 2 42 0 35Z"/>' +
        // taches et nervures
        '<circle cx="33" cy="14" r="4.5" fill="#fff" opacity=".6"/>' +
        '<circle cx="40" cy="9" r="2" fill="#fff" opacity=".5"/>' +
        '<circle cx="23" cy="49" r="3" fill="#fff" opacity=".5"/>' +
        '<path d="M2 31C14 22 26 14 40 9M2 34c10 6 20 12 26 18" stroke="rgba(255,255,255,.55)" stroke-width="1" fill="none"/>' +
      '</svg>'
    );
  }

  function makeButterfly(opts) {
    opts = opts || {};
    var palette = PALETTES[opts.palette != null ? opts.palette % PALETTES.length : Math.floor(Math.random() * PALETTES.length)];
    var el = document.createElement('div');
    el.className = 'bf';
    el.style.setProperty('--size', (opts.size || 36) + 'px');
    el.style.setProperty('--flap', opts.flap || '0.3s');
    el.innerHTML =
      '<div class="bf__inner">' +
        '<div class="bf__wing bf__wing--l">' + wingSVG(palette[0], palette[1]) + '</div>' +
        '<div class="bf__body"></div>' +
        '<div class="bf__wing bf__wing--r">' + wingSVG(palette[0], palette[1]) + '</div>' +
      '</div>';
    // Décale le battement d'ailes pour que tous ne soient pas synchronisés
    var delay = (-Math.random()).toFixed(2) + 's';
    el.querySelectorAll('.bf__wing').forEach(function (w) { w.style.animationDelay = delay; });
    return el;
  }

  /* ---------- Papillons posés (sur la photo, etc.) ---------- */
  document.querySelectorAll('[data-butterfly]').forEach(function (spot) {
    spot.appendChild(makeButterfly({
      size: parseFloat(spot.dataset.size) || 48,
      flap: spot.dataset.flap || '1.2s',
      palette: spot.dataset.palette != null ? parseInt(spot.dataset.palette, 10) : null
    }));
  });

  /* ---------- Papillons volants ---------- */
  var layer = document.getElementById('butterfly-layer');
  if (!layer || reduceMotion) return;

  var W = window.innerWidth;
  var H = window.innerHeight;
  var mouse = { x: -9999, y: -9999 };
  var flyers = [];
  var MAX = 14;

  function angleDiff(a, b) {
    var d = a - b;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  function Flyer(x, y) {
    this.size = rand(26, 44);
    this.el = makeButterfly({ size: this.size, flap: rand(0.22, 0.34).toFixed(2) + 's' });
    this.x = x != null ? x : rand(0, W);
    this.y = y != null ? y : rand(0, H);
    this.angle = rand(0, Math.PI * 2);
    this.turn = 0;
    this.base = rand(0.7, 1.3);   // vitesse de croisière
    this.speed = this.base;
    this.phase = rand(0, 100);
    this.opacity = 0;
    layer.appendChild(this.el);
  }

  Flyer.prototype.update = function (dt, t) {
    // Changement de direction aléatoire et doux
    this.turn += rand(-0.006, 0.006) * dt;
    this.turn = Math.max(-0.035, Math.min(0.035, this.turn));
    this.angle += this.turn * dt;

    // Revient vers le centre s'il s'approche des bords
    var m = 50;
    if (this.x < m || this.x > W - m || this.y < m + 40 || this.y > H - m) {
      var toCenter = Math.atan2(H / 2 - this.y, W / 2 - this.x);
      this.angle += angleDiff(toCenter, this.angle) * 0.05 * dt;
    }

    // Fuit la souris
    var boost = 1;
    var dx = this.x - mouse.x, dy = this.y - mouse.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 150) {
      var away = Math.atan2(dy, dx);
      this.angle += angleDiff(away, this.angle) * 0.14 * dt;
      boost = 3.2;
    }

    this.speed += (this.base * boost - this.speed) * 0.06 * dt;
    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;

    // Petit mouvement de "flottement"
    var bob = Math.sin(t * 0.005 + this.phase) * 4;
    if (this.opacity < 1) this.opacity = Math.min(1, this.opacity + 0.02 * dt);

    var deg = this.angle * 180 / Math.PI + 90; // le papillon est dessiné tête vers le haut
    this.el.style.opacity = this.opacity;
    this.el.style.transform =
      'translate3d(' + (this.x - this.size / 2).toFixed(1) + 'px,' + (this.y - this.size / 3 + bob).toFixed(1) + 'px,0) rotate(' + deg.toFixed(1) + 'deg)';
  };

  var count = W < 600 ? 3 : W < 1100 ? 5 : 7;
  for (var i = 0; i < count; i++) flyers.push(new Flyer());

  var last = performance.now();
  function loop(now) {
    var dt = Math.min(3, (now - last) / 16.67);
    last = now;
    for (var i = 0; i < flyers.length; i++) flyers[i].update(dt, now);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.addEventListener('resize', function () { W = window.innerWidth; H = window.innerHeight; });
  window.addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) mouse.x = mouse.y = -9999; });

  // Clic sur une zone vide → un nouveau papillon s'envole
  document.addEventListener('click', function (e) {
    if (e.target.closest('a, button, input, textarea, label, select, .card')) return;
    var f;
    if (flyers.length >= MAX) {
      f = flyers.shift();
      f.el.remove();
    }
    f = new Flyer(e.clientX, e.clientY);
    f.opacity = 0.3;
    f.speed = 4;
    f.angle = -Math.PI / 2 + rand(-0.8, 0.8); // s'envole vers le haut
    flyers.push(f);
  });
})();
