/** Converts campaign HTML into safe, readable plain text for compact previews. */
export function htmlToTextPreview(html: string, maxLength = 110): string {
  if (!html) return '';

  // Parse the email as a document so entities and visible text are decoded
  // correctly; never render the original HTML inside the search result.
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  // CSS and executable/document-only nodes should not become preview text.
  parsed.querySelectorAll('script, style, noscript').forEach((element) => element.remove());
  const text = (parsed.body.textContent ?? '').replace(/\s+/g, ' ').trim();

  // Keep each result compact and make truncation obvious to the user.
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}...` : text;
}
