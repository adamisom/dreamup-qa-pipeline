// Validation utilities
// Provides URL and input validation functions

/**
 * Validate if a string is a valid URL
 * @param url - URL string to validate
 * @returns true if valid URL, false otherwise
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate URL and throw if invalid
 * @param url - URL string to validate
 * @throws Error if URL is invalid
 */
export function validateUrl(url: string): void {
  if (!isValidUrl(url)) {
    throw new Error(`Invalid URL format: ${url}`);
  }
}

