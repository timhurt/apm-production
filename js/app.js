const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

function setActiveNavLink() {
  const page = document.body.dataset.page;
  if (!page) return;

  document.querySelectorAll('.site-nav a[aria-current="page"]').forEach(link => {
    link.removeAttribute('aria-current');
  });

  const activeLink = document.querySelector(`.site-nav a[data-page="${page}"]`);
  if (activeLink) {
    activeLink.setAttribute('aria-current', 'page');
  }
}

function initNav() {
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  if (!nav || !menuToggle) return;
  nav.classList.add('is-enhanced');
  const mobile = window.matchMedia('(max-width: 900px)');
  const backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');
  document.body.append(backdrop);
  backdrop.addEventListener('click', closeMenu);
  function updateMenuLabel(open) {
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Menu');
    document.body.classList.toggle('mobile-nav-open', open && mobile.matches);
  }
  function closeMenu() {
    nav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    updateMenuLabel(false);
  }
  nav.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobile.matches && nav.classList.contains('is-open')) {
      closeMenu();
      menuToggle.focus();
    }
  });
  nav.addEventListener('focusout', () => {
    requestAnimationFrame(() => {
      if (!nav.contains(document.activeElement) && document.activeElement !== menuToggle) closeMenu();
    });
  });
  mobile.addEventListener('change', closeMenu);

  if (document.body.dataset.page === 'home') {
    nav?.querySelectorAll('a[href*="#"]').forEach(link => {
      link.setAttribute('href', new URL(link.href).hash);
    });
  }

  menuToggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(open));
    updateMenuLabel(open);
  });

  document.querySelectorAll('.site-nav a').forEach(link => {
    link.addEventListener('click', () => {
      nav?.classList.remove('is-open');
      menuToggle?.setAttribute('aria-expanded', 'false');
      updateMenuLabel(false);
    });
  });
}

function initNavIndicator() {
  const nav = document.querySelector('.site-nav');
  const active = nav?.querySelector('a:not(.nav-cta)[aria-current="page"]');
  if (!nav) return;

  const links = [...nav.querySelectorAll('a:not(.nav-cta)')];
  const mobile = window.matchMedia('(max-width: 900px)');
  const indicator = document.createElement('span');
  indicator.className = 'nav-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  nav.append(indicator);
  let selected = active;

  function place(link) {
    selected = link;
    if (!link) {
      indicator.style.opacity = '0';
      return;
    }
    if (!nav.getClientRects().length) return;
    // Measure the label, including when mobile links span the whole menu.
    const range = document.createRange();
    range.selectNodeContents(link);
    const label = range.getBoundingClientRect();
    const bounds = nav.getBoundingClientRect();
    indicator.style.width = `${label.width}px`;
    // Only horizontal movement animates; vertical placement never transitions.
    indicator.style.top = mobile.matches
      ? `${label.bottom - bounds.top - nav.clientTop + 4}px`
      : '';
    indicator.style.transform = `translateX(${label.left - bounds.left - nav.clientLeft}px)`;
    indicator.style.opacity = '1';
  }

  function restore() {
    place(links.find(link => link === document.activeElement) || active);
  }

  links.forEach(link => {
    link.addEventListener('pointerenter', () => place(link));
    link.addEventListener('focus', () => place(link));
  });
  nav.addEventListener('pointerleave', restore);
  nav.addEventListener('focusout', () => requestAnimationFrame(restore));
  nav.querySelector('.nav-cta')?.addEventListener('pointerenter', restore);

  // Position before enabling transitions, with no cross-page animation replay.
  place(active);
  requestAnimationFrame(() => nav.classList.add('has-sliding-indicator'));
  new ResizeObserver(() => place(selected)).observe(nav);
  document.fonts.ready.then(() => place(selected));

}

