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

// No 'motion' class (reduced motion) = static page, nothing below runs.
if (motion) {
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({ anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  const portrait = $('.portrait');
  const face = $('.portrait img');
  const heroSlot = $('.hero__slot');
  const dockSlot = $('.rail__slot');
  const hero = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };

  // Letters for the name; the h1 keeps its aria-label so it still reads as one name.
  const lines = $$('.hero__name .line');
  lines.forEach((line) => {
    line.innerHTML = [...line.textContent].map((c) => `<span class="ch" aria-hidden="true">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
  });

  // The portrait is fixed over its hero slot, then scrubbed to the dock slot in the rail.
  let dock = { x: 0, y: 0, scale: 1 };
  const place = () => {
    const h = heroSlot.getBoundingClientRect();
    const d = dockSlot.getBoundingClientRect();
    const top = h.top + window.scrollY;
    gsap.set(portrait, { position: 'fixed', top, left: h.left, width: h.width, height: h.height, x: 0, y: 0, scale: 1 });
    dock = { x: d.left - h.left, y: d.top - top, scale: d.width / h.width };
  };
  place();
  ScrollTrigger.addEventListener('refreshInit', place);

  gsap.to(portrait, { x: () => dock.x, y: () => dock.y, scale: () => dock.scale, ease: 'none', scrollTrigger: { ...hero, invalidateOnRefresh: true } });
  gsap.fromTo('.rail', { autoAlpha: 0 }, { autoAlpha: 1, ease: 'none', scrollTrigger: { ...hero, start: '88% top' } });
  // The three name lines slide apart as the hero leaves.
  const wide = matchMedia('(min-width: 700px)'); // from here "Thomas John" is one line and moves as one
  lines.forEach((line, i) => gsap.to(line, { x: () => innerWidth * (wide.matches ? [-0.1, 0.1, 0.1] : [-0.14, 0.14, -0.14])[i], ease: 'none', scrollTrigger: { ...hero, invalidateOnRefresh: true } }));

  // Intro: about 2.6s, and any scroll input jumps it to the end.
  root.classList.add('ready');
  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.hero__name .ch', { filter: 'blur(12px)', autoAlpha: 0, y: -24, duration: 0.6, stagger: 0.045, clearProps: 'filter' })
    .fromTo(portrait, { clipPath: 'inset(50% 0% 50% 0% round 999px)' }, { clipPath: 'inset(0% 0% 0% 0% round 999px)', duration: 1.1, ease: 'power3.inOut', clearProps: 'clipPath' }, 0.55)
    .fromTo(face, { scale: 1.4, yPercent: 8 }, { scale: 1.06, yPercent: 0, duration: 1.6 }, 0.55)
    .from('.hero__top, .hero__foot > *, .hero__cue', { autoAlpha: 0, y: 14, duration: 0.6, stagger: 0.07 }, 1.7);
  const skip = () => intro.progress(1);
  ['wheel', 'touchmove', 'keydown', 'scroll'].forEach((e) => window.addEventListener(e, skip, { once: true, passive: true }));

  // The portrait leans a little towards the pointer.
  if (matchMedia('(pointer: fine)').matches) {
    const mx = gsap.quickTo(face, 'x', { duration: 0.8, ease: 'power3.out' });
    const my = gsap.quickTo(face, 'y', { duration: 0.8, ease: 'power3.out' });
    window.addEventListener('pointermove', (e) => { mx((e.clientX / innerWidth - 0.5) * 16); my((e.clientY / innerHeight - 0.5) * 16); }, { passive: true });
  }

  // Tool logos drop onto the banner once, then stay.
  gsap.from('.tools__list li', {
    y: -160, rotation: () => gsap.utils.random(-28, 28), autoAlpha: 0, duration: 0.9, ease: 'bounce.out', stagger: 0.06,
    scrollTrigger: { trigger: '.tools', start: 'top 82%', once: true },
  });

  // "I am Blessen" paragraph lights up word by word as it is read.
  const text = $('.intro__text');
  text.innerHTML = text.textContent.trim().split(/\s+/).map((w) => `<span>${w}</span>`).join(' ');
  gsap.fromTo(text.children, { opacity: 0.5 }, { // 0.5 keeps the unlit words at AA contrast
    opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: text, start: 'top 82%', end: 'bottom 55%', scrub: true } });

  // Rail link of the section in view takes its colour.
  $$('.rail a').forEach((link) => {
    ScrollTrigger.create({ trigger: link.hash, start: 'top 55%', end: 'bottom 55%', toggleClass: { targets: link, className: 'is-active' } });
  });

  // Featured work: the number counts up once.
  $$('.feat').forEach((feat) => {
    const num = feat.querySelector('.count');
    const n = { v: 0 };
    gsap.timeline({ scrollTrigger: { trigger: feat, start: 'top 82%', once: true }, defaults: { ease: 'power3.out' } })
      .from(feat, { '--rule-scale': 0, duration: 0.9 }, 0)
      .to(n, { v: +num.textContent, duration: 1.5, ease: 'power2.out', onUpdate: () => { num.textContent = Math.round(n.v); } }, 0)
      .from(feat.querySelector('.feat__body'), { autoAlpha: 0, y: 24, duration: 0.8 }, 0.15);
  });

  // Work rows: the rule draws across, the title rises out of its mask, the details follow.
  $$('.item').forEach((item) => {
    gsap.timeline({ scrollTrigger: { trigger: item, start: 'top 86%', once: true }, defaults: { ease: 'power3.out' } })
      .from(item, { '--rule-scale': 0, duration: 0.9 }, 0)
      .from(item.querySelector('h3 span'), { yPercent: 110, duration: 0.8 }, 0.05)
      .from(item.querySelector('dl'), { autoAlpha: 0, y: 18, duration: 0.7 }, 0.2);
  });

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
