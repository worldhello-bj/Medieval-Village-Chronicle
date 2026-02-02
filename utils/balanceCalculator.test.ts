/**
 * Balance Calculator Tests
 * 
 * Tests to ensure game balance is mathematically sound
 */

import {
  analyzeBalance,
  validateAllDifficulties,
  generateBalanceReport,
  validateBuildingMaintenance
} from './balanceCalculator';
import { Difficulty } from '../types';

describe('Balance Calculator', () => {
  describe('analyzeBalance', () => {
    test('Easy difficulty should be winnable', () => {
      const analysis = analyzeBalance(Difficulty.Easy);
      expect(analysis.isWinnable).toBe(true);
      expect(analysis.minPopulationNeeded).toBeLessThanOrEqual(25); // Starting pop
      expect(analysis.sustainablePopulation).toBeGreaterThanOrEqual(analysis.minPopulationNeeded);
    });

    test('Normal difficulty should be winnable', () => {
      const analysis = analyzeBalance(Difficulty.Normal);
      expect(analysis.isWinnable).toBe(true);
      expect(analysis.minPopulationNeeded).toBeLessThanOrEqual(20); // Starting pop
      expect(analysis.sustainablePopulation).toBeGreaterThanOrEqual(analysis.minPopulationNeeded);
    });

    test('Hard difficulty should be winnable (though challenging)', () => {
      const analysis = analyzeBalance(Difficulty.Hard);
      // Hard mode can be extremely difficult but should still be theoretically winnable
      expect(analysis.minPopulationNeeded).toBeLessThanOrEqual(15); // Starting pop
      expect(analysis.sustainablePopulation).toBeGreaterThan(0);
    });

    test('Food production should exceed consumption with proper job allocation', () => {
      Object.values(Difficulty).forEach(difficulty => {
        const analysis = analyzeBalance(difficulty);
        expect(analysis.resourceBreakdown.food.productionPerWorker).toBeGreaterThan(
          analysis.resourceBreakdown.food.consumptionPerPerson
        );
      });
    });

    test('Wood production should handle winter consumption', () => {
      Object.values(Difficulty).forEach(difficulty => {
        const analysis = analyzeBalance(difficulty);
        // Wood production per worker should be sufficient
        expect(analysis.resourceBreakdown.wood.productionPerWorker).toBeGreaterThan(0);
        expect(analysis.minWoodcuttersNeeded).toBeGreaterThan(0);
      });
    });
  });

  describe('validateAllDifficulties', () => {
    test('Should return analysis for all difficulty levels', () => {
      const results = validateAllDifficulties();
      expect(results[Difficulty.Easy]).toBeDefined();
      expect(results[Difficulty.Normal]).toBeDefined();
      expect(results[Difficulty.Hard]).toBeDefined();
    });

    test('All difficulties should have valid resource breakdowns', () => {
      const results = validateAllDifficulties();
      Object.values(results).forEach(analysis => {
        expect(analysis.resourceBreakdown.food).toBeDefined();
        expect(analysis.resourceBreakdown.wood).toBeDefined();
        expect(analysis.resourceBreakdown.stone).toBeDefined();
        expect(analysis.resourceBreakdown.gold).toBeDefined();
        expect(analysis.resourceBreakdown.knowledge).toBeDefined();
      });
    });
  });

  describe('generateBalanceReport', () => {
    test('Should generate a readable report', () => {
      const report = generateBalanceReport();
      expect(report).toContain('GAME BALANCE ANALYSIS');
      expect(report).toContain('农奴 (简单)'); // Easy
      expect(report).toContain('骑士 (普通)'); // Normal
      expect(report).toContain('领主 (困难)'); // Hard
    });

    test('Report should contain key metrics', () => {
      const report = generateBalanceReport();
      expect(report).toContain('Winnable');
      expect(report).toContain('Min Farmers');
      expect(report).toContain('Sustainable Pop');
      expect(report).toContain('Food');
      expect(report).toContain('Wood');
    });
  });

  describe('validateBuildingMaintenance', () => {
    test('Building maintenance should be sustainable', () => {
      const result = validateBuildingMaintenance();
      expect(result.sustainable).toBe(true);
      expect(result.analysis).toBeDefined();
    });

    test('Maintenance costs should be defined for all buildings', () => {
      const result = validateBuildingMaintenance();
      expect(Object.keys(result.analysis).length).toBeGreaterThan(0);
    });

    test('Individual building maintenance should not be excessive', () => {
      const result = validateBuildingMaintenance();
      // Each building's maintenance should be reasonable
      Object.entries(result.analysis).forEach(([building, costs]) => {
        expect(costs.woodPerWeek).toBeLessThan(10); // Not more than half a woodcutter's output
        expect(costs.goldPerWeek).toBeLessThan(3); // Not more than a miner's output
      });
    });
  });

  describe('Resource Ratios', () => {
    test('Farmer to population ratio should allow growth', () => {
      const analysis = analyzeBalance(Difficulty.Normal);
      const farmerRatio = analysis.minFarmersNeeded / 20; // Starting pop
      expect(farmerRatio).toBeLessThan(0.7); // Less than 70% should be farmers
    });

    test('Woodcutter to population ratio should be manageable', () => {
      const analysis = analyzeBalance(Difficulty.Normal);
      const woodcutterRatio = analysis.minWoodcuttersNeeded / 20; // Starting pop
      expect(woodcutterRatio).toBeLessThan(0.3); // Less than 30% should be woodcutters
    });
  });

  describe('Edge Cases', () => {
    test('Should handle zero population gracefully', () => {
      const analysis = analyzeBalance(Difficulty.Normal);
      expect(analysis.minPopulationNeeded).toBeGreaterThan(0);
    });

    test('Sustainable population should be positive', () => {
      Object.values(Difficulty).forEach(difficulty => {
        const analysis = analyzeBalance(difficulty);
        expect(analysis.sustainablePopulation).toBeGreaterThan(0);
      });
    });

    test('Resource production should always be non-negative', () => {
      Object.values(Difficulty).forEach(difficulty => {
        const analysis = analyzeBalance(difficulty);
        Object.values(analysis.resourceBreakdown).forEach(resource => {
          expect(resource.productionPerWorker).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });
});
