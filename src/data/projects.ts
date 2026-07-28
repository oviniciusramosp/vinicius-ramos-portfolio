/** Homepage bento spans: sm/md 1×1 · wide 2×1 · tall 1×2 · lg 2×2 · xl 2×3 */
export type ProjectSize = 'lg' | 'md' | 'sm' | 'tall' | 'wide' | 'xl';

export type ProjectSection = {
  title: string;
  paragraphs: string[];
  images?: string[];
};

export type ProjectQuote = {
  text: string;
  author: string;
  role: string;
  /** Optional portrait URL — shown top-right of the quote card */
  avatar?: string;
};

/** Case-study media item (Framer Image / gallery cell) */
export type CaseImage = {
  src: string;
  alt: string;
  fit?: 'cover' | 'contain';
  /** CSS aspect-ratio value, e.g. '0.8' or '1.24' */
  aspect?: string;
  /** Hide on narrow viewports (matches Framer hidden-* variants) */
  hideOn?: 'mobile';
  /**
   * Bento-style surface on the gallery figure:
   * radius + `--color-surface` fill + inset 1px border (and pad when `fit: contain`).
   */
  card?: boolean;
  /** CSS object-position, e.g. 'bottom center' */
  objectPosition?: string;
  /**
   * Flex align of the image inside a `card` figure.
   * `end` pins to the bottom (Siri / device shots that should sit on the floor).
   */
  cardAlign?: 'center' | 'end';
};

/** Grid span as col×row (live Framer ImagesFull / ImagesMoodBoard). */
export type CaseBentoSpan =
  | '1x1'
  | '1x2'
  | '1x3'
  | '2x1'
  | '2x2'
  | '2x3'
  | '2x4';

export type CaseBentoCell =
  | {
      kind: 'image';
      src: string;
      alt: string;
      /** grid span col×row (1x2 = tall phone; 2x3 = full-height hero laptop) */
      span?: CaseBentoSpan;
      fit?: 'cover' | 'contain';
      /** CSS object-position, e.g. 'center top' */
      objectPosition?: string;
      /** padded surface (icons / logos) */
      padded?: boolean;
      /** Tiled background texture (Framer background-image repeat) */
      texture?: string;
      /**
       * Card surface:
       * - `dark` = default `--color-surface`
       * - `light` = white
       * - `brand` = Moove orange `#FF4B24`
       */
      surface?: 'dark' | 'light' | 'brand';
      /** Continuous clockwise CSS spin on the image (full 360° linear loop). */
      spin?: boolean;
      /**
       * Uniform CSS scale on the image (e.g. 1.25) so product cutouts can
       * sit larger inside a contain cell without changing the grid span.
       */
      scale?: number;
      /**
       * Special case animations for inlined SVG cells.
       * `logo-mark` — draw construction lines → fade in mark → hide lines;
       * hover reveals lines in a radius near the cursor.
       * `layer-reveal` — bg (`src`) always on; front (`front`) fades in after logo-mark intro.
       * `logo-evolution` — construction draw + fill fade; cascade with siblings.
       * `brand-waves` — neumorphic expanding rings on brand surface (autoplay).
       */
      animate?: 'logo-mark' | 'layer-reveal' | 'logo-evolution' | 'brand-waves';
      /** Stagger order for `logo-evolution` cascade (0, 1, 2…). */
      cascadeIndex?: number;
      /**
       * Front overlay for `layer-reveal` (icon / wordmark on transparent SVG).
       * Background is `src`.
       */
      front?: string;
    }
  | {
      kind: 'caption';
      text: string;
      span?: CaseBentoSpan;
      /** Tiled pattern under the chat UI stack */
      texture?: string;
      /** Lottie JSON URL (live Framer Lottie module) */
      lottie?: string;
      lottieSpeed?: number;
      surface?: 'dark' | 'light';
    }
  | {
      /**
       * Fanned social posts (Lando-style callout): absolute stack, hover peel.
       * Prefer span `2x2` so cards have room to fan.
       */
      kind: 'social-fan';
      images: CaseImage[];
      span?: CaseBentoSpan;
      /** Accessible name for the group */
      ariaLabel?: string;
      surface?: 'dark' | 'light';
    }
  | {
      /**
       * WebGL device mock (Device3D) with flat poster fallback.
       * Prefer one per case (hero). Screen = app UI image or video.
       */
      kind: 'device-3d';
      /** App UI on the phone display */
      screen: string;
      alt: string;
      span?: CaseBentoSpan;
      /** GLB path (default in Device3D) */
      model?: string;
      /** Optional single poster image; omit to use Cosmic Orange bezel + screen */
      poster?: string;
      surface?: 'dark' | 'light';
    }
  | {
      /**
       * Row of app icons (e.g. default + alternates). Optional radial glow on one icon.
       */
      kind: 'icon-set';
      icons: {
        src: string;
        alt: string;
        /** Orange radial glow behind this icon (typically the default) */
        glow?: boolean;
      }[];
      span?: CaseBentoSpan;
      surface?: 'dark' | 'light';
    };

/**
 * Ordered case-study body blocks — mirrors Framer section order
 * (Hero + meta live outside blocks).
 */
/** One slide in a Framer-style wireframe deck carousel */
export type CaseDeck = {
  title: string;
  images: CaseImage[];
};

export type CaseBlock =
  | {
      type: 'bento';
      cells: CaseBentoCell[];
      /**
       * Grid column count.
       * - 4 = ImagesFull hero (default)
       * - 3 = design-challenge strip (live `.framer-1e8zhfa`: 1×1 + 2×1)
       * - 5 = ImagesMoodBoard mosaic (live Vibecheck)
       */
      columns?: 3 | 4 | 5;
      /**
       * Horizontal shell:
       * - `full` = ImagesFull edge padding (default)
       * - `content` = same pad as body text column (live design strip)
       */
      shell?: 'full' | 'content';
      /**
       * Special pack: 2 columns × 6 equal row tracks (same total height as a
       * 3-row bento). Left stack of 3 horizontal cards (`1x2` each = 1/3
       * height) + right stack of 2 cards (`1x3` each = half height).
       */
      layout?: 'split-3-2';
    }
  | {
      type: 'section';
      title?: string;
      paragraphs: string[];
      /**
       * Optional CTA under the last paragraph (e.g. “View Case”).
       * `modal: true` opens an embed dialog instead of navigating.
       */
      cta?: {
        label: string;
        href: string;
        /** Open `href` in a portfolio embed modal */
        modal?: boolean;
        /** Leading icon on the Button (e.g. App Store CTA) */
        icon?: 'apple';
        /** Upper badge line (e.g. “Download on the” above “App Store”) */
        eyebrow?: string;
      };
    }
  | {
      type: 'gallery';
      /**
       * pair/triple/single/social = CSS grids;
       * scroll = horizontal drag row (presentation decks);
       * stack = overlapping absolute cards (live Vibecheck wireframe notes)
       */
      /**
       * pair = equal columns · pair-height = shared height, widths from each image aspect
       */
      layout: 'pair' | 'pair-height' | 'triple' | 'single' | 'social' | 'scroll' | 'stack';
      /** Optional eyebrow above the gallery */
      title?: string;
      images: CaseImage[];
    }
  | {
      /**
       * Horizontal carousel via DeckSlider.
       * - `wireframes` (default): content-width cards + side peeks (HP SectionWireframes)
       * - `presentation`: one full content-width slide at a time, no adjacent peeks
       */
      type: 'deck-slider';
      /**
       * `wireframes` — phone-frame cards + prev/next peeks (HP).
       * `presentation` — full content-width slides, no peeks (Vibecheck).
       * `slides` — full-bleed slide images + prev/next peeks (campaign decks).
       */
      variant?: 'wireframes' | 'presentation' | 'slides';
      /** Optional eyebrow above the slider (e.g. “Presentation”) */
      title?: string;
      /** Tiled micro-logo texture under each deck card (wireframes only) */
      texture?: string;
      /**
       * Wireframes: title + phone frames.
       * Presentation / slides: title (a11y) + single full-bleed slide image per deck.
       */
      decks: CaseDeck[];
      /** Defaults: wireframes true · presentation/slides false */
      autoplay?: boolean;
    }
  | {
      type: 'video';
      src: string;
      /** Accessible label (used as aria-label) */
      alt?: string;
      /** CSS aspect-ratio, e.g. live Listings demo ≈ 2.63754 */
      aspect?: string;
      fit?: 'cover' | 'contain';
      poster?: string;
      /**
       * Show a pause/play control outside the video (bottom-right).
       * Video still autoplays muted + loop by default.
       */
      controls?: boolean;
      /**
       * Horizontal measure:
       * - `full` (default) = full media column (Staircase listings demo)
       * - `copy` = same width as section title/copy (2/3 on desktop+)
       */
      shell?: 'full' | 'copy';
    }
  | {
      /**
       * Apple-style ScrollGallery shell (`incentive-gallery-dark` when theme dark).
       * Use for image-first social posts (`kind: 'social'`), articles, or features.
       */
      type: 'scroll-gallery';
      title?: string;
      ariaLabel?: string;
      theme?: 'light' | 'dark';
      short?: boolean;
      entrance?: boolean;
      items: {
        id?: string;
        label?: string;
        headline?: string;
        body?: string;
        image?: string;
        imageAlt?: string;
        kind?: 'feature' | 'quote' | 'article' | 'social';
      }[];
    };

