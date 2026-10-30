export class Tokenizer {
  tokenize(line: string): string[] {
    if (!line.trim() || line.trimStart().startsWith('#')) return [];
    const result: string[] = []; let current = ''; let quoted = false; let started = false; let closed = false;
    for (let index = 0; index < line.length; index++) {
      const char = line[index]!;
      if (quoted) {
        if (char === '\\' && ['"', '\\'].includes(line[index + 1] ?? '')) { current += line[++index]; }
        else if (char === '"') { quoted = false; closed = true; }
        else current += char;
      } else if (/\s/u.test(char)) {
        if (started) result.push(current);
        current = ''; started = false; closed = false;
      } else if (char === '"') {
        if (started) throw new Error('quote must start a parameter');
        quoted = true; started = true;
      } else {
        if (closed) throw new Error('expected space after closing quote');
        current += char; started = true;
      }
    }
    if (quoted) throw new Error('unterminated double quote');
    if (started) result.push(current);
    return result;
  }
}
