/**
 * Lightweight photo slider for .travel-place-card media covers.
 * Works on list cards and panel clones (call bindPhotoSlider after clone).
 *
 * Note: inactive slides use opacity/visibility — images must load eagerly
 * (lazy + hidden often never fetches beyond the first slide).
 */

export function bindPhotoSlider(root: HTMLElement): void {
  const sliders = root.matches('[data-photo-slider]')
    ? [root]
    : Array.from(root.querySelectorAll<HTMLElement>('[data-photo-slider]'));

  sliders.forEach((slider) => {
    if (slider.dataset.sliderBound === '1') return;

    const slides = Array.from(
      slider.querySelectorAll<HTMLElement>('[data-photo-slide]'),
    );
    if (slides.length === 0) return;

    // Ensure every slide image is requested (not stuck in lazy queue)
    slides.forEach((slide) => {
      const img = slide.querySelector<HTMLImageElement>('img');
      if (!img) return;
      img.loading = 'eager';
      // Force re-fetch if clone left a half-loaded state
      if (img.dataset.src) {
        img.src = img.dataset.src;
      } else if (img.getAttribute('src')) {
        const src = img.getAttribute('src')!;
        if (!img.complete) img.src = src;
      }
    });

    if (slides.length <= 1) {
      slider.dataset.sliderBound = '1';
      return;
    }

    slider.dataset.sliderBound = '1';
    let index = Math.max(
      0,
      slides.findIndex((s) => s.classList.contains('is-active')),
    );
    if (index < 0) index = 0;

    const dots = Array.from(
      slider.querySelectorAll<HTMLElement>('[data-photo-dot]'),
    );
    const prev = slider.querySelector<HTMLButtonElement>('[data-photo-prev]');
    const next = slider.querySelector<HTMLButtonElement>('[data-photo-next]');

    const go = (i: number) => {
      index = ((i % slides.length) + slides.length) % slides.length;
      slides.forEach((s, n) => {
        const on = n === index;
        s.classList.toggle('is-active', on);
        // Preload neighbors when becoming active
        if (on || n === (index + 1) % slides.length || n === (index - 1 + slides.length) % slides.length) {
          const img = s.querySelector<HTMLImageElement>('img');
          if (img && !img.complete && img.src) {
            // touch decode
            void img.decode?.().catch(() => undefined);
          }
        }
      });
      dots.forEach((d, n) => d.classList.toggle('is-active', n === index));
    };

    // Normalize initial state
    go(index);

    prev?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      go(index - 1);
    });
    next?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      go(index + 1);
    });
    dots.forEach((dot) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const n = Number(dot.dataset.index ?? '0');
        if (!Number.isNaN(n)) go(n);
      });
    });

    let startX = 0;
    slider.addEventListener(
      'touchstart',
      (e) => {
        startX = e.changedTouches[0]?.clientX ?? 0;
      },
      { passive: true },
    );
    slider.addEventListener(
      'touchend',
      (e) => {
        const endX = e.changedTouches[0]?.clientX ?? startX;
        const dx = endX - startX;
        if (Math.abs(dx) < 40) return;
        if (dx < 0) go(index + 1);
        else go(index - 1);
      },
      { passive: true },
    );
  });
}

export function bootTravelPhotoSliders(): void {
  bindPhotoSlider(document.body);
}