export type Project = {
  slug: string;
  title: string;
  year: string;
  tags: string[];
  summary: string;
  /** Back image layer (Framer ImageBg) */
  cover: string;
  /** Front image layer (Framer Image) — dual-layer parallax when set */
  coverFront?: string;
  /**
   * When set, the cover SVG is inlined and its stroked paths draw on card hover.
   * Prefer a single combined SVG (mark + lines) so geometry stays locked.
   */
  coverAnimate?: 'draw-lines';
  /**
   * @deprecated Prefer `coverAnimate` on a combined SVG. Kept for dual-layer front SVGs.
   */
  coverFrontAnimate?: 'draw-lines';
  /** object-fit: Fit Image = contain, Fill Image = cover */
  imageFit?: 'cover' | 'contain';
  /**
   * Preferred bento span (also used as authored size on ALL).
   * When filtering: place at this size first; only grow if free space remains.
   */
  size: ProjectSize;
  /**
   * Pack order when filtering (higher placed first at preferred size).
   * Defaults from `size` if omitted.
   */
  priority?: number;
  href?: string;
  soon?: boolean;
  /**
   * Legacy flat sections (used when `blocks` is absent).
   * Prefer `blocks` for full case studies with interleaved media.
   */
  sections: ProjectSection[];
  /** Full case-study layout (text + galleries in source order) */
  blocks?: CaseBlock[];
  quotes?: ProjectQuote[];
  /**
   * Render `quotes` in the Apple-style ScrollGallery shell
   * instead of the legacy QuoteSlider.
   */
  quotesAsIncentive?: boolean;
  nextSlug?: string;
  note?: string;
};

const FRAMER = 'https://framerusercontent.com/images';

const CB = '/projects/crypto-bros';
const SC = '/projects/staircase';
const HP = '/projects/hp-printables';
const VC = '/projects/vibecheck';
const MOOVE = '/projects/moove';

