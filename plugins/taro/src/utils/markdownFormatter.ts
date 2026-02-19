/**
 * Markdown formatter for Oracle chat output
 * Converts markdown-style text to HTML with proper link handling
 */

export interface FormattedContent {
  html: string;
  hasLinks: boolean;
}

/**
 * Format markdown-style text to HTML
 * Supports:
 * - Bold: **text** or __text__
 * - Italic: *text* or _text_
 * - Code: `text`
 * - Links: [text](url)
 * - Line breaks: \n
 * - Lists: - item or * item
 * - Numbered lists: 1. item
 * - Headings: # Heading
 */
export function formatMarkdown(text: string): FormattedContent {
  if (!text) {
    return { html: '', hasLinks: false };
  }

  let html = text;
  let hasLinks = false;

  // Escape HTML special characters first (but preserve our custom tags)
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Unescape for our patterns we'll add
  html = html
    .replace(/&lt;external-link&gt;/g, '<external-link>')
    .replace(/&lt;\/external-link&gt;/g, '</external-link>')
    .replace(/&lt;br\s*\/?&gt;/g, '<br>');

  // Convert links [text](url) to <a> tags with external link icon
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (match, text, url) => {
      hasLinks = true;
      // Validate URL
      const isValidUrl = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
      if (!isValidUrl) {
        return text; // Return plain text if not a valid URL
      }
      return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="oracle-link"><span>${escapeHtml(text)}</span><external-link></external-link></a>`;
    }
  );

  // Convert bold **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Convert italic *text* or _text_ (but not in **text**)
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Convert inline code `text`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Convert headings # Heading
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  // Convert line breaks
  html = html.replace(/\n/g, '<br>');

  // Convert unordered lists - item or * item
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>)/s, '<ul>$1</ul>');

  // Convert ordered lists 1. item
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Clean up multiple <br> tags
  html = html.replace(/<br><br>/g, '<br>');

  return { html, hasLinks };
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Check if text contains markdown formatting
 */
export function hasMarkdown(text: string): boolean {
  const markdownPatterns = [
    /\*\*.+?\*\*/,  // bold
    /__(.+?)__/,    // bold
    /\*[^*]+\*/,    // italic
    /_[^_]+_/,      // italic
    /`[^`]+`/,      // code
    /\[.+?\]\(.+?\)/, // links
    /^#+\s/m,       // headings
    /^[-*]\s/m,     // unordered lists
    /^\d+\.\s/m,    // ordered lists
  ];

  return markdownPatterns.some(pattern => pattern.test(text));
}
