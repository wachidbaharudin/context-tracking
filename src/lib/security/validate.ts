/**
 * Allowed URL protocols for user-provided links.
 * Only http and https are permitted to prevent javascript: and data: protocol injection.
 */
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

/**
 * Maximum allowed URL length to prevent abuse.
 */
const MAX_URL_LENGTH = 2048;

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
  sanitizedUrl?: string;
}

/**
 * Validate and sanitize a user-provided URL.
 *
 * - Blocks dangerous protocols (javascript:, data:, vbscript:, etc.)
 * - Only allows http: and https:
 * - Enforces maximum URL length
 * - Returns the parsed and reconstructed URL to normalize it
 */
export function validateUrl(input: string): UrlValidationResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return { valid: false, error: 'URL cannot be empty' };
  }

  if (trimmed.length > MAX_URL_LENGTH) {
    return { valid: false, error: `URL exceeds maximum length of ${MAX_URL_LENGTH} characters` };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    // Try prepending https:// if no protocol is specified
    try {
      parsed = new URL(`https://${trimmed}`);
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
  }

  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    return {
      valid: false,
      error: `URL protocol "${parsed.protocol}" is not allowed. Only http and https are permitted.`,
    };
  }

  // Reconstruct from parsed URL to normalize
  return {
    valid: true,
    sanitizedUrl: parsed.href,
  };
}

/**
 * Validate an email address format.
 * Basic validation — does not verify the email actually exists.
 */
export function validateEmail(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;

  // RFC 5322 simplified pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

/**
 * Validate that a numeric value is within expected bounds.
 * Useful for hourly rates, quantities, etc.
 */
export function validateNumericRange(
  value: number,
  min: number,
  max: number
): { valid: boolean; error?: string } {
  if (!Number.isFinite(value)) {
    return { valid: false, error: 'Value must be a finite number' };
  }
  if (value < min) {
    return { valid: false, error: `Value must be at least ${min}` };
  }
  if (value > max) {
    return { valid: false, error: `Value must be at most ${max}` };
  }
  return { valid: true };
}
