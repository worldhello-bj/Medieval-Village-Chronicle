/**
 * Game State Storage Utility
 * Provides functions to save and load game state from localStorage
 * This replaces cookie storage to avoid HTTP 431 errors from large cookie headers
 */

import { GameState } from '../types';

const STORAGE_KEY = 'medieval_village_state';

/**
 * Check if localStorage is available
 * localStorage may not be available in:
 * - file:// protocol (opened directly from file system)
 * - Private browsing modes
 * - Some browsers with strict privacy settings
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.warn('localStorage is not available:', e);
    return false;
  }
}

/**
 * Save game state to localStorage
 * Limits logs to prevent excessive size
 */
export function saveStateToStorage(state: GameState): boolean {
  if (!isLocalStorageAvailable()) {
    console.warn('Cannot save state: localStorage is not available');
    return false;
  }

  try {
    // Create a lighter version of state - only keep last 500 logs
    const stateToSave = {
      ...state,
      logs: state.logs.slice(-500), // Cap logs to last 500 entries
      history: state.history.slice(-260), // Already capped in reducer, but ensure
    };

    const stateJson = JSON.stringify(stateToSave);
    
    // Check size (localStorage typically has 5-10MB limit)
    const sizeInBytes = new Blob([stateJson]).size;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    
    if (sizeInMB > 5) {
      console.warn(`State too large for localStorage: ${sizeInMB.toFixed(2)}MB`);
      return false;
    }

    localStorage.setItem(STORAGE_KEY, stateJson);
    return true;
  } catch (e) {
    console.error('Failed to save state to localStorage:', e);
    return false;
  }
}

/**
 * Load game state from localStorage
 */
export function loadStateFromStorage(): GameState | null {
  if (!isLocalStorageAvailable()) {
    console.warn('Cannot load state: localStorage is not available');
    return null;
  }

  try {
    const stateJson = localStorage.getItem(STORAGE_KEY);
    if (!stateJson) {
      return null;
    }

    const state = JSON.parse(stateJson) as GameState;
    return state;
  } catch (e) {
    console.error('Failed to load state from localStorage:', e);
    return null;
  }
}

/**
 * Clear state from localStorage
 */
export function clearStateStorage(): void {
  if (!isLocalStorageAvailable()) {
    console.warn('Cannot clear state: localStorage is not available');
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear state from localStorage:', e);
  }
}
