import type { Project, ProjectQuote } from '../data/projects';
import { placeholderImage, placeholderImageAlt } from './placeholder';

/** Minimal project fixtures for Storybook — gray placeholders only. */
export const mockProjectLg: Project = {
  slug: 'staircase',
  title: 'Staircase',
  year: '2021',
  tags: ['AI', 'WEB'],
  summary: 'AI-powered mortgage tools.',
  cover: placeholderImage({ width: 900, height: 900, label: 'cover' }),
  coverFront: placeholderImageAlt({ width: 900, height: 900, label: 'front' }),
  imageFit: 'contain',
  size: 'lg',
  priority: 100,
  href: '/projects/staircase',
  sections: [],
};

export const mockProjectSm: Project = {
  slug: 'vibecheck',
  title: 'Vibecheck',
  year: '2024',
  tags: ['WEB'],
  summary: 'Moodboard product.',
  cover: placeholderImage({ width: 600, height: 480, label: 'sm' }),
  size: 'sm',
  priority: 40,
  href: '/projects/vibecheck',
  sections: [],
};

export const mockProjectTall: Project = {
  slug: 'intermex',
  title: 'Intermex',
  year: '2022',
  tags: ['MOBILE', 'A11Y'],
  summary: 'Mobile remittance.',
  cover: placeholderImage({ width: 600, height: 900, label: 'tall' }),
  size: 'tall',
  priority: 60,
  href: '/projects/intermex',
  sections: [],
};

export const mockProjectWide: Project = {
  slug: 'booking',
  title: 'Booking.com',
  year: '2021',
  tags: ['MOBILE'],
  summary: 'Travel concept.',
  cover: placeholderImage({ width: 1200, height: 480, label: 'wide' }),
  size: 'wide',
  priority: 50,
  href: '/projects/booking',
  sections: [],
};

export const mockProjectSoon: Project = {
  slug: 'gilbarco',
  title: 'Gilbarco',
  year: '2025',
  tags: ['GAS PUMP OS', 'A11Y'],
  summary: 'Coming soon.',
  cover: placeholderImage({ width: 600, height: 480, label: 'soon' }),
  size: 'sm',
  priority: 30,
  soon: true,
  sections: [],
};

export const mockProjects: Project[] = [
  mockProjectLg,
  mockProjectSm,
  mockProjectTall,
  mockProjectWide,
  mockProjectSoon,
];

/**
 * Quote card model (ScrollGallery · kind: 'quote'):
 * role (accent mono) · author (Blatant) · optional avatar · hairline · body
 */
export const mockQuotes: ProjectQuote[] = [
  {
    text: 'Vinicius brings clarity to complex product problems and elevates the craft of every surface he touches.',
    author: 'Alex Rivera',
    role: "Acme's Head of Product",
    avatar: '/avatars/ChadMartin_HP.jpeg',
  },
  {
    text: 'Rare combination of systems thinking and pixel-level care. The portfolio speaks for itself.',
    author: 'Jordan Lee',
    role: "Northstar's Design Director",
    avatar: '/avatars/StefanVermeul_HP.jpeg',
  },
  {
    text: 'Collaborating with Vinicius was seamless — strong opinions, loosely held, always user-first.',
    author: 'Sam Okonkwo',
    role: "Lattice's Engineering Lead",
    avatar: '/avatars/JamesPatriquin_AT.jpeg',
  },
];

/** Same copy without portraits — tests header with identity only */
export const mockQuotesNoAvatar: ProjectQuote[] = mockQuotes.map(
  ({ avatar: _a, ...rest }) => rest,
);

export const mockFilterTags = ['AI', 'WEB', 'MOBILE', 'A11Y', 'BRAND'];
