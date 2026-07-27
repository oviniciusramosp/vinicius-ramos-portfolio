/**
 * Quotes slider — production model is ScrollGallery (incentive-gallery-dark)
 * with `kind: 'quote'` cards:
 *   [role · accent mono]  [avatar?]
 *   [name · Blatant]      [avatar?]
 *   ──────────────────────────────
 *   quote body
 *
 * Chrome: horizontal scroll · paddlenav bottom · no autoplay · all cards visible.
 * (Legacy QuoteSlider.astro with deck/AAP chrome is deprecated for case studies.)
 */
import ScrollGallery from './ScrollGallery.astro';
import { getProject } from '../data/projects';
import type { ProjectQuote } from '../data/projects';
import { mockQuotes, mockQuotesNoAvatar } from '../stories/fixtures';

function toQuoteItems(quotes: ProjectQuote[], idPrefix = 'quote') {
  return quotes.map((quote, index) => ({
    id: `${idPrefix}-${index}`,
    kind: 'quote' as const,
    label: quote.role,
    headline: quote.author,
    body: quote.text,
    avatar: quote.avatar,
  }));
}

const hpQuotes = getProject('hp-printables')?.quotes ?? [];

export default {
  title: 'Components/QuoteSlider',
  component: ScrollGallery,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Portfolio testimonials slider: ScrollGallery dark theme + quote cards (~400px wide). Role (blue mono) · name (Blatant) · optional avatar · hairline · body. Bottom paddlenav, no autoplay, no dim on inactive cards.',
      },
    },
  },
  argTypes: {
    theme: { control: 'select', options: ['dark', 'light'] },
    short: { control: 'boolean' },
    entrance: { control: 'boolean' },
  },
};

/** Canonical production model (HP Printables data + avatars) */
export const Default = {
  name: 'Quotes · HP Printables',
  args: {
    id: 'quotes-hp-printables',
    items: toQuoteItems(hpQuotes, 'hp-quote'),
    theme: 'dark',
    short: true,
    entrance: false,
    ariaLabel: 'Testimonials',
  },
};

/** Fixture set — same layout, generic copy */
export const Fixture = {
  name: 'Quotes · fixture',
  args: {
    id: 'quotes-fixture',
    items: toQuoteItems(mockQuotes, 'fixture-quote'),
    theme: 'dark',
    short: true,
    entrance: false,
    ariaLabel: 'Testimonials',
  },
};

/** Identity-only header (no portrait) */
export const WithoutAvatars = {
  name: 'Quotes · without avatars',
  args: {
    id: 'quotes-no-avatar',
    items: toQuoteItems(mockQuotesNoAvatar, 'no-avatar-quote'),
    theme: 'dark',
    short: true,
    entrance: false,
    ariaLabel: 'Testimonials',
  },
};

export const Single = {
  name: 'Quotes · single card',
  args: {
    id: 'quotes-single',
    items: toQuoteItems(hpQuotes.slice(0, 1), 'single-quote'),
    theme: 'dark',
    short: true,
    entrance: false,
    ariaLabel: 'Testimonials',
  },
};
