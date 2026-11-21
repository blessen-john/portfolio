import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

const root = document.documentElement;

// No 'motion' class (reduced motion) = static page, nothing below runs.
if (root.classList.contains('motion')) {
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({ anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  const $ = (s) => document.querySelector(s);
  const portrait = $('.portrait');
  const heroSlot = $('.hero__slot');
  const dockSlot = $('.rail__slot');

  // Letters for the name; the h1 keeps its aria-label so it still reads as one name.
  document.querySelectorAll('.hero__name .line').forEach((line) => {
    line.innerHTML = [...line.textContent].map((c) => `<span class="ch" aria-hidden="true">${c}</span>`).join('');
  });

  // The portrait is fixed over its hero slot, then scrubbed to the dock slot in the rail.
  let dock = { x: 0, y: 0, scale: 1 };
  const place = () => {
    const h = heroSlot.getBoundingClientRect();
    const d = dockSlot.getBoundingClientRect();
    const top = h.top + window.scrollY;
    gsap.set(portrait, { position: 'fixed', top, left: h.left, width: h.width, height: h.height });
    dock = { x: d.left - h.left, y: d.top - top, scale: d.width / h.width };
  };
  place();
  ScrollTrigger.addEventListener('refreshInit', place);

  gsap.to(portrait, {
    x: () => dock.x,
    y: () => dock.y,
    scale: () => dock.scale,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
  });
  gsap.fromTo('.rail', { autoAlpha: 0 }, {
    autoAlpha: 1,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: '80% top', end: 'bottom top', scrub: true },
  });

  // Intro: about 2.6s, and any scroll input jumps it to the end.
  root.classList.add('ready');
  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.hero__name .ch', { yPercent: 110, duration: 0.7, stagger: 0.025 })
    .fromTo(portrait, { clipPath: 'inset(50% 50% 50% 50%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power3.inOut', clearProps: 'clipPath' }, 0.5)
    .from('.portrait img', { scale: 1.3, yPercent: 8, duration: 1.5 }, 0.5)
    .from('.hero__foot > *', { autoAlpha: 0, y: 14, duration: 0.6, stagger: 0.08 }, 1.8);
  const skip = () => intro.progress(1);
  ['wheel', 'touchmove', 'keydown', 'scroll'].forEach((e) => window.addEventListener(e, skip, { once: true, passive: true }));

  // Work rows: the rule draws across, the title rises out of its mask, the details follow.
  document.querySelectorAll('.item').forEach((item) => {
    gsap.timeline({ scrollTrigger: { trigger: item, start: 'top 86%', once: true }, defaults: { ease: 'power3.out' } })
      .from(item, { '--rule-scale': 0, duration: 0.9 }, 0)
      .from(item.querySelector('h3 span'), { yPercent: 110, duration: 0.8 }, 0.05)
      .from(item.querySelector('dl'), { autoAlpha: 0, y: 18, duration: 0.7 }, 0.2);
  });

  // Web fonts change the hero's height, so measure again once they are in.
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}
