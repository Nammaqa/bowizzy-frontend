// Shared rich-text parsing for resume description fields (work experience,
// projects, roles & responsibilities). The editor lets users bold text —
// this preserves that <b>/<strong> formatting when splitting the HTML into
// bullet lines/paragraphs, instead of stripping it down to plain text.

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&'); // keep last so "&amp;lt;" doesn't double-decode

export const stripTags = (html: string) => decodeHtmlEntities(html.replace(/<[^>]+>/g, '')).trim();

// Invisible/space-like characters a contentEditable field can leave behind:
// NBSP 160 (browsers turn a trailing typed space into this so it doesn't
// collapse), zero-width space 8203, and BOM 65279. Built from numeric char
// codes rather than literal or \u-escaped characters in source, so the
// pattern can't silently get mangled by an editor/encoding round-trip.
const INVISIBLE_SPACE_CHARS = [160, 8203, 65279].map((code) => String.fromCharCode(code)).join('');
const TRAILING_INVISIBLE_SPACE_RE = new RegExp('[\\s' + INVISIBLE_SPACE_CHARS + ']+$', 'g');
const ANY_INVISIBLE_SPACE_RE = new RegExp('[\\s' + INVISIBLE_SPACE_CHARS + ']', 'g');

/**
 * Strips trailing empty paragraphs and trailing whitespace/&nbsp; left over
 * from the rich-text editor — a trailing space typed in a contentEditable
 * field is often preserved as &nbsp; so the browser doesn't collapse it, and
 * Enter presses can leave empty trailing <div><br></div> blocks. Left in,
 * PDF fonts often render that stray codepoint as a visible box/special
 * character at the end of the paragraph instead of invisible trailing
 * space. Operates on the raw HTML (before any per-template parsing) so the
 * fix applies uniformly regardless of how each template splits it up.
 */
export function trimTrailingHtml(html?: string): string {
  if (!html) return '';

  if (typeof document === 'undefined') {
    // Non-browser fallback: best-effort regex trim of trailing empty
    // blocks/whitespace/&nbsp; right before the string's closing tag(s).
    return html
      .replace(/(?:\s|&nbsp;|<br\s*\/?>|<(?:div|p)>(?:\s|&nbsp;|<br\s*\/?>)*<\/(?:div|p)>)+$/gi, '')
      .replace(/(?:&nbsp;|\s)+(<\/[a-zA-Z]+>)\s*$/, '$1');
  }

  const container = document.createElement('div');
  container.innerHTML = html;

  const isEmptyNode = (node: ChildNode): boolean => {
    if (node.nodeType === Node.TEXT_NODE) {
      return !(node.textContent || '').replace(ANY_INVISIBLE_SPACE_RE, '');
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.tagName === 'BR') return true;
      return Array.from(el.childNodes).every(isEmptyNode);
    }
    return true;
  };

  while (container.lastChild && isEmptyNode(container.lastChild)) {
    container.removeChild(container.lastChild);
  }

  let deepestLast: ChildNode | null = container;
  while (deepestLast && deepestLast.lastChild) deepestLast = deepestLast.lastChild;
  if (deepestLast && deepestLast.nodeType === Node.TEXT_NODE) {
    deepestLast.textContent = (deepestLast.textContent || '').replace(TRAILING_INVISIBLE_SPACE_RE, '');
  }

  return container.innerHTML;
}

// Tags that may carry inline formatting are kept; every other tag is dropped.
const INLINE_TAG_PATTERN = 'b|strong|i|em|u|span|font';
export const stripNonInlineTags = (html: string) =>
  html.replace(new RegExp(`<(?!\\/?(?:${INLINE_TAG_PATTERN})\\b)[^>]*>`, 'gi'), '');

const VOID_TAGS = new Set(['br', 'img', 'hr', 'input', 'meta', 'link', 'source']);

// Some editors emit <span style="font-weight:700"> instead of <b>.
const readBoldFlag = (rawTag: string, tag: string) => {
  if (tag === 'b' || tag === 'strong') return true;
  const styleMatch = rawTag.match(/style\s*=\s*"([^"]*)"/i) || rawTag.match(/style\s*=\s*'([^']*)'/i);
  const css = (styleMatch?.[1] || '').toLowerCase();
  return /font-weight\s*:\s*(bold(er)?|[6-9]00)/.test(css);
};

export type InlineSegment = { text: string; bold: boolean };

/** Split a fragment of inline HTML into runs that each carry a bold flag. */
export function parseInlineSegments(html: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  const stack: { tag: string; bold: boolean }[] = [];
  const isBold = () => stack.some((entry) => entry.bold);

  const pushText = (raw: string) => {
    if (!raw) return;
    const text = decodeHtmlEntities(raw);
    if (!text) return;
    segments.push({ text, bold: isBold() });
  };

  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(html)) !== null) {
    pushText(html.slice(lastIndex, match.index));

    const rawTag = match[0];
    const tag = match[1].toLowerCase();
    const isClosing = rawTag.startsWith('</');

    if (isClosing) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === tag) {
          stack.splice(i, 1);
          break;
        }
      }
    } else if (!VOID_TAGS.has(tag) && !/\/>\s*$/.test(rawTag)) {
      stack.push({ tag, bold: readBoldFlag(rawTag, tag) });
    }

    lastIndex = tagRegex.lastIndex;
  }

  pushText(html.slice(lastIndex));
  return segments;
}

export interface RichTextBlock {
  html: string;
  bullet: boolean;
}

/** Break sanitized rich text into bullet items (from <li>) or plain lines, keeping inline tags. */
export function splitIntoRichTextBlocks(sanitized: string): RichTextBlock[] {
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  const items: RichTextBlock[] = [];
  let match: RegExpExecArray | null;

  while ((match = liRegex.exec(sanitized)) !== null) {
    const inner = stripNonInlineTags(match[1] || '').trim();
    if (stripTags(inner)) items.push({ html: inner, bullet: true });
  }

  if (items.length > 0) return items;

  const withBreaks = sanitized
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6])>/gi, '\n');

  const lines = stripNonInlineTags(withBreaks)
    .split('\n')
    .map((line) => line.trim())
    // Strip any bullet character the user already typed by hand (or that an
    // AI-enhanced summary came pre-formatted with), so callers that force a
    // bullet marker on every line don't end up drawing two.
    .map((line) => line.replace(/^[•◦▪●\-*]\s*/, ''));

  // Drop only leading/trailing blank lines (editor artifacts, e.g. the
  // placeholder empty line an untouched field starts with) — a blank line
  // in the middle is a paragraph break the user deliberately typed by
  // pressing Enter twice, and should render as visible spacing.
  let start = 0;
  let end = lines.length - 1;
  while (start <= end && !stripTags(lines[start])) start++;
  while (end >= start && !stripTags(lines[end])) end--;

  return lines
    .slice(start, end + 1)
    // A block with no text would collapse to zero height when rendered —
    // give it a single space so the blank line still takes up a line.
    .map((line) => ({ html: stripTags(line) ? line : '&nbsp;', bullet: false }));
}
