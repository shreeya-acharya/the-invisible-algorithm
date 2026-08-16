console.log('[Invisible Algorithm] Content script loaded.');

type ReelData = {
  username: string | null;
  caption: string | null;
  hashtags: string[];
  reelUrl: string;
};

type UsernameCandidate = {
  username: string;
  href: string;
};

type CaptionCandidate = {
  text: string;
  element: HTMLElement;
};

type ProvenCaption = {
  preview: string;
  boundary: HTMLElement;
  container: HTMLElement;
};

let lastPageUrl = location.href;
let lastReelIdentity = '';
let scanTimer: number | undefined;
let pendingRetries = 0;

/** Rescans allowed after pressing "more", covering ~1.2s of re-render lag. */
const EXPAND_RETRIES = 8;

let expandedIdentity = '';
let expandRetries = 0;

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

/**
 * The reel item is the innermost ancestor of the video that owns a creator link.
 * Walking up from the video (rather than down from main) avoids selecting the
 * feed's scroll container, which also contains a video and never changes.
 */
function reelItemFor(video: HTMLElement, main: HTMLElement): HTMLElement {
  let fallback: HTMLElement = video;

  for (let current = video.parentElement; current && current !== main; current = current.parentElement) {
    if (getUsernameCandidates(current).length > 0) return current;
    if (current.getBoundingClientRect().height <= innerHeight * 1.25) fallback = current;
  }
  return fallback;
}

/** Select the reel whose video occupies the most of the viewport. */
function getCurrentReel(): HTMLElement | null {
  const main = document.querySelector('main');
  if (!main) return null;

  const active = Array.from(main.querySelectorAll<HTMLVideoElement>('video'))
    .map((video) => ({ video, area: visibleArea(video) }))
    .filter(({ area }) => area > 0)
    .sort((a, b) => b.area - a.area)[0];

  return active ? reelItemFor(active.video, main) : null;
}

/**
 * The script is injected across Instagram so it survives SPA navigation into
 * Reels; this gates the actual work to Reel routes.
 */
function isReelPage(): boolean {
  return /^\/reels?\//.test(location.pathname);
}

/** `/reels/audio/123` and `/reels/videos/…` are not reel permalinks. */
function isReelPermalink(pathname: string): boolean {
  return /^\/reels?\/[^/]+\/?$/.test(pathname) && !/^\/reels?\/(?:audio|music|videos)\//.test(pathname);
}

function getReelUrl(reel: HTMLElement): string {
  if (isReelPermalink(location.pathname)) return location.href;

  const reelLink = Array.from(reel.querySelectorAll<HTMLAnchorElement>('a[href]'))
    .find((link) => isReelPermalink(new URL(link.href, location.origin).pathname));
  return reelLink ? reelLink.href : location.href;
}

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
        href: link.href
      };
    })
    .filter((candidate) => candidate.username && !seen.has(candidate.href) && Boolean(seen.add(candidate.href)));
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

/** Hashtags and mentions are anchors inside the caption, not surrounding UI. */
function isCaptionLinkText(element: HTMLElement, text: string): boolean {
  const link = element.closest<HTMLAnchorElement>('a[href]');
  if (!link) return false;

  const path = new URL(link.href, location.origin).pathname;
  return /^\/explore\/tags\//.test(path) || /^[#@]/.test(text);
}

