/* ===================================================================
   BLENDING BEATZ — site configuration (edit this block)
   =================================================================== */
const EVENT_START = '2026-10-30T14:30:00+05:30';   // 30 Oct 2026, 2.30 PM (Sri Lanka time)

/* ARTIST REVEAL
   - Leave `name` empty  -> the card stays sealed.
   - Fill in `name` (and optionally role + img) -> the card flips open and reveals the artist.
   - Set REVEAL_AT to a date/time to keep everything sealed until then (auto-reveals at that moment).
   - Preview the revealed look any time with:  index.html?reveal                                   */
const REVEAL_AT = null;   // e.g. '2026-10-25T18:00:00+05:30'
const ARTISTS = [
  { title: 'The Headline Act', name: '', role: '', img: '' },          // img e.g. 'assets/artists/headline.jpg'
  { title: 'Special Guest',    name: '', role: '', img: '' },
  { title: 'Special Guest',    name: '', role: '', img: '' }
];

/* INVITED SCHOOLS — add { name, logo } entries. Empty `name` shows a "Joining soon" slot. */
const SCHOOLS = [
  // { name: 'Example College', logo: 'assets/schools/example.png' },
  { name: '', logo: '' }, { name: '', logo: '' }, { name: '', logo: '' }, { name: '', logo: '' },
  { name: '', logo: '' }, { name: '', logo: '' }, { name: '', logo: '' }, { name: '', logo: '' }
];

/* ===================================================================
   Helpers
   =================================================================== */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const PREVIEW = new URLSearchParams(location.search).has('reveal');

/* Dharma-wheel ornament (inline SVG, inherits currentColor) */
function wheelSVG() {
  let s = '<svg viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">';
  s += '<circle cx="100" cy="100" r="96"/><circle cx="100" cy="100" r="90" stroke-width=".6"/>';
  for (let i = 0; i < 24; i++) s += `<circle cx="100" cy="20" r="3.2" transform="rotate(${i * 15} 100 100)"/>`;
  for (let i = 0; i < 8; i++) {
    s += `<path d="M100 100V30" transform="rotate(${i * 45} 100 100)"/>`;
    s += `<path d="M100 34C87 50 87 64 100 76C113 64 113 50 100 34Z" transform="rotate(${i * 45 + 22.5} 100 100)"/>`;
  }
  s += '<circle cx="100" cy="100" r="26"/><circle cx="100" cy="100" r="8" fill="currentColor"/></svg>';
  return s;
}
const WHEEL = wheelSVG();
function injectWheels(root = document) { $$('[data-wheel]', root).forEach(el => { if (!el.firstChild) el.innerHTML = WHEEL; }); }

/* Images that fail to load: logo slots fall back to text, optional art hides */
function handleBroken(img) {
  const slot = img.closest('.logo-slot');
  if (slot) slot.classList.add('missing');
  else if (img.hasAttribute('data-opt')) img.style.display = 'none';
}
document.addEventListener('error', e => { if (e.target.tagName === 'IMG') handleBroken(e.target); }, true);
$$('img').forEach(img => { if (img.complete && img.naturalWidth === 0) handleBroken(img); });

/* ===================================================================
   Sound — synthesised war drums (no audio files needed)
   =================================================================== */
let ac = null, soundOn = true;
function initAudio() {
  if (ac) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (AC) ac = new AC();
  if (ac && ac.state === 'suspended') ac.resume();
}
function noise(dur) {
  const b = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const n = ac.createBufferSource(); n.buffer = b; return n;
}
function drum(t, f0 = 170, f1 = 42, vol = .9, dur = .55) {
  if (!ac || !soundOn) return;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur * .6);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + .05);
  const n = noise(.12), ng = ac.createGain(), bp = ac.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 900;
  ng.gain.setValueAtTime(vol * .35, t); ng.gain.exponentialRampToValueAtTime(.001, t + .12);
  n.connect(bp).connect(ng).connect(ac.destination); n.start(t);
}
function crash(t, dur = 2.2) {
  if (!ac || !soundOn) return;
  const n = noise(dur), g = ac.createGain(), hp = ac.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 3500;
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.35, t + .05); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  n.connect(hp).connect(g).connect(ac.destination); n.start(t);
}
function playIntro() {
  if (!ac) return;
  const t = ac.currentTime + .05;
  drum(t, 160, 45, .8); drum(t + .5, 160, 45, .85); drum(t + 1.0, 180, 40, .95);
  drum(t + 1.4, 120, 30, 1.2, 1.2); crash(t + 1.4);
}
$('#sound').addEventListener('click', e => {
  soundOn = !soundOn;
  e.currentTarget.setAttribute('aria-pressed', String(soundOn));
});

