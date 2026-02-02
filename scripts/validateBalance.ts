#!/usr/bin/env node
/**
 * Balance Validation Script
 * 
 * Run this to validate game balance and generate a report
 */

// Import balance calculator (will be compiled by TypeScript)
import { generateBalanceReport, validateAllDifficulties, validateBuildingMaintenance } from '../utils/balanceCalculator';

console.log('='.repeat(60));
console.log('MEDIEVAL VILLAGE CHRONICLE - BALANCE VALIDATION');
console.log('='.repeat(60));

// Generate full balance report
const report = generateBalanceReport();
console.log(report);

// Validate building maintenance
console.log('\n=== BUILDING MAINTENANCE VALIDATION ===\n');
const maintenanceValidation = validateBuildingMaintenance();
console.log(`Maintenance Sustainable: ${maintenanceValidation.sustainable ? '✓ YES' : '✗ NO'}\n`);

if (!maintenanceValidation.sustainable) {
  console.log('⚠ WARNING: Some buildings have unsustainable maintenance costs!\n');
}

// Summary
console.log('\n=== VALIDATION SUMMARY ===\n');
const allResults = validateAllDifficulties();
const allWinnable = Object.values(allResults).every(r => r.isWinnable);

if (allWinnable && maintenanceValidation.sustainable) {
  console.log('✓ All difficulty levels are winnable and balanced!');
  process.exit(0);
} else {
  console.log('✗ Some balance issues detected. Review warnings and recommendations above.');
  process.exit(1);
}
