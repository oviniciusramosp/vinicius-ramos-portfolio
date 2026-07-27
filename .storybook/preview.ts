import type { Preview } from '@storybook-astro/framework';

import '../src/styles/global.css';
// Side-effect: document-level paddlenav + entrance for ScrollGallery
// (Astro component <script> modules often don't re-run when Storybook swaps stories)
import '../src/scripts/scroll-gallery';
import '../src/scripts/toast-banner';
import '../src/scripts/deck-slider';
import '../src/scripts/social-fan';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'portfolio',
      values: [
        { name: 'portfolio', value: '#000000' },
        { name: 'surface', value: '#131219' },
        { name: 'light', value: '#f5f5f5' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: [
          'Tokens',
          ['Overview', 'Colors', 'Typography', 'Spacing', 'Radii', 'Motion'],
          'Components',
          [
            'Button',
            'Tag',
            'Banner',
            'Header',
            'LogoWave',
            'Footer',
            'ProjectCard',
            'ProjectGrid',
            'QuoteSlider',
            'NextProject',
            'ScrollGallery',
            'DeckSlider',
            'SocialFan',
          ],
        ],
      },
    },
  },
  decorators: [
    (story) => {
      // Ionicons used by Banner / Footer
      if (
        typeof document !== 'undefined' &&
        !document.querySelector('script[data-storybook-ionicons]')
      ) {
        const moduleScript = document.createElement('script');
        moduleScript.type = 'module';
        moduleScript.src =
          'https://cdn.jsdelivr.net/npm/ionicons@7.4.0/dist/ionicons/ionicons.esm.js';
        moduleScript.dataset.storybookIonicons = 'true';
        document.head.appendChild(moduleScript);

        const nomodule = document.createElement('script');
        nomodule.noModule = true;
        nomodule.src =
          'https://cdn.jsdelivr.net/npm/ionicons@7.4.0/dist/ionicons/ionicons.js';
        document.head.appendChild(nomodule);
      }

      // Re-init interactive components after Storybook paints the story
      if (typeof window !== 'undefined') {
        const reinit = () => {
          void import('../src/scripts/scroll-gallery').then((m) => {
            m.bootScrollGalleries();
          });
          void import('../src/scripts/toast-banner').then((m) => {
            m.bootToastBanners({ forceReplay: true });
          });
          void import('../src/scripts/deck-slider').then((m) => {
            m.bootDeckSliders();
          });
          void import('../src/scripts/social-fan').then((m) => {
            m.bootSocialFans();
          });
          void import('../src/scripts/magnetic').then((m) => {
            m.initMagneticButtons();
          });
        };
        window.setTimeout(reinit, 0);
        window.setTimeout(reinit, 120);
      }

      return story();
    },
  ],
};

export default preview;
