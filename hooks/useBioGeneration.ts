
import React, { useRef, useEffect } from 'react';
import { GameState, GameAction, GameStatus } from '../types';
import { WEEKS_PER_YEAR, CONSUMPTION } from '../constants';
import { generateBioBatch, updateVillagerChronicle } from '../services/aiService';

export const useBioGeneration = (state: GameState, dispatch: React.Dispatch<GameAction>) => {
  // Ref to track if we are currently generating a bio batch to avoid spamming
  const generatingBioBatchRef = useRef<boolean>(false);

  // Background Chronicle Generation Effect
  useEffect(() => {
    if (state.status !== GameStatus.Playing || state.paused || generatingBioBatchRef.current) return;

    // Calculate current game year (start at Year 1)
    const currentYear = Math.floor(state.tick / WEEKS_PER_YEAR) + 1;
    
    // Find multiple villagers who need a bio update for a previous year
    // Limit batch size to 5 to avoid too large prompts
    const BATCH_SIZE = 5;
    const candidates = state.population
        .filter(v => (v.lastBioYear || 0) < currentYear)
        .slice(0, BATCH_SIZE);
    
    if (candidates.length > 0) {
        // Determine the target year (all candidates should have same target year ideally, but we take the min + 1)
        const firstCandidate = candidates[0];
        const targetYear = (firstCandidate.lastBioYear || 0) + 1;
        
        // Filter candidates that match this target year
        const batch = candidates.filter(v => (v.lastBioYear || 0) + 1 === targetYear);
        
        if (batch.length === 0) return;

        generatingBioBatchRef.current = true;
        
        // Prepare village status
        const villageStatus = {
            isStarving: state.resources.food < state.population.length * CONSUMPTION.food,
            population: state.population.length
        };

        console.log(`Generating batch chronicle for ${batch.length} villagers (Year ${targetYear})...`);

        generateBioBatch(batch, targetYear, villageStatus).then(bioMap => {
            if (bioMap) {
                // Update all villagers in the batch
                batch.forEach(v => {
                    const newEntry = bioMap[v.id];
                    if (newEntry) {
                        const oldBio = v.bio || "";
                        const newBio = oldBio ? `${oldBio}\n\n${newEntry}` : newEntry;
                        dispatch({ type: 'UPDATE_BIO', id: v.id, bio: newBio, year: targetYear });
                    } else {
                        // If missing in response, just update year to skip
                        dispatch({ type: 'UPDATE_BIO', id: v.id, bio: v.bio || "", year: targetYear });
                    }
                });
            } else {
                // If batch failed, skip year for all to avoid stuck loop
                console.warn(`Failed to generate batch bio, skipping year ${targetYear}`);
                batch.forEach(v => {
                    dispatch({ type: 'UPDATE_BIO', id: v.id, bio: v.bio || "", year: targetYear });
                });
            }
        }).catch(err => {
             console.error("Batch bio generation error:", err);
             batch.forEach(v => {
                dispatch({ type: 'UPDATE_BIO', id: v.id, bio: v.bio || "", year: targetYear });
             });
        }).finally(() => {
            generatingBioBatchRef.current = false;
        });
    }
  }, [state.tick, state.status, state.paused, state.population, state.resources, dispatch]);
};
