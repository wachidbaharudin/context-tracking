import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Strips all HTML tags by default, returning only text content.
 */
export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

/**
 * Sanitize HTML content, allowing safe formatting tags.
 * Use this for rich text fields that need to preserve formatting.
 */
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize data read from IndexedDB before use.
 * Validates that string fields are actually strings and sanitizes them.
 */
export function sanitizeStringField(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return sanitizeText(value);
}

/**
 * Sanitize a record of string values (e.g., user settings, form data).
 */
export function sanitizeStringRecord(record: Record<string, unknown>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    }
  }
  return sanitized;
}
