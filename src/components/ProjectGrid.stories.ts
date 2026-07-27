import ProjectGridStage from '../stories/ProjectGridStage.astro';
import { mockFilterTags, mockProjects } from '../stories/fixtures';

export default {
  title: 'Components/ProjectGrid',
  component: ProjectGridStage,
  parameters: {
    layout: 'fullscreen',
  },
};

export const WithFilters = {
  name: 'With filters',
  args: {
    projects: mockProjects,
    filterTags: mockFilterTags,
  },
};

export const WithoutFilters = {
  name: 'Without filters',
  args: {
    projects: mockProjects,
    filterTags: [],
  },
};
