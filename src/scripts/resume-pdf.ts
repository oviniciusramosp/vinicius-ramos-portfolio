/**
 * Resume PDF download — print pipeline.
 *
 * Uses the browser print dialog with @media print styles on /resume
 * (black text, white paper, same layout; chrome hidden). Default
 * filename comes from document.title while the dialog is open.
 */

const PDF_TITLE = 'Vinicius-Ramos-Resume';

function downloadResumePdf() {
  const article = document.querySelector<HTMLElement>('.resume');
  if (!article) return;

  const previousTitle = document.title;
  document.title = PDF_TITLE;

  // Mark body so print CSS can target this flow if needed
  document.documentElement.classList.add('is-resume-printing');

  const cleanup = () => {
    document.title = previousTitle;
    document.documentElement.classList.remove('is-resume-printing');
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);

  // Defer so title/class settle before the print tree is captured
  requestAnimationFrame(() => {
    window.print();
    // Fallback cleanup if afterprint never fires (some WebViews)
    window.setTimeout(cleanup, 1000);
  });
}

export function initResumePdf() {
  const buttons = document.querySelectorAll<HTMLElement>('[data-resume-pdf]');
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    if (btn.dataset.resumePdfBound === '1') return;
    btn.dataset.resumePdfBound = '1';
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      downloadResumePdf();
    });
  });
}

// Re-bind after View Transitions
if (typeof document !== 'undefined') {
  document.addEventListener('astro:page-load', () => {
    initResumePdf();
  });
}

export { downloadResumePdf };
