/**
 * Link-in-bio entries for /links (personal Linktree-style page).
 * Not linked from the site nav — share the URL directly.
 */
export type LinkItem = {
  /** Button label */
  label: string;
  /** Absolute URL or site-relative path */
  href: string;
  /** Open in a new tab (default: true for external absolute URLs) */
  external?: boolean;
};

export const links: LinkItem[] = [
  {
    label: 'Portfolio',
    href: '/',
    external: false,
  },
];
