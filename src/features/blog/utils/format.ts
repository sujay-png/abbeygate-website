/**
 * Utility functions for formatting and cleaning WordPress blog content.
 */

export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&#8217;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#038;|&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&hellip;/g, "…")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
}

export function stripHtml(html: string): string {
  if (!html) return '';
  const noTags = html.replace(/<[^>]*>/g, ' ');
  return decodeHtmlEntities(noTags).replace(/\s+/g, ' ').trim();
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Splits top-level Elementor containers (<div ... e-parent> or <section ...>)
 * using a tag-depth counter to handle arbitrary nesting cleanly without external libraries.
 */
function splitTopLevelElementorContainers(html: string): string[] | null {
  const elemMatch = html.match(/<div[^>]*class="[^"]*elementor\b[^"]*"[^>]*>/i);
  if (!elemMatch || elemMatch.index === undefined) return null;

  const startIdx = elemMatch.index + elemMatch[0].length;
  const containers: string[] = [];
  let i = startIdx;

  while (i < html.length) {
    const tagMatch = html.slice(i).match(/<(div|section)\b[^>]*>/i);
    if (!tagMatch || tagMatch.index === undefined) break;

    const tagStart = i + tagMatch.index;
    const tagName = tagMatch[1].toLowerCase();
    const tagFull = tagMatch[0];

    let depth = 1;
    let cursor = tagStart + tagFull.length;

    while (cursor < html.length && depth > 0) {
      const nextOpen = html.indexOf(`<${tagName}`, cursor);
      const nextClose = html.indexOf(`</${tagName}>`, cursor);

      if (nextClose === -1) break;

      if (nextOpen !== -1 && nextOpen < nextClose) {
        const charAfter = html.charAt(nextOpen + tagName.length + 1);
        if (charAfter === ' ' || charAfter === '>' || charAfter === '/' || charAfter === '\n' || charAfter === '\t') {
          depth++;
          cursor = nextOpen + tagName.length + 1;
        } else {
          cursor = nextOpen + 1;
        }
      } else {
        depth--;
        cursor = nextClose + tagName.length + 3;
      }
    }

    const containerHtml = html.slice(tagStart, cursor);
    containers.push(containerHtml);
    i = cursor;

    const remaining = html.slice(i).trim();
    if (remaining === '</div>' || remaining === '') break;
  }

  return containers;
}

/**
 * Determines whether an Elementor container is part of the actual article content
 * or an unstyled theme-template component (breadcrumbs, duplicate header, related posts, CTA).
 */
function shouldKeepContainer(containerHtml: string, index: number): boolean {
  // 1. Drop breadcrumb icon list (which has unstyled giant SVG arrows)
  if (
    containerHtml.includes('icon-list.default') ||
    containerHtml.includes('elementor-widget-icon-list')
  ) {
    return false;
  }

  // 2. Drop duplicate related posts widget (Next.js already renders <LatestBlogPosts />)
  if (
    containerHtml.includes('posts.classic') ||
    containerHtml.includes('elementor-widget-posts')
  ) {
    return false;
  }

  // 3. Drop duplicate CTA banner / Latest From Our Blog widgets (Next.js renders <CustomisationCTA />)
  if (
    containerHtml.includes('Tailored to Perfection') ||
    containerHtml.includes('Latest From Our Blog')
  ) {
    return false;
  }

  // 4. Drop social share widgets (Next.js renders <SocialShare /> in header and footer)
  if (
    containerHtml.includes('elementor-widget-share-buttons') ||
    containerHtml.includes('elementor-widget-social-icons')
  ) {
    return false;
  }

  // 5. Drop empty divider widgets
  if (
    containerHtml.includes('elementor-widget-divider') &&
    containerHtml.replace(/<[^>]+>/g, '').trim() === ''
  ) {
    return false;
  }

  // 6. Drop duplicate post title & excerpt container at the top of the post (index <= 1)
  if (
    index <= 1 &&
    (containerHtml.includes('heading.default') || containerHtml.includes('elementor-widget-heading'))
  ) {
    const pMatches = containerHtml.match(/<p\b[^>]*>/gi) || [];
    // If it only has 0 or 1 paragraph (the duplicate excerpt), it's not the article body
    if (pMatches.length <= 1) {
      return false;
    }
  }

  return true;
}

/**
 * Sanitizes blog post HTML from WordPress.
 * For Elementor-authored posts, strips out baked-in theme template widgets (breadcrumbs with raw SVGs,
 * duplicate headings, social share icons, related posts grids, and CTA banners) while preserving
 * the full article text, headings, blockquotes, and media.
 */
export function cleanBlogPostContent(html: string): string {
  if (!html || typeof html !== 'string') return '';

  // Non-Elementor posts (Gutenberg/classic) are already clean prose
  if (!html.includes('elementor')) {
    return html;
  }

  const containers = splitTopLevelElementorContainers(html);
  let cleaned = html;

  if (containers && containers.length > 0) {
    const kept = containers.filter((c, idx) => shouldKeepContainer(c, idx));
    if (kept.length > 0) {
      cleaned = kept.join('\n');
    }
  }

  // Defensive passes:
  // Strip any raw unstyled Elementor font-icon SVGs that lack dimensions
  cleaned = cleaned.replace(/<svg\b[^>]*class="[^"]*e-font-icon-svg[^"]*"[^>]*>[\s\S]*?<\/svg>/gi, '');

  // Strip any leftover unstyled breadcrumb list containers
  cleaned = cleaned.replace(/<ul\b[^>]*class="[^"]*elementor-icon-list-items[^"]*"[^>]*>[\s\S]*?<\/ul>/gi, '');

  return cleaned.trim();
}
