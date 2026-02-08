import { describe, it, expect } from 'vitest';
import {
  sanitizeText,
  sanitizeHtml,
  sanitizeStringField,
  sanitizeStringRecord,
} from '@/lib/security/sanitize';

describe('sanitizeText', () => {
  it('strips all HTML tags', () => {
    expect(sanitizeText('<b>bold</b>')).toBe('bold');
    expect(sanitizeText('<script>alert("xss")</script>')).toBe('');
    expect(sanitizeText('<img src=x onerror=alert(1)>')).toBe('');
  });

  it('preserves plain text', () => {
    expect(sanitizeText('Hello World')).toBe('Hello World');
    expect(sanitizeText('Special chars: & < > "')).toBe('Special chars: &amp; &lt; &gt; "');
  });

  it('handles empty string', () => {
    expect(sanitizeText('')).toBe('');
  });

  it('strips nested HTML', () => {
    expect(sanitizeText('<div><p><b>nested</b></p></div>')).toBe('nested');
  });

  it('strips event handlers', () => {
    expect(sanitizeText('<div onclick="alert(1)">click</div>')).toBe('click');
  });
});

describe('sanitizeHtml', () => {
  it('allows safe formatting tags', () => {
    expect(sanitizeHtml('<b>bold</b>')).toBe('<b>bold</b>');
    expect(sanitizeHtml('<i>italic</i>')).toBe('<i>italic</i>');
    expect(sanitizeHtml('<em>emphasis</em>')).toBe('<em>emphasis</em>');
    expect(sanitizeHtml('<strong>strong</strong>')).toBe('<strong>strong</strong>');
    expect(sanitizeHtml('<code>code</code>')).toBe('<code>code</code>');
    expect(sanitizeHtml('<pre>preformatted</pre>')).toBe('<pre>preformatted</pre>');
  });

  it('allows links with href', () => {
    const result = sanitizeHtml('<a href="https://example.com">link</a>');
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('link');
  });

  it('strips script tags', () => {
    expect(sanitizeHtml('<script>alert(1)</script>')).toBe('');
  });

  it('strips disallowed tags but keeps content', () => {
    expect(sanitizeHtml('<div>content</div>')).toBe('content');
    expect(sanitizeHtml('<span>text</span>')).toBe('text');
  });

  it('strips event handlers from allowed tags', () => {
    expect(sanitizeHtml('<b onclick="alert(1)">text</b>')).toBe('<b>text</b>');
  });

  it('strips data attributes', () => {
    expect(sanitizeHtml('<b data-custom="val">text</b>')).toBe('<b>text</b>');
  });

  it('allows list elements', () => {
    const result = sanitizeHtml('<ul><li>item1</li><li>item2</li></ul>');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>');
  });
});

describe('sanitizeStringField', () => {
  it('sanitizes string values', () => {
    expect(sanitizeStringField('<b>text</b>')).toBe('text');
  });

  it('returns empty string for non-string values', () => {
    expect(sanitizeStringField(null)).toBe('');
    expect(sanitizeStringField(undefined)).toBe('');
    expect(sanitizeStringField(42)).toBe('');
    expect(sanitizeStringField({})).toBe('');
    expect(sanitizeStringField([])).toBe('');
  });

  it('preserves plain strings', () => {
    expect(sanitizeStringField('hello')).toBe('hello');
  });
});

describe('sanitizeStringRecord', () => {
  it('sanitizes all string values in a record', () => {
    const result = sanitizeStringRecord({
      name: '<b>Bold</b>',
      title: '<script>hack</script>',
    });
    expect(result).toEqual({ name: 'Bold', title: '' });
  });

  it('skips non-string values', () => {
    const result = sanitizeStringRecord({
      name: 'Valid',
      count: 42 as unknown,
      active: true as unknown,
    });
    expect(result).toEqual({ name: 'Valid' });
  });

  it('handles empty records', () => {
    expect(sanitizeStringRecord({})).toEqual({});
  });
});
