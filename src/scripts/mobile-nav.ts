/**
 * Mobile fullscreen nav (≤640px).
 * Toggle opens a full-viewport menu with large centered links.
 * Header uses transition:persist — init is idempotent.
 */

const HEADER = '[data-site-header]';
const TOGGLE = '[data-nav-menu-toggle]';
const MENU = '[data-site-menu]';
const READY = 'data-mobile-nav-ready';

function setOpen(header: HTMLElement, open: boolean) {
  const toggle = header.querySelector<HTMLElement>(TOGGLE);
  const menu = header.querySelector<HTMLElement>(MENU);
  if (!toggle || !menu) return;

  header.classList.toggle('is-menu-open', open);
  document.documentElement.classList.toggle('is-nav-menu-open', open);

  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  menu.setAttribute('aria-hidden', open ? 'false' : 'true');

  // Prevent background scroll while open
  if (open) {
    document.documentElement.style.overflow = 'hidden';
  } else {
    document.documentElement.style.overflow = '';
  }
}

export function closeMobileNav() {
  const header = document.querySelector<HTMLElement>(HEADER);
  if (!header) return;
  setOpen(header, false);
}

export function initMobileNav(root: ParentNode = document) {
  const header = root.querySelector?.<HTMLElement>(HEADER) ?? document.querySelector<HTMLElement>(HEADER);
  if (!header) return;

  const toggle = header.querySelector<HTMLButtonElement>(TOGGLE);
  const menu = header.querySelector<HTMLElement>(MENU);
  if (!toggle || !menu) return;

  // Always close on soft navigations (persist header can keep open state)
  setOpen(header, false);

  if (toggle.getAttribute(READY) === '1') return;
  toggle.setAttribute(READY, '1');

  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !header.classList.contains('is-menu-open');
    setOpen(header, next);
  });

  // Close when a menu link is activated (ClientRouter will navigate)
  menu.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((a) => {
    a.addEventListener('click', () => {
      // Delay close slightly so the click registers before unmount feel
      setOpen(header, false);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!header.classList.contains('is-menu-open')) return;
    setOpen(header, false);
    toggle.focus({ preventScroll: true });
  });

  // Close if resizing up to desktop
  const mql = window.matchMedia('(min-width: 641px)');
  const onMq = () => {
    if (mql.matches) setOpen(header, false);
  };
  mql.addEventListener?.('change', onMq);
}
