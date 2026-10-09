const menuButton = document.querySelector('.menu-button');
const mobileNav = document.querySelector('#mobile-nav');
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  mobileNav.hidden = open;
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mobileNav.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
}));

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const scene = document.querySelector('.product-scroll-scene');
const stage = scene.querySelector('.product-sticky');
const panels = [...scene.querySelectorAll('[data-panel]')];
const moduleLinks = [...scene.querySelectorAll('[data-module]')];
let activeIndex = -1;
let enhanced = false;
let sceneStart = 0;
let scrollStep = 1;
let scrollFrame = 0;

function setModule(index) {
  if (index === activeIndex) return;
  activeIndex = index;
  scene.style.setProperty('--active-module', index);
  panels.forEach((panel, i) => {
    panel.classList.toggle('is-active', i === index);
    panel.inert = enhanced && i !== index;
    if (enhanced && i !== index) panel.setAttribute('aria-hidden', 'true');
    else panel.removeAttribute('aria-hidden');
  });
  moduleLinks.forEach((link, i) => {
    if (i === index) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
}
function updateFromScroll() {
  scrollFrame = 0;
  let index = 0;
  if (enhanced) {
    index = Math.max(0, Math.min(3, Math.round((scrollY - sceneStart) / scrollStep)));
  } else {
    panels.forEach((panel, i) => {
      if (panel.getBoundingClientRect().top < innerHeight * .55) index = i;
    });
  }
  setModule(index);
}
function configureScroll() {
  // Fit the pinned presentation to the actual viewport; fall back to a normal
  // sequence when text enlargement, a phone or a short window needs more room.
  scene.classList.add('scroll-ready');
  const stageHeight = stage.getBoundingClientRect().height;
  enhanced = innerWidth >= 900 && stageHeight <= innerHeight - 48;
  scene.classList.toggle('scroll-ready', enhanced);
  if (enhanced) {
    const top = Math.max(24, (innerHeight - stageHeight) / 2);
    scrollStep = Math.max(500, innerHeight * .8);
    scene.style.setProperty('--sticky-top', `${top}px`);
    scene.style.height = `${stageHeight + 3 * scrollStep}px`;
    sceneStart = scene.getBoundingClientRect().top + scrollY - top;
  } else {
    scene.style.height = '';
    scene.style.removeProperty('--sticky-top');
  }
  activeIndex = -1;
  updateFromScroll();
}
addEventListener('scroll', () => {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateFromScroll);
}, { passive: true });
let resizeTimer;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(configureScroll, 100);
});
moduleLinks.forEach(link => link.addEventListener('click', event => {
  const index = panels.findIndex(panel => panel.dataset.panel === link.dataset.module);
  event.preventDefault();
  const target = enhanced ? sceneStart + index * scrollStep : panels[index].getBoundingClientRect().top + scrollY - 30;
  scrollTo({ top: target, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  setModule(index);
}));
configureScroll();
document.fonts.ready.then(configureScroll);

const costToggle = document.querySelector('.calculation-toggle');
const costValue = document.querySelector('#cost-value');
let numberAnimation;
let currentCost = 25.9;
function animateCost(target) {
  cancelAnimationFrame(numberAnimation);
  if (reducedMotion.matches) {
    currentCost = target;
    costValue.textContent = target.toFixed(1).replace('.', ',');
    return;
  }
  const from = currentCost;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min(1, (now - start) / 480);
    const eased = 1 - Math.pow(1 - progress, 3);
    currentCost = from + (target - from) * eased;
    costValue.textContent = currentCost.toFixed(1).replace('.', ',');
    if (progress < 1) numberAnimation = requestAnimationFrame(tick);
  }
  numberAnimation = requestAnimationFrame(tick);
}
costToggle.querySelectorAll('[data-cost]').forEach(button => button.addEventListener('click', () => {
  const discount = button.dataset.cost === 'discount';
  costToggle.style.setProperty('--toggle-index', discount ? 1 : 0);
  costToggle.querySelectorAll('[data-cost]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  animateCost(discount ? 26.7 : 25.9);
  document.querySelector('#cost-label').textContent = discount ? 'Фудкост с учётом скидок' : 'Фудкост продаж без учёта скидок';
  document.querySelector('#cost-difference').textContent = discount ? '+0,8 процентного пункта' : 'Исходный показатель';
  document.querySelector('#cost-bar').style.width = discount ? '66.75%' : '64.75%';
}));

const dialog = document.querySelector('#image-dialog');
let dialogTrigger;
document.querySelectorAll('[data-open-image]').forEach(button => button.addEventListener('click', () => {
  dialogTrigger = button;
  document.querySelector('#dialog-title').textContent = button.dataset.imageTitle;
  document.querySelector('#dialog-visual').replaceChildren(document.querySelector('#ui-' + button.dataset.openImage).content.cloneNode(true));
  document.body.classList.add('dialog-open');
  dialog.showModal();
  document.querySelector('.dialog-scroll').scrollTo(0, 0);
}));
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  dialogTrigger?.focus();
});
