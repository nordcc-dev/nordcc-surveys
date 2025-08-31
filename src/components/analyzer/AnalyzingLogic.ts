export const STOPWORDS = new Set([
    "the","a","an","and","or","but","if","then","so","of","to","in","on","for","with",
    "at","by","from","as","is","it","this","that","these","those","i","you","we","they",
    "he","she","them","us","me","my","your","our","their","be","are","was","were","am",
    "not","no","yes"
  ])
  
  export function tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s']/gu, " ") // keep letters/numbers/apostrophes
      .split(/\s+/)
      .filter(Boolean)
  }
  
  export function topNWords(responses: string[], n = 3): { word: string; count: number }[] {
    const counts = new Map<string, number>()
    for (const r of responses) {
      for (const w of tokenize(r)) {
        if (STOPWORDS.has(w)) continue
        counts.set(w, (counts.get(w) ?? 0) + 1)
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([word, count]) => ({ word, count }))
  }
  
  export function averageWordLength(responses: string[]): number {
    let chars = 0
    let words = 0
    for (const r of responses) {
      const tokens = tokenize(r)
      words += tokens.length
      chars += tokens.join("").length
    }
    return words === 0 ? 0 : +(chars / words).toFixed(2)
  }
  


  // Accepts either an array of answers or a { answer: count } map
function normalizeAnswers(
  input: string[] | Record<string, number> | undefined | null
): Array<{ text: string; count: number }> {
  if (!input) return []
  if (Array.isArray(input)) return input.map((t) => ({ text: t, count: 1 }))
  return Object.entries(input).map(([text, count]) => ({ text, count }))
}

export function topNWordsFrom(
  input: string[] | Record<string, number>,
  n = 3
): { word: string; count: number }[] {
  const items = normalizeAnswers(input)
  const counts = new Map<string, number>()
  for (const { text, count } of items) {
    for (const w of tokenize(text)) {
      if (STOPWORDS.has(w)) continue
      counts.set(w, (counts.get(w) ?? 0) + count)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([word, count]) => ({ word, count }))
}

export function averageWordLengthFrom(
  input: string[] | Record<string, number>
): number {
  const items = normalizeAnswers(input)
  let chars = 0
  let words = 0
  for (const { text, count } of items) {
    const tokens = tokenize(text)
    const tokenChars = tokens.join("").length
    chars += tokenChars * count
    words += tokens.length * count
  }
  return words === 0 ? 0 : +(chars / words).toFixed(2)
}
