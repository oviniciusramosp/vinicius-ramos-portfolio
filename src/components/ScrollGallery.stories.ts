import ScrollGallery from './ScrollGallery.astro';
import { placeholderImage } from '../stories/placeholder';

type GalleryItem = {
  id?: string;
  label: string;
  headline: string;
  body?: string;
  image: string;
  imageAlt?: string;
  href?: string;
};

const ph = (label: string, w = 744, h = 568) =>
  placeholderImage({ width: w, height: h, label, bg: '#d2d2d7', fg: '#86868b' });

const phDark = (label: string, w = 744, h = 568) =>
  placeholderImage({ width: w, height: h, label, bg: '#3a3a3e', fg: '#8a8a90' });

/** Copy structure from Apple incentive-gallery — images are placeholders only. */
const incentiveItems: GalleryItem[] = [
  {
    id: 'icon-card-apple-card',
    label: 'Ways to Buy',
    headline: 'Pay over time,<br />interest-free.',
    body: 'When you choose to check out at Apple with Apple&nbsp;Card Monthly&nbsp;Installments.',
    image: ph('card'),
    imageAlt: 'Placeholder',
  },
  {
    id: 'icon-card-apple-trade-in',
    label: 'Apple Trade In',
    headline: 'Save with Apple&nbsp;Trade&nbsp;In.',
    body: 'Get credit toward your next Mac when you trade in an eligible&nbsp;device.',
    image: ph('trade-in'),
    imageAlt: 'Placeholder',
  },
  {
    id: 'icon-card-education-pricing',
    label: 'Education',
    headline: 'Save on Mac with education&nbsp;pricing.',
    body: 'College students and educators can save through the Apple&nbsp;Store.',
    image: ph('education'),
    imageAlt: 'Placeholder',
  },
  {
    id: 'icon-card-personal-setup',
    label: 'Personal Setup',
    headline: 'Meet your new Mac with Personal&nbsp;Setup.',
    body: 'Get one-on-one help with data transfer, the latest features, and&nbsp;more.',
    image: ph('setup'),
    imageAlt: 'Placeholder',
  },
  {
    id: 'icon-card-apple-delivery',
    label: 'Delivery and Pickup',
    headline: 'Get flexible delivery<br />and easy pickup.',
    body: 'Choose two-hour delivery from an Apple&nbsp;Store, free delivery, or easy pickup options.',
    image: ph('delivery'),
    imageAlt: 'Placeholder',
  },
  {
    id: 'icon-card-apple-support',
    label: 'Guided Shopping',
    headline: 'Shop live with<br />a Specialist.',
    body: 'Let us help you find what you need and answer all your questions, one on one.',
    image: ph('support'),
    imageAlt: 'Placeholder',
  },
  {
    id: 'icon-card-apple-store',
    label: 'Apple Store App',
    headline: 'Explore a shopping experience designed around&nbsp;you.',
    body: 'Use the Apple&nbsp;Store app to get a more personal way to&nbsp;shop.',
    image: ph('store'),
    imageAlt: 'Placeholder',
  },
];

const portfolioItems: GalleryItem[] = [
  {
    label: 'Product',
    headline: 'Systems that feel<br />inevitable.',
    body: 'End-to-end product design from research to high-fidelity craft.',
    image: phDark('product'),
    imageAlt: 'Placeholder',
  },
  {
    label: 'Spatial',
    headline: 'Interfaces beyond<br />the rectangle.',
    body: 'Spatial computing, AR, and multi-surface experiences.',
    image: phDark('spatial'),
    imageAlt: 'Placeholder',
  },
  {
    label: 'AI',
    headline: 'Human-centered<br />intelligence.',
    body: 'AI tools that stay useful, private, and on-brand.',
    image: phDark('ai'),
    imageAlt: 'Placeholder',
  },
  {
    label: 'Brand',
    headline: 'Visual systems<br />with teeth.',
    body: 'Identity, motion language, and component libraries.',
    image: phDark('brand'),
    imageAlt: 'Placeholder',
  },
  {
    label: 'Mobile',
    headline: 'Thumb-first<br />precision.',
    body: 'Native patterns, accessibility, and performance.',
    image: phDark('mobile'),
    imageAlt: 'Placeholder',
  },
];

export default {
  title: 'Components/ScrollGallery',
  component: ScrollGallery,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Horizontal scroll gallery modeled on Apple’s `#incentive-gallery` (MacBook Neo): `.scroll-container`, snap cards, and `.scroll-gallery-paddlenav.paddlenav.paddlenav-alpha` with staggered entrance. Story images are gray SVG placeholders only.',
      },
    },
  },
  argTypes: {
    theme: { control: 'select', options: ['dark', 'light'] },
    short: { control: 'boolean' },
    entrance: { control: 'boolean' },
    title: { control: 'text' },
  },
};

export const IncentiveGallery = {
  name: 'Apple · incentive-gallery',
  args: {
    id: 'incentive-gallery',
    items: incentiveItems,
    short: true,
    theme: 'light',
    entrance: true,
  },
};

export const IncentiveGalleryDark = {
  name: 'Apple · incentive dark',
  args: {
    id: 'incentive-gallery-dark',
    items: incentiveItems.map((item) => ({
      ...item,
      image: phDark(item.id?.replace('icon-card-', '') ?? 'item'),
    })),
    short: true,
    theme: 'dark',
    entrance: true,
  },
};

export const WithHeader = {
  name: 'With optional header + CTA',
  args: {
    id: 'gallery-with-header',
    title: 'Selected<br />capabilities.',
    cta: { label: 'See all', href: '#' },
    items: portfolioItems,
    short: true,
    theme: 'dark',
    entrance: true,
  },
};

export const Portfolio = {
  name: 'Portfolio sample',
  args: {
    id: 'portfolio-gallery',
    items: portfolioItems,
    short: true,
    theme: 'dark',
    entrance: true,
  },
};

export const TallCards = {
  name: 'Tall cards (not short)',
  args: {
    id: 'tall-gallery',
    items: incentiveItems.slice(0, 5).map((item, i) => ({
      ...item,
      image: ph(`tall-${i + 1}`, 744, 900),
    })),
    short: false,
    theme: 'light',
    entrance: true,
  },
};

export const NoEntrance = {
  name: 'Without entrance',
  args: {
    id: 'static-gallery',
    items: incentiveItems.slice(0, 4).map((item) => ({
      ...item,
      image: phDark(item.id?.replace('icon-card-', '') ?? 'item'),
    })),
    short: true,
    theme: 'dark',
    entrance: false,
  },
};
