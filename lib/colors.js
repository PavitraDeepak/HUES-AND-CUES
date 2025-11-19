// Color utility functions for server-side use
// This is a CommonJS version of colors.ts

const COLORS = [];
const GRID_COLS = 24;
const GRID_ROWS = 20;

// HSL to Hex conversion
function hslToHex(h, s, l) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Generate colors: 20 lightness levels × 24 hues
for (let l = 0; l < 20; l++) {
  const lightness = 10 + (l * 4.5); // 10% to 95%
  for (let h = 0; h < 24; h++) {
    const hue = h * 15; // 0° to 345° (every 15°)
    const saturation = l === 0 ? 0 : 70 + (l % 3) * 10; // Vary saturation slightly
    COLORS.push(hslToHex(hue, saturation, lightness));
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
  
  // Return grid distance (max of horizontal and vertical distance)
  const rowDist = Math.abs(row2 - row1);
  const colDist = Math.abs(col2 - col1);
  
  return { rowDist, colDist, maxDist: Math.max(rowDist, colDist) };
}

function scoreForDistance(distanceObj) {
  const { rowDist, colDist } = distanceObj;
  
  // Bullseye: Exact match
  if (rowDist === 0 && colDist === 0) return 3;
  
  // Inner Ring: Adjacent (8 squares touching the target)
  if (rowDist <= 1 && colDist <= 1) return 2;
  
  // Outer Ring: One square away from inner ring
  if (rowDist <= 2 && colDist <= 2) return 1;
  
  // Miss: Outside the scoring frame
  return 0;
}

function getCoordinate(index) {
  const row = Math.floor(index / GRID_COLS);
  const col = index % GRID_COLS;
  const letter = String.fromCharCode(65 + row); // A, B, C, etc.
  return `${letter}-${col + 1}`;
}

module.exports = {
  COLORS,
  GRID_ROWS,
  GRID_COLS,
  sampleFour,
  calculateDistance,
  scoreForDistance,
  getCoordinate,
};
