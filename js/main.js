/**
 * ZEUS – Essensuals  |  main.js  v10
 *
 * Strategy:
 *  1. Load ONLY frame_0001.jpg first → show it immediately → hide loading screen
 *  2. Load the remaining frames lazily in the background
 *  3. Scroll picks the closest already-loaded frame
 *  4. NO fallback video on error — dark canvas is the fallback (no autoplay ever)
 *
 * Mobile  : every 4th frame  = 60 frames  (frame_0001, 0005, 0009 … 0237)
 * Desktop : every 1st frame  = 240 frames
 */

'use strict';

/* ─── CONFIG ────────────────────────────────────────────── */
const TOTAL_FRAMES  = 240;
const MOBILE_STEP   = 4;    // load 60 frames on mobile
const DESKTOP_STEP  = 1;    // load all 240 on desktop
const SCROLL_SPANS  = 5;    // scroll-track height in vh multiples

/* ─── STATE ─────────────────────────────────────────────── */
let frames       = [];      // sparse array — slots filled as imgs load
let frameStep    = 1;
let totalSlots   = 0;
let currentFrame = 0;
let targetFrame  = 0;
let isReady      = false;   // true once frame 0 is painted
let rafPending   = false;
let isMobile     = false;

/* ─── DOM ───────────────────────────────────────────────── */
const canvas        = document.getElementById('bg-canvas');
const ctx           = canvas.getContext('2d');
const loadingScreen = document.getElementById('loading-screen');
const progressFill  = document.getElementById('progress-fill');
const progressPct   = document.getElementById('progress-percent');
const progressBar   = document.getElementById('progress-bar');
const scrollTrack   = document.getElementById('scroll-track');
const heroOverlay   = document.getElementById('hero-overlay');
const aboutOverlay  = document.getElementById('about-overlay');
const siteHeader    = document.getElementById('site-header');
const hamburger     = document.getElementById('hamburger');
const mobileMenu    = document.getElementById('mobile-menu');

/* ─── INIT ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initSmoothScroll();
  initHeaderShrink();
  initServiceCards();
  initGallery();

  isMobile   = window.innerHeight > window.innerWidth;
  frameStep  = isMobile ? MOBILE_STEP : DESKTOP_STEP;
  totalSlots = Math.ceil(TOTAL_FRAMES / frameStep);
  frames     = new Array(totalSlots).fill(null);

  resizeCanvas();
  loadFirstFrame();

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
});

/* ─── CANVAS ────────────────────────────────────────────── */
function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  if (isReady && frames[currentFrame]) drawFrame(frames[currentFrame]);
}

/* ─── FRAME PATHS ───────────────────────────────────────── */
function frameSrc(slotIndex) {
  const num = slotIndex * frameStep + 1;          // 0→1, 1→5, 2→9 …
  const dir = isMobile ? 'assets/frames/mobile/' : 'assets/frames/desktop/';
  return `${dir}frame_${String(num).padStart(4, '0')}.jpg`;
}

/* ─── STEP 1: load frame 0 only, show immediately ─────── */
function loadFirstFrame() {
  const img = new Image();

  img.onload = () => {
    frames[0] = img;
    setProgress(100);             // show full bar before hiding screen
    drawFrame(img);
    currentFrame = 0;
    isReady      = true;

    loadingScreen.classList.add('fade-out');
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
      onScroll();
      loadRemainingFrames();      // start background loading now
    }, 800);
  };

  img.onerror = () => {
    /* Frame 0 failed — skip loading screen, show dark canvas */
    console.warn('[ZEUS] frame 0 failed, continuing without animation');
    isReady = true;
    loadingScreen.classList.add('fade-out');
    setTimeout(() => { loadingScreen.classList.add('hidden'); }, 800);
    loadRemainingFrames();
  };

  img.src = frameSrc(0);
}

