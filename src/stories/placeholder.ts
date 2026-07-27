/**
 * Storybook-only gray placeholders with a simple image icon.
 * Never reuse portfolio / OG / Framer / Apple assets here.
 */

export type PlaceholderOptions = {
  width?: number;
  height?: number;
  /** Background fill */
  bg?: string;
  /** Icon + label stroke/fill */
  fg?: string;
  /** Optional small caption under the icon */
  label?: string;
};

const DEFAULTS = {
  width: 800,
  height: 600,
  bg: '#3a3a3e',
  fg: '#8a8a90',
} as const;

/**
 * Inline SVG data-URI: flat gray field + centered image/mountain icon.
 */
export function placeholderImage(options: PlaceholderOptions = {}): string {
  const width = options.width ?? DEFAULTS.width;
  const height = options.height ?? DEFAULTS.height;
  const bg = options.bg ?? DEFAULTS.bg;
  const fg = options.fg ?? DEFAULTS.fg;
  const label = options.label?.slice(0, 24) ?? '';

  const iconSize = Math.round(Math.min(width, height) * 0.18);
  const cx = width / 2;
  const cy = height / 2 - (label ? iconSize * 0.12 : 0);
  const half = iconSize / 2;

  // Frame + mountain + sun (classic “image” glyph)
  const frame = `
    <rect x="${cx - half}" y="${cy - half * 0.85}"
      width="${iconSize}" height="${iconSize * 0.72}"
      rx="${iconSize * 0.08}"
      fill="none" stroke="${fg}" stroke-width="${Math.max(2, iconSize * 0.06)}"
    />
    <circle cx="${cx + half * 0.35}" cy="${cy - half * 0.35}"
      r="${iconSize * 0.1}" fill="${fg}" opacity="0.9"
    />
    <path d="
      M ${cx - half * 0.75} ${cy + half * 0.35}
      L ${cx - half * 0.15} ${cy - half * 0.15}
      L ${cx + half * 0.2} ${cy + half * 0.1}
      L ${cx + half * 0.45} ${cy - half * 0.05}
      L ${cx + half * 0.75} ${cy + half * 0.35}
      Z
    " fill="${fg}" opacity="0.85"/>
  `;

  const text = label
    ? `<text x="${cx}" y="${cy + half * 0.85 + 18}"
        text-anchor="middle"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
        font-size="${Math.max(11, Math.round(iconSize * 0.22))}"
        fill="${fg}" opacity="0.75">${escapeXml(label)}</text>`
    : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Placeholder${label ? `: ${label}` : ''}">
  <rect width="100%" height="100%" fill="${bg}"/>
  ${frame}
  ${text}
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Slightly lighter layer — useful as coverFront on dual-image cards */
export function placeholderImageAlt(options: PlaceholderOptions = {}): string {
  return placeholderImage({
    bg: '#4a4a50',
    fg: '#9a9aa0',
    ...options,
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
