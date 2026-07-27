import Banner from './Banner.astro';
import { site } from '../data/site';

const defaultMessage = site.banner;

export default {
  title: 'Components/Banner',
  component: Banner,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Reusable bottom toast with Apple AAP-style entrance (seed → glass expand → dismiss).

**Props**
- \`message\` — toast copy (required)
- \`storageKey\` — localStorage key for dismiss persistence; \`""\` disables persist
- \`dismissLabel\` — accessible label for the close button
- \`enterDelay\` — ms after the gate before entrance
- \`waitEvent\` — document event to wait for (homepage: \`logo-wave:intro-end\`)
- \`waitTimeout\` — max ms to wait for that event

**Client API** (\`src/scripts/toast-banner.ts\`)
- \`bootToastBanners({ forceReplay })\` — init / replay all instances in the document
- \`clearToastDismiss(storageKey)\` — clear a dismiss flag
        `.trim(),
      },
    },
  },
  argTypes: {
    message: {
      control: 'text',
      description: 'Toast copy',
    },
    storageKey: {
      control: 'text',
      description:
        'localStorage key for dismiss. Empty string = no persistence (always re-shows).',
    },
    dismissLabel: {
      control: 'text',
      description: 'aria-label on the dismiss button',
    },
    enterDelay: {
      control: { type: 'number', min: 0, max: 2000, step: 40 },
      description: 'Delay after gate / before entrance (ms)',
    },
    waitEvent: {
      control: 'text',
      description: 'Optional document event to wait for before entrance',
    },
  },
  args: {
    message: defaultMessage,
    storageKey: '',
    dismissLabel: 'Dismiss',
    enterDelay: 200,
    waitEvent: '',
  },
};

/** Production-like message; no persistence so the entrance always plays in Storybook. */
export const Default = {
  args: {
    message: defaultMessage,
    storageKey: '',
    enterDelay: 200,
  },
};

/** Short label — checks compact pill width / icon travel. */
export const Short = {
  args: {
    message: 'WIP',
    storageKey: '',
    enterDelay: 200,
  },
};

/** Longer copy — checks max-width, padding, and wrap on small viewports. */
export const Long = {
  args: {
    message:
      'This portfolio is currently in development. Some projects and case studies may still be incomplete.',
    storageKey: '',
    enterDelay: 200,
  },
};

/**
 * Persists dismiss under a Storybook-only key.
 * Click dismiss once; reload the story to confirm it stays hidden.
 * Change `storageKey` or clear localStorage to see it again.
 */
export const PersistDismiss = {
  name: 'Persist dismiss',
  args: {
    message: defaultMessage,
    storageKey: 'storybook:banner-persist-demo',
    enterDelay: 200,
  },
};

/** Instant entrance (no delay) — useful when scrubbing controls. */
export const Instant = {
  args: {
    message: defaultMessage,
    storageKey: '',
    enterDelay: 0,
  },
};
