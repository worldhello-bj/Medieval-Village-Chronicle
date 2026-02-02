// Utility function to round numbers to 2 decimal places
export const round2 = (num: number): number => {
  return Math.round(num * 100) / 100;
};

// Utility function to format numbers for display with 2 decimal places
export const formatNumber = (num: number): string => {
  return round2(num).toFixed(2);
};
