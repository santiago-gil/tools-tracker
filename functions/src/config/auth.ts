/**
 * Authentication configuration
 * Centralizes auth settings and allows environment-based overrides
 */

// Default allowed email domains
// Note: The "@" prefix is intentional; domains are matched via userEmail.endsWith(domain),
// so @-prefixed strings allow exact domain suffix matching (e.g., "user@searchkings.ca".endsWith("@searchkings.ca"))
export const DEFAULT_ALLOWED_EMAIL_DOMAINS = ["@searchkings.ca"];

/**
 * Parse allowed email domains from environment variable
 * @returns Array of normalized domain strings (e.g., ["@searchkings.ca"])
 */
function parseAllowedEmailDomains(): string[] {
  const envValue = process.env.ALLOWED_EMAIL_DOMAINS?.trim();

  // Default fallback
  if (!envValue) {
    return DEFAULT_ALLOWED_EMAIL_DOMAINS;
  }

  // Split by comma, trim whitespace, and ensure each entry starts with "@"
  return envValue
    .split(",")
    .map((domain) => domain.trim())
    .filter((domain) => domain.length > 0) // Remove empty strings
    .map((domain) => domain.startsWith("@") ? domain : `@${domain}`);
}

// Runtime allowed email domains with environment override
export const ALLOWED_EMAIL_DOMAINS = parseAllowedEmailDomains();