function initScrollingLogo() {
  const source = document.querySelector('.hero-logo');
  const header = document.querySelector('.site-header');
  const target = header?.querySelector('.brand-logo-img');
  if (!source || !target) return;

  // Match desktop artwork while preserving the mobile picture source.
  target.src = source.getAttribute('src');
  target.setAttribute('width', source.getAttribute('width'));
  target.setAttribute('height', source.getAttribute('height'));

  const floating = source.cloneNode();
  floating.className = 'scrolling-logo';
  floating.alt = '';
  floating.setAttribute('aria-hidden', 'true');
  document.body.append(floating);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 900px)');
  let frame = 0;

  function update() {
    frame = 0;
    if (mobile.matches || reduceMotion.matches) {
      document.body.classList.remove('logo-scroll-active');
      header.classList.add('is-logo-docked');
      source.style.visibility = '';
      floating.hidden = true;
      return;
    }
    const origin = source.getBoundingClientRect();
    const destination = target.getBoundingClientRect();
    const originTop = origin.top + window.scrollY;
    const distance = Math.max(1, originTop - destination.top);
    const progress = Math.min(1, Math.max(0, window.scrollY / distance));
    const docked = progress >= 1;
    header.classList.toggle('is-logo-docked', docked);
    document.body.classList.add('logo-scroll-active');
    source.style.visibility = reduceMotion.matches && !docked ? 'visible' : '';
    floating.hidden = docked || reduceMotion.matches;
    const width = origin.width + (destination.width - origin.width) * progress;
    const left = origin.left + (destination.left - origin.left) * progress;
    const top = originTop + (destination.top - originTop) * progress;
    floating.style.width = `${origin.width}px`;
    floating.style.height = 'auto';
    floating.style.transform = `translate(${left}px, ${top}px) scale(${width / origin.width})`;
  }

  function scheduleUpdate() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('pageshow', scheduleUpdate);
  reduceMotion.addEventListener('change', scheduleUpdate);
  mobile.addEventListener('change', scheduleUpdate);
  new ResizeObserver(scheduleUpdate).observe(document.querySelector('.hero'));
  document.fonts.ready.then(scheduleUpdate);
  update();
}

