import DeckSlider from './DeckSlider.astro';
import { getProject } from '../data/projects';

const HP = '/projects/hp-printables';
const TEXTURE = `${HP}/texture.svg`;

/** Live HP Printables SectionWireframes data (from projects.ts). */
const hp = getProject('hp-printables');
const hpDeckBlock = hp?.blocks?.find((b) => b.type === 'deck-slider');
const hpDecks =
  hpDeckBlock && hpDeckBlock.type === 'deck-slider' ? hpDeckBlock.decks : [];

const demoDecks = [
  {
    title: 'Wireframes: Homepage',
    images: [
      {
        src: `${HP}/wf-homepage-1.jpg`,
        alt: 'Homepage wireframe',
        fit: 'cover' as const,
      },
      {
        src: `${HP}/wf-homepage-2.jpg`,
        alt: 'Homepage detail',
        fit: 'cover' as const,
      },
      {
        src: `${HP}/wf-homepage-3.jpg`,
        alt: 'Homepage variants',
        fit: 'cover' as const,
        hideOn: 'mobile' as const,
      },
    ],
  },
  {
    title: 'Wireframes: Logged Out vs Logged In',
    images: [
      {
        src: `${HP}/wf-login-1.jpg`,
        alt: 'Homepage with login',
        fit: 'cover' as const,
      },
      {
        src: `${HP}/wf-login-2.jpg`,
        alt: 'Homepage logged in',
        fit: 'cover' as const,
      },
      {
        src: `${HP}/wf-login-3.jpg`,
        alt: 'Homepage with Ads',
        fit: 'cover' as const,
        hideOn: 'mobile' as const,
      },
    ],
  },
  {
    title: 'Wireframes: Printable Page',
    images: [
      {
        src: `${HP}/wf-printable-1.jpg`,
        alt: 'Printable file page',
        fit: 'cover' as const,
      },
      {
        src: `${HP}/wf-printable-2.jpg`,
        alt: 'File details',
        fit: 'cover' as const,
      },
      {
        src: `${HP}/wf-printable-3.jpg`,
        alt: 'Details',
        fit: 'cover' as const,
        hideOn: 'mobile' as const,
      },
    ],
  },
  {
    title: 'Wireframes: Share and Printed',
    images: [
      {
        src: `${HP}/wf-share-1.jpg`,
        alt: 'Share sheet',
        fit: 'cover' as const,
      },
      {
        src: `${HP}/wf-share-2.jpg`,
        alt: 'Printed',
        fit: 'cover' as const,
      },
    ],
  },
];

const decks = hpDecks.length ? hpDecks : demoDecks;

export default {
  title: 'Components/DeckSlider',
  component: DeckSlider,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Horizontal **wireframe deck** carousel with Apple **\`#aap-media-card-gallery\`** chrome.

### Layout
- **Track** is full-bleed (prev/next cards peek at lower opacity)
- **Active card** matches the case **content column** (\`.case__section\` pad → \`--deck-width\`)
- Phone frames keep **aspect-ratio 0.46** and scale with the card

### Controls
- Timed dots: bar↔dot morph via \`--autoplay-progress\` + CSS fill animation
- Play / pause / replay + magnetic side arrows
- Shared eased handoff for arrows, autoplay, and dots (incl. loop wrap)

### Props
| Prop | Default | Notes |
|------|---------|--------|
| \`decks\` | — | \`CaseDeck[]\` |
| \`texture\` | — | tiled SVG under cards |
| \`autoplay\` | \`true\` | |
| \`interval\` | \`6150\` | hold ms (Apple persist) |
| \`loop\` | \`true\` | |
        `.trim(),
      },
    },
  },
  argTypes: {
    autoplay: { control: 'boolean' },
    interval: {
      control: { type: 'number', min: 2000, max: 12000, step: 250 },
      description: 'Hold duration per slide (ms), Apple ≈ 6150',
    },
    loop: { control: 'boolean' },
    texture: { control: 'text' },
    ariaLabel: { control: 'text' },
  },
};

export const Default = {
  name: 'Default',
  args: {
    decks,
    texture: TEXTURE,
    ariaLabel: 'Wireframe decks',
    autoplay: true,
    interval: 6150,
    loop: true,
  },
};

export const HPPrintables = {
  name: 'HP Printables (live data)',
  args: {
    decks,
    texture: TEXTURE,
    ariaLabel: 'HP Printables wireframe decks',
    autoplay: true,
    interval: 6150,
    loop: true,
  },
};

export const AutoplayFast = {
  name: 'Autoplay · 3s',
  args: {
    decks: demoDecks,
    texture: TEXTURE,
    autoplay: true,
    interval: 3000,
    loop: true,
  },
};

export const Paused = {
  name: 'Autoplay off',
  args: {
    decks: demoDecks,
    texture: TEXTURE,
    autoplay: false,
    loop: true,
  },
};

export const WithoutTexture = {
  name: 'Without texture',
  args: {
    decks: demoDecks,
    autoplay: true,
    interval: 6150,
    loop: true,
  },
};
