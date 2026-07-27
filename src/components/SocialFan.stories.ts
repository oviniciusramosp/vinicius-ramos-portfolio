import SocialFanStage from '../stories/SocialFanStage.astro';
import { getProject } from '../data/projects';
import { placeholderImage } from '../stories/placeholder';

const CB = '/projects/crypto-bros';

/** Live Crypto Bros hero fan (odd count, geometric center). */
const crypto = getProject('crypto-bros');
const cryptoBento = crypto?.blocks?.find((b) => b.type === 'bento');
const cryptoFanCell =
  cryptoBento && cryptoBento.type === 'bento'
    ? cryptoBento.cells.find((c) => c.kind === 'social-fan')
    : undefined;
const cryptoImages =
  cryptoFanCell && cryptoFanCell.kind === 'social-fan'
    ? cryptoFanCell.images.map((img) => ({ src: img.src, alt: img.alt }))
    : [];

const ph = (label: string, i: number) =>
  placeholderImage({
    width: 540,
    height: 720,
    label: label || `Post ${i + 1}`,
    bg: i % 2 === 0 ? '#1c1b22' : '#25242c',
    fg: '#8a8a90',
  });

const demoImages = Array.from({ length: 7 }, (_, i) => ({
  src: ph(`Post ${i + 1}`, i),
  alt: `Demo social post ${i + 1}`,
}));

const fiveImages = demoImages.slice(0, 5);
const threeImages = demoImages.slice(0, 3);

const liveImages =
  cryptoImages.length >= 3
    ? cryptoImages
    : [
        { src: `${CB}/post-00.jpg`, alt: 'Crypto Bros post 0' },
        { src: `${CB}/post-01.png`, alt: 'Crypto Bros post 1' },
        { src: `${CB}/post-02.jpg`, alt: 'Crypto Bros post 2' },
        { src: `${CB}/post-03.png`, alt: 'Crypto Bros post 3' },
        { src: `${CB}/post-04.png`, alt: 'Crypto Bros post 4' },
        { src: `${CB}/post-05.jpg`, alt: 'Crypto Bros post 5' },
        { src: `${CB}/post-06.png`, alt: 'Crypto Bros post 6' },
      ];

export default {
  title: 'Components/SocialFan',
  component: SocialFanStage,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Fanned social cards on a **circular arc** (Lando Norris off-track callout).

### Layout
- Cards sit on \`x = R·sin(θ)\`, \`y = R·(1−cos(θ))\` so the center is highest
- Outer angle ±21°, radius ≈ 4.15× card width (tuned to Lando GSAP rem values)
- Clipped by the parent surface (bento cell / stage)
- Hover / focus peels a card forward (desktop pointer only)

### Props (\`SocialFan.astro\`)
| Prop | Default | Notes |
|------|---------|--------|
| \`images\` | — | \`{ src, alt }[]\` (prefer **odd** count) |
| \`centerIndex\` | geometric mid | 0-based hero (front / top of arc) |
| \`ariaLabel\` | \`"Social posts"\` | group accessible name |

### Case data
\`\`\`ts
{
  kind: 'social-fan',
  span: '2x2',
  images: [/* CaseImage[] */],
  ariaLabel: 'Educational social posts',
}
\`\`\`

### Client API (\`src/scripts/social-fan.ts\`)
- \`bootSocialFans()\` — rebind all \`[data-social-fan]\` (Storybook + page load)
- \`initSocialFans(root?)\` — bind within a subtree
        `.trim(),
      },
    },
  },
  argTypes: {
    centerIndex: {
      control: { type: 'number', min: 0, max: 12, step: 1 },
      description: '0-based hero card index (front of the arc)',
    },
    ariaLabel: { control: 'text' },
    width: { control: 'text', description: 'Stage width CSS' },
    height: { control: 'text', description: 'Stage height CSS' },
  },
};

export const Default = {
  name: 'Default · 7 demo cards',
  args: {
    images: demoImages,
    ariaLabel: 'Demo social posts',
    centerIndex: 3,
    width: 'min(92vw, 560px)',
    height: 'min(72vw, 440px)',
  },
};

export const CryptoBros = {
  name: 'Crypto Bros (live data)',
  args: {
    images: liveImages,
    ariaLabel: 'Educational social posts',
    // geometric center of 7 → post-03
    centerIndex: 3,
    width: 'min(92vw, 560px)',
    height: 'min(72vw, 440px)',
  },
};

export const FiveCards = {
  name: '5 cards',
  args: {
    images: fiveImages,
    ariaLabel: 'Five posts',
    centerIndex: 2,
    width: 'min(92vw, 520px)',
    height: 'min(70vw, 400px)',
  },
};

export const ThreeCards = {
  name: '3 cards',
  args: {
    images: threeImages,
    ariaLabel: 'Three posts',
    centerIndex: 1,
    width: 'min(92vw, 420px)',
    height: 'min(68vw, 360px)',
  },
};

export const WideStage = {
  name: 'Wide stage (desktop bento 2×2)',
  args: {
    images: liveImages,
    ariaLabel: 'Educational social posts',
    centerIndex: 3,
    width: '680px',
    height: '460px',
  },
};