function initMobileFooterDock() {
  const header = document.querySelector('.site-header');
  const footer = document.querySelector('.site-footer');
  if (!header || !footer) return;
  const mobile = matchMedia('(max-width: 900px)');
  const wipe = document.createElement('div');
  wipe.className = 'header-footer-wipe';
  wipe.setAttribute('aria-hidden', 'true');
  wipe.inert = true;
  const bar = header.querySelector('.nav-wrap').cloneNode(true);
  bar.querySelector('.site-nav')?.remove();
  const menuCopy = bar.querySelector('.menu-toggle');
  menuCopy.className = 'wipe-menu-toggle';
  menuCopy.removeAttribute('aria-controls');
  wipe.append(bar);
  header.append(wipe);
  let frame;
  function update() {
    frame = null;
    // The footer stays in normal document flow; swap only at the header edge.
    const bounds = header.getBoundingClientRect();
    const edge = mobile.matches ? Math.max(0, Math.min(bounds.height, footer.getBoundingClientRect().top - bounds.top)) : bounds.height;
    wipe.style.clipPath = `inset(${edge}px 0 0 0)`;
    header.classList.toggle('footer-wiping', mobile.matches && edge < bounds.height);
    const footerLogo = footer.querySelector('.footer-logo-img');
    const navLogo = header.querySelector('.nav-wrap .brand-logo-img');
    footer.classList.toggle('logo-in-header', mobile.matches && footerLogo.getBoundingClientRect().top <= navLogo.getBoundingClientRect().top);
    const docked = mobile.matches && edge === 0;
    header.classList.toggle('has-footer-dock', docked);
    header.classList.toggle('footer-is-docked', docked);
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  mobile.addEventListener('change', schedule);
  new ResizeObserver(schedule).observe(document.body);
  update();
}

function initFaqParallax() {
  const hero = document.querySelector('body[data-page="faq"] .page-hero');
  if (!hero) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame;
  function update() {
    frame = null;
    const distance = Math.max(0, -hero.getBoundingClientRect().top + 74);
    hero.firstElementChild.style.transform = reduced.matches ? '' : `translateY(${Math.min(distance, hero.offsetHeight) * 0.35}px)`;
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  addEventListener('scroll', schedule, { passive: true });
  reduced.addEventListener('change', schedule);
  update();
}

function initMembershipPhotoParallax() {
  const photo = document.querySelector('.membership-waiting-photo');
  if (!photo) return;
  const image = photo.querySelector('img');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame;
  function update() {
    frame = null;
    if (reduced.matches) { image.style.transform = ''; return; }
    const bounds = photo.getBoundingClientRect();
    const progress = Math.max(-1, Math.min(1, (innerHeight / 2 - bounds.top - bounds.height / 2) / ((innerHeight + bounds.height) / 2)));
    image.style.transform = `translateY(${progress * bounds.height * 0.12}px)`;
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  reduced.addEventListener('change', schedule);
  update();
}

function initRevealAnimations() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (document.body.dataset.page === 'home') {
    const revealPositions = [...document.querySelectorAll('.reveal')].map(el => ({ el, bounds: el.getBoundingClientRect() }));
    revealPositions.forEach(({ el, bounds }) => {
      const isLeft = el.closest('.hero-copy') || bounds.left + bounds.width / 2 < window.innerWidth / 2;
      el.style.setProperty('--reveal-y', el.classList.contains('hero-visual') ? '24px' : (isLeft ? '-10px' : '10px'));
    });
    document.querySelectorAll('.editorial-benefits li.reveal').forEach((el, index) => {
      el.style.setProperty('--reveal-y', '20px');
      el.style.setProperty('--reveal-index', index);
    });
    if (!reduceMotion) document.body.classList.add('home-entrance');
  }

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });

    document.querySelectorAll('.reveal').forEach(el => {
      el.classList.add('reveal-ready');
      observer.observe(el);
      el.addEventListener('focusin', () => {
        el.classList.add('is-visible');
        observer.unobserve(el);
      });
    });
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
  }
}

async function submitNetlifyForm(form, successMessage) {
  if (form.dataset.submitting === 'true') return;
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.form-status');
  const label = button.textContent;
  const inquiry = form.id === 'onboarding-form';
  const started = performance.now();
  const previousMinHeight = form.style.minHeight;
  if (inquiry) {
    const bounds = form.getBoundingClientRect();
    form.style.minHeight = `${bounds.height}px`;
    const visibleTop = Math.max(bounds.top, 90);
    const visibleBottom = Math.min(bounds.bottom, innerHeight);
    status.style.top = `${Math.max(24, (visibleTop + visibleBottom) / 2 - bounds.top)}px`;
    document.body.classList.add('inquiry-sending');
  }
  form.dataset.submitting = 'true';
  button.disabled = true;
  button.textContent = 'Sending…';
  status.classList.remove('is-error', 'is-success');
  status.textContent = inquiry ? 'Sending…' : 'Sending your details…';
  form.setAttribute('aria-busy', 'true');
  try {
    const response = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString()
    });
    if (!response.ok) throw new Error('Submission failed');
    if (inquiry) await new Promise(resolve => setTimeout(resolve, Math.max(0, 2500 - (performance.now() - started))));
    status.textContent = successMessage;
    status.classList.add('is-success');
    form.reset();
    form.dispatchEvent(new Event('change'));
    window.location.assign(form.action);
  } catch {
    form.classList.remove('is-sent');
    status.textContent = 'We couldn’t send your details. Please try again or contact info@anchorpoint.med.';
    status.classList.add('is-error');
  } finally {
    if (inquiry) {
      document.body.classList.remove('inquiry-sending');
      form.style.minHeight = previousMinHeight;
      status.style.top = '';
    }
    form.removeAttribute('aria-busy');
    button.disabled = false;
    button.textContent = label;
    delete form.dataset.submitting;
  }
}

