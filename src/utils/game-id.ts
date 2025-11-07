// Game ID utility
// Generates consistent game identifiers from URLs

import { createHash } from 'node:crypto';

/**
 * Generate a consistent game ID from a game URL
 * Uses MD5 hash to ensure same URL always produces same ID
 * @param gameUrl - The game URL
 * @returns 32-character hex MD5 hash
 */
export function generateGameId(gameUrl: string): string {
  return createHash('md5').update(gameUrl).digest('hex');
}

