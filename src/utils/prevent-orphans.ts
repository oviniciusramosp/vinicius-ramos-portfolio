/**
 * Avoid a single orphan word on the last line by gluing **exactly the last
 * two words** with a non-breaking space (U+00A0). Nothing more is pulled
 * to the next line — only `word\u00A0word` at the end of each paragraph line.
 *
 * Multi-paragraph copy (`\n`) is handled line-by-line.
 */
export function preventOrphans(text: string): string {
  if (!text) return text;

  return text
    .split('\n')
    .map((line) => glueLastTwoWords(line))
    .join('\n');
}

function glueLastTwoWords(line: string): string {
  // Keep separators; rewrite only the space between the final two words
  const parts = line.split(/(\s+)/);
  const wordIndexes: number[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] && !/^\s+$/.test(parts[i]!)) wordIndexes.push(i);
  }
  if (wordIndexes.length < 2) return line;

  const penultimate = wordIndexes[wordIndexes.length - 2]!;
  const spaceIdx = penultimate + 1;
  if (spaceIdx < parts.length && /^\s+$/.test(parts[spaceIdx]!)) {
    parts[spaceIdx] = '\u00A0';
  }
  return parts.join('');
}

/**
 * Like `preventOrphans`, but only rewrites text outside simple HTML tags.
 * Safe for portfolio headlines that use `<br />` / `&nbsp;` already.
 */
export function preventOrphansHtml(html: string): string {
  if (!html) return html;
  return html
    .split(/(<[^>]+>)/g)
    .map((chunk) => (chunk.startsWith('<') ? chunk : preventOrphans(chunk)))
    .join('');
}
