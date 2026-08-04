/**
 * Lightweight photo slider for .travel-place-card media covers.
 * Works on list cards and panel clones (call bindPhotoSlider after clone).
 *
 * Note: inactive slides use opacity/visibility — images must load eagerly
 * (lazy + hidden often never fetches beyond the first slide).
 */

/**
 * Mark broken images and hide their slides. If every slide fails, collapse
 * the whole media block so the card still works without a dead cover.
 */
function wireImageErrorHandling(
  slider: HTMLElement,
  slides: HTMLElement[],
): void {
  const reindex = () => {
    const live = slides.filter((s) => !s.classList.contains('is-broken'));
    slider.dataset.photoCount = String(live.length);
    if (live.length === 0) {
      slider.classList.add('is-all-broken');
      const card = slider.closest('.travel-place-card');
      // Keep media header; swap to category placeholder instead of collapsing
      card?.classList.add('travel-place-card--placeholder-media');
      if (!slider.querySelector('.travel-place-card__placeholder')) {
        const ph = document.createElement('div');
        ph.className = 'travel-place-card__placeholder';
        ph.setAttribute('aria-hidden', 'true');
        const iconWrap = document.createElement('span');
        iconWrap.className = 'travel-place-card__placeholder-icon';
        const catIcon = card?.querySelector('.travel-place-card__cat-icon');
        if (catIcon) {
          iconWrap.innerHTML = catIcon.innerHTML;
        } else {
          iconWrap.innerHTML =
            '<span class="material-symbols-rounded" aria-hidden="true">photo_camera</span>';
        }
        ph.appendChild(iconWrap);
        slider.appendChild(ph);
      }
      return;
    }
    // Ensure one active live slide
    if (!live.some((s) => s.classList.contains('is-active'))) {
      live[0]?.classList.add('is-active');
    }
    // Hide controls when only one live image remains
    if (live.length <= 1) {
      slider.querySelector<HTMLElement>('[data-photo-dots]')?.setAttribute('hidden', '');
      slider
        .querySelectorAll<HTMLElement>('[data-photo-prev], [data-photo-next]')
        .forEach((el) => el.setAttribute('hidden', ''));
    }
  };

  slides.forEach((slide) => {
    const img = slide.querySelector<HTMLImageElement>('img');
    if (!img) return;
    const markBroken = () => {
      if (slide.classList.contains('is-broken')) return;
      slide.classList.add('is-broken');
      slide.classList.remove('is-active');
      img.removeAttribute('src');
      reindex();
    };
    img.addEventListener('error', markBroken);
    // Already failed before bind (cached error / clone)
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) {
      markBroken();
    }
  });
}

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
      } else if (img.dataset.photoSrc && !img.getAttribute('src')) {
        img.src = img.dataset.photoSrc;
      } else if (img.getAttribute('src')) {
        const src = img.getAttribute('src')!;
        if (!img.complete) img.src = src;
      }
    });

    wireImageErrorHandling(slider, slides);

    const liveSlides = () =>
      slides.filter((s) => !s.classList.contains('is-broken'));

    if (liveSlides().length <= 1) {
      slider.dataset.sliderBound = '1';
      return;
    }

    slider.dataset.sliderBound = '1';
    /** Index into live (non-broken) slides only */
    let liveIndex = 0;

    const dots = Array.from(
      slider.querySelectorAll<HTMLElement>('[data-photo-dot]'),
    );
    const prev = slider.querySelector<HTMLButtonElement>('[data-photo-prev]');
    const next = slider.querySelector<HTMLButtonElement>('[data-photo-next]');

    const goLive = (i: number) => {
      const live = liveSlides();
      if (live.length === 0) return;
      liveIndex = ((i % live.length) + live.length) % live.length;
      const target = live[liveIndex]!;
      slides.forEach((s) => {
        const on = s === target;
        s.classList.toggle('is-active', on);
        if (on) {
          const img = s.querySelector<HTMLImageElement>('img');
          if (img && !img.complete && img.src) {
            void img.decode?.().catch(() => undefined);
          }
        }
      });
      const abs = slides.indexOf(target);
      dots.forEach((d, n) => {
        const broken = slides[n]?.classList.contains('is-broken');
        d.hidden = Boolean(broken);
        d.classList.toggle('is-active', n === abs);
      });
    };

    // Start on the first active live slide if any
    {
      const live = liveSlides();
      const activeAbs = slides.findIndex((s) => s.classList.contains('is-active'));
      const startLive =
        activeAbs >= 0 ? live.indexOf(slides[activeAbs]!) : 0;
      goLive(startLive >= 0 ? startLive : 0);
    }

    prev?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      goLive(liveIndex - 1);
    });
    next?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      goLive(liveIndex + 1);
    });
    dots.forEach((dot) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const n = Number(dot.dataset.index ?? '0');
        if (Number.isNaN(n)) return;
        const live = liveSlides();
        const li = live.indexOf(slides[n]!);
        if (li >= 0) goLive(li);
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
        if (dx < 0) goLive(liveIndex + 1);
        else goLive(liveIndex - 1);
      },
      { passive: true },
    );
  });
}

export function bootTravelPhotoSliders(): void {
  bindPhotoSlider(document.body);
}
