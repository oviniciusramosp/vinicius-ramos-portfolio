export const site = {
  name: 'Vinicius Ramos',
  title: 'Vinicius Ramos · Product Designer',
  /**
   * Primary meta description (home + fallback).
   * ~155 chars — product design, AI, spatial; location signal for local queries.
   */
  description:
    'Product designer and manager crafting UX for digital products, AI, and spatial computing. Based in Florianópolis, Brazil — portfolio, case studies, and writing.',
  /** Shorter tagline for Person schema / secondary use */
  tagline:
    'Brazilian product designer and manager focused on UX, AI, and spatial computing.',
  jobTitle: 'Senior Product Designer and Manager',
  url: 'https://viniciusramos.com',
  /** BCP 47 — used for html lang + og:locale */
  locale: 'en-US',
  /** Open Graph locale underscore form */
  ogLocale: 'en_US',
  banner: 'This portfolio is currently in development.',
  hero: {
    title: "hi, i'm Vinicius.",
    bio: "I'm a product designer and manager passionate about crafting delightful digital experiences. With a focus on user experience for digital products, AI, and spatial computing.",
  },
  location: {
    city: 'Florianópolis',
    region: 'SC',
    country: 'BR',
  },
  nav: [
    { label: 'Articles', href: '/articles' },
    { label: 'Resume', href: '/resume' },
    { label: 'Contact', href: '/contact' },
  ],
  social: {
    linkedin: 'https://www.linkedin.com/in/viniciusramos/',
  },
  /** Profile URLs for schema.org sameAs */
  sameAs: ['https://www.linkedin.com/in/viniciusramos/'] as const,
  /** Same Framer Forms endpoint used by viniciusramos.com/contact */
  contactForm: {
    action:
      'https://api.framer.com/forms/v1/forms/15471708-2475-471d-898a-67877b3c8a54/submit',
    siteId:
      'aed12d7d19e5beedab164db3805b41311ef7af423be8a7bc9568676278fb8ecc',
  },
  /**
   * Default Open Graph image (1200×630), self-hosted.
   * Override per page with BaseLayout `image` prop.
   */
  ogImage: '/og-default.jpg',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: 'Vinicius Ramos — Product Designer portfolio',
  /** Local favicons in /public (black tile + white Blatant V, iOS-style corners) */
  faviconSvg: '/favicon.svg',
  faviconIco: '/favicon.ico',
  appleTouchIcon: '/apple-touch-icon.png',
  /** Matches dark UI (--color-bg) for browser chrome */
  themeColor: '#000000',
  /**
   * Page-level default descriptions (override in each page when needed).
   */
  pages: {
    articles:
      'Notes on product design, craft, AI, and the conversations that sharpen both — writing by Vinicius Ramos.',
    resume:
      'Resume of Vinicius Ramos: Senior Product Designer and Manager — experience, skills, and education.',
    contact:
      'Get in touch with Vinicius Ramos — product designer and manager. Send a message about product design, AI, or collaboration.',
  },
} as const;
