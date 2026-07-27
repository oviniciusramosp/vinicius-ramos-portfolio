import TokensShowcase from './TokensShowcase.astro';

export default {
  title: 'Tokens/Overview',
  component: TokensShowcase,
  parameters: {
    layout: 'fullscreen',
  },
};

export const All = {
  args: {
    section: 'all',
  },
};

export const Colors = {
  name: 'Colors',
  args: {
    section: 'colors',
  },
};

export const Typography = {
  name: 'Typography',
  args: {
    section: 'typography',
  },
};

export const Spacing = {
  name: 'Spacing',
  args: {
    section: 'spacing',
  },
};

export const Radii = {
  name: 'Radii',
  args: {
    section: 'radii',
  },
};

export const Motion = {
  name: 'Motion',
  args: {
    section: 'motion',
  },
};
