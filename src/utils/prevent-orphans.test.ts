import { describe, expect, it } from 'vitest';
import { preventOrphans, preventOrphansHtml } from './prevent-orphans';

describe('preventOrphans', () => {
  it('glues only the last two words with a single NBSP', () => {
    expect(preventOrphans('Hello world friends')).toBe('Hello world\u00A0friends');
  });

  it('never glues more than two trailing words', () => {
    // three spaces of opportunity — only the last pair is joined
    expect(preventOrphans('a b c d e')).toBe('a b c d\u00A0e');
    expect(preventOrphans('a b c d e').split('\u00A0')).toHaveLength(2);
  });

  it('leaves short lines alone when under two words', () => {
    expect(preventOrphans('One')).toBe('One');
  });

  it('glues a two-word line', () => {
    expect(preventOrphans('Two words')).toBe('Two\u00A0words');
  });

  it('handles multi-line paragraphs independently (still 2 words each)', () => {
    const input = 'First line ends here.\n\nSecond line ends there.';
    const out = preventOrphans(input);
    expect(out).toBe(
      'First line ends\u00A0here.\n\nSecond line ends\u00A0there.',
    );
  });

  it('preserves leading indentation on a line', () => {
    expect(preventOrphans('  pad last word')).toBe('  pad last\u00A0word');
  });
});

describe('preventOrphansHtml', () => {
  it('does not rewrite inside tags; glues last two words per text segment', () => {
    expect(preventOrphansHtml('Save with <br />Trade In.')).toBe(
      'Save\u00A0with <br />Trade\u00A0In.',
    );
  });

  it('leaves existing nbsp entities alone while gluing plain text', () => {
    const html = 'Pay with Apple&nbsp;Card monthly plan.';
    expect(preventOrphansHtml(html)).toBe(
      'Pay with Apple&nbsp;Card monthly\u00A0plan.',
    );
  });
});
