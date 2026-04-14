import Papa from 'papaparse';

/**
 * Parse CSV text and extract participant names
 * Handles comma-separated or newline-separated names
 */
export function parseParticipantsCSV(csvText: string): string[] {
  const trimmed = csvText.trim();
  if (!trimmed) return [];

  // Try parsing with Papa Parse first
  const result = Papa.parse(trimmed, {
    header: false,
    skipEmptyLines: true,
  });

  let names: string[] = [];

  if (result.data && Array.isArray(result.data)) {
    // Flatten and extract names from CSV
    names = result.data
      .flat()
      .map((item: unknown) => {
        if (typeof item === 'string') {
          return item.trim();
        }
        return '';
      })
      .filter((name) => name.length > 0);
  }

  // Fallback: split by common delimiters if Papa Parse doesn't work well
  if (names.length === 0) {
    names = trimmed
      .split(/[\n,;]/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
  }

  // Remove duplicates while preserving order
  const seen = new Set<string>();
  return names.filter((name) => {
    const lower = name.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });
}

/**
 * Generate CSV content from winner data
 */
export function generateWinnersCSV(
  raffleData: {
    id: string;
    title: string;
    drawnAt: Date;
  },
  winners: Array<{
    tier: { prizeName: string; prizeAmount: number };
    participant: { name: string; email?: string };
  }>
): string {
  const csvRows: string[] = [];

  // Header
  csvRows.push(
    'Raffle ID,Raffle Title,Drawn Date,Winner Name,Winner Email,Prize Name,Prize Amount'
  );

  // Data rows
  winners.forEach((winner) => {
    const row = [
      raffleData.id,
      `"${raffleData.title.replace(/"/g, '""')}"`,
      raffleData.drawnAt.toISOString(),
      `"${winner.participant.name.replace(/"/g, '""')}"`,
      winner.participant.email || '',
      `"${winner.tier.prizeName.replace(/"/g, '""')}"`,
      winner.tier.prizeAmount.toString(),
    ].join(',');

    csvRows.push(row);
  });

  return csvRows.join('\n');
}

/**
 * Export function to create downloadable CSV file
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
