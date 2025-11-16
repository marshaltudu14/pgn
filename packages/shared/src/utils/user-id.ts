/**
 * User ID Generation Utilities
 * Implements PGN-YYYY-NNNN format for human-readable employee IDs
 * Shared between web and mobile applications
 */

import { Database, UserIdSequence, GeneratedUserId } from '../types';

// Type aliases for cleaner code
export type Employee = Database['public']['Tables']['employees']['Row'];
export type EmployeeDatabase = Database['public']['Tables']['employees'];

/**
 * Generate a human-readable user ID in PGN-YYYY-NNNN format
 * @param lastSequence The last sequence number used for the current year
 * @returns Generated user ID with sequence info
 */
export function generateUserId(lastSequence: number = 0): GeneratedUserId {
  const currentYear = new Date().getFullYear();
  const nextSequence = lastSequence + 1;
  const paddedSequence = nextSequence.toString().padStart(4, '0');
  const userId = `PGN-${currentYear}-${paddedSequence}`;

  return {
    userId,
    sequence: nextSequence,
    year: currentYear
  };
}

/**
 * Parse a user ID to extract year and sequence
 * @param userId The user ID to parse
 * @returns Parsed components or null if invalid format
 */
export function parseUserId(userId: string): UserIdSequence | null {
  const match = userId.match(/^PGN-(\d{4})-(\d{4})$/);

  if (!match) {
    return null;
  }

  const year = parseInt(match[1], 10);
  const sequence = parseInt(match[2], 10);

  return { year, last_sequence: sequence };
}

/**
 * Validate user ID format
 * @param userId The user ID to validate
 * @returns True if valid format, false otherwise
 */
export function isValidUserIdFormat(userId: string): boolean {
  return /^PGN-\d{4}-\d{4}$/.test(userId);
}

/**
 * Check if a user ID belongs to the current year
 * @param userId The user ID to check
 * @returns True if current year, false otherwise
 */
export function isCurrentYearUserId(userId: string): boolean {
  const currentYear = new Date().getFullYear();
  const parsed = parseUserId(userId);

  return parsed ? parsed.year === currentYear : false;
}

/**
 * Get the next sequence number for a given year based on existing user IDs
 * @param existingUserIds Array of existing user IDs
 * @param targetYear The year to get sequence for
 * @returns Next sequence number for the target year
 */
export function getNextSequenceForYear(existingUserIds: string[], targetYear: number): number {
  const yearPrefix = `PGN-${targetYear}-`;

  const yearIds = existingUserIds.filter(id => id.startsWith(yearPrefix));

  if (yearIds.length === 0) {
    return 1;
  }

  const sequences = yearIds
    .map(id => parseUserId(id))
    .filter(parsed => parsed !== null)
    .map(parsed => parsed!.last_sequence);

  const maxSequence = Math.max(...sequences);

  return maxSequence + 1;
}

/**
 * Format user ID for display (consistent formatting)
 * @param userId The user ID to format
 * @returns Formatted user ID
 */
export function formatUserId(userId: string): string {
  const parsed = parseUserId(userId);

  if (!parsed) {
    return userId;
  }

  return generateUserId(parsed.last_sequence - 1).userId;
}

/**
 * Generate a batch of user IDs for testing purposes
 * @param count Number of user IDs to generate
 * @param startingFrom Starting sequence number
 * @param year Year to generate for (defaults to current year)
 * @returns Array of generated user IDs
 */
export function generateUserIdsBatch(
  count: number,
  startingFrom: number = 0,
  year?: number
): GeneratedUserId[] {
  const targetYear = year || new Date().getFullYear();
  const userIds: GeneratedUserId[] = [];

  for (let i = 0; i < count; i++) {
    const sequence = startingFrom + i + 1;
    const paddedSequence = sequence.toString().padStart(4, '0');
    const userId = `PGN-${targetYear}-${paddedSequence}`;

    userIds.push({
      userId,
      sequence,
      year: targetYear
    });
  }

  return userIds;
}

