console.log('[Invisible Algorithm] Content script loaded.');

type ReelData = {
  username: string | null;
  caption: string | null;
  hashtags: string[];
  reelUrl: string;
};

let lastPageUrl = location.href;
let lastReelIdentity = '';
let scanTimer: number | undefined;
let initialScanPending = true;

function cleanText(element: Element): string {
  return (element instanceof HTMLElement ? element.innerText : element.textContent || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function visibleArea(element: Element): number {
  const rect = element.getBoundingClientRect();
  const width = Math.max(0, Math.min(rect.right, innerWidth) - Math.max(rect.left, 0));
  const height = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
  const style = getComputedStyle(element);

  if (style.display === 'none' || style.visibility !== 'visible' || Number(style.opacity) === 0) return 0;
  return width * height;
}

/** Select the largest viewport-visible media container; never assume the first node is active. */
function getCurrentReel(): HTMLElement | null {
  const main = document.querySelector('main');
  if (!main) return null;

  const candidates = Array.from(main.querySelectorAll<HTMLElement>('div'))
    .map((element) => ({ element, area: visibleArea(element) }))
    .filter(({ element, area }) =>
      area > 0 &&
      Boolean(element.querySelector('video, img')) &&
      Boolean(cleanText(element))
    )
    .sort((a, b) => b.area - a.area);

  return candidates[0]?.element || null;
}

function getReelUrl(reel: HTMLElement): string {
  if (/^\/reel\//.test(location.pathname)) return location.href;

  const reelLink = Array.from(reel.querySelectorAll<HTMLAnchorElement>('a[href]'))
    .find((link) => /^\/reels?\//.test(new URL(link.href, location.origin).pathname));
  return reelLink ? reelLink.href : location.href;
}

type UsernameCandidate = {
  username: string;
  href: string;
  ariaLabel: string;
};

type CaptionCandidate = {
  text: string;
  parent: string;
};

function getUsernameCandidates(reel: HTMLElement): UsernameCandidate[] {
  const seen = new Set<string>();

  return Array.from(reel.querySelectorAll<HTMLAnchorElement>('a[href]'))
    .filter((link) => {
      const label = link.getAttribute('aria-label') || '';
      const path = new URL(link.href, location.origin).pathname;
      return label.endsWith(' reels') || /^\/[^/]+\/reels\/?$/.test(path);
    })
    .map((link) => {
      const label = link.getAttribute('aria-label') || '';
      return {
        username: cleanText(link) || label.replace(/ reels$/i, ''),
        href: link.href,
        ariaLabel: label
      };
    })
    .filter((candidate) => candidate.username && !seen.has(candidate.href) && Boolean(seen.add(candidate.href)));
}

function getUsername(_reel: HTMLElement, candidates: UsernameCandidate[]): string | null {
  return candidates[0]?.username || null;
}

function audioTexts(reel: HTMLElement): Set<string> {
  return new Set(
    Array.from(reel.querySelectorAll<HTMLAnchorElement>('a[href]'))
      .filter((link) => /\/(?:audio|music)\//.test(new URL(link.href, location.origin).pathname))
      .map(cleanText)
      .filter(Boolean)
  );
}

function isVisibleTextParent(element: HTMLElement, reel: HTMLElement): boolean {
  for (let current: HTMLElement | null = element; current; current = current.parentElement) {
    const style = getComputedStyle(current);
    if (style.display === 'none' || style.visibility !== 'visible' || Number(style.opacity) === 0) return false;
    if (current === reel) break;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function isUiOrMetadataText(element: HTMLElement, text: string, audio: Set<string>): boolean {
  if (element.closest('a') || element.closest('time')) return true;
  if (audio.has(text)) return true;

  const normalized = text.toLowerCase();
  if (/^(?:follow|following|like|likes|comment|comments|repost|share|save|more|see more)$/.test(normalized)) return true;
  if (/^(?:…|\.\.\.)$/.test(normalized)) return true;
  if (/^\d[\d,.]*\s*(?:like|likes|comment|comments|view|views)$/.test(normalized)) return true;
  if (/^\d[\d,.]*(?:[km])?$/i.test(normalized)) return true;
  if (/^\d+\s*(?:s|m|h|d|w|mo|y)(?:\s+ago)?$/.test(normalized)) return true;
  if (/\boriginal audio\b/i.test(text)) return true;

  const control = element.closest<HTMLElement>('button, [role="button"]');
  const controlLabel = control?.getAttribute('aria-label') || '';
  return /^(?:like|comment|repost|share|save|more)$/i.test(controlLabel);
}

/** Inspect text nodes only inside the selected Reel for concise, scoped diagnostics. */
function getCaptionCandidates(reel: HTMLElement): CaptionCandidate[] {
  const audio = audioTexts(reel);
  const candidates = new Map<string, CaptionCandidate>();
  const walker = document.createTreeWalker(reel, NodeFilter.SHOW_TEXT);

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    const text = node.textContent?.replace(/\s+/g, ' ').trim() || '';
    if (!parent || !text || !isVisibleTextParent(parent, reel) || isUiOrMetadataText(parent, text, audio)) continue;

    candidates.set(text, {
      text,
      parent: `${parent.tagName.toLowerCase()}${parent.getAttribute('role') ? `[role="${parent.getAttribute('role')}"]` : ''}`
    });
  }

  return [...candidates.values()];
}

type ProvenCaption = {
  preview: string;
  boundary: HTMLElement;
};

function creatorElementFor(reel: HTMLElement, username: string): HTMLAnchorElement | null {
  return Array.from(reel.querySelectorAll<HTMLAnchorElement>('a[href]'))
    .find((link) => cleanText(link) === username) || null;
}

function findProvenCaption(reel: HTMLElement, username: string | null, candidates: CaptionCandidate[]): ProvenCaption | null {
  if (!username) return null;

  const creator = creatorElementFor(reel, username);
  if (!creator) return null;

  const proven = candidates.flatMap((candidate) => {
    const captionElement = findTextElement(reel, candidate.text);
    const boundary = captionElement ? nearestCreatorCaptionAncestor(creator, candidate.text, reel) : null;
    if (!boundary) return [];

    const containsOtherCreator = getUsernameCandidates(boundary)
      .some((other) => other.username !== username);
    return containsOtherCreator ? [] : [{ preview: candidate.text, boundary }];
  });

  return proven.length === 1 ? proven[0] : null;
}

function fullCaptionText(boundary: HTMLElement, preview: string): string | null {
  const audio = audioTexts(boundary);
  const matches = new Set<string>();
  const walker = document.createTreeWalker(boundary, NodeFilter.SHOW_TEXT);

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    const text = node.textContent?.replace(/\s+/g, ' ').trim() || '';
    if (!parent || !text || isUiOrMetadataText(parent, text, audio)) continue;
    if (text.includes(preview) && text.length > preview.length) matches.add(text);
  }

  return matches.size === 1 ? [...matches][0] : null;
}

function captionExpander(boundary: HTMLElement): HTMLElement | null {
  return Array.from(boundary.querySelectorAll<HTMLElement>('button, a, [role="button"]'))
    .find((element) => /^(?:\.\.\.|…)?\s*more$|^see more$/i.test(cleanText(element))) || null;
}

function getCaption(reel: HTMLElement, username: string | null, candidates: CaptionCandidate[]): string | null {
  const proven = findProvenCaption(reel, username, candidates);
  if (!proven) return null;

  const fullText = fullCaptionText(proven.boundary, proven.preview);
  if (fullText) return fullText;

  const expander = captionExpander(proven.boundary);
  if (expander) {
    console.info('[Invisible Algorithm] Caption boundary contains only the preview; full text requires this expander:', expander);
  }
  return proven.preview;
}

function findTextElement(reel: HTMLElement, targetText: string): HTMLElement | null {
  const walker = document.createTreeWalker(reel, NodeFilter.SHOW_TEXT);

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent?.replace(/\s+/g, ' ').trim();
    if (text === targetText && node.parentElement) return node.parentElement;
  }
  return null;
}

function elementDescription(element: HTMLElement | null): Record<string, string> | null {
  if (!element) return null;
  return {
    tagName: element.tagName,
    className: element.getAttribute('class') || '(none)',
    role: element.getAttribute('role') || '(none)',
    text: cleanText(element).slice(0, 160)
  };
}

function parentChain(element: HTMLElement, reel: HTMLElement): Record<string, string>[] {
  const chain: Record<string, string>[] = [];

  for (let current: HTMLElement | null = element; current && chain.length < 8; current = current.parentElement) {
    const description = elementDescription(current);
    if (description) chain.push(description);
    if (current === reel) break;
  }
  return chain;
}

function nearestCreatorCaptionAncestor(
  creator: HTMLElement,
  captionText: string,
  reel: HTMLElement
): HTMLElement | null {
  for (let current: HTMLElement | null = creator; current; current = current.parentElement) {
    if (current.textContent?.replace(/\s+/g, ' ').includes(captionText)) return current;
    if (current === reel) break;
  }
  return null;
}

function textSnapshot(element: HTMLElement): Record<string, string> {
  return {
    tagName: element.tagName,
    role: element.getAttribute('role') || '(none)',
    textContent: element.textContent || '',
    innerText: element.innerText || ''
  };
}

function visibilitySnapshot(element: HTMLElement): Record<string, string | boolean> {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return {
    hiddenAttribute: element.hidden,
    ariaHidden: element.getAttribute('aria-hidden') || '(none)',
    display: style.display,
    visibility: style.visibility,
    opacity: style.opacity,
    hasLayout: rect.width > 0 && rect.height > 0
  };
}

function commonAncestor(first: HTMLElement, second: HTMLElement, boundary: HTMLElement): HTMLElement | null {
  const ancestors = new Set<HTMLElement>();
  for (let current: HTMLElement | null = first; current; current = current.parentElement) {
    ancestors.add(current);
    if (current === boundary) break;
  }
  for (let current: HTMLElement | null = second; current; current = current.parentElement) {
    if (ancestors.has(current)) return current;
    if (current === boundary) break;
  }
  return null;
}

function inspectCreatorCaptionBoundary(boundary: HTMLElement, captionText: string): void {
  const descendants = Array.from(boundary.querySelectorAll<HTMLElement>('*'));
  const captionElements = descendants.filter((element) => element.textContent?.replace(/\s+/g, ' ').includes(captionText));
  const hiddenTextElements = descendants.filter((element) => {
    const text = element.textContent?.replace(/\s+/g, ' ').trim() || '';
    const visibility = visibilitySnapshot(element);
    return text && (visibility.hiddenAttribute || visibility.ariaHidden === 'true' || visibility.display === 'none' ||
      visibility.visibility !== 'visible' || !visibility.hasLayout);
  });
  const possibleExpandedText = hiddenTextElements.filter((element) =>
    (element.textContent?.replace(/\s+/g, ' ').trim().length || 0) > captionText.length
  );
  const controls = Array.from(boundary.querySelectorAll<HTMLElement>('button, a, [role="button"]'))
    .map((element) => ({
      tagName: element.tagName,
      role: element.getAttribute('role') || '(none)',
      ariaLabel: element.getAttribute('aria-label') || '(none)',
      href: element.getAttribute('href') || '(none)',
      text: cleanText(element),
      isMoreLike: /^(?:\.\.\.|…)?\s*more$|^see more$/i.test(cleanText(element)),
      parent: elementDescription(element.parentElement)
    }));

  console.groupCollapsed('[Invisible Algorithm] Proven creator-caption boundary inspection');
  console.log('Direct children:', Array.from(boundary.children).map((child) => ({
    ...elementDescription(child as HTMLElement),
    textContent: child.textContent || '',
    innerText: child instanceof HTMLElement ? child.innerText : ''
  })));
  console.log('Descendants containing Summer in Japan. 🇯🇵:', captionElements.map((element) => ({
    ...textSnapshot(element),
    visibility: visibilitySnapshot(element),
    parent: elementDescription(element.parentElement),
    ancestorChain: parentChain(element, boundary)
  })));
  console.log('Hidden/collapsed text descendants:', hiddenTextElements.map((element) => ({
    ...textSnapshot(element),
    visibility: visibilitySnapshot(element),
    parent: elementDescription(element.parentElement)
  })));
  console.log('Long hidden/collapsed text is present:', possibleExpandedText.length > 0);
  console.log('Potential long expanded-caption elements:', possibleExpandedText.map((element) => ({
    ...textSnapshot(element),
    parent: elementDescription(element.parentElement),
    nearestCaptionAncestor: captionElements[0] ? elementDescription(commonAncestor(captionElements[0], element, boundary)) : null
  })));
  console.log('Caption expansion buttons/links:', controls);
  console.groupEnd();
}

function debugCreatorCaptionBoundary(reel: HTMLElement): void {
  const creatorText = 'fourleaf.428';
  const captionText = 'Summer in Japan. 🇯🇵';
  const otherCreatorText = 'nomads.onchain';
  const otherCaptionText = 'This game had one rule... and somehow I qualified. 🤣';
  const creator = Array.from(reel.querySelectorAll<HTMLAnchorElement>('a[href]'))
    .find((link) => cleanText(link) === creatorText) || null;
  const captionElement = findTextElement(reel, captionText);

  console.groupCollapsed('[Invisible Algorithm] Creator-caption boundary diagnostic');
  console.log('Creator element for fourleaf.428:', creator);
  console.log('Creator parent chain:', creator ? parentChain(creator, reel) : '(creator not found)');
  console.log('Caption element for Summer in Japan. 🇯🇵:', captionElement);

  const boundary = creator ? nearestCreatorCaptionAncestor(creator, captionText, reel) : null;
  const containsOtherCreator = Boolean(boundary?.textContent?.includes(otherCreatorText));
  const containsOtherCaption = Boolean(boundary?.textContent?.includes(otherCaptionText));

  console.log('Nearest creator ancestor containing Summer in Japan. 🇯🇵:', boundary, elementDescription(boundary));
  console.log('Contains nomads.onchain:', containsOtherCreator);
  console.log('Contains This game had one rule... and somehow I qualified. 🤣:', containsOtherCaption);

  if (!boundary) {
    console.warn('[Invisible Algorithm] Structural limitation: no ancestor of fourleaf.428 contains the target caption.');
  } else if (containsOtherCreator || containsOtherCaption) {
    console.warn('[Invisible Algorithm] Structural limitation: the nearest shared ancestor still contains competing Reel content.');
  } else {
    console.log('[Invisible Algorithm] Reliable creator-caption boundary found for this DOM instance.');
    inspectCreatorCaptionBoundary(boundary, captionText);
  }
  console.groupEnd();
}

function mediaDiagnosticDescription(element: HTMLElement): Record<string, string> {
  return {
    tagName: element.tagName,
    role: element.getAttribute('role') || '(none)',
    ariaLabel: element.getAttribute('aria-label') || '(none)',
    href: element.getAttribute('href') || '(none)',
    className: element.getAttribute('class') || '(none)',
    textPreview: cleanText(element).slice(0, 160)
  };
}

function diagnosticAncestorChain(element: HTMLElement, limit = 8): Record<string, string>[] {
  const chain: Record<string, string>[] = [];
  for (let current: HTMLElement | null = element; current && chain.length < limit; current = current.parentElement) {
    chain.push(mediaDiagnosticDescription(current));
    if (current === document.body) break;
  }
  return chain;
}

function logSelectedMediaDiagnostic(reel: HTMLElement): void {
  const media = [
    ...Array.from(reel.getElementsByTagName('video')),
    ...Array.from(reel.getElementsByTagName('audio'))
  ];
  const rect = reel.getBoundingClientRect();
  const usernameCandidates = getUsernameCandidates(reel);
  const captionCandidates = getCaptionCandidates(reel);

  console.groupCollapsed('[Invisible Algorithm] Selected Reel media/container diagnostic');
  console.log('Selected container bounds:', {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height
  });
  console.log('Selected container ancestry:', diagnosticAncestorChain(reel));
  console.log('Selected media:', media.map((element) => ({
    tagName: element.tagName,
    currentSrc: element.currentSrc || element.src || '(none)',
    ancestry: diagnosticAncestorChain(element)
  })));
  console.log('Selected-container region signals:', {
    creatorProfileCandidates: usernameCandidates.length,
    existingCaptionCandidates: captionCandidates.length,
    indication: usernameCandidates.length
      ? 'creator/profile signal present in the selected container'
      : 'no creator/profile signal in the selected container; it may be a media or engagement wrapper'
  });
  console.groupEnd();
}

function extractHashtags(caption: string | null): string[] {
  if (!caption) return [];

  const hashtags = new Set<string>();
  for (const match of caption.matchAll(/(^|\s)#([\p{L}\p{N}_]+)/gu)) {
    hashtags.add(`#${match[2]}`);
  }
  return [...hashtags];
}

function scanCurrentReel(): void {
  console.log('[Invisible Algorithm] SCAN CURRENT REEL ENTERED');
  const reel = getCurrentReel();
  console.log('[Invisible Algorithm] GET CURRENT REEL RETURNED:', reel);
  if (!reel) {
    console.log('[Invisible Algorithm] GET CURRENT REEL RETURNED NULL');
    return;
  }

  const reelUrl = getReelUrl(reel);
  const mediaUrl = reel.querySelector<HTMLVideoElement>('video')?.currentSrc || '';
  const identity = `${reelUrl}|${mediaUrl}`;
  console.log('[Invisible Algorithm] IDENTITY CHECK:', { identity, lastReelIdentity });
  if (identity === lastReelIdentity) return;
  lastReelIdentity = identity;

  console.log('[Invisible Algorithm] BEFORE MEDIA/CONTAINER DIAGNOSTIC');
  logSelectedMediaDiagnostic(reel);

  const usernameCandidates = getUsernameCandidates(reel);
  const captionCandidates = getCaptionCandidates(reel);
  const username = getUsername(reel, usernameCandidates);
  const caption = getCaption(reel, username, captionCandidates);
  const data: ReelData = {
    reelUrl,
    username,
    caption,
    hashtags: extractHashtags(caption)
  };

  console.log('[Invisible Algorithm] Selected Reel URL:', reelUrl);
  console.log('[Invisible Algorithm] Selected Reel container:', reel);
  console.log('[Invisible Algorithm] Username candidates:', usernameCandidates);
  console.log('[Invisible Algorithm] Caption candidates:', captionCandidates);
  console.log('[Invisible Algorithm] Final username:', data.username);
  console.log('[Invisible Algorithm] Final caption:', data.caption);
  debugCreatorCaptionBoundary(reel);

  console.log(
    '==================================\n' +
      'Invisible Algorithm\n\n' +
      `Reel URL:\n${data.reelUrl}\n\n` +
      `Username:\n${data.username || 'not found'}\n\n` +
      `Caption:\n${data.caption || 'not found'}\n\n` +
      `Hashtags:\n${data.hashtags.length ? data.hashtags.join(', ') : '(none)'}\n` +
      '=================================='
  );
}

function scheduleScan(): void {
  console.log('[Invisible Algorithm] SCHEDULE SCAN CALLED');
  if (scanTimer !== undefined) window.clearTimeout(scanTimer);
  scanTimer = window.setTimeout(() => {
    console.log(initialScanPending
      ? '[Invisible Algorithm] INITIAL SCAN CALLBACK FIRED'
      : '[Invisible Algorithm] SCHEDULED SCAN CALLBACK FIRED');
    initialScanPending = false;
    console.log('[Invisible Algorithm] IMMEDIATELY BEFORE scanCurrentReel()');
    scanCurrentReel();
  }, 150);
}

function watchForReelChanges(): void {
  window.setInterval(() => {
    if (location.href === lastPageUrl) return;
    lastPageUrl = location.href;
    console.log(`[Invisible Algorithm] Reel changed:\n${lastPageUrl}`);
    scheduleScan();
  }, 300);

  window.addEventListener('scroll', scheduleScan, { passive: true });
  window.addEventListener('popstate', scheduleScan);
  window.addEventListener('hashchange', scheduleScan);
}

console.log('[Invisible Algorithm] CHECKPOINT A: reached bottom of script');
watchForReelChanges();
console.log('[Invisible Algorithm] CHECKPOINT B: watchForReelChanges returned');
console.log('[Invisible Algorithm] INITIAL SCAN SCHEDULED');
console.log('[Invisible Algorithm] CHECKPOINT C: about to call initial scheduleScan');
scheduleScan();
console.log('[Invisible Algorithm] CHECKPOINT D: initial scheduleScan returned');
