import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getHomeFilterTags,
  getHomeProjects,
  getProject,
  getPublishedProjects,
  projects,
  type CaseBlock,
  type CaseBentoCell,
} from './projects';

const publicDir = resolve(process.cwd(), 'public');

function publicAssetExists(path: string): boolean {
  if (!path.startsWith('/')) return true; // remote URL or non-public path
  return existsSync(resolve(publicDir, path.slice(1)));
}

function collectLocalSrcs(projectSlug: string): string[] {
  const project = getProject(projectSlug);
  if (!project) return [];

  const srcs: string[] = [];
  const push = (src?: string) => {
    if (src?.startsWith('/')) srcs.push(src);
  };

  push(project.cover);
  push(project.coverFront);

  for (const quote of project.quotes ?? []) {
    push(quote.avatar);
  }

  for (const section of project.sections) {
    for (const image of section.images ?? []) push(image);
  }

  for (const block of project.blocks ?? []) {
    collectBlockSrcs(block, push);
  }

  return srcs;
}

function collectBlockSrcs(
  block: CaseBlock,
  push: (src?: string) => void,
): void {
  if (block.type === 'gallery') {
    for (const image of block.images) push(image.src);
    return;
  }
  if (block.type === 'bento') {
    for (const cell of block.cells as CaseBentoCell[]) {
      if (cell.kind === 'image') {
        push(cell.src);
        if ('front' in cell) push(cell.front);
      }
      if (cell.kind === 'device-3d') push(cell.screen);
      if (cell.kind === 'social-fan') {
        for (const image of cell.images) push(image.src);
      }
    }
    return;
  }
  if (block.type === 'deck-slider') {
    for (const deck of block.decks) {
      for (const image of deck.images) push(image.src);
    }
    return;
  }
  if (block.type === 'video') {
    push(block.src);
    push(block.poster);
    return;
  }
  if (block.type === 'scroll-gallery') {
    for (const item of block.items) push(item.image);
  }
}

describe('projects data integrity', () => {
  it('has at least one project', () => {
    expect(projects.length).toBeGreaterThan(0);
  });

  it('has unique slugs', () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('requires core fields on every project', () => {
    for (const project of projects) {
      expect(project.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(project.title, project.slug).toBeTruthy();
      expect(project.tags.length, project.slug).toBeGreaterThan(0);
      expect(project.summary, project.slug).toBeTruthy();
      expect(project.cover, project.slug).toBeTruthy();
      expect(project.size, project.slug).toBeTruthy();
      // Draft / soon cards may leave year empty until the case is ready
      if (!project.soon) {
        expect(project.year, project.slug).toBeTruthy();
      }
    }
  });

  it('points nextSlug at existing projects when set', () => {
    for (const project of projects) {
      if (!project.nextSlug) continue;
      expect(
        getProject(project.nextSlug),
        `${project.slug} nextSlug → ${project.nextSlug}`,
      ).toBeDefined();
    }
  });

  it('routable projects have href; non-soon ones also require year', () => {
    const published = getPublishedProjects();
    expect(published.length).toBeGreaterThan(0);
    for (const project of published) {
      expect(project.href, project.slug).toBeTruthy();
      // Drafts may ship with empty year until the case is ready
      if (!project.soon) {
        expect(project.year, project.slug).toBeTruthy();
      }
    }
  });

  it('local cover assets exist under public/ for every project', () => {
    for (const project of projects) {
      expect(
        publicAssetExists(project.cover),
        `missing cover for ${project.slug}: ${project.cover}`,
      ).toBe(true);
      if (project.coverFront) {
        expect(
          publicAssetExists(project.coverFront),
          `missing coverFront for ${project.slug}: ${project.coverFront}`,
        ).toBe(true);
      }
    }
  });

  it('local media in published case studies exists under public/', () => {
    for (const project of getPublishedProjects()) {
      for (const src of collectLocalSrcs(project.slug)) {
        expect(
          publicAssetExists(src),
          `missing media for ${project.slug}: ${src}`,
        ).toBe(true);
      }
    }
  });
});

describe('crypto-bros educational posts slider', () => {
  it('includes a short dark scroll-gallery of social posts with local assets', () => {
    const project = getProject('crypto-bros');
    expect(project).toBeDefined();
    const gallery = project!.blocks?.find(
      (b) => b.type === 'scroll-gallery' && b.ariaLabel === 'Educational social posts',
    );
    expect(gallery, 'missing Educational social posts scroll-gallery').toBeDefined();
    if (!gallery || gallery.type !== 'scroll-gallery') return;

    expect(gallery.theme).toBe('dark');
    expect(gallery.short).toBe(true);
    expect(gallery.items.length).toBeGreaterThanOrEqual(7);

    for (const item of gallery.items) {
      expect(item.kind, item.id).toBe('social');
      expect(item.image, item.id).toMatch(/^\/projects\/crypto-bros\/post-/);
      expect(
        publicAssetExists(item.image!),
        `missing social post asset: ${item.image}`,
      ).toBe(true);
    }
  });
});

describe('project helpers', () => {
  it('getProject returns a match or undefined', () => {
    const first = projects[0];
    expect(getProject(first.slug)).toEqual(first);
    expect(getProject('does-not-exist')).toBeUndefined();
  });

  it('getHomeProjects returns the full list', () => {
    expect(getHomeProjects()).toBe(projects);
  });

  it('getHomeFilterTags returns unique tags in first-seen order', () => {
    const tags = getHomeFilterTags();
    expect(tags.length).toBeGreaterThan(0);
    expect(new Set(tags).size).toBe(tags.length);

    // Reconstruct expected order without Set shortcut in production code path
    const expected: string[] = [];
    const seen = new Set<string>();
    for (const project of projects) {
      for (const tag of project.tags) {
        if (seen.has(tag)) continue;
        seen.add(tag);
        expected.push(tag);
      }
    }
    expect(tags).toEqual(expected);
  });
});
