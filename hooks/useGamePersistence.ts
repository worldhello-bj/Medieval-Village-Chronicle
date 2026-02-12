
import React, { useEffect } from 'react';
import { GameState, GameAction, GameStatus } from '../types';
import { saveStateToStorage, loadStateFromStorage, clearStateStorage } from '../utils/gameStorage';
import { clearStateCookies } from '../utils/cookieStorage';

export const useGamePersistence = (state: GameState, dispatch: React.Dispatch<GameAction>) => {
  // Clean up old cookies on first mount (one-time cleanup to fix HTTP 431 issue)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Cleaning up legacy cookies from previous version...');
    }
    clearStateCookies();
  }, []);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = loadStateFromStorage();
    if (savedState) {
      console.log('Loading saved game from localStorage...');
      dispatch({ type: 'LOAD_STATE', state: savedState });
    }
  }, [dispatch]);

  // Save state to localStorage periodically during gameplay
  useEffect(() => {
    if (state.status === GameStatus.Playing && !state.paused) {
      // Save every 20 ticks (approximately every 16 seconds at 800ms per tick)
      // This reduces overhead while still providing reasonable save frequency
      if (state.tick % 20 === 0) {
        saveStateToStorage(state);
      }
    }
  }, [state.tick, state.status, state.paused, state]);

  // Clear storage on restart
  useEffect(() => {
    if (state.status === GameStatus.Menu && state.tick === 0) {
      clearStateStorage();
      // Also ensure cookies are cleared
      clearStateCookies();
    }
  }, [state.status, state.tick]);
};
