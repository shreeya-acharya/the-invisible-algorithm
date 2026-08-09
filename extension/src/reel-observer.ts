export interface VisibleReel {
  /** A best-effort identifier used to avoid logging the same Reel repeatedly. */
  key: string;
  caption: string;
}

const REEL_CONTAINER_SELECTORS = [
  // A Reel can be either its own page or a dialog opened from the feed.
  'main [role="dialog"] article',
  'main article',
  'main [role="dialog"]',
  // Modern Chrome supports :has(); this keeps the fallback scoped to a Reel.
  'main:has(a[href*="/reel/"])',
  'main',
];

const UI_LABEL_PATTERN = /^(follow|following|like|liked|comment|share|remix|more|view all comments|save|report|reels?|posts?|views?|reply|send)$/i;
const TIMESTAMP_PATTERN = /^(\d+[,.]?\d*[km]?\s+(likes?|views?)|\d+\s*(s|m|h|d|w|mo|y)|\d+\s+(seconds?|minutes?|hours?|days?|weeks?)\s+ago)$/i;
const PUNCTUATION_OR_EMOJI_PATTERN = /[.!?,;:…]|[\p{Extended_Pictographic}]/u;

interface CaptionCandidate {
  text: string;
  accepted: boolean;
  reason: string;
  isSentenceLike: boolean;
}

function normalizedText(element: Element): string {
  return (element.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function isLikelyCaption(text: string): boolean {
  return text.length >= 2 && !UI_LABEL_PATTERN.test(text) && !TIMESTAMP_PATTERN.test(text);
}

function isProfileLink(element: Element): boolean {
  const link = element.closest('a[href]');
  const href = link?.getAttribute('href') ?? '';
  // Profile links are relative, one-segment Instagram paths (for example /itsjayshultz/).
  return /^\/[A-Za-z0-9._]+\/?(?:\?.*)?$/.test(href);
}

function isVisible(element: Element): boolean {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
}

function isAudioTitle(element: Element, text: string): boolean {
  return Boolean(element.closest('a[href*="/music/"], a[href*="/audio/"]')) || /^(original\s+audio|audio\s*[·•-])/i.test(text);
}

function isUsernameLike(text: string): boolean {
  // Probable handles are a single short word made of letters, numbers, or underscores.
  return /^[a-z0-9_]{1,39}$/i.test(text);
}

function isSentenceLike(text: string): boolean {
  return text.length > 15 && (/\s/.test(text) || PUNCTUATION_OR_EMOJI_PATTERN.test(text));
}

function inspectCandidate(element: Element, text: string): CaptionCandidate {

  if (!isLikelyCaption(text)) {
    return { text, accepted: false, reason: 'empty, UI control, or timestamp', isSentenceLike: false };
  }
  if (isProfileLink(element)) {
    return { text, accepted: false, reason: 'inside a creator profile link', isSentenceLike: false };
  }
  if (element.closest('button, [role="button"]')) {
    return { text, accepted: false, reason: 'inside a button', isSentenceLike: false };
  }
  if (isAudioTitle(element, text)) {
    return { text, accepted: false, reason: 'audio title', isSentenceLike: false };
  }
  if (isUsernameLike(text)) {
    return { text, accepted: false, reason: 'username-like text', isSentenceLike: false };
  }

  return {
    text,
    accepted: true,
    reason: 'meaningful visible text',
    isSentenceLike: isSentenceLike(text),
  };
}

function visibleTextCandidates(container: Element): Array<{ element: Element; text: string }> {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const candidates: Array<{ element: Element; text: string }> = [];
  let node: Node | null;

  while ((node = walker.nextNode())) {
    const element = node.parentElement;
    const text = (node.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (element && text && isVisible(element)) candidates.push({ element, text });
  }

  return candidates;
}

/**
 * Finds the currently displayed Reel and extracts a best-effort visible caption.
 * Selectors are intentionally layered because Instagram frequently changes markup.
 */
export function findVisibleReel(document: Document): VisibleReel | null {
  console.log('[Invisible Algorithm] findVisibleReel() started.');
  const container = REEL_CONTAINER_SELECTORS
    .map((selector) => document.querySelector(selector))
    .find((element): element is Element => Boolean(element));

  if (!container) {
    console.log('[Invisible Algorithm] No Reel container found.', REEL_CONTAINER_SELECTORS);
    return null;
  }

  console.log('[Invisible Algorithm] Reel container found:', container);

  // Do not depend on Instagram class names: inspect every visible text node in the Reel.
  const candidateElements = visibleTextCandidates(container);

  if (candidateElements.length === 0) {
    console.log('[Invisible Algorithm] No visible span elements found in the Reel.');
    return null;
  }

  const candidates = candidateElements.map(({ element, text }) => inspectCandidate(element, text));
  const uniqueCandidates = candidates.filter(
    (candidate, index, all) =>
      all.findIndex((other) => other.text.toLocaleLowerCase() === candidate.text.toLocaleLowerCase()) === index
  );
  candidates.forEach((candidate, index) => {
    console.log(`Candidate ${index + 1}:\n${candidate.text}`);
  });

  const acceptedCandidates = uniqueCandidates.filter((candidate) => candidate.accepted);
  // Prefer text that reads like a sentence. If several do, the longest is most likely the Reel description.
  const sentenceLikeCandidates = acceptedCandidates.filter((candidate) => candidate.isSentenceLike);
  const selectionPool = sentenceLikeCandidates.length > 0 ? sentenceLikeCandidates : acceptedCandidates;
  console.log(
    `Filtered candidates:\n${selectionPool.map((candidate) => candidate.text).join('\n\n') || '(none)'}`
  );
  const selected = selectionPool.reduce<CaptionCandidate | null>(
    (longest, candidate) => (!longest || candidate.text.length > longest.text.length ? candidate : longest),
    null
  );

  if (!selected) {
    console.log('[Invisible Algorithm] No caption extracted after filtering visible span candidates.');
    return null;
  }

  console.log(
    '[Invisible Algorithm] Caption selected:',
    selected.text,
    `Reason: longest ${selected.isSentenceLike ? 'sentence-like ' : ''}meaningful candidate (${selected.text.length} characters); ${selected.reason}.`
  );

  const permalink = container.querySelector<HTMLAnchorElement>('a[href*="/reel/"]')?.href;
  // Captions can be repeated in nested DOM nodes, so add the route to make this stable per Reel.
  const key = `${location.pathname}|${permalink ?? ''}|${selected.text}`;
  return { key, caption: selected.text };
}