export const projects: Project[] = [
{
    slug: 'crypto-bros',
    title: 'Crypto Bros',
    year: '2024',
    tags: ['AI', 'MOBILE', 'WEB'],
    summary:
      'Grew a Brazilian crypto education community from Telegram into an iOS, web, and Apple Watch product with free courses, market news, and real-time charts, powered by an AI operations dashboard I designed and shipped end to end.',
    // Homepage card: cover1 (back) + cover2 (front / parallax)
    cover: `${CB}/cover.png`,
    coverFront: `${CB}/cover-front.png`,
    imageFit: 'contain',
    size: 'lg',
    priority: 105,
    href: '/projects/crypto-bros',
    nextSlug: 'staircase',
    sections: [
      {
        title: 'From a group chat to a product',
        paragraphs: [
          'Crypto Bros started as a Telegram community for Brazilians who wanted to understand crypto without the noise. I shared market context, study materials, and how I think about the space, always with education first.',
          'As the community grew, the chat stopped being enough. People needed a calmer place to follow news, learn at their own pace, and keep perspective on price over time. That gap became the product: an iOS app, a web experience, and later an Apple Watch companion.',
        ],
      },
      {
        title: 'Learning in the loop',
        paragraphs: [
          'The app is built around three everyday habits: catch what matters in the market, learn the fundamentals for free, and read price with context instead of panic. News, a free course, real-time charts, and indicators sit in one place so beginners are not left alone with a blank exchange screen.',
          'Portfolio moves and buy/sell opportunities exist as supporting features for members who already follow the market, but they never outshine the educational core. The goal is literacy and community, not hype.',
        ],
      },
      {
        title: 'The engine behind the feed',
        paragraphs: [
          'To keep the product alive as a solo builder, I designed an operations dashboard that does the heavy lifting: spotting trending market news and drafting bilingual posts (Portuguese and English), crossing indicators to surface Bitcoin opportunities, generating analyses from predictive markets and Bitcoin cycles, creating Instagram Stories creatives, and continuously reviewing trades and signals with data analysis so the system learns from what worked and what did not.',
        ],
      },
      {
        title: 'Craft and continuity',
        paragraphs: [
          'I designed the full visual language: brand, interface, and educational materials written to make crypto approachable for beginners. Price charts animate between time ranges so users never lose their frame of reference when they switch periods; the path of price stays continuous instead of jumping into a new chart.',
          'The product is also ready for what comes next on Apple platforms: an Apple Watch app, Siri and on-device Apple Intelligence hooks so members can query tools and data hands-free, and a foundation prepared for iOS 27.',
        ],
      },
      {
        title: 'Impact',
        paragraphs: [
          'Crypto Bros was the first app I designed, built, and shipped entirely on my own to the App Store. That launch led to an invitation to Apple’s Brazil headquarters for a developer event, where the work was reviewed and recognized by the Apple team.',
          'The project also opened the door to Paradigma Education, Brazil’s first Bitcoin research desk and a national reference, where the community I help reach spans more than 9,000 members. Crypto Bros itself remains intentionally small and personal (50+ members, including people outside Brazil), but it became the bridge from a side community into a broader research and education stage.',
        ],
      },
    ],
    blocks: [
      {
        type: 'bento',
        cells: [
          {
            kind: 'device-3d',
            span: '2x2',
            screen: `${CB}/screen-feed.jpg`,
            alt: 'Crypto Bros feed screen on a 3D iPhone',
          },
          {
            kind: 'image',
            src: `${CB}/hero-watch.png`,
            alt: 'Crypto Bros prices on Apple Watch',
            span: '1x1',
            fit: 'contain',
            padded: true,
          },
          {
            kind: 'icon-set',
            span: '1x1',
            /** Order: left rear · center front (default) · right rear */
            icons: [
              {
                src: `${CB}/bro-icon.png`,
                alt: 'Crypto Bros alternate app icon',
              },
              {
                src: `${CB}/default-icon.png`,
                alt: 'Crypto Bros default app icon',
                glow: true,
              },
              {
                src: `${CB}/test-flight-icon.png`,
                alt: 'Crypto Bros TestFlight app icon',
              },
            ],
          },
          {
            kind: 'image',
            src: `${CB}/hero-ipad.png`,
            alt: 'Crypto Bros cycles dashboard on iPad',
            span: '2x2',
            fit: 'contain',
            padded: true,
          },
          {
            kind: 'social-fan',
            span: '2x1',
            ariaLabel: 'Educational social posts',
            images: [
              {
                src: `${CB}/post-00.jpg`,
                alt: 'Crypto Bros educational post: Bitcoin cycle repeating in 2026',
                aspect: '0.75',
              },
              {
                src: `${CB}/post-01.png`,
                alt: 'Crypto Bros educational social post 1',
                aspect: '0.75',
              },
              {
                src: `${CB}/post-02.jpg`,
                alt: 'Crypto Bros educational social post 2',
                aspect: '0.75',
              },
              {
                src: `${CB}/post-03.png`,
                alt: 'Crypto Bros educational social post 3',
                aspect: '0.75',
              },
              {
                src: `${CB}/post-04.png`,
                alt: 'Crypto Bros educational social post 4',
                aspect: '0.75',
              },
              {
                src: `${CB}/post-05.jpg`,
                alt: 'Crypto Bros educational social post 5',
                aspect: '0.75',
              },
              {
                src: `${CB}/post-06.png`,
                alt: 'Crypto Bros educational social post 6',
                aspect: '0.75',
              },
            ],
          },
        ],
      },
      {
        type: 'section',
        title: 'From a group chat to a product',
        paragraphs: [
          'Crypto Bros started as a Telegram community for Brazilians who wanted to understand crypto without the noise. I shared market context, study materials, and how I think about the space, always with **education first**.',
          'As the community grew, the chat stopped being enough. People needed a calmer place to follow news, learn at their own pace, and keep perspective on price over time. That gap became the product: an **iOS app**, a **web** experience, and later an **Apple Watch** companion.',
        ],
      },
      {
        type: 'section',
        title: 'Learning in the loop',
        paragraphs: [
          'The app is built around three everyday habits: catch what matters in the market, learn the fundamentals for free, and read price with context instead of panic. **News**, a **free course**, **real-time charts**, and indicators sit in one place so beginners are not left alone with a blank exchange screen.',
        ],
      },
      {
        type: 'gallery',
        layout: 'triple',
        images: [
          {
            src: `${CB}/app-news.png`,
            alt: 'Crypto Bros news feed on iPhone',
            fit: 'cover',
            aspect: '0.486',
          },
          {
            src: `${CB}/app-course.png`,
            alt: 'Crypto Bros free course screen',
            fit: 'cover',
            aspect: '0.486',
          },
          {
            src: `${CB}/app-charts.png`,
            alt: 'Crypto Bros real-time price chart',
            fit: 'cover',
            aspect: '0.486',
            hideOn: 'mobile',
          },
        ],
      },
      {
        type: 'section',
        paragraphs: [
          'Portfolio context and buy/sell opportunities exist as **supporting features** for members who already follow the market, but they never outshine the educational core. The goal is literacy and community, not hype.',
        ],
      },
      {
        type: 'section',
        title: 'The engine behind the feed',
        paragraphs: [
          'To keep the product alive as a solo builder, I designed an operations **dashboard** that does the heavy lifting: spotting trending market news and drafting bilingual posts (**Portuguese and English**), crossing indicators to surface Bitcoin opportunities, generating analyses from predictive markets and Bitcoin cycles, creating educational social creatives, and continuously reviewing trades and signals with data analysis so the system learns from what worked and what did not.',
        ],
      },
      {
        type: 'gallery',
        layout: 'single',
        images: [
          {
            src: `${CB}/dash-news.png`,
            alt: 'Crypto Bros operations dashboard: news queue with AI write, review, and translate tools',
            fit: 'cover',
            aspect: '1.304',
          },
        ],
      },
      {
        /**
         * incentive-gallery-dark — side-by-side social posts + paddlenav.
         * Placed after the engine (dashboard produces this feed), not as a late essay.
         */
        type: 'scroll-gallery',
        theme: 'dark',
        short: true,
        entrance: false,
        ariaLabel: 'Educational social posts',
        items: (
          [
            ['post-00.jpg', 'Crypto Bros educational post: Bitcoin cycle repeating in 2026'],
            ['post-01.png', 'Crypto Bros educational social post 1'],
            ['post-02.jpg', 'Crypto Bros educational social post 2'],
            ['post-03.png', 'Crypto Bros educational social post 3'],
            ['post-04.png', 'Crypto Bros educational social post 4'],
            ['post-05.jpg', 'Crypto Bros educational social post 5'],
            ['post-06.png', 'Crypto Bros educational social post 6'],
            ['post-07.jpg', 'Crypto Bros educational social post 7'],
            ['post-08.jpg', 'Crypto Bros educational social post 8'],
            ['post-09.jpg', 'Crypto Bros educational social post 9'],
            ['post-10.jpg', 'Crypto Bros educational social post 10'],
          ] as const
        ).map(([file, alt], i) => ({
          id: `cb-social-${i + 1}`,
          kind: 'social' as const,
          image: `${CB}/${file}`,
          imageAlt: alt,
          label: `Post ${i + 1}`,
        })),
      },
      {
        type: 'section',
        title: 'Craft and continuity',
        paragraphs: [
          'I designed the full visual language: brand, interface, and educational materials written to make crypto approachable for beginners. Price charts **animate between time ranges** so users never lose their frame of reference when they switch periods; the path of price stays continuous instead of jumping into a new chart.',
        ],
      },
      {
        type: 'video',
        src: `${CB}/craft-charts.mp4`,
        alt: 'Animated price chart preserving perspective across time ranges',
        aspect: '1.401',
        fit: 'cover',
        controls: true,
        shell: 'copy',
      },
      {
        type: 'section',
        paragraphs: [
          'The product is also ready for what comes next on Apple platforms: an **Apple Watch** app, **Siri** and on-device **Apple Intelligence** hooks so members can query tools and data hands-free, and a foundation prepared for **iOS 27**.',
        ],
      },
      {
        type: 'gallery',
        layout: 'pair',
        images: [
          {
            src: `${CB}/app-siri.png`,
            alt: 'Crypto Bros Live Activity: Accumulate score 72 with Siri summary',
            fit: 'contain',
            aspect: '1',
            card: true,
            cardAlign: 'end',
            objectPosition: 'bottom center',
          },
          {
            src: `${CB}/hero-watch.png`,
            alt: 'Crypto Bros prices on Apple Watch',
            fit: 'contain',
            aspect: '1',
            /** Same surface as bento cells: radius, bg, inset border */
            card: true,
          },
        ],
      },
      {
        type: 'section',
        title: 'Impact',
        paragraphs: [
          'Crypto Bros was the first app I designed, built, and shipped entirely on my own to the **App Store**. That launch led to an invitation to **Apple’s Brazil headquarters** for a developer event, where the work was reviewed and recognized by the Apple team.',
          'The project also opened the door to **Paradigma Education**, Brazil’s first Bitcoin research desk and a national reference, where the community I help reach spans more than **9,000 members**. Crypto Bros itself remains intentionally small and personal (**50+ members**, including people outside Brazil), but it became the bridge from a side community into a broader research and education stage.',
        ],
        cta: {
          label: 'App Store',
          eyebrow: 'Download on the',
          href: 'https://apps.apple.com/br/app/crypto-bros/id6758371729',
          icon: 'apple',
        },
      },
      {
        type: 'gallery',
        layout: 'pair-height',
        images: [
          {
            src: `${CB}/apple-event2.jpg`,
            alt: 'At Apple’s Brazil headquarters developer event with Crypto Bros on stage',
            fit: 'cover',
            /** Natural 716×485 — drives column width at shared height */
            aspect: '1.476',
          },
          {
            src: `${CB}/apple-event.jpg`,
            alt: 'Crypto Bros recognized at the Apple Brazil developer event',
            fit: 'cover',
            /** Natural 517×483 */
            aspect: '1.07',
          },
        ],
      },
    ],
  },
{
    slug: 'staircase',
    title: 'Staircase',
    year: '2021',
    tags: ['AI', 'WEB'],
    summary:
      'Led the design of key tools at Staircase, leveraging AI and advanced APIs to streamline the traditionally lengthy American mortgage process to less than 48 hours.',
    // Homepage card layers (ImageBg + Image)
    cover: `${SC}/cover.png`,
    coverFront: `${SC}/cover-front.png`,
    imageFit: 'contain',
    size: 'lg',
    priority: 100,
    href: '/projects/staircase',
    nextSlug: 'hp-printables',
    // Flat fallback if a consumer ignores `blocks`
    sections: [
      {
        title: 'Role',
        paragraphs: [
          'I joined Staircase in 2021 as a Designer and also took on the role of Product Manager while developing internal tools. From 2023 onwards, I focused on the company’s B2B and B2C products.',
          'My role involved creating a process to deploy applications directly from Figma: generating components without traditional code development, writing automated tests, and publishing functional products. Key projects included Chat MTG, Staircase’s AI that connected the Rate Calculator, the digital PreApproval Letter, and the Listings tool.',
        ],
      },
      {
        title: 'User Journey and Products',
        paragraphs: [
          'Users begin their journey with the Listings tool, a platform with a simplified, minimalist user experience similar to Airbnb. Here, they can browse properties, apply for PreApproval through Chat MTG, contact an agent, or schedule home visits.',
          'The Listings tool also uses AI to select the best photos, organize them, and generate standardized descriptions for properties. Staircase differentiates itself by offering lower rates through reduced intermediaries, thereby lowering costs.',
          'The Chat MTG serves as a mortgage-focused AI chatbot, similar to Chat GPT, where users can input their data, ask questions, and determine their loan eligibility. Traditionally, obtaining a pre-approval letter from a bank can take several days or weeks, but Chat MTG reduces this process to mere minutes.',
          'Once the user completes the Chat MTG process, they receive a PreApproval, which is a digital version of traditional pre-approval letters. This digital format is not only more convenient but also promotes Staircase, as users can easily share it with others involved in their mortgage process.',
          'During Open Houses, visitors use the Rate Calculator to sign up and calculate their mortgage rates on the spot. This tool helps users quickly check their eligibility and see potential rates, enhancing their experience and engagement with the Staircase platform.',
        ],
      },
      {
        title: 'Challenges and Impact',
        paragraphs: [
          'Collaborating closely with the CEO and CTO, we set and achieved daily goals in a high-pressure environment. This required managing tight deadlines and adapting quickly to new information. Additionally, I worked with branding from an external company, which posed challenges in aligning with accessibility standards for digital interfaces. These experiences significantly enhanced my leadership skills, resilience, and ability to take on multiple roles, including Product Manager, Product Designer, test writer, and app developer.',
        ],
      },
    ],
    /**
     * Case order (from live site):
     * ImagesFull bento → Role → UJ01 → listings pair + video → UJ02 → Chat MTG triple
     * → UJ03 → Calc+PreApproval → UJ04 → Challenges → social triple → Quotes → Thanks
     * Breakpoints: mobile ≤809 · tablet 810–1193 · desktop ≥1194 · xl ≥1536
     */
    blocks: [
      {
        type: 'bento',
        cells: [
          {
            kind: 'image',
            src: `${SC}/hero-phones.png`,
            alt: 'Staircase apps running in two iPhones',
            span: '2x2',
            fit: 'contain',
          },
          {
            kind: 'caption',
            text: 'Let me evaluate your documents…',
            span: '1x1',
            // Caption cell — tiled micro-logo texture + Lottie
            texture: `${SC}/texture.svg`,
            lottie: `${SC}/caption-lottie.json`,
            lottieSpeed: 0.75,
          },
          {
            kind: 'image',
            src: `${SC}/icons.svg`,
            alt: 'Staircase custom icons',
            span: '1x1',
            fit: 'contain',
            padded: true,
          },
          {
            kind: 'image',
            src: `${SC}/hero-macbook.jpg`,
            alt: 'Staircase Listings App running on a MacBook',
            span: '2x2',
            fit: 'contain',
          },
          {
            kind: 'image',
            src: `${SC}/partners.svg`,
            alt: 'Partner logos',
            span: '2x1',
            fit: 'contain',
            padded: true,
          },
        ],
      },
      {
        type: 'section',
        title: 'Role',
        paragraphs: [
          'I joined Staircase in 2021 as a Designer and also took on the role of Product Manager while developing internal tools. From 2023 onwards, I focused on the company’s B2B and B2C products.',
          'My role involved creating a process to deploy applications directly from Figma: generating components without traditional code development, writing automated tests, and publishing functional products. Key projects included Chat MTG, Staircase’s AI that connected the Rate Calculator, the digital PreApproval Letter, and the Listings tool.',
        ],
      },
      {
        type: 'section',
        title: 'User Journey and Products',
        paragraphs: [
          'Users begin their journey with the **Listings** tool, a platform with a simplified, minimalist user experience similar to Airbnb. Here, they can browse properties, apply for PreApproval through Chat MTG, contact an agent, or schedule home visits.',
          'The Listings tool also uses AI to select the best photos, organize them, and generate standardized descriptions for properties. Staircase differentiates itself by offering lower rates through reduced intermediaries, thereby lowering costs.',
        ],
      },
      {
        type: 'gallery',
        layout: 'pair',
        images: [
          {
            src: `${SC}/listings-property.jpg`,
            alt: 'Staircase Listings property interface',
            fit: 'cover',
            aspect: '0.8',
          },
          {
            src: `${SC}/listings-detail.jpg`,
            alt: 'Staircase Listings product detail',
            fit: 'cover',
            aspect: '0.8',
          },
        ],
      },
      // Full-width muted loop after Listings pair
      {
        type: 'video',
        src: `${SC}/listings-demo.mp4`,
        alt: 'Staircase Listings product demo',
        aspect: '2.63754',
        fit: 'cover',
      },
      {
        type: 'section',
        paragraphs: [
          'The **Chat MTG** serves as a mortgage-focused AI chatbot, similar to Chat GPT, where users can input their data, ask questions, and determine their loan eligibility. Traditionally, obtaining a pre-approval letter from a bank can take several days or weeks, but Chat MTG reduces this process to mere minutes.',
        ],
      },
      {
        type: 'gallery',
        layout: 'triple',
        images: [
          {
            src: `${SC}/chat-mtg-1.png`,
            alt: 'Chat MTG conversation screen',
            fit: 'cover',
            aspect: '0.486',
          },
          {
            src: `${SC}/chat-mtg-2.png`,
            alt: 'Chat MTG eligibility screen',
            fit: 'cover',
            aspect: '0.486',
          },
          {
            src: `${SC}/chat-mtg-3.png`,
            alt: 'Chat MTG results screen',
            fit: 'cover',
            aspect: '0.486',
            hideOn: 'mobile',
          },
        ],
      },
      {
        type: 'section',
        paragraphs: [
          'Once the user completes the Chat MTG process, they receive a **PreApproval**, which is a digital version of traditional pre-approval letters. This digital format is not only more convenient but also promotes Staircase, as users can easily share it with others involved in their mortgage process.',
        ],
      },
      {
        type: 'gallery',
        layout: 'single',
        images: [
          {
            src: `${SC}/rate-preapproval.jpg`,
            alt: 'Rate Calculator and digital PreApproval letter',
            fit: 'cover',
            aspect: '1.239',
          },
        ],
      },
      {
        type: 'section',
        paragraphs: [
          'During Open Houses, visitors use the **Rate Calculator** to sign up and calculate their mortgage rates on the spot. This tool helps users quickly check their eligibility and see potential rates, enhancing their experience and engagement with the Staircase platform.',
        ],
      },
      {
        type: 'section',
        title: 'Challenges and Impact',
        paragraphs: [
          'Collaborating closely with the CEO and CTO, we set and achieved daily goals in a high-pressure environment. This required managing tight deadlines and adapting quickly to new information. Additionally, I worked with branding from an external company, which posed challenges in aligning with accessibility standards for digital interfaces. These experiences significantly enhanced my leadership skills, resilience, and ability to take on multiple roles, including Product Manager, Product Designer, test writer, and app developer.',
        ],
      },
      {
        type: 'gallery',
        layout: 'social',
        images: [
          {
            src: `${SC}/social-1.jpeg`,
            alt: 'Staircase social media creative 1',
            fit: 'cover',
            aspect: '0.8',
          },
          {
            src: `${SC}/social-2.jpeg`,
            alt: 'Staircase social media creative 2',
            fit: 'cover',
            aspect: '0.8',
            hideOn: 'mobile',
          },
          {
            src: `${SC}/social-3.jpeg`,
            alt: 'Staircase social media creative 3',
            fit: 'cover',
            aspect: '0.8',
          },
        ],
      },
    ],
    quotesAsIncentive: true,
    quotes: [
      {
        text: 'Throughout our collaboration, Vini consistently demonstrated a deep understanding of user needs and a keen eye for detail. He approaches every project with enthusiasm and professionalism, and always goes above and beyond to deliver exceptional results. He brings fresh and innovative ideas to the table, while still adhering to project requirements and timelines.',
        author: 'Guido Avogadro',
        role: 'Product Designer',
        avatar: '/avatars/GuidoAvogadro_SC.png',
      },
      {
        text: "Vini is one of the most dedicated professionals I’ve worked with and is always willing to put that extra help whenever you need it.\n\nHe has a keen eye for detail and as a manager he helped our team come up with quick solutions on complex features while balancing the workload.",
        author: 'Alonso Godinez',
        role: 'Software Engineer',
        avatar: '/avatars/AlonsoGodinez_SC.jpeg',
      },
      {
        text: "I've had the pleasure of working with Vinicius for the past couple of years. His insight as Scrum Manager and Product Engineer makes a perfect match with his background in Design. Vini is one of the most effective, creative, and committed teammates I have ever worked with; he consistently comes up with fresh and elegant solutions. Having him on your team is a win-win.",
        author: 'Oscar Liguori',
        role: 'Senior Staff Software Engineer',
        avatar: '/avatars/OscarLiguori_SC.jpeg',
      },
    ],
    note: 'Since this work, the company has pivoted into AI-powered real estate data verification and rebranded as Elephant. The designs presented here reflect the Staircase mortgage platform from that earlier chapter.',
  },
{
    slug: 'hp-printables',
    title: 'HP Printables',
    year: '2020',
    tags: ['WEB'],
    summary:
      'Redesigned the Print, Play & Learn website to create an engaging platform for printable content, allowing users to easily find and print materials such as games, coloring pages, holiday cards, children’s exercises, and more.',
    cover: `${HP}/cover.png`,
    imageFit: 'cover',
    size: 'xl',
    priority: 90,
    href: '/projects/hp-printables',
    nextSlug: 'vibecheck',
    sections: [
      {
        title: 'Discovery',
        paragraphs: [
          'At the project’s inception, I had a call with HP’s Principal Designer to get acquainted and discuss the project vision, tools, stages, and timeline. Following this, we conducted several online workshops with other HP decision-makers to better understand the scope of functionalities, learnings from the product being replaced, requirements, target audience, and product expectations.',
          'I then developed wireframes, which were refined through several rounds of feedback between myself, Chad, and the company’s stakeholders. Once the wireframes were approved, I began working on the visual design.',
        ],
      },
      {
        title: 'Challenges',
        paragraphs: [
          'One of the main challenges was integrating the rigid and serious HP Design System into a fun and colorful platform. To achieve this, we added colorful overlay elements and played with CMYK colors within HP’s palette, ensuring a playful interface that remained consistent with the existing design system. We also used halftone dots to create textures and utilized the angle of the HP logo to rotate elements within the interface.',
          'The development process involved close collaboration with the HP team and frequent iterations to balance the project’s playful aspects with the constraints of the design system. By utilizing existing components, the platform was rapidly released, ensuring a seamless experience for HP users.',
        ],
      },
      {
        title: 'Deliverables',
        paragraphs: [
          'As part of the final deliverables, I created prototypes for mobile, tablets, and desktops. These prototypes were presented to HP stakeholders, approved, and handed over to the developers to facilitate understanding of the product’s functionalities, transitions, and interactions.',
          'Additionally, screens and prototypes representing phase 2 of the product were presented, including integration with HP+ (HP’s subscription and rewards system), a user sign-up system, and spaces for advertisements and promotions.',
        ],
      },
      {
        title: 'Impact',
        paragraphs: [
          'The HP Printables platform was successfully launched, earning praise from HP executives and users. It seamlessly integrated with HP’s existing websites, respecting the design system and creating a user-friendly, engaging platform. The platform is still active and prominently featured on the main page of the HP printer app.',
          'Additionally, the project became a standout case study for ArcTouch. Following its success, HP went on to engage ArcTouch on additional contracts and projects.',
        ],
      },
    ],
    /**
     * ImagesFull — 4×3 desktop:
     *   [Laptop 2×2][Laptop 2×2][Hover 2×1     ][Hover 2×1]
     *   [Laptop 2×2][Laptop 2×2][Logo 1×1      ][Phone 1×2]
     *   [Partners  ][Multi-page 2×1            ][Phone 1×2]
     * Logo cell: tiled micro-logo texture. Phone: object-position center top.
     */
    blocks: [
      {
        type: 'bento',
        cells: [
          {
            kind: 'image',
            src: `${HP}/hero-laptop.png`,
            alt: 'HP Printables running in a laptop',
            span: '2x2',
            fit: 'contain',
          },
          {
            kind: 'image',
            src: `${HP}/hover-list.jpg`,
            alt: 'List of Printable files showing the hover effect',
            span: '2x1',
            fit: 'cover',
          },
          {
            kind: 'image',
            src: `${HP}/logo-deco.svg`,
            alt: 'HP Logo - Decorative element',
            span: '1x1',
            fit: 'contain',
            texture: `${HP}/texture.svg`,
          },
          {
            kind: 'image',
            src: `${HP}/hero-phone.jpg`,
            alt: 'HP Printables website running on an iPhone',
            span: '1x2',
            fit: 'cover',
            objectPosition: 'center top',
          },
          {
            kind: 'image',
            src: `${HP}/partners.jpg`,
            alt: 'Printables Partners example',
            span: '1x1',
            fit: 'cover',
          },
          {
            kind: 'image',
            src: `${HP}/multipage.jpg`,
            alt: 'Difference between a single page printable file and a multi-page printable file in the UI.',
            span: '2x1',
            fit: 'contain',
          },
        ],
      },
      {
        type: 'section',
        title: 'Discovery',
        paragraphs: [
          'At the project’s inception, I had a call with HP’s Principal Designer to get acquainted and discuss the project vision, tools, stages, and timeline. Following this, we conducted several online workshops with other HP decision-makers to better understand the scope of functionalities, learnings from the product being replaced, requirements, target audience, and product expectations.',
          'I then developed wireframes, which were refined through several rounds of feedback between myself, Chad, and the company’s stakeholders. Once the wireframes were approved, I began working on the visual design.',
        ],
      },
      /**
       * SectionWireframes: ONE horizontal carousel of 4 deck cards.
       * Desktop: 3 phone frames / card (2 on Share). Mobile: drops 3rd frame.
       * Each card: tiled texture · mono title · aspect .46 phone rails · cover fit.
       */
      {
        type: 'deck-slider',
        texture: `${HP}/texture.svg`,
        decks: [
          {
            title: 'Wireframes: Homepage',
            images: [
              {
                src: `${HP}/wf-homepage-1.jpg`,
                alt: 'HP Printables Wireframe: Homepage',
                fit: 'cover',
              },
              {
                src: `${HP}/wf-homepage-2.jpg`,
                alt: 'HP Printables Wireframe: Homepage detail',
                fit: 'cover',
              },
              {
                src: `${HP}/wf-homepage-3.jpg`,
                alt: 'HP Printables Wireframe: Homepage variants',
                fit: 'cover',
                hideOn: 'mobile',
              },
            ],
          },
          {
            title: 'Wireframes: Logged Out vs Logged In',
            images: [
              {
                src: `${HP}/wf-login-1.jpg`,
                alt: 'HP Printables Wireframe: Homepage with login option',
                fit: 'cover',
              },
              {
                src: `${HP}/wf-login-2.jpg`,
                alt: 'HP Printables Wireframe: Homepage logged in',
                fit: 'cover',
              },
              {
                src: `${HP}/wf-login-3.jpg`,
                alt: 'HP Printables Wireframe: Homepage with Ads',
                fit: 'cover',
                hideOn: 'mobile',
              },
            ],
          },
          {
            title: 'Wireframes: Printable Page',
            images: [
              {
                src: `${HP}/wf-printable-1.jpg`,
                alt: 'HP Printables Wireframe: Printable file page',
                fit: 'cover',
              },
              {
                src: `${HP}/wf-printable-2.jpg`,
                alt: 'HP Printables Wireframe: Printable File Details',
                fit: 'cover',
              },
              {
                src: `${HP}/wf-printable-3.jpg`,
                alt: 'HP Printables Wireframe: Details',
                fit: 'cover',
                hideOn: 'mobile',
              },
            ],
          },
          {
            title: 'Wireframes: Share and Printed',
            images: [
              {
                src: `${HP}/wf-share-1.jpg`,
                alt: 'HP Printables Wireframe: Share sheet',
                fit: 'cover',
              },
              {
                src: `${HP}/wf-share-2.jpg`,
                alt: 'HP Printables Wireframe: Printed',
                fit: 'cover',
              },
            ],
          },
        ],
      },
      {
        type: 'section',
        title: 'Challenges',
        paragraphs: [
          'One of the main challenges was integrating the rigid and serious HP Design System into a fun and colorful platform. To achieve this, we added colorful overlay elements and played with CMYK colors within HP’s palette, ensuring a playful interface that remained consistent with the existing design system. We also used halftone dots to create textures and utilized the angle of the HP logo to rotate elements within the interface.',
        ],
      },
      /**
       * 3-col content-shell strip:
       *   [Logo 1×1][CMYK + Halftone 2×1        ]
       * Desktop rows 220px · XL 330px · mobile stacked aspect ratios.
       */
      {
        type: 'bento',
        columns: 3,
        shell: 'content',
        cells: [
          {
            kind: 'image',
            src: `${HP}/challenge-logo.svg`,
            alt: 'HP Logo showing the 35º rotation',
            span: '1x1',
            fit: 'cover',
          },
          {
            kind: 'image',
            src: `${HP}/challenge-cmyk.svg`,
            alt: 'Visual elements: CMYK and Halftone dots',
            span: '2x1',
            fit: 'cover',
          },
        ],
      },
      {
        type: 'section',
        paragraphs: [
          'The development process involved close collaboration with the HP team and frequent iterations to balance the project’s playful aspects with the constraints of the design system. By utilizing existing components, the platform was rapidly released, ensuring a seamless experience for HP users.',
        ],
      },
      {
        type: 'section',
        title: 'Deliverables',
        paragraphs: [
          'As part of the final deliverables, I created prototypes for mobile, tablets, and desktops. These prototypes were presented to HP stakeholders, approved, and handed over to the developers to facilitate understanding of the product’s functionalities, transitions, and interactions.',
          'Additionally, screens and prototypes representing phase 2 of the product were presented, including integration with HP+ (HP’s subscription and rewards system), a user sign-up system, and spaces for advertisements and promotions.',
        ],
      },
      {
        type: 'gallery',
        layout: 'single',
        images: [
          {
            src: `${HP}/deliverable-laptop.jpg`,
            alt: 'HP Printables website running in a laptop',
            fit: 'cover',
          },
        ],
      },
      {
        type: 'section',
        title: 'Impact',
        paragraphs: [
          'The HP Printables platform was successfully launched, earning praise from HP executives and users. It seamlessly integrated with HP’s existing websites, respecting the design system and creating a user-friendly, engaging platform. The platform is still active and prominently featured on the main page of the HP printer app.',
          'Additionally, the project became a standout case study for ArcTouch. Following its success, HP went on to engage ArcTouch on additional contracts and projects.',
        ],
        cta: {
          label: 'View Case',
          href: 'https://arctouch.com/portfolio/hp-printables',
          modal: true,
        },
      },
    ],
    quotes: [
      {
        text: "I’ve had nothing but good interactions with Vini. He took time up front to make sure he understood the objectives, he took direction really well, didn’t have an ego about the designs, and was really quick to turn things around when needed. I would happily work with him again!",
        author: 'Chad Q. Martin',
        role: "HP's Principal Designer",
        avatar: '/avatars/ChadMartin_HP.jpeg',
      },
      {
        text: "Can’t express enough my gratitude to the work that you have done on this project. Developing the Netflix of printables! We wanted an improved customer experience, a solution that’s scalable and ready for the future. And you did it. Amazing job!",
        author: 'Stefan Vermeul',
        role: "HP's Senior Director of Marketing",
        avatar: '/avatars/StefanVermeul_HP.jpeg',
      },
      {
        text: 'Congrats to the entire team who worked on this challenging product […] Special thanks to Martim Sisson and Alysson Lopes for their leadership on this project, along with Vinicius Ramos for his great design work - our first design work for any HP project ever. HP has high expectations for success of Printables and love the work we’ve done.',
        author: 'James Patriquin',
        role: "ArcTouch's VP of Client Services",
        avatar: '/avatars/JamesPatriquin_AT.jpeg',
      },
    ],
    note: 'Special thanks to Eduardo Tanaka for connecting me with this project through ArcTouch, and to Chad Martin for his invaluable guidance and productive conversations throughout the project.',
  },
{
    slug: 'vibecheck',
    title: 'Vibecheck',
    year: '2021',
    tags: ['WEB', 'CONCEPT'],
    summary:
      'During a hackathon at AE Studio, the internal tool Vibecheck was created for AI sentiment analysis. As part of the hiring process, I redesigned Vibecheck, suggested improvements, and created user stories, leading to my employment at AE Studio.',
    cover: `${VC}/cover.png`,
    coverFront: `${VC}/cover-front.png`,
    imageFit: 'cover',
    size: 'sm',
    priority: 40,
    href: '/projects/vibecheck',
    nextSlug: 'moove',
    sections: [
      {
        title: 'Audit',
        paragraphs: [
          'The project began with an email from AE Studio asking me to review and redesign Vibecheck. It is a tool that uses AI to evaluate the sentiment of tweets. The email included a link to the existing Vibecheck app and a list of tasks, such as suggesting improvements for virality and creating feature ideas with designs or user stories.',
        ],
      },
      {
        title: 'Audit Notes',
        paragraphs: [
          'To understand the current state of Vibecheck, I conducted a thorough audit of the product. During this audit, I took extensive notes, balancing objective and subjective points. I checked the webpage on various devices and viewport sizes, ran Lighthouse diagnostics, and navigated using accessibility tools like VoiceOver, font scaling, and keyboard navigation. My audit also included annotating opportunities for improvement and posing questions about potential features, UI enhancements, performance issues, and ADA improvements.',
        ],
      },
      {
        title: 'Wireframing and Moodboard',
        paragraphs: [
          'With the user stories defined, I began exploring solutions. Ideally, I would rely on data to inform my decisions, but due to limited access and time constraints, I leveraged my experience and relevant references. I created hand-drawn wireframes to explore ideas and organize the information.',
          'For this challenge, I opted for a single mood board to expedite the process, incorporating elements from the original product like waves and square corners. I also used Twitter’s color palette and a monospaced font to emphasize the algorithm and AI concepts.',
        ],
      },
      {
        title: 'Final Deliverables',
        paragraphs: [
          'I designed the project’s interface based on my wireframes and mood board. For certain parts of the experience, I created multiple approaches to select the best alternative. Although it wasn’t part of the challenge requirement, I generated two prototypes to better illustrate my envisioned user experience. This practice helps developers understand my expectations for the final product, so I applied the same approach here.',
          'Additionally, I delivered a comprehensive presentation explaining my process, which included detailed explanations of my design decisions and user stories. These deliverables were crucial in demonstrating my approach and securing my position at AE Studio.',
        ],
      },
    ],
    /**
     * Case order:
     * ImagesFull (Mac 2×3 · detail · decor · phones 2×2)
     * → Audit → Audit Notes + photo
     * → Wireframing text → stacked wireframe notes (3 overlap)
     * → Moodboard text → ImagesMoodBoard mosaic (5-col)
     * → Final Deliverables + prototype mockup → presentation deck (scroll)
     */
    blocks: [
      {
        type: 'bento',
        cells: [
          {
            kind: 'image',
            src: `${VC}/hero-mac.png`,
            alt: 'Vibecheck website running in a macbook pro',
            span: '2x3',
            fit: 'contain',
          },
          {
            kind: 'image',
            src: `${VC}/hero-detail.jpg`,
            alt: 'Vibecheck product detail',
            span: '1x1',
            fit: 'cover',
          },
          {
            kind: 'image',
            src: `${VC}/hero-deco.jpg`,
            alt: 'Vibecheck decorative visual',
            span: '1x1',
            fit: 'contain',
            surface: 'light',
            spin: true,
          },
          {
            kind: 'image',
            src: `${VC}/hero-phones.png`,
            alt: 'Vibecheck running in 2 iPhones',
            span: '2x2',
            fit: 'contain',
          },
        ],
      },
      {
        type: 'section',
        title: 'Audit',
        paragraphs: [
          'The project began with an email from AE Studio asking me to review and redesign Vibecheck. It is a tool that uses AI to evaluate the sentiment of tweets. The email included a link to the existing Vibecheck app and a list of tasks, such as suggesting improvements for virality and creating feature ideas with designs or user stories.',
        ],
      },
      {
        type: 'section',
        title: 'Audit Notes',
        paragraphs: [
          'To understand the current state of Vibecheck, I conducted a thorough audit of the product. During this audit, I took extensive notes, balancing objective and subjective points. I checked the webpage on various devices and viewport sizes, ran Lighthouse diagnostics, and navigated using accessibility tools like VoiceOver, font scaling, and keyboard navigation. My audit also included annotating opportunities for improvement and posing questions about potential features, UI enhancements, performance issues, and ADA improvements.',
        ],
      },
      {
        type: 'gallery',
        layout: 'single',
        images: [
          {
            src: `${VC}/audit-notes.jpg`,
            alt: 'Audit Notes',
            fit: 'cover',
          },
        ],
      },
      {
        type: 'section',
        title: 'Wireframing and Moodboard',
        paragraphs: [
          'With the user stories defined, I began exploring solutions. Ideally, I would rely on data to inform my decisions, but due to limited access and time constraints, I leveraged my experience and relevant references. I created hand-drawn wireframes to explore ideas and organize the information.',
        ],
      },
      {
        /** 3 overlapping hand-drawn wireframe cards */
        type: 'gallery',
        layout: 'stack',
        images: [
          {
            src: `${VC}/wire-1.jpg`,
            alt: 'Hand-drawn Vibecheck wireframe notes (portrait)',
            fit: 'cover',
          },
          {
            src: `${VC}/wire-2.jpg`,
            alt: 'Hand-drawn Vibecheck wireframe notes (tall)',
            fit: 'cover',
          },
          {
            src: `${VC}/wire-3.jpg`,
            alt: 'Hand-drawn Vibecheck wireframe notes (landscape)',
            fit: 'cover',
          },
        ],
      },
      {
        type: 'section',
        paragraphs: [
          'For this challenge, I opted for a single mood board to expedite the process, incorporating elements from the original product like waves and square corners. I also used Twitter’s color palette and a monospaced font to emphasize the algorithm and AI concepts.',
        ],
      },
      {
        /**
         * ImagesMoodBoard — 5×6 mosaic (not a horizontal scroll):
         * Mac 2×4 · mood 2×3 · brand 1×3 · phones 1×3 · mobile 2×3 · mobile-alt 2×2
         */
        type: 'bento',
        columns: 5,
        shell: 'content',
        cells: [
          {
            kind: 'image',
            src: `${VC}/mood-mac.png`,
            alt: 'Vibecheck website running in a macbook pro',
            span: '2x4',
            fit: 'cover',
          },
          {
            kind: 'image',
            src: `${VC}/mood-visual.jpg`,
            alt: 'Vibecheck moodboard visual',
            span: '2x3',
            fit: 'cover',
          },
          {
            kind: 'image',
            src: `${VC}/mood-brand.png`,
            alt: 'Vibecheck brand / decorative element',
            span: '1x3',
            fit: 'contain',
            surface: 'light',
          },
          {
            kind: 'image',
            src: `${VC}/mood-phones.png`,
            alt: 'Vibecheck running in 2 iPhones',
            span: '1x3',
            fit: 'contain',
          },
          {
            kind: 'image',
            src: `${VC}/mood-mobile.jpg`,
            alt: 'Vibecheck mobile interface',
            span: '2x3',
            fit: 'cover',
          },
          {
            kind: 'image',
            src: `${VC}/mood-mobile-alt.jpg`,
            alt: 'Vibecheck mobile interface alternate',
            span: '2x2',
            fit: 'cover',
          },
        ],
      },
      {
        type: 'section',
        title: 'Final Deliverables',
        paragraphs: [
          'I designed the project’s interface based on my wireframes and mood board. For certain parts of the experience, I created multiple approaches to select the best alternative. Although it wasn’t part of the challenge requirement, I generated two prototypes to better illustrate my envisioned user experience. This practice helps developers understand my expectations for the final product, so I applied the same approach here.',
        ],
      },
      {
        type: 'gallery',
        layout: 'single',
        images: [
          {
            src: `${VC}/prototype.png`,
            alt: 'Vibecheck prototype mockups',
            fit: 'contain',
          },
        ],
      },
      {
        type: 'section',
        paragraphs: [
          'Additionally, I delivered a comprehensive presentation explaining my process, which included detailed explanations of my design decisions and user stories. These deliverables were crucial in demonstrating my approach and securing my position at AE Studio.',
        ],
      },
      {
        /**
         * SectionPresentation — full content-width slides, no side peeks.
         * Uses DeckSlider variant `presentation`.
         */
        type: 'deck-slider',
        variant: 'presentation',
        title: 'Presentation',
        autoplay: false,
        decks: Array.from({ length: 25 }, (_, i) => ({
          title: `Slide ${i + 1}`,
          images: [
            {
              src: `${VC}/slide-${String(i + 1).padStart(2, '0')}.jpg`,
              alt: `Vibecheck presentation slide ${i + 1}`,
              fit: 'contain' as const,
            },
          ],
        })),
      },
    ],
  },
{
    slug: 'booking',
    title: 'Booking.com',
    year: '2020',
    tags: ['MOBILE', 'CONCEPT'],
    summary:
      'Conducted a design critique and redesign concept of the Booking.com app’s search flow, focusing on enhancing usability and visual harmony by addressing inconsistencies and improving the overall user experience.',
    cover: `${FRAMER}/OBLjNMv2ereMgmyMWjWgMY2gX3s.png?width=1090&height=754`,
    imageFit: 'contain',
    size: 'sm',
    priority: 55,
    soon: true,
    href: '/projects/booking',
    nextSlug: 'crypto-bros',
    sections: [
      {
        title: 'Audit',
        paragraphs: [
          'I identified several key issues in the app, including a lack of design patterns, poor harmony among UI elements due to an inconsistent design system, and a confusing search experience where category changes resulted in loss of user input. Additionally, some areas lacked context, making it difficult for users to understand the content, and the search results pages were cluttered with low legibility.',
        ],
      },
      {
        title: 'Redesign Process',
        paragraphs: [
          'To address these issues, I turned to Airbnb and SkyScanner as primary visual references. Both apps have well-structured search flows with clear patterns that enhance usability. I used these references to guide the redesign, applying industry standards that users would find familiar.',
          'The main objective of my redesign was to create a clearer, more intuitive experience for the user, adhering to industry standards to make the flow more predictable. I focused on reorganizing the information, defining clear hierarchies, and eliminating unnecessary visual clutter.',
          'I developed a simple prototype in Figma, emphasizing the user interactions and transitions. This allowed for an easy comparison with the current Booking.com app, clearly demonstrating how the proposed changes would improve the user experience.',
        ],
      },
      {
        title: 'Challenges & Outcome',
        paragraphs: [
          'The most challenging part of this project was organizing the information effectively. Identifying groups, hierarchies, and essential data required careful consideration to ensure that the final design would be both functional and user-friendly.',
          'The success of this project led to an offer from Zygo for the position of Senior UI Designer. However, I decided to continue my career at ArcTouch, as I saw more promising opportunities for growth there.',
        ],
      },
    ],
  },
{
    slug: 'intermex',
    title: 'Intermex',
    year: '2021',
    tags: ['MOBILE', 'A11Y'],
    summary:
      'Led the design of the Intermex app, developed its design system, and ensured the app was fully accessible (a11y compliant), facilitating money transfers from the U.S. to Latin America and the Caribbean, focusing on users with limited tech knowledge.',
    cover: `${FRAMER}/KDJ8dI9G4pR5XgWWFsyJ5N6I8bs.png?width=1210&height=2060`,
    imageFit: 'contain',
    size: 'tall',
    priority: 60,
    soon: true,
    href: '/projects/intermex',
    nextSlug: 'booking',
    sections: [
      {
        title: 'Project Kickoff and Discovery',
        paragraphs: [
          'The project began with several virtual workshop and discovery sessions to identify Intermex’s target audience: Latinos with limited tech knowledge who need to send money to their families in other countries, like Mexico.',
          'Intermex, as the leading processor of money transfer services in the U.S. to Latin America and the Caribbean, required a tailored approach to address the unique needs of this demographic.',
        ],
      },
      {
        title: 'Wireframing and Prioritization',
        paragraphs: [
          'We proceeded with wireframing and feature prioritization to outline the MVP. I led the wireframe creation with two other designers, iterating through several rounds of feedback with the Intermex team to refine the scope and ensure alignment with the company’s goals.',
        ],
      },
      {
        title: 'UI Exploration',
        paragraphs: [
          'In the UI phase, we explored concepts and created mood boards. We looked for visual representations of the feelings, concepts, and personas defined during discovery. Three mood boards were presented to the client. Intermex, launching a new brand with a vibrant green, chose the “So Green” concept. Though not our first choice, it aligned well with their new branding.',
          'Once the concept was decided, we implemented all other app screens with that visual language and created a simple design system for easy use.',
        ],
      },
      {
        title: 'Accessibility',
        paragraphs: [
          'Accessibility was a major focus for this project as many companies often overlook it in their apps. During the accessibility phase, I researched criteria and implementation methods, adjusting the design for contrast, Voice Over, Focus Order, and Font Scaling.',
          'To create an effective Voice Over experience, I collaborated with a blind user who demonstrated how he navigates apps daily. This experience was crucial in determining the content and element order for Voice Over.',
        ],
      },
    ],
    quotes: [
      {
        text: "I'm always impressed by Vini's professional posture on the project and all the work he put into it: from super organized and structured Figma files, to how he comes up with good ideas and solutions for the project, the way he presents and communicates them and how he is always trying to optimize the work to make it easier and faster! Working with him is very rewarding and enriching!",
        author: 'João Brizzi',
        role: 'Product Designer at ArcTouch',
      },
    ],
  },
{
    slug: 'moove',
    title: 'Moove',
    year: '2023',
    tags: ['BRAND'],
    summary:
      'Visual identity and brand applications for Moove Wellness Club, a multi-modality Brazilian fitness network: a clearer infinity mark, then apparel, merch, and campaigns that carry the brand from the locker room to the wall.',
    // Homepage: original combined mark + construction lines (draw strokes on hover)
    cover: `${MOOVE}/logo-mark.svg`,
    coverAnimate: 'draw-lines',
    imageFit: 'contain',
    size: 'wide',
    priority: 50,
    href: '/projects/moove',
    nextSlug: 'crypto-bros',
    sections: [
      {
        title: 'From every practice, one brand',
        paragraphs: [
          'Moove Wellness Club brings pilates, yoga, dance, jiu-jitsu, and wellness under one roof. The old mark was hard to apply: too delicate at small sizes, easy to confuse with generic gym type, and too rigid for every context a club like this needs.',
          'I redesigned the identity so it could stay sharp on a hoodie, clear on a bottle, and flexible across campaigns, then built the applications that put it in members hands every day.',
        ],
      },
      {
        title: 'Identity system',
        paragraphs: [
          'The infinity mark is the heart of Moove: strong enough to stand alone as an icon, and clean enough to live next to the wordmark in orange, black, or reverse. The system is built to scale, reverse, and print without drama.',
        ],
      },
      {
        title: 'In the club',
        paragraphs: [
          'A wellness brand has to survive the floor, not only the deck. I applied the system to hoodies, tees, bottles, and bags so members wear and carry Moove between classes.',
        ],
      },
      {
        title: 'Modalities, one system',
        paragraphs: [
          'Wellness, yoga, jiu-jitsu, and pilates each keep their own energy, while sharing the same mark and brand color. Campaign templates keep the club consistent without redesigning every class from scratch.',
        ],
      },
      {
        title: 'Print and promotion',
        paragraphs: [
          'Poster systems and infinite-tile layouts extend the mark into walls, windows, and seasonal communication, so the brand stays present outside the studio too.',
        ],
      },
    ],
    blocks: [
      {
        type: 'bento',
        // Pack order for 4-col grid (sizes fixed: tshirt 1×1, wave 1×2):
        // [ logo-mark 2×1 ][ tshirt 1×1 ][ wave 1×2 ]
        // [ moletom 1×2 ][ wellness 2×2 ][ wave     ]
        // [ moletom     ][ wellness     ][ icon 1×1 ]
        cells: [
          {
            kind: 'image',
            src: `${MOOVE}/logo-mark.svg`,
            alt: 'Moove wordmark with construction lines',
            span: '2x1',
            fit: 'contain',
            animate: 'logo-mark',
          },
          {
            kind: 'image',
            src: `${MOOVE}/tshirt-01.jpg`,
            alt: 'Moove branded t-shirt mockup',
            span: '1x1',
            fit: 'cover',
            // Zoom shirt so the product reads larger in the 1×1 card
            scale: 1.22,
            objectPosition: 'center center',
          },
          {
            kind: 'image',
            src: `${MOOVE}/hero-training.jpg`,
            alt: 'Athlete training with Moove line-art wordmark overlay',
            span: '1x2',
            fit: 'cover',
            // Wave / training column: keep subject centered in the tall card
            objectPosition: 'center center',
          },
          {
            kind: 'image',
            src: `${MOOVE}/moletom.jpg`,
            alt: 'Moove branded hoodie mockup',
            span: '1x2',
            fit: 'cover',
          },
          {
            kind: 'image',
            // Layered: photo bg + infinity icon / Wellness Club wordmark front
            src: `${MOOVE}/wellness-bg.jpg`,
            front: `${MOOVE}/wellness-overlay.svg`,
            alt: 'Moove wellness club poster: photo with infinity icon and wordmark',
            span: '2x2',
            fit: 'cover',
            // Align photo to top of card so the subject sits under the overlay
            objectPosition: 'left top',
            animate: 'layer-reveal',
          },
          {
            kind: 'image',
            // Transparent mark so brand-wave rings show on orange cell bg
            src: `${MOOVE}/icon-mark.svg`,
            alt: 'Moove infinity icon on brand orange',
            span: '1x1',
            fit: 'contain',
            padded: true,
            // Wide mark (180×89); keep modest vs the orange field
            scale: 0.28,
            surface: 'brand',
            animate: 'brand-waves',
          },
        ],
      },
      {
        type: 'section',
        title: 'From every practice, one brand',
        paragraphs: [
          '**Moove Wellness Club** brings **pilates**, **yoga**, **dance**, **jiu-jitsu**, and **wellness** under one roof. The old mark fought that reality: fragile at small sizes, easy to confuse with generic gym type, and too rigid for every context a club like this needs.',
          'I rebuilt the identity so it could stay sharp on a hoodie, clear on a bottle, and flexible across campaigns, then carried it into the applications members actually touch.',
        ],
      },
      {
        type: 'section',
        title: 'Identity system',
        paragraphs: [
          'The infinity mark is the heart of Moove: strong enough to stand alone as an icon, and clean enough to sit with the wordmark in brand orange, black, or reverse. The system is built to scale, reverse, and print without drama, from large outdoor lettering down to embroidery.',
        ],
      },
      {
        // Identity kit — split-3-2 (2 cols × 6 tracks = same height as 3-row bento):
        // [ evolution 01 1×2 ][ primary orange 1×3 ]
        // [ evolution 02 1×2 ][ primary orange     ]
        // [ evolution 03 1×2 ][ mono lockup 1×3    ]
        // Left: 3 horizontal half-width cards. Right: 2 cards, 50/50 height.
        type: 'bento',
        shell: 'content',
        layout: 'split-3-2',
        cells: [
          {
            kind: 'image',
            src: `${MOOVE}/logo-evolution-01.svg`,
            alt: 'Moove logo construction: early mark geometry and guidelines',
            span: '1x2',
            fit: 'cover',
            animate: 'logo-evolution',
            cascadeIndex: 0,
          },
          {
            kind: 'image',
            src: `${MOOVE}/colored-full-logo.svg`,
            alt: 'Moove primary logo on brand orange field',
            span: '1x3',
            fit: 'cover',
          },
          {
            kind: 'image',
            src: `${MOOVE}/logo-evolution-02.svg`,
            alt: 'Moove logo construction: refined wordmark proportions',
            span: '1x2',
            fit: 'cover',
            animate: 'logo-evolution',
            cascadeIndex: 1,
          },
          {
            kind: 'image',
            src: `${MOOVE}/bw-full-logo.jpg`,
            alt: 'Moove monochrome logo lockup',
            span: '1x3',
            fit: 'cover',
          },
          {
            kind: 'image',
            src: `${MOOVE}/logo-evolution-03.svg`,
            alt: 'Moove logo construction: final mark with grid and color accents',
            span: '1x2',
            fit: 'cover',
            animate: 'logo-evolution',
            cascadeIndex: 2,
          },
        ],
      },
      {
        type: 'section',
        title: 'In the club',
        paragraphs: [
          'A wellness brand has to survive the floor, not only the deck. I applied the system to **hoodies**, **tees**, **bottles**, and **bags** so members wear and carry Moove between classes.',
        ],
      },
      {
        // Merch mosaic — content column (not full-bleed)
        // Pack (4-col): apparel first, paper last
        // [ tee1 2×1      ][ mol 1×2 ][ tee2 1×1 ]
        // [ bottles 2×2   ][ mol     ][ bags 1×1 ]
        // [ bottles       ][ paper 2×1          ]
        type: 'bento',
        shell: 'content',
        cells: [
          {
            kind: 'image',
            src: `${MOOVE}/tshirt-01.jpg`,
            alt: 'Moove branded t-shirt mockup, front view',
            span: '2x1',
            fit: 'cover',
          },
          {
            kind: 'image',
            src: `${MOOVE}/moletom.jpg`,
            alt: 'Moove branded hoodie mockup',
            span: '1x2',
            fit: 'cover',
          },
          {
            kind: 'image',
            src: `${MOOVE}/tshirt-02.jpg`,
            alt: 'Moove branded t-shirt mockup on dark surface',
            span: '1x1',
            fit: 'cover',
            // Double default scale so the product reads larger in the 1×1 card
            scale: 2,
          },
          {
            kind: 'image',
            src: `${MOOVE}/bottles.png`,
            alt: 'Moove branded water bottles and drinkware',
            span: '2x2',
            fit: 'contain',
            padded: true,
            surface: 'light',
          },
          {
            kind: 'image',
            src: `${MOOVE}/bags.png`,
            alt: 'Moove branded tote and gym bags',
            span: '1x1',
            fit: 'contain',
            scale: 1.15,
            surface: 'light',
          },
          {
            kind: 'image',
            src: `${MOOVE}/paper-work.jpg`,
            alt: 'Brand system overview with mark and application samples on paper',
            span: '2x1',
            fit: 'cover',
          },
        ],
      },
      {
        type: 'section',
        title: 'Modalities, one system',
        paragraphs: [
          'Many practices, one brand. Campaigns for **wellness**, **yoga**, **jiu-jitsu**, and **pilates** share the infinity mark and brand color, while photography keeps each class feeling like itself.',
        ],
      },
      {
        // Continues “Modalities, one system” (no separate title)
        type: 'deck-slider',
        variant: 'slides',
        autoplay: false,
        decks: [
          {
            title: 'Yoga',
            images: [
              {
                src: `${MOOVE}/icon-yoga.jpg`,
                alt: 'Moove yoga campaign: brand icon over yoga photography',
                fit: 'cover',
                aspect: '1.778',
              },
            ],
          },
          {
            title: 'Jiu-jitsu',
            images: [
              {
                src: `${MOOVE}/icon-jiu.jpg`,
                alt: 'Moove jiu-jitsu campaign: brand icon over training photography',
                fit: 'cover',
                aspect: '1.778',
              },
            ],
          },
          {
            title: 'Pilates',
            images: [
              {
                src: `${MOOVE}/icon-pilates.jpg`,
                alt: 'Moove pilates campaign: brand icon over studio photography',
                fit: 'cover',
                aspect: '1.778',
              },
            ],
          },
          {
            title: 'Wellness Club',
            images: [
              {
                src: `${MOOVE}/icon-wellness-poster.jpg`,
                alt: 'Moove wellness club poster with brand icon',
                fit: 'cover',
                aspect: '1.778',
              },
            ],
          },
        ],
      },
      {
        type: 'section',
        title: 'Print and promotion',
        paragraphs: [
          'Beyond the floor, I designed **poster systems** and **infinite-tile** layouts so walls, windows, and seasonal communication stay on-brand without starting from zero every time.',
        ],
      },
      {
        type: 'gallery',
        layout: 'pair',
        images: [
          {
            src: `${MOOVE}/poster-infinite-01.jpg`,
            alt: 'Moove infinite-tile poster design, variant one',
            fit: 'cover',
            aspect: '0.667',
          },
          {
            src: `${MOOVE}/poster-infinite-02.jpg`,
            alt: 'Moove infinite-tile poster design, variant two',
            fit: 'cover',
            aspect: '0.667',
          },
        ],
      },
      {
        type: 'section',
        paragraphs: [
          'The **brand book** closed the project for the teams that print, post, and open doors every day, so new pieces can keep feeling like Moove without starting from a blank file.',
        ],
      },
    ],
  },
{
    slug: 'bubble',
    title: 'Bubble Habits',
    year: '',
    tags: ['VISION PRO'],
    summary: 'Spatial computing concept for Bubble Habits on Apple Vision Pro.',
    cover: `${FRAMER}/GYdQIKFo1opDQy8FHD7lExMvak.png?lossless=1&width=2000&height=1500`,
    coverFront: `${FRAMER}/ZjzIWZpe69g6ShfSlQK9Mh16zcQ.png?width=2000&height=1500`,
    imageFit: 'cover',
    size: 'lg',
    priority: 70,
    soon: true,
    sections: [],
  },
{
    slug: 'gilbarco',
    title: 'Gilbarco',
    year: '2020',
    tags: ['GAS PUMP OS', 'A11Y'],
    summary: 'Accessibility-focused work on the Gilbarco gas pump operating system.',
    cover: `${FRAMER}/fPPrfYc8utPH5PTgQv1X8WZxXU.png?lossless=1&width=1200&height=1395`,
    coverFront: `${FRAMER}/4EsOv8e8x37Rm0559UWwJRTQ.png?lossless=1&width=1200&height=1395`,
    imageFit: 'cover',
    size: 'sm',
    priority: 35,
    soon: true,
    sections: [],
  },
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}

/** Projects with a case-study route (includes `soon` drafts so /projects/[slug] is previewable). */
export function getPublishedProjects() {
  return projects.filter((p) => Boolean(p.href));
}

export function getHomeProjects() {
  return projects;
}

/** Unique tags in first-seen order across homepage projects (filter chips). */
export function getHomeFilterTags(): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const project of getHomeProjects()) {
    for (const tag of project.tags) {
      if (seen.has(tag)) continue;
      seen.add(tag);
      tags.push(tag);
    }
  }
  return tags;
}