/* ===================================================================
   Intro: curtain + drums
   =================================================================== */
const curtain = $('#curtain'), flash = $('#flash');
let entered = false;
function pulse(big) {
  const p = document.createElement('div');
  p.className = 'pulse' + (big ? ' big' : '');
  curtain.appendChild(p);
  setTimeout(() => p.remove(), 1700);
}
function enter() {
  if (entered) return; entered = true;
  initAudio(); playIntro();
  if (reduce) { finish(); return; }
  pulse(); setTimeout(pulse, 500); setTimeout(pulse, 1000);
  setTimeout(() => {
    pulse(true);
    flash.classList.add('go');
    document.body.classList.add('open');
  }, 1400);
  setTimeout(() => document.body.classList.add('entered'), 1900);
  setTimeout(() => { curtain.remove(); document.body.classList.remove('locked'); onScroll(); }, 4300);
}
function finish() {
  document.body.classList.add('open', 'entered');
  curtain.remove(); document.body.classList.remove('locked');
}
$('#enter').addEventListener('click', enter);
document.addEventListener('keydown', e => { if (!entered && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); enter(); } });

/* ===================================================================
   Embers (canvas)
   =================================================================== */
(function embers() {
  const cv = $('#embers'), cx = cv.getContext('2d');
  if (reduce) { cv.remove(); return; }
  let W, H, d, P = [];
  const N = () => (innerWidth < 700 ? 38 : 85);
  const rnd = (a, b) => a + Math.random() * (b - a);
  function spawn(init) {
    return { x: rnd(0, W), y: init ? rnd(0, H) : H + rnd(0, 40 * d), r: rnd(.6, 2.6) * d, vy: rnd(.35, 1.3) * d, vx: rnd(-.25, .25) * d,
             ph: rnd(0, 6.28), sp: rnd(.01, .035), a: rnd(.35, 1), h: rnd(22, 42) };
  }
  function size() {
    d = Math.min(devicePixelRatio || 1, 2);
    W = cv.width = innerWidth * d; H = cv.height = innerHeight * d;
    cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
    P = Array.from({ length: N() }, () => spawn(true));
  }
  function frame() {
    cx.clearRect(0, 0, W, H);
    cx.globalCompositeOperation = 'lighter';
    for (const p of P) {
      p.ph += p.sp; p.x += p.vx + Math.sin(p.ph) * .5 * d; p.y -= p.vy;
      const fade = Math.min(1, p.y / (H * .5)) * p.a * (.6 + .4 * Math.sin(p.ph * 3));
      const g = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      g.addColorStop(0, `hsla(${p.h},100%,65%,${fade})`);
      g.addColorStop(1, `hsla(${p.h},100%,50%,0)`);
      cx.fillStyle = g; cx.beginPath(); cx.arc(p.x, p.y, p.r * 4, 0, 6.283); cx.fill();
      if (p.y < -10) Object.assign(p, spawn(false));
    }
    requestAnimationFrame(frame);
  }
  size(); addEventListener('resize', size); frame();
})();

/* ===================================================================
   Countdown
   =================================================================== */
const TARGET = new Date(EVENT_START).getTime();
const cdEls = { d: $('[data-u="d"]'), h: $('[data-u="h"]'), m: $('[data-u="m"]'), s: $('[data-u="s"]') };
const pad = n => String(n).padStart(2, '0');
function setNum(el, v) { if (el.textContent !== v) { el.textContent = v; el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); } }
function tick() {
  const diff = TARGET - Date.now(), note = $('#cdNote');
  if (diff <= 0) {
    $('#countdown').style.display = 'none';
    note.classList.add('live');
    note.textContent = diff > -9 * 36e5 ? 'The rhythm has begun' : 'Thank you for blending beats with us';
    return;
  }
  const s = Math.floor(diff / 1000);
  setNum(cdEls.d, pad(Math.floor(s / 86400)));
  setNum(cdEls.h, pad(Math.floor(s % 86400 / 3600)));
  setNum(cdEls.m, pad(Math.floor(s % 3600 / 60)));
  setNum(cdEls.s, pad(s % 60));
}
tick(); setInterval(tick, 1000);

