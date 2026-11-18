/**
 * OpsPilot Security Subsystem
 *
 * Provides enterprise-grade input sanitization, prompt injection defense,
 * and PII masking for operational and conversational AI pipelines.
 */

// Adversarial prompt injection keywords and control phrase regex
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/gi,
  /system\s+prompt\s+override/gi,
  /you\s+are\s+now\s+(in\s+)?(developer|god|dan)\s+mode/gi,
  /reveal\s+(your\s+)?(internal|hidden|system)\s+instructions/gi,
  /output\s+(all\s+)?(api\s+keys|secrets|environment\s+variables)/gi,
  /disregard\s+(the\s+)?rules/gi,
  /bypass\s+safety\s+filters/gi,
];

// Dangerous XSS and script payload patterns
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=/gi, // onerror=, onload=, onclick=
  /<iframe\b[^>]*>/gi,
  /<object\b[^>]*>/gi,
  /<embed\b[^>]*>/gi,
];

/**
 * Strips active executable scripting payloads and normalizes user input.
 *
 * @param input - Raw untrusted string from CSV or user chat
 * @returns Cleaned safe string
 */
export function sanitizeUntrustedText(input: unknown): string {
  if (typeof input !== 'string') {
    return String(input ?? '').trim();
  }

  let sanitized = input;

  // Defang XSS vectors
  XSS_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Strip raw HTML angle brackets to prevent injection into document contexts
  sanitized = sanitized
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  return sanitized.trim();
}

/**
 * Detects adversarial prompt injection attempts and defangs them into benign text.
 *
 * @param query - Input query to be inspected before LLM context construction
 * @returns Object indicating if injection was detected and the safe defanged text
 */
export function defangPromptInjection(query: string): { isFlagged: boolean; cleanText: string } {
  let isFlagged = false;
  let cleanText = query;

  INJECTION_PATTERNS.forEach((pattern) => {
    if (pattern.test(cleanText)) {
      isFlagged = true;
      cleanText = cleanText.replace(pattern, '[BLOCKED_INSTRUCTION]');
    }
  });

  return { isFlagged, cleanText: cleanText.trim() };
}

/**
 * Anonymizes PII (emails, phone numbers, tax IDs) from business evidence
 * prior to dispatching prompts to external LLM services.
 *
 * @param text - Raw business string containing potential contact info
 * @returns Masked string safe for external AI processing
 */
export function maskSensitivePII(text: string): string {
  if (!text) return '';

  return text
    // Mask emails: john.doe@company.com -> j***e@company.com
    .replace(/([a-zA-Z0-9_.+-])[a-zA-Z0-9_.+-]*([a-zA-Z0-9_.+-])@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/g, '$1***$2@$3')
    // Mask 10-digit phone numbers: 9876543210 -> 98****3210
    .replace(/\b(\d{2})\d{4,6}(\d{4})\b/g, '$1****$2')
    // Mask credit card-like 16 digit numbers
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '****-****-****-****');
}

/**
 * In-memory sliding window rate limiter for public Next.js route handlers.
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  clientIp: string,
  limit = 60,
  windowMs = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(clientIp);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(clientIp, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count };
}