/* ─── STEP 2: load everything else in background ─────── */
function loadRemainingFrames() {
  let loaded = 1;   // frame 0 already done

  for (let i = 1; i < totalSlots; i++) {
    const slot = i;
    const img  = new Image();

    img.onload = () => {
      frames[slot] = img;
      loaded++;
      setProgress(Math.round((loaded / totalSlots) * 100));
    };
    img.onerror = () => { loaded++; };  // skip bad frames silently

    img.src = frameSrc(slot);
  }
}

/* ─── DRAW ──────────────────────────────────────────────── */
function drawFrame(img) {
  if (!img || !img.complete || !img.naturalWidth) return;
  const cw = canvas.width,  ch = canvas.height;
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const scale = Math.max(cw / iw, ch / ih);
  const dw = iw * scale, dh = ih * scale;
  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
}

function setProgress(pct) {
  progressFill.style.width = pct + '%';
  progressPct.textContent  = pct + '%';
  progressBar.setAttribute('aria-valuenow', pct);
}

/* ─── SCROLL ────────────────────────────────────────────── */
function onScroll() {
  if (!isReady) return;

  const trackTop  = scrollTrack.offsetTop;
  const scrubSpan = scrollTrack.offsetHeight - window.innerHeight;
  const progress  = Math.max(0, Math.min(1,
    (window.scrollY - trackTop) / Math.max(1, scrubSpan)));

  targetFrame = Math.round(progress * (totalSlots - 1));
  if (!rafPending) { rafPending = true; requestAnimationFrame(renderTick); }

  updateOverlays(progress);
}

function renderTick() {
  rafPending = false;

  /* Try the exact target frame */
  if (frames[targetFrame]) {
    if (currentFrame !== targetFrame) {
      drawFrame(frames[targetFrame]);
      currentFrame = targetFrame;
    }
    return;
  }

  /* Target not loaded yet — find nearest loaded frame */
  let best = -1, bestDist = Infinity;
  for (let i = 0; i < frames.length; i++) {
    if (frames[i]) {
      const d = Math.abs(i - targetFrame);
      if (d < bestDist) { bestDist = d; best = i; }
    }
  }
  if (best >= 0 && best !== currentFrame) {
    drawFrame(frames[best]);
    currentFrame = best;
  }
}

/* ─── OVERLAYS ──────────────────────────────────────────── */
const CFG = {
  HERO_OUT_END    : 0.08,
  ABOUT_IN_START  : 0.18,
  ABOUT_IN_END    : 0.32,
  ABOUT_OUT_START : 0.64,
  ABOUT_OUT_END   : 0.82,
};

function updateOverlays(p) {
  /* Hero */
  if (p <= CFG.HERO_OUT_END) {
    const t = 1 - (p / CFG.HERO_OUT_END);
    setOverlay(heroOverlay, easeOut(t), 0, t > 0.05);
  } else {
    setOverlay(heroOverlay, 0, 0, false);
  }

  /* About */
  let aOp = 0, aY = 0;
  if (p >= CFG.ABOUT_IN_START && p < CFG.ABOUT_IN_END) {
    const t = (p - CFG.ABOUT_IN_START) / (CFG.ABOUT_IN_END - CFG.ABOUT_IN_START);
    aOp = easeOut(t); aY = (1 - easeOut(t)) * 38;
  } else if (p >= CFG.ABOUT_IN_END && p <= CFG.ABOUT_OUT_START) {
    aOp = 1; aY = 0;
  } else if (p > CFG.ABOUT_OUT_START && p < CFG.ABOUT_OUT_END) {
    const t = (p - CFG.ABOUT_OUT_START) / (CFG.ABOUT_OUT_END - CFG.ABOUT_OUT_START);
    aOp = 1 - easeOut(t); aY = easeOut(t) * -32;
  }
  aboutOverlay.style.opacity   = aOp;
  aboutOverlay.style.transform = `translateY(${aY}px)`;
  aboutOverlay.setAttribute('aria-hidden', aOp < 0.05 ? 'true' : 'false');
}

