const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');

menuButton.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
});

nav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
  });
});

document.querySelector('#year').textContent = new Date().getFullYear();

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

// Give each card a restrained, pointer-driven 3D lean on desktop.
if (window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) {
  document.querySelectorAll('.service-card, .member-image, .plan-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      card.style.setProperty('--card-rx', `${-y * 5}deg`);
      card.style.setProperty('--card-ry', `${x * 6}deg`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--card-rx', '0deg');
      card.style.setProperty('--card-ry', '0deg');
    });
  });
}

// Subtle pointer tilt on the hero sculpture; disabled for touch and reduced motion.
const hero = document.querySelector('.hero');
const sculpture = document.querySelector('.sculpture');
const heroVisual = document.querySelector('.hero-visual');
if (window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) {
  hero.addEventListener('pointermove', (event) => {
    const bounds = hero.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    sculpture.style.setProperty('--tilt-x', `${-x * 9}deg`);
    sculpture.style.setProperty('--tilt-y', `${y * 5}deg`);
  });
  hero.addEventListener('pointerleave', () => {
    sculpture.style.setProperty('--tilt-x', '0deg');
    sculpture.style.setProperty('--tilt-y', '0deg');
  });
}

// Lightweight canvas scene: a rotating point-cloud planet with a perspective orbit.
// It uses no image or 3D library, so the animation stays quick to load.
const canvas = document.querySelector('.hero-canvas');
const context = canvas.getContext('2d');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const dotCount = window.innerWidth < 650 ? 68 : 120;
const dots = Array.from({ length: dotCount }, (_, index) => {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (index / (dotCount - 1)) * 2;
  const radius = Math.sqrt(1 - y * y);
  const angle = golden * index;
  return { x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius };
});
let sceneWidth = 0;
let sceneHeight = 0;
let sceneFrame = 0;
let sceneVisible = true;
let pointerX = 0;
let pointerY = 0;

function resizeScene() {
  const bounds = heroVisual.getBoundingClientRect();
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  sceneWidth = bounds.width;
  sceneHeight = bounds.height;
  canvas.width = Math.round(sceneWidth * scale);
  canvas.height = Math.round(sceneHeight * scale);
  context.setTransform(scale, 0, 0, scale, 0, 0);
}

function drawScene(time = 0) {
  context.clearRect(0, 0, sceneWidth, sceneHeight);
  const centerX = sceneWidth * 0.57;
  const centerY = sceneHeight * 0.5;
  const radius = Math.min(sceneWidth, sceneHeight) * 0.285;
  const spin = reduceMotion ? 0.35 : time * 0.00012;
  const tilt = pointerX * 0.25;
  const projected = dots.map((dot) => {
    const x1 = dot.x * Math.cos(spin) - dot.z * Math.sin(spin);
    const z1 = dot.x * Math.sin(spin) + dot.z * Math.cos(spin);
    const y2 = dot.y * Math.cos(pointerY * 0.35) - z1 * Math.sin(pointerY * 0.35);
    const z2 = dot.y * Math.sin(pointerY * 0.35) + z1 * Math.cos(pointerY * 0.35);
    const depth = 1 / (1.5 - z2 * 0.38);
    return { x: centerX + (x1 * Math.cos(tilt) + z2 * Math.sin(tilt)) * radius * depth, y: centerY + y2 * radius * depth, z: z2, depth };
  });

  // Fine connecting arcs fade into the far side of the sphere.
  for (let i = 0; i < projected.length; i += 1) {
    for (let j = i + 1; j < Math.min(i + 5, projected.length); j += 1) {
      const a = projected[i];
      const b = projected[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance < radius * 0.32 && (a.z + b.z) > -0.45) {
        context.strokeStyle = `rgba(118, 145, 83, ${Math.max(0.025, (a.z + 0.5) * 0.09)})`;
        context.lineWidth = 0.65;
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
      }
    }
  }
  projected.forEach((point, index) => {
    const size = (index % 11 === 0 ? 2.3 : 1.05) * point.depth;
    context.fillStyle = point.z > 0 ? `rgba(221, 239, 174, ${0.25 + point.z * 0.55})` : `rgba(113, 137, 82, ${0.08 + (point.z + 1) * 0.12})`;
    context.beginPath();
    context.arc(point.x, point.y, size, 0, Math.PI * 2);
    context.fill();
  });

  // Orbit ellipse, drawn in perspective, with a bright moving satellite.
  context.save();
  context.translate(centerX, centerY);
  context.rotate(-0.34);
  context.strokeStyle = 'rgba(220, 154, 112, .36)';
  context.lineWidth = 1;
  context.beginPath();
  context.ellipse(0, 0, radius * 1.48, radius * 0.47, 0, 0, Math.PI * 2);
  context.stroke();
  const orbitAngle = reduceMotion ? 0.75 : time * 0.0003;
  const satelliteX = Math.cos(orbitAngle) * radius * 1.48;
  const satelliteY = Math.sin(orbitAngle) * radius * 0.47;
  context.fillStyle = '#efb58c';
  context.shadowColor = '#efb58c';
  context.shadowBlur = 12;
  context.beginPath();
  context.arc(satelliteX, satelliteY, 3.5, 0, Math.PI * 2);
  context.fill();
  context.restore();

  if (!reduceMotion && sceneVisible) sceneFrame = requestAnimationFrame(drawScene);
}

const sceneObserver = new IntersectionObserver(([entry]) => {
  sceneVisible = entry.isIntersecting;
  cancelAnimationFrame(sceneFrame);
  if (sceneVisible) drawScene(performance.now());
}, { threshold: 0.05 });
sceneObserver.observe(heroVisual);
new ResizeObserver(resizeScene).observe(heroVisual);
resizeScene();
heroVisual.addEventListener('pointermove', (event) => {
  const bounds = heroVisual.getBoundingClientRect();
  pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
  pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
  if (reduceMotion) drawScene();
});
heroVisual.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; });
if (reduceMotion) drawScene();
