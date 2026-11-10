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

// Gentle pointer tilt makes the browser mockup feel like a small 3D object.
const heroVisual = document.querySelector('.hero-visual');
const webModel = document.querySelector('.web-model');
if (window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) {
  heroVisual.addEventListener('pointermove', (event) => {
    const bounds = heroVisual.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    webModel.style.setProperty('--model-tilt-x', `${-y * 7}deg`);
    webModel.style.setProperty('--model-tilt-y', `${x * 9}deg`);
  });
  heroVisual.addEventListener('pointerleave', () => {
    webModel.style.setProperty('--model-tilt-x', '0deg');
    webModel.style.setProperty('--model-tilt-y', '0deg');
  });
}
