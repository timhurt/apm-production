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

  if (document.body.dataset.page === 'home') {
    nav?.querySelectorAll('a[href*="#"]').forEach(link => {
      link.setAttribute('href', new URL(link.href).hash);
    });
  }

  menuToggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });

  document.querySelectorAll('.site-nav a').forEach(link => {
    link.addEventListener('click', () => {
      nav?.classList.remove('is-open');
      menuToggle?.setAttribute('aria-expanded', 'false');
    });
  });
}

function initNavIndicator() {
  const nav = document.querySelector('.site-nav');
  let active = nav?.querySelector('[aria-current="page"]');
  if (!active) return;

  const links = [...nav.querySelectorAll('a[data-page]')];
  const indicator = document.createElement('span');
  indicator.className = 'nav-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  nav.append(indicator);
  let selected = active;

  function place(link) {
    selected = link;
    if (!nav.getClientRects().length) return;
    // Measure the label, including when mobile links span the whole menu.
    const range = document.createRange();
    range.selectNodeContents(link);
    const label = range.getBoundingClientRect();
    const bounds = nav.getBoundingClientRect();
    indicator.style.width = `${label.width}px`;
    indicator.style.transform = `translate(${label.left - bounds.left - nav.clientLeft}px, ${label.bottom - bounds.top - nav.clientTop + 4}px)`;
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

  // Carry the previous tab across page loads without delaying navigation.
  let previous;
  try {
    previous = sessionStorage.getItem('anchorpoint-nav-page');
    sessionStorage.setItem('anchorpoint-nav-page', active.dataset.page);
  } catch { /* Navigation works when browser storage is unavailable. */ }
  place(links.find(link => link.dataset.page === previous) || active);
  requestAnimationFrame(() => {
    nav.classList.add('has-sliding-indicator');
    requestAnimationFrame(() => place(active));
  });
  new ResizeObserver(() => place(selected)).observe(nav);
  document.fonts.ready.then(() => place(selected));

  if (document.body.dataset.page === 'home') {
    const sections = links.map(link => ({ link, section: document.getElementById(link.dataset.section) })).filter(item => item.section);
    let pending = false;
    function syncSection() {
      pending = false;
      const threshold = document.querySelector('.site-header').getBoundingClientRect().height + 100;
      let current = sections[0]?.link;
      for (const item of sections) {
        if (item.section.getBoundingClientRect().top <= threshold) current = item.link;
      }
      if (!current) return;
      links.forEach(link => link.removeAttribute('aria-current'));
      current.setAttribute('aria-current', 'location');
      active = current;
      place(active);
    }
    function scheduleSection() {
      if (!pending) { pending = true; requestAnimationFrame(syncSection); }
    }
    window.addEventListener('scroll', scheduleSection, { passive: true });
    window.addEventListener('resize', scheduleSection);
    window.addEventListener('hashchange', scheduleSection);
    scheduleSection();
  }
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
    if (mobile.matches) {
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

function initRevealAnimations() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (document.body.dataset.page === 'home') {
    document.querySelectorAll('.reveal').forEach(el => {
      const bounds = el.getBoundingClientRect();
      const isLeft = el.closest('.hero-copy') || bounds.left + bounds.width / 2 < window.innerWidth / 2;
      el.style.setProperty('--reveal-y', el.classList.contains('hero-visual') ? '24px' : (isLeft ? '-10px' : '10px'));
    });
    // stagger each row's items (3-up grid on desktop) so they appear in sequence as the row scrolls into view
    document.querySelectorAll('.editorial-services li.reveal').forEach((el, index) => {
      el.style.setProperty('--reveal-index', index % 3);
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

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
  }
}

function initImageParallax(selector, maxOffset = 45, speed = 0.12, moveFrame = false) {
  const wrap = document.querySelector(selector);
  const img = wrap?.querySelector('img');
  if (!wrap || !img) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const desktop = window.matchMedia('(min-width: 901px)');
  const target = moveFrame ? wrap : img;
  target.classList.add('parallax-img');
  let previousOffset = 0;
  let frame = 0;

  function update() {
    frame = 0;
    if (!desktop.matches) {
      target.style.transform = '';
      previousOffset = 0;
      return;
    }
    const rect = wrap.getBoundingClientRect();
    const elementCenter = rect.top + rect.height / 2 - (moveFrame ? previousOffset : 0);
    const viewportCenter = window.innerHeight / 2;
    // image trails the section's own scroll motion so it reads as slower and higher
    const offset = Math.max(-maxOffset, Math.min(maxOffset, (viewportCenter - elementCenter) * speed));
    target.style.transform = `translateY(${offset}px)`;
    previousOffset = offset;
  }

  function scheduleUpdate() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  desktop.addEventListener('change', scheduleUpdate);
  update();
}

async function submitNetlifyForm(form, successMessage) {
  if (form.dataset.submitting === 'true') return;
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.form-status');
  const label = button.textContent;
  form.dataset.submitting = 'true';
  button.disabled = true;
  button.textContent = 'Sending…';
  status.classList.remove('is-error', 'is-success');
  status.textContent = 'Sending your details…';
  try {
    const response = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString()
    });
    if (!response.ok) throw new Error('Submission failed');
    status.textContent = successMessage;
    status.classList.add('is-success');
    form.reset();
    form.dispatchEvent(new Event('change'));
  } catch {
    status.textContent = 'We couldn’t send your details. Please try again or contact info@anchorpoint.med.';
    status.classList.add('is-error');
  } finally {
    button.disabled = false;
    button.textContent = label;
    delete form.dataset.submitting;
  }
}

function initSignupForms() {
  document.querySelectorAll('.signup-form').forEach(form => {
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

function initOnboardingForm() {
  const form = document.querySelector('#onboarding-form');
  if (!form) return;
  const phone = form.elements.phone;
  const method = form.elements.contactMethod;
  function updatePhoneRequirement() {
    phone.required = method.value === 'Phone';
    form.querySelector('label[for="phone"]').textContent = phone.required ? 'Phone *' : 'Phone (optional)';
  }
  form.addEventListener('change', updatePhoneRequirement);
  updatePhoneRequirement();
  form.addEventListener('submit', event => {
    event.preventDefault();
    for (const field of form.querySelectorAll('input, textarea')) field.value = field.value.trim();
    if (!form.reportValidity()) return;
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
  initRevealAnimations();
  initImageParallax('.editorial-pair--about .editorial-image');
  initImageParallax('.family-care-photo', 45, -0.12, true);
  initSignupForms();
  initOnboardingForm();
  initFooterUtilities();
}

initPage();
