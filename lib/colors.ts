// 480-color palette (24 columns x 20 rows)
// Generated algorithmically using HSL color space for balanced distribution
export const COLORS: string[] = [];

// Generate colors: 20 lightness levels × 24 hues
for (let l = 0; l < 20; l++) {
  const lightness = 10 + (l * 4.5); // 10% to 95%
  for (let h = 0; h < 24; h++) {
    const hue = h * 15; // 0° to 345° (every 15°)
    const saturation = l === 0 ? 0 : 70 + (l % 3) * 10; // Vary saturation slightly
    COLORS.push(hslToHex(hue, saturation, lightness));
  }
}

// HSL to Hex conversion
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Grid dimensions
export const GRID_COLS = 24;
export const GRID_ROWS = 20;

// Sample 4 random colors for a card
export interface CardData {
  colors: string[];
  indices: number[];
}

export function sampleFour(): CardData {
  const indices = new Set<number>();
  while (indices.size < 4) {
    indices.add(Math.floor(Math.random() * COLORS.length));
  }
  const arr = Array.from(indices);
  return {
    colors: arr.map((i) => COLORS[i]),
    indices: arr,
  };
}

// Convert index to x,y coordinates
export function idxToXY(index: number): { x: number; y: number } {
  return {
    x: index % GRID_COLS,
    y: Math.floor(index / GRID_COLS),
  };
}

// Calculate grid distance between two indices
export interface DistanceResult {
  rowDist: number;
  colDist: number;
  maxDist: number;
}

export function calculateDistance(idx1: number, idx2: number): DistanceResult {
  const pos1 = idxToXY(idx1);
  const pos2 = idxToXY(idx2);
  
  const rowDist = Math.abs(pos1.y - pos2.y);
  const colDist = Math.abs(pos1.x - pos2.x);
  
  return {
    rowDist,
    colDist,
    maxDist: Math.max(rowDist, colDist),
  };
}

// Calculate score based on proximity to target
// 3 points: Bullseye (exact match)
// 2 points: Inner Ring (8 adjacent squares)
// 1 point: Outer Ring (16 squares in outer frame)
// 0 points: Miss (outside scoring frame)
export function scoreForDistance(distanceObj: DistanceResult): number {
  const { rowDist, colDist } = distanceObj;
  
  // Bullseye: Exact match
  if (rowDist === 0 && colDist === 0) return 3;
  
  // Inner Ring: Adjacent (within ±1)
  if (rowDist <= 1 && colDist <= 1) return 2;
  
  // Outer Ring: Within ±2
  if (rowDist <= 2 && colDist <= 2) return 1;
  
  // Miss: Outside the frame
  return 0;
}

// Get coordinate notation (e.g., "A-4", "H-9")
export function getCoordinate(index: number): string {
  const row = Math.floor(index / GRID_COLS);
  const col = index % GRID_COLS;
  const letter = String.fromCharCode(65 + row); // A, B, C, etc.
  return `${letter}-${col + 1}`;
}

// Get color name/description (simple hue-based)
export function getColorName(hex: string): string {
  // Simple color naming based on hex value
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  
  if (lightness < 50) return 'dark';
  if (lightness > 200) return 'light';
  
  if (r > g && r > b) return 'red';
  if (g > r && g > b) return 'green';
  if (b > r && b > g) return 'blue';
  if (r > b && g > b) return 'yellow';
  if (r > g && b > g) return 'purple';
  if (g > r && b > r) return 'cyan';
  
  return 'gray';
}
