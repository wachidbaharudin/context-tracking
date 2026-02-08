import { describe, it, expect } from 'vitest';
import { validateUrl, validateEmail, validateNumericRange } from '@/lib/security/validate';

describe('validateUrl', () => {
  it('accepts valid https URLs', () => {
    const result = validateUrl('https://example.com');
    expect(result.valid).toBe(true);
    expect(result.sanitizedUrl).toBe('https://example.com/');
  });

  it('accepts valid http URLs', () => {
    const result = validateUrl('http://example.com/path?q=1');
    expect(result.valid).toBe(true);
    expect(result.sanitizedUrl).toContain('http://example.com/path');
  });

  it('auto-prepends https:// for protocol-less URLs', () => {
    const result = validateUrl('example.com');
    expect(result.valid).toBe(true);
    expect(result.sanitizedUrl).toBe('https://example.com/');
  });

  it('rejects empty URLs', () => {
    const result = validateUrl('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('rejects whitespace-only URLs', () => {
    const result = validateUrl('   ');
    expect(result.valid).toBe(false);
  });

  it('rejects javascript: protocol', () => {
    const result = validateUrl('javascript:alert(1)');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not allowed');
  });

  it('rejects data: protocol', () => {
    const result = validateUrl('data:text/html,<h1>hello</h1>');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not allowed');
  });

  it('rejects ftp: protocol', () => {
    const result = validateUrl('ftp://files.example.com');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not allowed');
  });

  it('rejects URLs exceeding max length', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2100);
    const result = validateUrl(longUrl);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('maximum length');
  });

  it('rejects completely invalid URLs', () => {
    const result = validateUrl('not a url at all :::');
    expect(result.valid).toBe(false);
  });

  it('trims whitespace from input', () => {
    const result = validateUrl('  https://example.com  ');
    expect(result.valid).toBe(true);
    expect(result.sanitizedUrl).toBe('https://example.com/');
  });

  it('handles URLs with ports', () => {
    const result = validateUrl('https://localhost:3000/api');
    expect(result.valid).toBe(true);
  });

  it('handles URLs with fragments', () => {
    const result = validateUrl('https://example.com/page#section');
    expect(result.valid).toBe(true);
    expect(result.sanitizedUrl).toContain('#section');
  });
});

describe('validateEmail', () => {
  it('accepts valid emails', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('first.last@domain.org')).toBe(true);
    expect(validateEmail('user+tag@example.co.uk')).toBe(true);
  });

  it('rejects empty strings', () => {
    expect(validateEmail('')).toBe(false);
  });

  it('rejects emails without @', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });

  it('rejects emails without domain', () => {
    expect(validateEmail('user@')).toBe(false);
  });

  it('rejects emails without TLD', () => {
    expect(validateEmail('user@domain')).toBe(false);
  });

  it('trims whitespace', () => {
    expect(validateEmail('  user@example.com  ')).toBe(true);
  });
});

describe('validateNumericRange', () => {
  it('accepts values within range', () => {
    expect(validateNumericRange(5, 0, 10)).toEqual({ valid: true });
    expect(validateNumericRange(0, 0, 10)).toEqual({ valid: true });
    expect(validateNumericRange(10, 0, 10)).toEqual({ valid: true });
  });

  it('rejects values below min', () => {
    const result = validateNumericRange(-1, 0, 10);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at least');
  });

  it('rejects values above max', () => {
    const result = validateNumericRange(11, 0, 10);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at most');
  });

  it('rejects NaN', () => {
    const result = validateNumericRange(NaN, 0, 10);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('finite number');
  });

  it('rejects Infinity', () => {
    const result = validateNumericRange(Infinity, 0, 100);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('finite number');
  });

  it('rejects negative Infinity', () => {
    const result = validateNumericRange(-Infinity, 0, 100);
    expect(result.valid).toBe(false);
  });
});
