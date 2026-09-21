function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Erkennt Blöcke wie "1. Verantwortlicher", auch wenn sie im Quelltext nicht durch
// eine Leerzeile vom nachfolgenden Absatz getrennt sind, und zwingt sie in einen
// eigenen Block.
function isolateNumberedHeadings(text: string): string {
  return text.replace(/\n?[ \t]*(\d{1,2}\.\s+[A-ZÄÖÜ][^\n]*)/g, '\n\n$1\n\n');
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

/**
 * Wandelt Klartext (Absätze getrennt durch Leerzeilen, wie ihn das ControlPanel
 * liefert) in strukturiertes HTML für die Legal-Seiten um.
 */
export function formatLegalText(raw: string): string {
  const normalized = isolateNumberedHeadings(raw.replace(/\r\n/g, '\n').trim()).replace(/\n{3,}/g, '\n\n');

  const blocks = normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks
    .map((block) => {
      if (isHeadingBlock(block)) {
        return `<h2>${escapeHtml(block)}</h2>`;
      }
      return `<p>${escapeHtml(block).replace(/\n/g, '<br />')}</p>`;
    })
    .join('\n');
}