/* ===================================================================
   Nav, menu, scroll reveals, hero parallax
   =================================================================== */
const nav = $('#nav');
function onScroll() { nav.classList.toggle('solid', scrollY > 60); }
addEventListener('scroll', onScroll, { passive: true }); onScroll();
$('#burger').addEventListener('click', () => document.body.classList.toggle('menu'));
$$('#navLinks a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu')));

const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
$$('.rv').forEach(el => io.observe(el));

const hero = $('.hero');
if (matchMedia('(hover:hover)').matches && !reduce) {
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--px', ((e.clientX - r.left) / r.width - .5).toFixed(3));
    hero.style.setProperty('--py', ((e.clientY - r.top) / r.height - .5).toFixed(3));
  });
}

/* ticket tilt */
$$('[data-tilt]').forEach(el => {
  el.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    el.style.transform = `perspective(900px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.02)`;
  });
  el.addEventListener('pointerleave', () => { el.style.transform = ''; });
});

/* ===================================================================
   Artist reveal
   =================================================================== */
(function artists() {
  const wrap = $('#artists'), note = $('#revealNote');
  const timeOpen = !REVEAL_AT || Date.now() >= new Date(REVEAL_AT).getTime();
  const items = ARTISTS.map((a, i) => {
    const name = a.name || (PREVIEW ? 'Artist Name' : '');
    return { ...a, name, open: !!name && (timeOpen || PREVIEW) };
  });
  const sil = '<svg viewBox="0 0 200 260"><path d="M100 30c26 0 44 20 44 48 0 22-12 40-26 48 40 8 68 30 74 134H8c6-104 34-126 74-134-14-8-26-26-26-48 0-28 18-48 44-48z"/></svg>';
  wrap.innerHTML = items.map((a, i) => `
    <div class="acard rv${a.open ? ' open' : ''}" style="--d:${i * .12}s" tabindex="0" role="button" aria-label="${a.open ? a.name : 'Sealed — to be revealed'}">
      <div class="ai">
        <div class="af front">
          <div class="wm" data-wheel></div>
          <div class="sil">${sil}</div>
          <div class="q">?</div>
          <div class="seal">BB</div>
          <div class="ttl">${a.title}</div>
          <div class="st">Sealed</div>
        </div>
        <div class="af back">
          ${a.img ? `<img src="${a.img}" alt="${a.name}" data-opt>` : `<div class="ph-init">${(a.name || '?').trim().charAt(0)}</div>`}
          <div class="bt"><div class="ttl">${a.title}</div><h3>${a.name}</h3>${a.role ? `<p>${a.role}</p>` : ''}</div>
        </div>
      </div>
    </div>`).join('');
  injectWheels(wrap);

  const cards = $$('.acard', wrap);
  cards.forEach(c => {
    const open = c.classList.contains('open');
    const act = () => {
      if (open) { c.classList.toggle('flip'); return; }
      c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake');
      note.textContent = 'The seal holds. The rhythm is not ready yet.';
    };
    c.addEventListener('click', act);
    c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
  });
  const flipObs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && e.target.classList.contains('open')) {
      const idx = cards.indexOf(e.target);
      setTimeout(() => { e.target.classList.add('flip'); }, 700 + idx * 350);
      flipObs.unobserve(e.target);
    }
  }), { threshold: .5 });
  cards.forEach(c => { flipObs.observe(c); io.observe(c); });

  function updateNote() {
    if (items.some(a => a.open)) { note.textContent = 'Revealed. Tap a card to flip it back.'; return; }
    if (REVEAL_AT && !timeOpen) {
      const s = Math.max(0, Math.floor((new Date(REVEAL_AT).getTime() - Date.now()) / 1000));
      note.textContent = `The seal breaks in ${Math.floor(s / 86400)}d ${pad(Math.floor(s % 86400 / 3600))}h ${pad(Math.floor(s % 3600 / 60))}m ${pad(s % 60)}s`;
    } else {
      note.textContent = 'To be revealed. Stay tuned.';
    }
  }
  updateNote(); setInterval(() => { if (REVEAL_AT && !timeOpen) updateNote(); }, 1000);
  if (REVEAL_AT && !timeOpen) setTimeout(() => location.reload(), Math.min(2147483000, new Date(REVEAL_AT).getTime() - Date.now() + 500));
})();

