// src/lib/muley/inlineText.ts
// Muley writes plain text: paragraphs, and lists as lines that start with
// "- ". This splits an answer into those pieces so the web and the app can
// draw them. Nothing in an answer is ever treated as HTML or a link.

export type TextPiece = { kind: 'paragraph'; text: string } | { kind: 'list'; items: string[] }

const BULLET = /^\s*(?:[-•*]|\d+[.)])\s+/

export function splitText(text: string): TextPiece[] {
  const pieces: TextPiece[] = []
  let paragraph: string[] = []
  let list: string[] = []
  const flushParagraph = () => {
    if (paragraph.length) pieces.push({ kind: 'paragraph', text: paragraph.join(' ') })
    paragraph = []
  }
  const flushList = () => {
    if (list.length) pieces.push({ kind: 'list', items: list })
    list = []
  }
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trim()
    if (!line) {
      flushParagraph()
      flushList()
    } else if (BULLET.test(line)) {
      flushParagraph()
      list.push(line.replace(BULLET, '').replace(/\*\*/g, ''))
    } else {
      flushList()
      paragraph.push(line.replace(/\*\*/g, ''))
    }
  }
  flushParagraph()
  flushList()
  return pieces
}

/** A link a card may follow: a path inside the app, never another site. */
export const isAppPath = (href: unknown): href is string =>
  typeof href === 'string' && href.startsWith('/') && !href.startsWith('//') && !href.includes('\\') && !/[\s<>"']/.test(href)
