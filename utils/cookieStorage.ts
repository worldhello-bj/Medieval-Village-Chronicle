/**
 * Cookie Storage Utility
 * Provides functions to save and load game state from cookies
 * with compression to handle large state objects
 */

import { GameState } from '../types';

const COOKIE_NAME = 'medieval_village_state';
const COOKIE_EXPIRY_DAYS = 7;

/**
 * Compresses a string using a simple encoding to reduce size
 */
function compressString(str: string): string {
  try {
    // Use btoa for base64 encoding - browser native
    return btoa(encodeURIComponent(str));
  } catch (e) {
    console.error('Compression failed:', e);
    return str;
  }
}

/**
 * Decompresses a string
 */
function decompressString(str: string): string {
  try {
    return decodeURIComponent(atob(str));
  } catch (e) {
    console.error('Decompression failed:', e);
    return str;
  }
}

/**
 * Save game state to cookie
 * Limits logs to prevent excessive size
 */
export function saveStateToCookie(state: GameState): boolean {
  try {
    // Create a lighter version of state - only keep last 500 logs
    const stateToSave = {
      ...state,
      logs: state.logs.slice(-500), // Cap logs to last 500 entries
      history: state.history.slice(-260), // Already capped in reducer, but ensure
    };

    const stateJson = JSON.stringify(stateToSave);
    const compressed = compressString(stateJson);
    
    // Check if data is too large for cookie (cookies have ~4KB limit per cookie)
    // We'll split into multiple cookies if needed
    const chunkSize = 4000; // Safe size per cookie
    const chunks = Math.ceil(compressed.length / chunkSize);
    
    if (chunks > 20) {
      // Too large even with splitting
      console.warn('State too large to save in cookies');
      return false;
    }

    // Clear old cookies first
    clearStateCookies();

    // Save chunk count
    setCookie(`${COOKIE_NAME}_chunks`, chunks.toString(), COOKIE_EXPIRY_DAYS);

    // Save chunks
    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, compressed.length);
      const chunk = compressed.slice(start, end);
      setCookie(`${COOKIE_NAME}_${i}`, chunk, COOKIE_EXPIRY_DAYS);
    }

    return true;
  } catch (e) {
    console.error('Failed to save state to cookie:', e);
    return false;
  }
}

/**
 * Load game state from cookie
 */
export function loadStateFromCookie(): GameState | null {
  try {
    const chunksStr = getCookie(`${COOKIE_NAME}_chunks`);
    if (!chunksStr) {
      return null;
    }

    const chunks = parseInt(chunksStr, 10);
    if (isNaN(chunks) || chunks <= 0) {
      return null;
    }

    // Reconstruct compressed data from chunks
    let compressed = '';
    for (let i = 0; i < chunks; i++) {
      const chunk = getCookie(`${COOKIE_NAME}_${i}`);
      if (!chunk) {
        console.warn(`Missing chunk ${i}`);
        return null;
      }
      compressed += chunk;
    }

    const decompressed = decompressString(compressed);
    const state = JSON.parse(decompressed) as GameState;
    
    return state;
  } catch (e) {
    console.error('Failed to load state from cookie:', e);
    return null;
  }
}

/**
 * Clear all state cookies
 */
export function clearStateCookies(): void {
  const chunksStr = getCookie(`${COOKIE_NAME}_chunks`);
  if (chunksStr) {
    const chunks = parseInt(chunksStr, 10);
    for (let i = 0; i < chunks; i++) {
      deleteCookie(`${COOKIE_NAME}_${i}`);
    }
    deleteCookie(`${COOKIE_NAME}_chunks`);
  }
}

/**
 * Set a cookie
 */
function setCookie(name: string, value: string, days: number): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
}

/**
 * Get a cookie value
 */
function getCookie(name: string): string | null {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

/**
 * Delete a cookie
 */
function deleteCookie(name: string): void {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}