function initSignupForms() {
  document.querySelectorAll('.signup-form').forEach(form => {
    form.noValidate = true;
    form.addEventListener('submit', event => {
      event.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const status = form.querySelector('.form-status');
      input.value = input.value.trim();
      status.classList.remove('is-error', 'is-success');
      if (!input.validity.valid || !emailPattern.test(input.value)) {
        status.textContent = 'Please enter a valid email address.';
        status.classList.add('is-error');
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return;
      }
      input.removeAttribute('aria-invalid');
      submitNetlifyForm(form, 'Thank you — your interest has been received.');
    });
  });
}

function initAvailabilityPicker(form) {
  const picker = form.querySelector('.reach-preferences');
  if (!picker) return;
  const days = [...picker.querySelectorAll('[data-day]')];
  const periods = [...picker.querySelectorAll('[data-period]')];
  const reveal = picker.querySelector('.availability-reveal');
  const phonePreference = form.querySelector('#contact-phone');
  function sync() {
    picker.hidden = !phonePreference.checked;
    if (picker.hidden) [...days, ...periods].forEach(button => button.setAttribute('aria-pressed', 'false'));
    const hasDays = days.some(button => button.getAttribute('aria-pressed') === 'true');
    if (!hasDays) periods.forEach(button => button.setAttribute('aria-pressed', 'false'));
    reveal.classList.toggle('is-expanded', hasDays);
    reveal.inert = !hasDays;
    reveal.setAttribute('aria-hidden', String(!hasDays));
    for (const button of [...days, ...periods]) {
      const value = button.dataset.day || button.dataset.period;
      const input = [...picker.querySelectorAll('input[type="hidden"]')].find(input => input.value === value);
      input.disabled = button.getAttribute('aria-pressed') !== 'true';
    }
    const selected = periods.filter(button => button.getAttribute('aria-pressed') === 'true');
    // Retain the original range fields for the existing form integration.
    const start = form.elements.preferredTimeStart;
    const end = form.elements.preferredTimeEnd;
    start.disabled = end.disabled = selected.length === 0;
    start.value = selected.length ? selected.map(button => button.dataset.start).sort()[0] : '';
    end.value = selected.length ? selected.map(button => button.dataset.end).sort().at(-1) : '';
  }
  phonePreference.addEventListener('change', sync);
  for (const button of [...days, ...periods]) {
    button.addEventListener('click', () => {
      button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
      sync();
    });
  }
  form.addEventListener('reset', () => {
    [...days, ...periods].forEach(button => button.setAttribute('aria-pressed', 'false'));
    queueMicrotask(sync);
  });
  sync();
}

