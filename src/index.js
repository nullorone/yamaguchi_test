const slides = [...document.querySelectorAll('.slide')];
const links = [...document.querySelectorAll('.wheel__item')];
const wheel = document.querySelector('.wheel');
const desktop = matchMedia('(min-width: 768px)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let active = 0;
let frame = 0;
let wheelTimer = null;
let wheelGestureActive = false;

function setActive(index) {
  active = index;

  slides.forEach((slide, i) => {
    slide.classList.toggle('is-active', i === index);

    slide.inert = desktop.matches && i !== index;
  });

  links.forEach((link, i) => {
    if (i === index) {
      link.setAttribute('aria-current', 'true');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  wheel.style.setProperty('--rotation', `${index * -22.5}deg`);
}

function updateFromScroll() {
  frame = 0;

  if (desktop.matches) {
    return;
  }

  const centre = innerHeight / 2;
  let nearest = 0;
  let distance = Infinity;

  slides.forEach((slide, index) => {
    const rect = slide.getBoundingClientRect();
    const delta = Math.abs(rect.top + rect.height / 2 - centre);

    if (delta < distance) {
      nearest = index;

      distance = delta;
    }
  });

  if (nearest !== active) {
    setActive(nearest);
  }
}

function scheduleUpdate() {
  if (!frame) {
    frame = requestAnimationFrame(updateFromScroll);
  }
}

function goTo(index) {
  clearTimeout(wheelTimer);

  wheelTimer = null;
  wheelGestureActive = false;

  const target = Math.max(0, Math.min(slides.length - 1, index));

  if (!desktop.matches) {
    slides[target].scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });

    return;
  }

  if (target === active) {
    return;
  }

  if (slides[active].contains(document.activeElement)) {
    document.activeElement.blur();
  }

  setActive(target);

  history.replaceState(null, '', `#${slides[target].id}`);
}

addEventListener('wheel', (event) => {
  if (!desktop.matches || event.ctrlKey || event.deltaY === 0 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
    return;
  }

  event.preventDefault();

  if (!wheelGestureActive) {
    goTo(active + Math.sign(event.deltaY));

    wheelGestureActive = true;
  }

  clearTimeout(wheelTimer);

  wheelTimer = setTimeout(() => {
    wheelTimer = null;

    wheelGestureActive = false;
  }, 20);
}, { passive: false });

links.forEach((link, index) => {
  link.addEventListener('click', (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();

    history.replaceState(null, '', link.hash);

    goTo(index);
  });
});

document.addEventListener('keydown', (event) => {
  if (!desktop.matches || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return;
  }

  if (event.target.closest('input, textarea, select, [contenteditable="true"]')) {
    return;
  }

  const targets = { ArrowDown: active + 1, PageDown: active + 1, ArrowUp: active - 1, PageUp: active - 1, Home: 0, End: slides.length - 1, ' ': active + 1 };

  if (!(event.key in targets)) {
    return;
  }

  event.preventDefault();

  goTo(targets[event.key]);
});

function syncViewport() {
  wheel.hidden = !desktop.matches;

  document.documentElement.classList.toggle('is-enhanced', desktop.matches);

  setActive(active);

  clearTimeout(wheelTimer);

  wheelTimer = null;

  wheelGestureActive = false;

  if (desktop.matches) {
    window.scrollTo(0, 0);
  } else {
    slides[active].scrollIntoView({ behavior: 'instant', block: 'start' });
  }
}

const initialIndex = slides.findIndex(slide => `#${slide.id}` === location.hash);

setActive(initialIndex === -1 ? 0 : initialIndex);

syncViewport();

addEventListener('scroll', scheduleUpdate, { passive: true });

addEventListener('resize', scheduleUpdate);

addEventListener('pageshow', updateFromScroll);

desktop.addEventListener('change', syncViewport);

addEventListener('hashchange', () => {
  const index = slides.findIndex(slide => `#${slide.id}` === location.hash);

  if (index !== -1) {
    goTo(index);
  }
});
