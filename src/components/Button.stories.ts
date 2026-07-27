import Button from './Button.astro';

export default {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['ghost', 'solid', 'submit'],
    },
    label: { control: 'text' },
    href: { control: 'text' },
    active: { control: 'boolean' },
    magnetic: { control: 'boolean' },
    external: { control: 'boolean' },
  },
};

export const Ghost = {
  args: {
    label: 'Resume',
    variant: 'ghost',
    href: '/resume',
    magnetic: true,
  },
};

export const GhostActive = {
  name: 'Ghost · active',
  args: {
    label: 'Contact',
    variant: 'ghost',
    href: '/contact',
    active: true,
    magnetic: true,
  },
};

export const Solid = {
  args: {
    label: 'Say hi',
    variant: 'solid',
    href: '/contact',
    magnetic: true,
  },
};

export const Submit = {
  args: {
    label: 'Send message',
    variant: 'submit',
    type: 'submit',
    magnetic: false,
  },
};

export const External = {
  args: {
    label: 'linkedin',
    variant: 'ghost',
    href: 'https://www.linkedin.com/in/viniciusramos/',
    external: true,
    magnetic: true,
  },
};

export const AppStore = {
  name: 'App Store download',
  args: {
    label: 'App Store',
    eyebrow: 'Download on the',
    variant: 'ghost',
    href: 'https://apps.apple.com/br/app/crypto-bros/id6758371729',
    external: true,
    icon: 'apple',
    magnetic: true,
  },
};
