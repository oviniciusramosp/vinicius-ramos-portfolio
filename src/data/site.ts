export const site = {
  name: 'Vinicius Ramos',
  title: 'Vinicius Ramos · Product Designer',
  description: 'Vinicius Ramos, Brazilian Product Designer and Manager.',
  url: 'https://viniciusramos.com',
  locale: 'en-US',
  banner: 'This portfolio is currently in development.',
  hero: {
    title: "hi, i'm Vinicius.",
    bio: "I'm a product designer and manager passionate about crafting delightful digital experiences. With a focus on user experience for digital products, AI, and spatial computing.",
  },
  nav: [
    { label: 'Articles', href: '/articles' },
    { label: 'Resume', href: '/resume' },
    { label: 'Contact', href: '/contact' },
  ],
  social: {
    linkedin: 'https://www.linkedin.com/in/viniciusramos/',
  },
  /** Same Framer Forms endpoint used by viniciusramos.com/contact */
  contactForm: {
    action:
      'https://api.framer.com/forms/v1/forms/15471708-2475-471d-898a-67877b3c8a54/submit',
    siteId:
      'aed12d7d19e5beedab164db3805b41311ef7af423be8a7bc9568676278fb8ecc',
  },
  ogImage:
    'https://framerusercontent.com/assets/wAJJbFFUrW8JR2myQTatY2IdeEY.jpg',
  favicon:
    'https://framerusercontent.com/images/Z12cSKBSXFH538058mvxCkln8A.png',
} as const;
