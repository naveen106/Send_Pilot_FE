/**
 * Shared email helpers for recipient inputs, contact forms, and free-text parsing.
 * Practical format checks (not full RFC 5322): accept real-world addresses,
 * reject common gibberish.
 */

const MAX_EMAIL_LENGTH = 254;
const MAX_LOCAL_LENGTH = 64;
const MAX_LABEL_LENGTH = 63;

/**
 * Returns true when `value` looks like a usable email address.
 *
 * - Exactly one `@`
 * - Local part: letters/digits with `. _ % + -` as separators (no leading/trailing/double dots)
 * - Domain: dot-separated labels; no leading/trailing hyphens
 * - TLD: 2–63 letters only (rejects `a@b.c`, `foo@bar.x`, `not-an-email`)
 */
export function isValidEmail(value: string): boolean {
  const email = value.trim();
  if (!email || email.length > MAX_EMAIL_LENGTH) return false;

  const at = email.lastIndexOf('@');
  // Reject missing/leading/trailing @ and multiple @
  if (at <= 0 || at !== email.indexOf('@') || at === email.length - 1) return false;

  return isValidLocalPart(email.slice(0, at)) && isValidDomain(email.slice(at + 1));
}

function isValidLocalPart(local: string): boolean {
  if (!local || local.length > MAX_LOCAL_LENGTH) return false;
  // Must start/end with alphanumeric; special chars only between segments
  // e.g. user, user.name, user+tag, user_name — not .user, user., u..ser, +++
  return /^[a-zA-Z0-9]+(?:[._%+-][a-zA-Z0-9]+)*$/.test(local);
}

function isValidDomain(domain: string): boolean {
  if (!domain || domain.length > MAX_EMAIL_LENGTH - 2) return false;

  const labels = domain.split('.');
  // Need at least host + TLD (e.g. gmail.com)
  if (labels.length < 2) return false;

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    if (!label || label.length > MAX_LABEL_LENGTH) return false;

    const isTld = i === labels.length - 1;
    if (isTld) {
      // TLD: letters only, min 2 (com, io, museum, …)
      if (!/^[a-zA-Z]{2,63}$/.test(label)) return false;
    } else {
      // Hostname label: alphanumeric, hyphens not at ends
      if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(label)) return false;
    }
  }
  return true;
}

/**
 * Pulls unique valid emails out of free-form text.
 * Handles commas, spaces, semicolons, newlines, and mixed lists like:
 * "test1@gmail.com, test2@gmail.com test3@gmail.com, xyz@gmail.com"
 *
 * Candidates are matched loosely, then filtered with {@link isValidEmail}.
 * Dedupes case-insensitively; returned addresses keep original casing.
 */
export function extractEmails(text: string): string[] {
  if (!text?.trim()) return [];

  // Loose candidate scan — final acceptance is isValidEmail only
  const candidates = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi) ?? [];
  const seen = new Set<string>();
  const emails: string[] = [];

  for (const raw of candidates) {
    const email = raw.trim();
    if (!isValidEmail(email)) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    emails.push(email);
  }

  return emails;
}

/** Case-insensitive check whether `email` is already in `list`. */
export function hasEmail(list: string[], email: string): boolean {
  const key = email.trim().toLowerCase();
  return list.some((item) => item.toLowerCase() === key);
}