function setOverlay(el, opacity, ty, interactive) {
  el.style.opacity       = opacity;
  el.style.transform     = `translateY(${ty}px)`;
  el.style.pointerEvents = interactive ? 'auto' : 'none';
  el.style.visibility    = opacity < 0.01 ? 'hidden' : 'visible';
}

/* ─── RESIZE ────────────────────────────────────────────── */
function onResize() {
  resizeCanvas();
  const nowMobile = window.innerHeight > window.innerWidth;
  if (nowMobile !== isMobile) {
    isMobile   = nowMobile;
    frameStep  = isMobile ? MOBILE_STEP : DESKTOP_STEP;
    totalSlots = Math.ceil(TOTAL_FRAMES / frameStep);
    frames     = new Array(totalSlots).fill(null);
    isReady    = false;
    currentFrame = 0;
    loadingScreen.classList.remove('hidden', 'fade-out');
    setProgress(0);
    loadFirstFrame();
  }
}

/* ─── HEADER SHRINK ─────────────────────────────────────── */
function initHeaderShrink() {
  window.addEventListener('scroll', () => {
    siteHeader.classList.toggle('scrolled', window.scrollY > 55);
  }, { passive: true });
}

/* ─── MOBILE MENU ───────────────────────────────────────── */
function initMobileMenu() {
  hamburger.addEventListener('click', () => {
    const open = !mobileMenu.classList.contains('open');
    mobileMenu.classList.toggle('open', open);
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open);
    hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  });
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  function closeMenu() {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open menu');
    document.body.style.overflow = '';
  }
}

/* ─── SMOOTH SCROLL ─────────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      e.preventDefault();
      if (href === '#home') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      if (href === '#about') {
        const span = scrollTrack.offsetHeight - window.innerHeight;
        window.scrollTo({ top: scrollTrack.offsetTop + span * 0.35, behavior: 'smooth' });
        return;
      }
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

/* ─── SERVICE CARDS ─────────────────────────────────────── */
function initServiceCards() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const d = parseInt(e.target.dataset.delay || '0', 10) * 150;
      setTimeout(() => e.target.classList.add('visible'), d);
      io.unobserve(e.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });
  document.querySelectorAll('.svc-card, .svc-signature').forEach(c => io.observe(c));
}

/* ─── GALLERY LIGHTBOX ──────────────────────────────────── */
function initGallery() {
  const items     = document.querySelectorAll('.gal-item');
  const lightbox  = document.getElementById('gallery-lightbox');
  if (!lightbox || !items.length) return;

  const lbImg     = document.getElementById('lb-img');
  const lbClose   = document.getElementById('lb-close');
  const lbPrev    = document.getElementById('lb-prev');
  const lbNext    = document.getElementById('lb-next');
  const lbBackdrop= document.getElementById('lb-backdrop');

  const srcs = Array.from(items).map(el => ({
    src: el.querySelector('img').src,
    alt: el.querySelector('img').alt,
  }));
  let current = 0;

  function open(idx) {
    current = idx;
    lbImg.src = srcs[idx].src;
    lbImg.alt = srcs[idx].alt;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => { lbImg.src = ''; }, 300);
  }

  function next() { current = (current + 1) % srcs.length; lbImg.src = srcs[current].src; }
  function prev() { current = (current - 1 + srcs.length) % srcs.length; lbImg.src = srcs[current].src; }

  items.forEach((item, i) => item.addEventListener('click', () => open(i)));
  lbClose.addEventListener('click', close);
  lbNext.addEventListener('click', next);
  lbPrev.addEventListener('click', prev);
  lbBackdrop.addEventListener('click', close);

  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape')      close();
    if (e.key === 'ArrowRight')  next();
    if (e.key === 'ArrowLeft')   prev();
  });

  /* Swipe support for mobile */
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
  }, { passive: true });
}

/* ─── EASING ────────────────────────────────────────────── */
function easeOut(t) {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
}
