(() => {
  'use strict';

  const previews = [...document.querySelectorAll('.editorial-preview')];
  const revealItems = [...document.querySelectorAll('.editorial-reveal')];
  const textItems = [...document.querySelectorAll('.editorial-intro > *, .editorial-about > *, .editorial-contact > h2, .editorial-email')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function show(item) {
    item.classList.add('is-visible');
  }

  function revealAll() {
    revealItems.forEach(show);
    textItems.forEach(show);
  }

  function setupSignalPreview() {
    const canvas = document.querySelector('.editorial-signal-canvas');
    if (!canvas) return;
    const panel = canvas.parentElement;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    const palette = ['#76b9d4', '#87a5dc', '#ab91d5', '#bc83bb', '#c5a58b'];
    const groups = [[.18, .39], [.49, .53], [.81, .38]];
    let width = 1, height = 1, particles = [], visible = false, frame = 0, last = 0, time = 0;
    let pointer = { x: -1000, y: -1000 };
    let seed = 9417;
    const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

    function resize() {
      const rect = panel.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const scale = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      seed = 9417;
      const count = width < 500 ? 310 : 510;
      particles = Array.from({ length: count }, () => {
        const group = Math.floor(random() * 3);
        const bridge = random() < .16 && group < 2;
        const x = bridge
          ? groups[group][0] + random() * (groups[group + 1][0] - groups[group][0])
          : groups[group][0] + (random() + random() + random() - 1.5) * .27;
        const y = groups[group][1] + (random() + random() + random() - 1.5) * (bridge ? .26 : .34);
        return { x: Math.max(.01, Math.min(.99, x)), y, group, phase: random() * Math.PI * 2, speed: 2.5 + random() * 7, size: .9 + random() * 2.1, alpha: bridge ? .22 + random() * .27 : .3 + random() * .53, color: palette[Math.min(4, group + Math.floor(random() * 2))] };
      });
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      const moving = visible && !reducedMotion.matches && !document.body.classList.contains('still');
      for (const p of particles) {
        const direction = p.group === 1 ? -1 : 1;
        const drift = moving ? time * p.speed * direction : 0;
        const x = (p.x * width + drift + width) % width;
        const y = p.y * height + (moving ? Math.sin(time * .42 + p.phase) * 2.1 : 0);
        const dx = x - pointer.x, dy = y - pointer.y;
        const influence = moving ? Math.max(0, 1 - Math.hypot(dx, dy) / 72) : 0;
        const displace = influence * influence * 9;
        const flicker = moving ? .82 + .18 * Math.sin(time * (1.2 + p.speed * .08) + p.phase) : 1;
        ctx.globalAlpha = p.alpha * flicker;
        ctx.fillStyle = p.color;
        ctx.fillRect(x + Math.sign(dx) * displace, y + Math.sign(dy) * displace, p.size, p.size);
      }
      ctx.globalAlpha = 1;
    }

    function tick(now) {
      frame = 0;
      if (!visible || document.hidden || reducedMotion.matches || document.body.classList.contains('still')) return;
      if (now - last >= 1000 / 30) {
        time += Math.min((now - last) / 1000, .06);
        last = now;
        draw();
      }
      frame = requestAnimationFrame(tick);
    }

    function sync() {
      const shouldRun = visible && !document.hidden && !reducedMotion.matches && !document.body.classList.contains('still');
      if (shouldRun && !frame) { last = performance.now(); frame = requestAnimationFrame(tick); }
      if (!shouldRun && frame) { cancelAnimationFrame(frame); frame = 0; draw(); }
    }

    panel.addEventListener('pointermove', event => {
      const rect = panel.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }, { passive: true });
    panel.addEventListener('pointerleave', () => { pointer = { x: -1000, y: -1000 }; }, { passive: true });
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: .01 }).observe(panel);
    new ResizeObserver(resize).observe(panel);
    new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('visibilitychange', sync);
    reducedMotion.addEventListener('change', sync);
    window.PachinSignalPreview = { diagnostics: () => ({ active: Boolean(frame), count: particles.length, visible }) };
    resize();
  }

  function setup() {
    setupSignalPreview();
    if (reducedMotion.matches || document.body.classList.contains('still') || !('IntersectionObserver' in window)) {
      revealAll();
      return;
    }

    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const preview = entry.target;
        show(preview);
        const copy = preview.classList.contains('editorial-preview') && preview.parentElement.querySelector('.editorial-reveal-copy');
        if (copy) show(copy);
        instance.unobserve(preview);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });

    previews.forEach((preview) => observer.observe(preview));
    textItems.forEach((item) => {
      item.classList.add('editorial-text-motion');
      item.addEventListener('focusin', () => show(item));
      observer.observe(item);
    });
    document.body.classList.add('editorial-ready');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true });
  else setup();
})();
