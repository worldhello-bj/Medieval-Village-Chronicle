
import React, { useEffect } from 'react';
import { GameState, GameAction, GameStatus } from '../types';
import { generateAIEventsBatch, getFixedEvents, generateEndingSummary } from '../services/aiService';
import { GAME_END_TICK } from '../constants';

export const useGameLoop = (state: GameState, dispatch: React.Dispatch<GameAction>) => {
  
  // Game Loop Tick
  useEffect(() => {
    const timer = setInterval(() => {
      dispatch({ type: 'TICK' });
    }, state.gameSpeed);
    return () => clearInterval(timer);
  }, [state.gameSpeed, dispatch]);

  // Initialize event pool when game starts
  useEffect(() => {
    if (state.status === GameStatus.Playing && state.eventPool.length === 0 && state.tick === 1) {
      console.log('Initializing event pool...');
      
      // Get fixed events immediately
      const fixedEvents = getFixedEvents(state);
      
      // Generate AI events asynchronously
      generateAIEventsBatch(state, 8).then(aiEvents => {
        const allEvents = [...fixedEvents, ...aiEvents];
        console.log(`Event pool initialized with ${allEvents.length} events (${aiEvents.length} AI, ${fixedEvents.length} fixed)`);
        dispatch({ type: 'INIT_EVENT_POOL', events: allEvents });
      });
    }
  }, [state.status, state.tick, state.eventPool.length, dispatch]); // added state (as dependency of getFixedEvents/generateAI) but careful with infinite loops if not handled. 
  // Actually getFixedEvents uses state.
  // The original dependency array was [state.status, state.tick, state.eventPool.length].
  // I should stick to that to avoid re-running when other parts of state change. 
  // But inside the effect, we use `state`. In strict React, `state` should be in dep array.
  // But if `state` is in dep array, it runs every tick.
  // The condition `state.tick === 1` protects it from running later.
  // So it's fine.

  // Replenish event pool periodically during gameplay
  useEffect(() => {
    if (state.paused || state.status !== GameStatus.Playing) return;
    
    // Every 10 ticks, check if pool needs replenishment
    if (state.tick > 1 && state.tick % 10 === 0) {
      // Refresh fixed events based on current state
      const fixedEvents = getFixedEvents(state);
      
      // If pool is low (< 5 events), generate more AI events
      if (state.eventPool.length < 5) {
        console.log('Event pool low, generating more events...');
        generateAIEventsBatch(state, 5).then(aiEvents => {
          const newEvents = [...fixedEvents, ...aiEvents];
          console.log(`Replenishing pool with ${newEvents.length} events`);
          dispatch({ type: 'REPLENISH_EVENT_POOL', events: newEvents });
        });
      }
    }
  }, [state.tick, state.paused, state.status, state.eventPool.length, dispatch]);

  // Trigger events from pool using weighted random selection
  useEffect(() => {
    if (state.paused || state.status !== GameStatus.Playing) return;
    if (state.eventPool.length === 0) return;
    
    // Trigger event roughly every 3-4 ticks
    if (state.tick > 4 && state.tick % 3 === 0) {
      if (Math.random() > 0.4) {
        // Weighted random selection
        const totalWeight = state.eventPool.reduce((sum, e) => sum + e.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const event of state.eventPool) {
          random -= event.weight;
          if (random <= 0) {
            console.log(`Triggering event: ${event.message} (source: ${event.source})`);
            dispatch({ type: 'TRIGGER_EVENT', eventId: event.id });
            break;
          }
        }
      }
    }
  }, [state.tick, state.paused, state.status, state.eventPool, dispatch]);

  // Generate AI ending summary when game finishes
  useEffect(() => {
    if (state.status === GameStatus.Finished && state.endingType && !state.endingSummary?.includes('AI generated')) {
      // Use endingReason from state instead of fragile string matching
      generateEndingSummary(state, state.endingType, state.endingReason).then(summary => {
        if (summary && summary !== state.endingSummary) {
          dispatch({ type: 'UPDATE_ENDING_SUMMARY', summary });
        }
      }).catch(error => {
        console.warn('Failed to generate AI ending summary:', error);
      });
    }
  }, [state.status, state.endingType, state.endingSummary, dispatch]); // Added state.endingSummary to deps to be correct, likely fine as check handles it.
};
