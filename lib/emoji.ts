/** One emoji: an emoji-style pictograph (plus optional skin tone), and any ZWJ-joined parts.
 *  Text-style symbols like © ™ ↔ only count when followed by U+FE0F. */
export const EMOJI_RE =
  /(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}️)[\u{1F3FB}-\u{1F3FF}]?(?:‍(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}️?)[\u{1F3FB}-\u{1F3FF}]?)*/gu

export const findEmoji = (text: string) => [...text.matchAll(EMOJI_RE)].map((m) => m[0])

/** "⚠️" → "26a0-fe0f": the file name of its 3D icon in public/emoji. */
export const emojiCode = (e: string) =>
  [...e].map((c) => c.codePointAt(0)!.toString(16)).join("-")

export const emojiSrc = (e: string) => `/emoji/${emojiCode(e)}.webp`
