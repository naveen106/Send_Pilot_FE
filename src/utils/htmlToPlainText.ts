/** True when the string contains real HTML markup (not just plain text). */
export function hasHtmlMarkup(source: string): boolean {
  return /<\/?[a-z][^>]*>/i.test(source);
}

/**
 * Picks the authoring body stored in form state:
 * - HTML from the Code tab wins when it contains markup
 * - otherwise the plain Text-tab content is used
 */
export function resolveEmailBody(htmlDraft: string, textDraft: string): string {
  if (htmlDraft.trim() && hasHtmlMarkup(htmlDraft)) return htmlDraft;
  return textDraft;
}

/**
 * Converts a plain-text body into minimal HTML so line breaks survive email clients
 * (the transport always sends an HTML part). HTML input is returned unchanged.
 */
export function normalizeEmailHtml(body: string): string {
  if (!body.trim()) return body;
  if (hasHtmlMarkup(body)) return body;
  return `<div style="font-family: sans-serif; white-space: pre-wrap; color: #1e293b;">${escapeHtml(body)}</div>`;
}

/** Escapes text so it can be safely injected into an HTML preview document. */
export function escapeHtml(source: string): string {
  return source.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[character] ?? character));
}

/**
 * Builds an iframe `srcDoc` that matches what recipients will see.
 * HTML bodies render as-is; plain text is shown with preserved line breaks.
 */
export function buildEmailPreviewDocument(body: string): string {
  if (!body.trim()) {
    return '<p style="font-family: sans-serif; color: #64748b; padding: 16px;">Your email preview will appear here.</p>';
  }

  if (hasHtmlMarkup(body)) return body;

  return `<div style="font-family: sans-serif; white-space: pre-wrap; padding: 16px; color: #1e293b;">${escapeHtml(body)}</div>`;
}

/**
 * Converts HTML into readable plain text for the Text tab.
 * Strips non-content nodes and preserves basic block separation.
 */
export function htmlToPlainText(source: string): string {
  if (!source) return '';
  if (!hasHtmlMarkup(source)) return source;
  if (typeof DOMParser === 'undefined') {
    return source.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const document = new DOMParser().parseFromString(source, 'text/html');
  document.querySelectorAll('script, style, noscript, template').forEach((element) => element.remove());

  // Turn common block boundaries into newlines before reading textContent,
  // otherwise adjacent blocks glue together (e.g. "HelloWorld").
  document.querySelectorAll('br').forEach((element) => {
    element.replaceWith(document.createTextNode('\n'));
  });
  document.querySelectorAll('p, div, tr, li, h1, h2, h3, h4, h5, h6, header, footer, section, article, blockquote').forEach((element) => {
    element.insertBefore(document.createTextNode('\n'), element.firstChild);
    element.appendChild(document.createTextNode('\n'));
  });

  return (document.body?.textContent ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Seeds the Text-tab draft from a parent/prefill value. */
export function deriveTextDraft(value: string): string {
  if (!value) return '';
  return hasHtmlMarkup(value) ? htmlToPlainText(value) : value;
}

/** Seeds the Code-tab draft from a parent/prefill value. */
export function deriveHtmlDraft(value: string): string {
  if (!value) return '';
  return hasHtmlMarkup(value) ? value : '';
}
