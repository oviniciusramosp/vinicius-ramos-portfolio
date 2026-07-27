import Tag from './Tag.astro';
import TagRevealDemo from '../stories/TagRevealDemo.astro';

export default {
  title: 'Components/Tag',
  component: Tag,
  argTypes: {
    label: { control: 'text' },
    tone: {
      control: 'select',
      options: ['default', 'accent', 'soon'],
    },
    variant: {
      control: 'select',
      options: ['solid', 'chip', 'reveal'],
    },
    pressed: { control: 'boolean' },
  },
};

export const Solid = {
  args: {
    label: 'WEB',
    tone: 'default',
    variant: 'solid',
  },
};

export const SolidAccent = {
  name: 'Solid · accent',
  args: {
    label: 'AI',
    tone: 'accent',
    variant: 'solid',
  },
};

export const SolidSoon = {
  name: 'Solid · soon',
  args: {
    label: 'SOON',
    tone: 'soon',
    variant: 'solid',
  },
};

export const Chip = {
  args: {
    label: 'MOBILE',
    variant: 'chip',
    tone: 'default',
    pressed: false,
  },
};

export const ChipPressed = {
  name: 'Chip · pressed',
  args: {
    label: 'ALL',
    variant: 'chip',
    tone: 'default',
    pressed: true,
  },
};

export const RevealOnCard = {
  name: 'Reveal · on card hover',
  component: TagRevealDemo,
  args: {
    label: 'AI',
    tone: 'default',
  },
};