function initOnboardingForm() {
  const form = document.querySelector('#onboarding-form');
  if (!form) return;
  initAvailabilityPicker(form);
  form.noValidate = true;
  const fields = [...form.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([name="bot-field"]), select, textarea')];
  function showError(field) {
    const error = document.getElementById(`${field.id}-error`);
    const invalid = !field.validity.valid;
    field.setAttribute('aria-invalid', String(invalid));
    error.textContent = invalid ? 'Action required.' : '';
    error.hidden = !invalid;
    return invalid;
  }
  fields.forEach(field => {
    const error = document.createElement('p');
    error.id = `${field.id}-error`;
    error.className = 'field-error';
    error.hidden = true;
    field.after(error);
    field.setAttribute('aria-describedby', [field.getAttribute('aria-describedby'), error.id].filter(Boolean).join(' '));
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') showError(field);
    });
  });
  const phone = form.elements.phone;
  const phonePreference = form.querySelector('#contact-phone');
  function updatePhoneRequirement() {
    phone.required = phonePreference.checked;
    form.querySelector('label[for="phone"]').textContent = phone.required ? 'Phone *' : 'Phone (optional)';
    if (phone.getAttribute('aria-invalid') === 'true') showError(phone);
  }
  form.addEventListener('change', updatePhoneRequirement);
  updatePhoneRequirement();
  const membershipType = form.elements.membershipType;
  const dependants = form.elements.familyMembers;
  const dependantsField = form.querySelector('#family-dependants-field');
  const familySteps = [...form.querySelectorAll('[data-family-step]')];
  if (new URLSearchParams(window.location.search).get('membership') === 'family') {
    membershipType.value = 'Family';
  }
  function updateFamilySteps() {
    const count = dependants.valueAsNumber;
    familySteps.forEach(button => {
      button.disabled = dependants.disabled || (Number(button.dataset.familyStep) < 0 ? count <= 1 : count >= 4);
    });
  }
  familySteps.forEach(button => button.addEventListener('click', () => {
    const count = Number.isFinite(dependants.valueAsNumber) ? dependants.valueAsNumber : 2;
    dependants.value = String(Math.max(1, Math.min(4, count + Number(button.dataset.familyStep))));
    dependants.dispatchEvent(new Event('input', { bubbles: true }));
  }));
  dependants.addEventListener('input', updateFamilySteps);
  function updateMembershipType() {
    const family = membershipType.value === 'Family';
    dependantsField.hidden = !family;
    dependants.disabled = !family;
    if (!family) {
      dependants.value = '';
      showError(dependants);
    } else if (!dependants.value) {
      dependants.value = '2';
    }
    updateFamilySteps();
  }
  membershipType.addEventListener('change', updateMembershipType);
  form.addEventListener('reset', () => queueMicrotask(updateMembershipType));
  updateMembershipType();
  form.addEventListener('submit', event => {
    event.preventDefault();
    for (const field of form.querySelectorAll('input, textarea')) field.value = field.value.trim();
    const invalidFields = fields.filter(showError);
    if (invalidFields.length) {
      const status = form.querySelector('.form-status');
      status.textContent = `Briefing incomplete: ${invalidFields.length} field${invalidFields.length === 1 ? ' needs' : 's need'} attention.`;
      status.classList.remove('is-success');
      status.classList.add('is-error');
      invalidFields[0].focus();
      return;
    }
    submitNetlifyForm(form, 'Thank you for your interest in Anchor Point. We’ll contact you to discuss membership.');
  });
}

function initFooterUtilities() {
  document.querySelectorAll('.year, #year').forEach(el => el.textContent = new Date().getFullYear());

  document.querySelectorAll('.social-placeholder').forEach(link => {
    link.addEventListener('click', event => event.preventDefault());
  });
}

async function loadGlobalPartials() {
  const headerMount = document.querySelector('#site-header');
  const footerMount = document.querySelector('#site-footer');

  if (!headerMount && !footerMount) {
    return;
  }

  const tasks = [];

  if (headerMount) {
    tasks.push(
      fetch('partials/header.html')
        .then(response => {
          if (!response.ok) throw new Error('Failed to load header partial');
          return response.text();
        })
        .then(markup => {
          headerMount.innerHTML = markup;
        })
    );
  }

  if (footerMount) {
    tasks.push(
      fetch('partials/footer.html')
        .then(response => {
          if (!response.ok) throw new Error('Failed to load footer partial');
          return response.text();
        })
        .then(markup => {
          footerMount.innerHTML = markup;
        })
    );
  }

  await Promise.all(tasks);
}

