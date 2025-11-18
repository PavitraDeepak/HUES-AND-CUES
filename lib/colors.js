// Color utility functions for server-side use
// This is a CommonJS version of colors.ts

const COLORS = [];
const GRID_ROWS = 30;
const GRID_COLS = 30;

// Generate all colors
for (let r = 0; r < GRID_ROWS; r++) {
  for (let c = 0; c < GRID_COLS; c++) {
    const hue = (c / GRID_COLS) * 360;
    const saturation = 40 + (r / GRID_ROWS) * 60;
    const lightness = 30 + (r / GRID_ROWS) * 40;
    COLORS.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
}

function sampleFour() {
  const indices = [];
  const colors = [];
  
  while (indices.length < 4) {
    const randomIndex = Math.floor(Math.random() * COLORS.length);
    if (!indices.includes(randomIndex)) {
      indices.push(randomIndex);
      colors.push(COLORS[randomIndex]);
    }
  }
  
  return { indices, colors };
}

function calculateDistance(index1, index2) {
  const row1 = Math.floor(index1 / GRID_COLS);
  const col1 = index1 % GRID_COLS;
  const row2 = Math.floor(index2 / GRID_COLS);
  const col2 = index2 % GRID_COLS;
  
  return Math.sqrt(Math.pow(row2 - row1, 2) + Math.pow(col2 - col1, 2));
}

function scoreForDistance(distance) {
  if (distance === 0) return 5;
  if (distance <= 2) return 4;
  if (distance <= 5) return 3;
  if (distance <= 10) return 2;
  if (distance <= 15) return 1;
  return 0;
}

module.exports = {
  COLORS,
  GRID_ROWS,
  GRID_COLS,
  sampleFour,
  calculateDistance,
  scoreForDistance,
};
