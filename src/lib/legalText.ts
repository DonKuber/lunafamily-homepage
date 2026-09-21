function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Erkennt Blöcke wie "1. Verantwortlicher", auch wenn sie im Quelltext nicht durch
// eine Leerzeile vom nachfolgenden Absatz getrennt sind, und zwingt sie in einen
// eigenen Block.
function isolateNumberedHeadings(text: string): string {
  return text.replace(/^[ \t]*(\d{1,2}\.\s+[A-ZÄÖÜ][^\n]*)$/gm, '\n\n$1\n\n');
}

function isHeadingBlock(block: string): boolean {
  if (block.includes('\n')) return false;
  if (/^\d{1,2}\.\s+\S/.test(block)) return true;
  if (block.length > 90) return false;
  if (block.includes('@')) return false;
  if (block.includes('://')) return false;
  if (block.includes(':')) return false;
  if (/\b\d{5}\b/.test(block)) return false; // sieht nach PLZ/Adresse aus
  if (/[.!?,;]$/.test(block)) return false;
  return true;
}

// Gleiches Mini-Markdown wie die App (frontend/src/pages/legal/AgbPage.tsx):
// "#"/"##"/"###" = Überschriften, "- "/"* " = Listenpunkte. Damit rendert ein
// und derselbe agbText/impressumText/privacyPolicyText auf Homepage und App gleich.
function markdownHeadingLevel(line: string): number {
  const match = /^(#{1,3})\s+\S/.exec(line);
  return match ? match[1].length : 0;
}

function isListBlock(lines: string[]): boolean {
  return lines.length > 0 && lines.every((line) => /^[-*]\s+\S/.test(line));
}

/**
 * Wandelt Klartext oder das App-eigene Mini-Markdown (Absätze getrennt durch
 * Leerzeilen, wie es das ControlPanel liefert) in strukturiertes HTML für die
 * Legal-Seiten um.
 */
export function formatLegalText(raw: string): string {
  const normalized = isolateNumberedHeadings(raw.replace(/\r\n/g, '\n').trim()).replace(/\n{3,}/g, '\n\n');

  const blocks = normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks
    .map((block) => {
      const lines = block.split('\n').map((line) => line.trim());

      const headingLevel = lines.length === 1 ? markdownHeadingLevel(lines[0]) : 0;
      if (headingLevel > 0) {
        const tag = `h${Math.min(headingLevel + 1, 4)}`;
        const text = lines[0].replace(/^#{1,3}\s+/, '');
        return `<${tag}>${escapeHtml(text)}</${tag}>`;
      }

      if (isListBlock(lines)) {
        const items = lines.map((line) => `<li>${escapeHtml(line.replace(/^[-*]\s+/, ''))}</li>`).join('');
        return `<ul>${items}</ul>`;
      }

      if (isHeadingBlock(block)) {
        return `<h2>${escapeHtml(block)}</h2>`;
      }
      return `<p>${escapeHtml(block).replace(/\n/g, '<br />')}</p>`;
    })
    .join('\n');
}
