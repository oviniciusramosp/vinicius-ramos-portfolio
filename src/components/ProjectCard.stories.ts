import ProjectCardStage from '../stories/ProjectCardStage.astro';
import {
  mockProjectLg,
  mockProjectSm,
  mockProjectSoon,
  mockProjectTall,
  mockProjectWide,
} from '../stories/fixtures';

export default {
  title: 'Components/ProjectCard',
  component: ProjectCardStage,
  parameters: {
    layout: 'centered',
  },
};

export const Large = {
  name: 'Size · lg',
  args: {
    project: mockProjectLg,
    width: '420px',
    height: '340px',
  },
};

export const Small = {
  name: 'Size · sm',
  args: {
    project: mockProjectSm,
    width: '275px',
    height: '220px',
  },
};

export const Tall = {
  name: 'Size · tall',
  args: {
    project: mockProjectTall,
    width: '275px',
    height: '448px',
  },
};

export const Wide = {
  name: 'Size · wide',
  args: {
    project: mockProjectWide,
    width: '558px',
    height: '220px',
  },
};

export const Soon = {
  name: 'State · soon',
  args: {
    project: mockProjectSoon,
    width: '275px',
    height: '220px',
  },
};
