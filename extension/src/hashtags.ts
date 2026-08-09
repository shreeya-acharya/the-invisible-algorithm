/** Matches normal hashtag characters while accepting Unicode letters and numbers. */
const HASHTAG_PATTERN = /(^|\s)#([\p{L}\p{N}_]+)/gu;

/** Returns unique hashtags in the order in which they appear in the caption. */
export function extractHashtags(caption: string): string[] {
  const seen = new Set<string>();
  const hashtags: string[] = [];

  for (const match of caption.matchAll(HASHTAG_PATTERN)) {
    const hashtag = `#${match[2]}`;
    const key = hashtag.toLocaleLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      hashtags.push(hashtag);
    }
  }

  return hashtags;
}
