/**
 * Verification Status Utilities
 * Shared utilities for displaying verification status across web and mobile
 */

import { VerificationStatus } from './attendance';

export interface VerificationStatusConfig {
  label: string;
  className: string;
  dotColor: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const VERIFICATION_STATUS_CONFIG: Record<VerificationStatus, VerificationStatusConfig> = {
  PENDING: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    dotColor: 'bg-yellow-500',
    color: '#92400e',
    bgColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  VERIFIED: {
    label: 'Verified',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800',
    dotColor: 'bg-green-500',
    color: '#14532d',
    bgColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200 dark:border-red-800',
    dotColor: 'bg-red-500',
    color: '#7f1d1d',
    bgColor: '#fee2e2',
    borderColor: '#dc2626',
  },
  FLAGGED: {
    label: 'Flagged',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    dotColor: 'bg-orange-500',
    color: '#7c2d12',
    bgColor: '#fed7aa',
    borderColor: '#ea580c',
  },
};

export function getVerificationStatusConfig(status?: VerificationStatus): VerificationStatusConfig {
  return status ? VERIFICATION_STATUS_CONFIG[status] : VERIFICATION_STATUS_CONFIG.PENDING;
}

export function getVerificationStatusColor(status?: VerificationStatus): string {
  const config = getVerificationStatusConfig(status);
  return config.color;
}