function initOfficeGallery() {
  const opener = document.querySelector('.membership-gallery-open');
  const dialog = document.querySelector('#office-gallery');
  if (!opener || !dialog) return;
  const photos = [
    {src: 'img/anchorpoint-waiting.jpg', label: 'Waiting area'},
    {src: 'img/anchorpoint-office.jpg', label: 'Office'},
    {src: 'img/anchorpoint-exam.jpg', label: 'Exam room'}
  ];
  const photo = dialog.querySelector('img');
  const caption = dialog.querySelector('figcaption');
  let index = 0;
  let start = null;
  let previousOverflow;
  let transitioning = false;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const frame = opener.closest('.membership-waiting-photo');
  async function animateFrame(expanding) {
    if (reducedMotion.matches) return;
    const small = frame.getBoundingClientRect();
    const source = opener.querySelector('img').getBoundingClientRect();
    const large = photo.getBoundingClientRect();
    const layer = document.createElement('div');
    layer.className = 'office-gallery-transition';
    layer.setAttribute('aria-hidden', 'true');
    const copy = photo.cloneNode();
    copy.removeAttribute('id');
    layer.append(copy);
    dialog.append(layer);
    photo.style.visibility = 'hidden';
    dialog.classList.add('is-transitioning');
    const frameKeys = [
      {left: `${small.left}px`, top: `${small.top}px`, width: `${small.width}px`, height: `${small.height}px`, borderRadius: getComputedStyle(frame).borderRadius},
      {left: `${large.left}px`, top: `${large.top}px`, width: `${large.width}px`, height: `${large.height}px`, borderRadius: '0px'}
    ];
    const imageKeys = [
      {left: `${source.left - small.left}px`, top: `${source.top - small.top}px`, width: `${source.width}px`, height: `${source.height}px`},
      {left: '0px', top: '0px', width: `${large.width}px`, height: `${large.height}px`}
    ];
    const options = {duration: 480, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both'};
    if (!expanding) { frameKeys.reverse(); imageKeys.reverse(); }
    try {
      await Promise.all([
        layer.animate(frameKeys, options).finished,
        copy.animate(imageKeys, options).finished
      ]);
    } finally {
      layer.remove();
      photo.style.visibility = '';
      dialog.classList.remove('is-transitioning');
    }
  }
  async function closeGallery() {
    if (transitioning || !dialog.open) return;
    transitioning = true;
    try {
      const preview = opener.querySelector('img');
      preview.src = photos[index].src;
      preview.alt = photo.alt;
      await preview.decode().catch(() => {});
      await animateFrame(false);
      dialog.close();
    } finally { transitioning = false; }
  }
  function showPhoto(next) {
    index = (next + photos.length) % photos.length;
    photo.src = photos[index].src;
    photo.alt = `The ${photos[index].label.toLowerCase()} at Anchor Point Medicine`;
    caption.textContent = `${photos[index].label} · ${index + 1} of ${photos.length}`;
  }
  opener.hidden = false;
  opener.addEventListener('click', async () => {
    if (transitioning) return;
    transitioning = true;
    showPhoto(index);
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    try {
      await photo.decode().catch(() => {});
      await animateFrame(true);
    } finally { transitioning = false; }
  });
  dialog.querySelector('[data-gallery-close]').addEventListener('click', closeGallery);
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeGallery(); });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) closeGallery();
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    start = null;
    opener.focus({preventScroll: true});
  });
  dialog.querySelector('[data-gallery-prev]').addEventListener('click', () => showPhoto(index - 1));
  dialog.querySelector('[data-gallery-next]').addEventListener('click', () => showPhoto(index + 1));
  dialog.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    showPhoto(index + (event.key === 'ArrowRight' ? 1 : -1));
  });
  photo.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    start = {x: event.clientX, y: event.clientY};
    photo.setPointerCapture(event.pointerId);
  });
  photo.addEventListener('pointerup', event => {
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    start = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) showPhoto(index + (dx < 0 ? 1 : -1));
  });
  photo.addEventListener('pointercancel', () => { start = null; });
}

async function initPage() {
  try {
    await loadGlobalPartials();
  } catch (error) {
    console.error(error);
  }

  setActiveNavLink();
  initNav();
  initNavIndicator();
  initScrollingLogo();
  initMobileFooterDock();
  initFaqParallax();
  initMembershipPhotoParallax();
  initOfficeGallery();
  initRevealAnimations();
  initSignupForms();
  initOnboardingForm();
  initFooterUtilities();
}

initPage();
