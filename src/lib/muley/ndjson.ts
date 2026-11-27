// src/lib/muley/ndjson.ts
// Reads Muley's stream: text arriving in arbitrary chunks, one JSON object
// per line. A line that isn't JSON is skipped, never thrown: one bad line
// must not lose the rest of an answer.

export type NdjsonParser = {
  /** Feed the next piece of text; each complete line is handed to onValue. */
  push: (chunk: string) => void
  /** The stream ended: hand over a last line that had no newline after it. */
  end: () => void
}

export function createNdjsonParser(onValue: (value: unknown) => void): NdjsonParser {
  let buffer = ''
  const take = (line: string) => {
    const trimmed = line.trim()
    if (!trimmed) return
    try {
      onValue(JSON.parse(trimmed))
    } catch {
      // not JSON: skip it
    }
  }
  return {
    push(chunk) {
      buffer += chunk
      let cut = buffer.indexOf('\n')
      while (cut !== -1) {
        take(buffer.slice(0, cut))
        buffer = buffer.slice(cut + 1)
        cut = buffer.indexOf('\n')
      }
    },
    end() {
      take(buffer)
      buffer = ''
    },
  }
}