function isUiOrMetadataText(element: HTMLElement, text: string, audio: Set<string>): boolean {
  if (element.closest('time')) return true;
  if (element.closest('a') && !isCaptionLinkText(element, text)) return true;
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

function getCaptionCandidates(reel: HTMLElement): CaptionCandidate[] {
  const audio = audioTexts(reel);
  const candidates = new Map<string, CaptionCandidate>();
  const walker = document.createTreeWalker(reel, NodeFilter.SHOW_TEXT);

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    const text = node.textContent?.replace(/\s+/g, ' ').trim() || '';
    if (!parent || !text || !isVisibleTextParent(parent, reel) || isUiOrMetadataText(parent, text, audio)) continue;

    candidates.set(text, { text, element: parent });
  }

  return [...candidates.values()];
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

/**
 * The caption spans the prose text node plus its sibling hashtag/mention anchors.
 * The largest ancestor that still excludes the creator link is that shared parent.
 */
function captionContainerFor(previewParent: HTMLElement, creator: HTMLElement, boundary: HTMLElement): HTMLElement {
  let container = previewParent;

  for (let current = previewParent.parentElement; current && current !== boundary; current = current.parentElement) {
    if (current.contains(creator)) break;
    container = current;
  }
  return container;
}

function findProvenCaption(
  reel: HTMLElement,
  creatorCandidate: UsernameCandidate | undefined,
  candidates: CaptionCandidate[]
): ProvenCaption | null {
  if (!creatorCandidate) return null;

  const creator = Array.from(reel.querySelectorAll<HTMLAnchorElement>('a[href]'))
    .find((link) => link.href === creatorCandidate.href);
  if (!creator) return null;

  const proven = candidates.flatMap((candidate) => {
    const boundary = nearestCreatorCaptionAncestor(creator, candidate.text, reel);
    if (!boundary) return [];

    const containsOtherCreator = getUsernameCandidates(boundary)
      .some((other) => other.username !== creatorCandidate.username);
    if (containsOtherCreator) return [];

    return [{
      preview: candidate.text,
      boundary,
      container: captionContainerFor(candidate.element, creator, boundary)
    }];
  });

  // A caption can span several text nodes; the longest proven run is the caption.
  return proven.sort((a, b) => b.preview.length - a.preview.length)[0] || null;
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

/** Join every non-UI text node in the caption container, in document order. */
function assembleCaption(container: HTMLElement): string {
  const audio = audioTexts(container);
  const seen = new Set<string>();
  const parts: string[] = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    const text = node.textContent?.replace(/\s+/g, ' ').trim() || '';
    if (!parent || !text || seen.has(text) || isUiOrMetadataText(parent, text, audio)) continue;

    seen.add(text);
    parts.push(text);
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/** Matches "more", "... more", "…more", "see more". */
const EXPANDER_TEXT = /^(?:\.{3}|…)?\s*(?:see\s+)?more$/i;

/** Matches "less", "... less", "show less". */
const COLLAPSER_TEXT = /^(?:\.{3}|…)?\s*(?:show\s+)?less$/i;

/**
 * Instagram renders this control as a bare span with the handler on an ancestor,
 * so any element can be the target; click() bubbles up to whoever is listening.
 * Anchors with a real href are skipped so expanding can never navigate the page.
 */
function findControl(scope: HTMLElement, pattern: RegExp): HTMLElement | null {
  const matches = Array.from(scope.querySelectorAll<HTMLElement>('*'))
    .filter((element) => element.tagName !== 'A' || !element.getAttribute('href'))
    .filter((element) => pattern.test(cleanText(element)));

  // The deepest match is the control itself rather than a wrapper around it.
  return matches.find((element) => !matches.some((other) => other !== element && element.contains(other))) || null;
}

function captionExpander(scope: HTMLElement): HTMLElement | null {
  return findControl(scope, EXPANDER_TEXT);
}

/** element.click() only fires a click event; React handlers often watch pointerdown/mousedown. */
function simulateClick(target: Element, x: number, y: number): void {
  const base = { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, button: 0 };
  const pointer = { ...base, pointerId: 1, isPrimary: true, pointerType: 'mouse' };

  target.dispatchEvent(new PointerEvent('pointerdown', pointer));
  target.dispatchEvent(new MouseEvent('mousedown', base));
  target.dispatchEvent(new PointerEvent('pointerup', pointer));
  target.dispatchEvent(new MouseEvent('mouseup', base));
  target.dispatchEvent(new MouseEvent('click', base));
}

/** Put the caption back the way it was, so scrolling past does not leave it open. */
function collapseCaption(reel: HTMLElement): void {
  const collapser = findControl(reel, COLLAPSER_TEXT);
  if (collapser) {
    collapser.click();
    return;
  }

  // Instagram has no "less" control; a click inside the reel collapses the caption.
  // The listener sits on a descendant, so the click has to start where a real
  // pointer would land — the topmost element at the reel's centre.
  const rect = reel.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const target = document.elementFromPoint(x, y);
  if (!target || !reel.contains(target)) return;

  const video = reel.querySelector<HTMLVideoElement>('video');
  const wasPlaying = video ? !video.paused : false;
  simulateClick(target, x, y);

  // Restore playback if the click also reached a play/pause handler.
  window.setTimeout(() => {
    if (!video) return;
    if (wasPlaying && video.paused) void video.play().catch(() => undefined);
    else if (!wasPlaying && !video.paused) video.pause();
  }, 100);
}

function resolveCaption(
  reel: HTMLElement,
  creatorCandidate: UsernameCandidate | undefined
): { caption: string | null; expander: HTMLElement | null } {
  const proven = findProvenCaption(reel, creatorCandidate, getCaptionCandidates(reel));
  if (!proven) return { caption: null, expander: null };

  const assembled = assembleCaption(proven.container) || proven.preview;
  return {
    caption: fullCaptionText(proven.boundary, assembled) || assembled,
    // Falls back to the whole reel in case the control sits outside the boundary.
    expander: captionExpander(proven.boundary) || captionExpander(reel)
  };
}

/** \p{M} keeps combining marks attached (Devanagari matras, Arabic diacritics). */
const HASHTAG_PATTERN = /(^|\s)#([\p{L}\p{M}\p{N}_]+)/gu;

function extractHashtags(caption: string | null): string[] {
  if (!caption) return [];

  const hashtags = new Set<string>();
  for (const match of caption.matchAll(HASHTAG_PATTERN)) {
    hashtags.add(`#${match[2]}`);
  }
  return [...hashtags];
}

/** The pattern consumes the whitespace before each hashtag, so removal leaves no gap. */
function stripHashtags(caption: string | null): string | null {
  if (!caption) return null;

  const stripped = caption.replace(HASHTAG_PATTERN, '').replace(/\s+/g, ' ').trim();
  return stripped || null;
}

const API_BASE_URL = 'http://localhost:3000';

async function sendReelDataToBackend(data: ReelData): Promise<void> {
  try {
    const { invisible_algo_token } = await chrome.storage.local.get(
      'invisible_algo_token'
    );
    console.log(
      '[Invisible Algorithm] Token diagnostic:',
      invisible_algo_token
        ? {
            length: invisible_algo_token.length,
            start: invisible_algo_token.slice(0, 12),
            end: invisible_algo_token.slice(-12)
          }
        : 'MISSING'
    );

    if (!invisible_algo_token) {
      console.error(
        '[Invisible Algorithm] No auth token available in extension storage.'
      );
      return;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/extension/reel`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${invisible_algo_token}`
        },
        body: JSON.stringify({
          reel_url: data.reelUrl,
          username: data.username,
          caption: data.caption,
          hashtags: data.hashtags
        })
      }
    );

    if (!response.ok) {
      console.error(
        '[Invisible Algorithm] Failed to send Reel data:',
        response.status,
        await response.text()
      );
      return;
    }

    console.log(
      '[Invisible Algorithm] Reel data saved successfully.'
    );
  } catch (error) {
    console.error(
      '[Invisible Algorithm] Reel backend connection failed:',
      error
    );
  }
}

function scanCurrentReel(): void {
  // Clearing the identity makes re-entering Reels rescan rather than dedupe away.
  if (!isReelPage()) {
    lastReelIdentity = '';
    expandedIdentity = '';
    return;
  }

  const reel = getCurrentReel();
  if (!reel) {
    if (pendingRetries > 0) {
      pendingRetries--;
      scheduleScan();
    }
    return;
  }

  const reelUrl = getReelUrl(reel);
  const mediaUrl = reel.querySelector<HTMLVideoElement>('video')?.currentSrc || '';
  const identity = `${reelUrl}|${mediaUrl}`;
  if (identity === lastReelIdentity) return;

  const creatorCandidate = getUsernameCandidates(reel)[0];
  const { caption, expander } = resolveCaption(reel, creatorCandidate);

  // Instagram renders only the first line until "more" is pressed, so press it
  // once per reel and rescan; the retries cover the re-render lag.
  if (expander) {
    if (expandedIdentity !== identity) {
      expandedIdentity = identity;
      expandRetries = EXPAND_RETRIES;
      expander.click();
      scheduleScan();
      return;
    }
    if (expandRetries > 0) {
      expandRetries--;
      scheduleScan();
      return;
    }
  }

  const didExpand = expandedIdentity === identity;
  lastReelIdentity = identity;
  expandedIdentity = '';

  const data: ReelData = {
    reelUrl,
    username: creatorCandidate?.username || null,
    caption: stripHashtags(caption),
    hashtags: extractHashtags(caption)
  };

  void sendReelDataToBackend(data);
 async function sendSessionDataToBackend(): Promise<void> {
  try {
    const result = await chrome.storage.local.get('invisible_algo_token');
    const token = result.invisible_algo_token;

    if (!token) {
      console.error(
        '[Invisible Algorithm] No authenticated dashboard session found.'
      );
      return;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/extension/session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          website: 'instagram.com',
          duration: 60,
          diversity_score: 70,
          reflection: 'Browsed Instagram recommendations.'
        })
      }
    );

    if (!response.ok) {
      console.error(
        '[Invisible Algorithm] Failed to save session:',
        response.status,
        await response.text()
      );
      return;
    }

    console.log(
      '[Invisible Algorithm] Browsing session saved successfully.'
    );
  } catch (error) {
    console.error(
      '[Invisible Algorithm] Session backend connection failed:',
      error
    );
  }
}
  void sendSessionDataToBackend();

  console.log(
    '==================================\n' +
      'Invisible Algorithm\n\n' +
      `Reel URL:\n${data.reelUrl}\n\n` +
      `Username:\n${data.username || 'not found'}\n\n` +
      `Caption:\n${data.caption || 'not found'}\n\n` +
      `Hashtags:\n${data.hashtags.length ? data.hashtags.join(', ') : '(none)'}\n` +
      '=================================='
  );

  if (didExpand) collapseCaption(reel);
}

function scheduleScan(): void {
  if (scanTimer !== undefined) window.clearTimeout(scanTimer);
  scanTimer = window.setTimeout(scanCurrentReel, 150);
}

/** Reel markup can lag an SPA route change, so retry briefly before giving up. */
function restartScan(): void {
  pendingRetries = 20;
  scheduleScan();
}

function watchForReelChanges(): void {
  window.setInterval(() => {
    if (location.href === lastPageUrl) return;
    lastPageUrl = location.href;
    restartScan();
  }, 300);

  window.addEventListener('scroll', scheduleScan, { passive: true, capture: true });
  window.addEventListener('popstate', restartScan);
  window.addEventListener('hashchange', restartScan);
}

watchForReelChanges();
restartScan();
