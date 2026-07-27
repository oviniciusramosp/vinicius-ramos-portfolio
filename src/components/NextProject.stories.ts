import NextProject from './NextProject.astro';
import { mockProjectLg, mockProjectSm } from '../stories/fixtures';

export default {
  title: 'Components/NextProject',
  component: NextProject,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Next CTA with **Blatant Bold width-wave** (same engine as navbar logo). Cases use label “NEXT PROJECT”; articles use “NEXT”. Hover for solid white fill + radial letter stretch.',
      },
    },
  },
};

export const Default = {
  name: 'Case · NEXT PROJECT',
  args: {
    title: mockProjectLg.title,
    href: mockProjectLg.href ?? '#',
    label: 'NEXT PROJECT',
  },
};

export const ShortTitle = {
  name: 'Short title',
  args: {
    title: mockProjectSm.title,
    href: mockProjectSm.href ?? '#',
  },
};

export const ArticleNext = {
  name: 'Article · NEXT',
  args: {
    label: 'NEXT',
    title: 'Siri, meet my app',
    href: '/articles/apple-ai-app-intents',
  },
};
