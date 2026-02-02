/**
 * Quick Balance Check - Console Output
 * 
 * This file can be imported in the app to log balance info on startup
 */

import { generateBalanceReport, validateAllDifficulties } from './utils/balanceCalculator';

/**
 * Log balance information to console
 */
export function logBalanceCheck(): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(generateBalanceReport());
  }
}

/**
 * Get balance validation results
 */
export function getBalanceValidation() {
  return validateAllDifficulties();
}

/**
 * Check if game is balanced and winnable
 */
export function isGameBalanced(): boolean {
  const results = validateAllDifficulties();
  return Object.values(results).every(r => r.isWinnable);
}