/* ===================================================================
   Invited schools
   =================================================================== */
(function schools() {
  $('#schoolGrid').innerHTML = SCHOOLS.map((s, i) => `
    <div class="school rv${s.name ? '' : ' soon'}" style="--d:${(i % 8) * .06}s">
      <div class="crest logo-slot">
        ${s.logo ? `<img src="${s.logo}" alt="${s.name}">` : ''}
        ${s.name ? `<span class="fb">${s.name.trim().charAt(0)}</span>` : ''}
        ${!s.logo && !s.name ? '<div class="ghost" data-wheel></div>' : ''}
      </div>
      <p>${s.name || 'Joining soon'}</p>
    </div>`).join('');
  injectWheels($('#schoolGrid'));
  $$('#schoolGrid .rv').forEach(el => io.observe(el));
  $$('#schoolGrid img').forEach(img => { if (img.complete && img.naturalWidth === 0) handleBroken(img); });
})();

/* ===================================================================
   3D auditorium — seating follows the two ticket categories
   (front rows = LKR 3000, rear rows = LKR 2000). Illustrative layout:
   change ROWS / Z3_ROWS to match the real hall.
   =================================================================== */
(function hall() {
  const ROWS = 16, Z3_ROWS = 6;
  const model = $('#hallModel'), scene = $('#scene'), seats = $('#seats');
  const zl = (z, i) => `<div class="zl z${z}" style="--i:${i}"><span>LKR ${z === 3 ? 3000 : 2000}</span></div>`;
  let html = '';
  for (let i = 0; i < ROWS; i++) {
    if (i === 0) html += zl(3, 0);
    if (i === Z3_ROWS) html += zl(2, i);
    const z = i < Z3_ROWS ? 3 : 2, n = 6 + Math.floor(i * .55);
    const blk = `<div class="blk">${`<i class="seat z${z}"></i>`.repeat(n)}</div>`;
    html += `<div class="row" style="--i:${i}">${blk}${blk}</div>`;
  }
  seats.innerHTML = html;

  const VIEWS = { '3d': { rx: 52, f: .74 }, top: { rx: 0, f: 1 }, stage: { rx: 72, f: .5 } };
  let view = '3d';
  function layout() {
    const w = scene.clientWidth - parseFloat(getComputedStyle(scene).paddingLeft) * 2;
    const s = Math.min(16, Math.max(5, w / 40));
    model.style.setProperty('--s', s + 'px');
    scene.style.setProperty('--H', model.offsetHeight + 'px');
    scene.style.setProperty('--f', VIEWS[view].f);
  }
  function setView(v) {
    view = v;
    model.style.setProperty('--rx', VIEWS[v].rx + 'deg');
    model.style.setProperty('--rz', '0deg');
    scene.style.setProperty('--f', VIEWS[v].f);
    $$('[data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === v));
  }
  $$('[data-view]').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
  $$('[data-zone]').forEach(b => b.addEventListener('click', () => {
    model.classList.toggle('f3', b.dataset.zone === '3');
    model.classList.toggle('f2', b.dataset.zone === '2');
    $$('[data-zone]').forEach(x => x.classList.toggle('on', x === b));
  }));
  /* swivel with the pointer in 3D view */
  scene.addEventListener('pointermove', e => {
    if (view !== '3d' || e.pointerType === 'touch') return;
    const r = scene.getBoundingClientRect();
    model.style.setProperty('--rz', (((e.clientX - r.left) / r.width - .5) * 26).toFixed(1) + 'deg');
  });
  scene.addEventListener('pointerleave', () => { if (view === '3d') model.style.setProperty('--rz', '0deg'); });

  new ResizeObserver(layout).observe(scene);
  layout(); setView('3d');
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { model.classList.add('in'); o.disconnect(); } }, { threshold: .25 }).observe(scene);
})();

/* wheels everywhere else */
injectWheels();
