const FINALS: Record<string, string> = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
const SUFFIXES = ['ימ', 'ות', 'ה'];

function normalizeWord(w: string): string {
  let s = w.replace(/[ךםןףץ]/g, (c) => FINALS[c]).replace(/יי/g, 'י').replace(/וו/g, 'ו');
  if (s.length > 3) {
    const suf = SUFFIXES.find((x) => s.endsWith(x));
    if (suf) s = s.slice(0, -suf.length);
  }
  return s;
}

export function normalizeName(name: string): string {
  return name
    .trim()
    .replace(/[֑-ׇ]/g, '')
    .replace(/[׳’‘`]/g, "'")
    .toLowerCase()
    .replace(/[/\\]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(normalizeWord)
    .join(' ');
}
