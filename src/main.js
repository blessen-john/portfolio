import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

const root = document.documentElement;
const motion = root.classList.contains('motion');
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

// Live Dubai time. Seconds only tick when motion is allowed.
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit', ...(motion && { second: '2-digit' }) });
const tick = () => { $('#clock').textContent = fmt.format(new Date()); };
tick();
setInterval(tick, motion ? 1000 : 15000);

// Pointer spotlight: tiles, result cards and project rows light up under the cursor.
$$('.tools__list li, .feat, .proj').forEach((el) => {
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });
});

// No 'motion' class (reduced motion) = static page, nothing below runs.
if (motion) {
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({ anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  const hero = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
  const face = $('.portrait img');

  // Letters for the name; the h1 keeps its aria-label so it still reads as one name.
  const lines = $$('.hero__name .line');
  lines.forEach((line) => {
    line.innerHTML = [...line.textContent].map((c) => `<span class="ch" aria-hidden="true">${c}</span>`).join('');
  });

  // Liquid distortion: an SVG displacement filter whose strength is animated.
  // The filter is only attached while it is doing something, so the still photo stays sharp.
  const warp = (el, id) => {
    const map = $(`#${id} feDisplacementMap`);
    const state = { v: 0 };
    return { state, apply: () => { map.setAttribute('scale', state.v); el.style.filter = state.v > 0.5 ? `url(#${id})` : ''; } };
  };
  const warpIn = warp($('.portrait'), 'warp-in');
  const warpOut = warp($('.hero__photo'), 'warp-out');

  // Intro: about 2.6s, and any scroll input jumps it to the end.
  root.classList.add('ready');
  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } })
    .fromTo(warpIn.state, { v: 280 }, { v: 0, duration: 1.5, ease: 'power2.out', onUpdate: warpIn.apply }, 0)
    .from('.portrait', { autoAlpha: 0, duration: 0.9, ease: 'power1.out' }, 0)
    .fromTo(face, { scale: 1.3 }, { scale: 1.05, duration: 1.8 }, 0)
    .from('.hero__name .ch', { filter: 'blur(12px)', autoAlpha: 0, y: 28, duration: 0.6, stagger: 0.04, clearProps: 'filter' }, 0.45)
    .from('.hero__top, .hero__foot > *, .hero__cue', { autoAlpha: 0, y: 14, duration: 0.6, stagger: 0.07 }, 1.7);
  const skip = () => intro.progress(1);
  ['wheel', 'touchmove', 'keydown', 'scroll'].forEach((e) => window.addEventListener(e, skip, { once: true, passive: true }));

  // Leaving the hero, the photo liquefies and fades; scrolling back re-forms it.
  gsap.to(warpOut.state, { v: 340, ease: 'power1.in', onUpdate: warpOut.apply, scrollTrigger: { ...hero, end: '75% top' } });
  gsap.to('.hero__photo', { autoAlpha: 0, yPercent: -10, ease: 'power1.in', scrollTrigger: { ...hero, end: '75% top' } });
  // The name lines slide apart. From 700px "Thomas John" is one line and moves as one.
  const wide = matchMedia('(min-width: 700px)');
  lines.forEach((line, i) => gsap.to(line, { x: () => innerWidth * (wide.matches ? [-0.1, 0.1, 0.1] : [-0.14, 0.14, -0.14])[i], ease: 'none', scrollTrigger: { ...hero, invalidateOnRefresh: true } }));
  gsap.fromTo('.rail', { autoAlpha: 0 }, { autoAlpha: 1, ease: 'none', scrollTrigger: { ...hero, start: '88% top' } });

  // The portrait leans a little towards the pointer.
  if (matchMedia('(pointer: fine)').matches) {
    const mx = gsap.quickTo(face, 'x', { duration: 0.8, ease: 'power3.out' });
    const my = gsap.quickTo(face, 'y', { duration: 0.8, ease: 'power3.out' });
    window.addEventListener('pointermove', (e) => { mx((e.clientX / innerWidth - 0.5) * 14); my((e.clientY / innerHeight - 0.5) * 14); }, { passive: true });
  }

  // Tool logos drop onto the banner once, then stay.
  gsap.from('.tools__list li', {
    y: -160, rotation: () => gsap.utils.random(-28, 28), autoAlpha: 0, duration: 0.9, ease: 'bounce.out', stagger: 0.06, clearProps: 'transform',
    scrollTrigger: { trigger: '.tools', start: 'top 82%', once: true },
  });

  // Intro paragraph lights up word by word as it is read.
  const text = $('.intro__text');
  text.innerHTML = text.textContent.trim().split(/\s+/).map((w) => `<span>${w}</span>`).join(' ');
  gsap.fromTo(text.children, { opacity: 0.5 }, { // 0.5 keeps the unlit words at AA contrast
    opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: text, start: 'top 82%', end: 'bottom 55%', scrub: true } });

  // Rail link of the section in view takes that section's colour.
  $$('.rail a').forEach((link) => {
    ScrollTrigger.create({ trigger: link.hash, start: 'top 55%', end: 'bottom 55%', toggleClass: { targets: link, className: 'is-active' } });
  });

  // Result cards rise in and their numbers count up once.
  $$('.feat').forEach((feat, i) => {
    const num = feat.querySelector('.count');
    const n = { v: 0 };
    gsap.timeline({ scrollTrigger: { trigger: '.feats', start: 'top 82%', once: true }, delay: i * 0.12, defaults: { ease: 'power3.out' } })
      .from(feat, { autoAlpha: 0, y: 40, duration: 0.8, clearProps: 'transform' }, 0)
      .to(n, { v: +num.textContent, duration: 1.5, ease: 'power2.out', onUpdate: () => { num.textContent = Math.round(n.v); } }, 0);
  });

  // Project rows follow each other in.
  ScrollTrigger.batch('.proj', { start: 'top 90%', once: true, onEnter: (rows) => gsap.from(rows, { autoAlpha: 0, y: 24, duration: 0.6, ease: 'power3.out', stagger: 0.07, clearProps: 'transform' }) });

  // Experience: vertical scroll drives a pinned horizontal timeline on wide screens.
  gsap.matchMedia().add('(min-width: 900px)', () => {
    const xp = $('.xp');
    const row = $('.xp__track');
    const travel = () => Math.max(0, row.scrollWidth - xp.clientWidth);
    gsap.to(row, { x: () => -travel(), ease: 'none', scrollTrigger: { trigger: xp, start: 'top top', end: () => `+=${travel()}`, pin: true, scrub: true, invalidateOnRefresh: true } });
  });

  // Web fonts change heights, so measure again once they are in.
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}
