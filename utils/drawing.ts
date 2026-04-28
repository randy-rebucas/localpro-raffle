import { randomInt } from 'crypto';

/**
 * Weighted random drawing algorithm
 * Selects winners from participants ensuring exact winner counts per tier
 * Uses a crypto-backed Fisher-Yates shuffle for fair random selection
 */

interface DrawConfig {
  participants: { id: string; name: string }[];
  tiers: Array<{
    id: string;
    prizeName: string;
    winnerCount: number;
  }>;
}

interface DrawResult {
  tierId: string;
  prizeName: string;
  winners: Array<{ participantId: string; participantName: string }>;
}

/**
 * Fisher-Yates shuffle algorithm for randomization
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Main drawing function - draws winners for all tiers
 * Ensures no participant wins the same tier twice
 */
export function drawWinners(config: DrawConfig): DrawResult[] {
  const { participants, tiers } = config;

  // Validate input
  if (participants.length === 0) {
    throw new Error('No participants available');
  }

  const totalWinnersNeeded = tiers.reduce((sum, tier) => sum + tier.winnerCount, 0);
  if (totalWinnersNeeded > participants.length) {
    throw new Error(
      `Total winners needed (${totalWinnersNeeded}) exceeds participants (${participants.length})`
    );
  }

  const results: DrawResult[] = [];
  const usedParticipants = new Set<string>();

  // Draw winners for each tier
  for (const tier of tiers) {
    const availableParticipants = participants.filter(
      (p) => !usedParticipants.has(p.id)
    );

    if (availableParticipants.length < tier.winnerCount) {
      throw new Error(
        `Not enough available participants for tier "${tier.prizeName}"`
      );
    }

    // Shuffle and select winners for this tier
    const shuffled = shuffleArray(availableParticipants);
    const tierWinners = shuffled.slice(0, tier.winnerCount);

    // Mark participants as used
    tierWinners.forEach((winner) => {
      usedParticipants.add(winner.id);
    });

    results.push({
      tierId: tier.id,
      prizeName: tier.prizeName,
      winners: tierWinners.map((w) => ({
        participantId: w.id,
        participantName: w.name,
      })),
    });
  }

  return results;
}
