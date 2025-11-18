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

// Calculate Euclidean distance between two indices
export function calculateDistance(idx1: number, idx2: number): number {
  const pos1 = idxToXY(idx1);
  const pos2 = idxToXY(idx2);
  return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
}

// Calculate score based on distance
export function scoreForDistance(distance: number): number {
  const maxDistance = Math.sqrt(
    Math.pow(GRID_COLS - 1, 2) + Math.pow(GRID_ROWS - 1, 2)
  );
  const normalized = Math.max(0, 1 - distance / maxDistance);
  return Math.round(normalized * 100);
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
