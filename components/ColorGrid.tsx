import React, { useState, useRef, useEffect } from 'react';
import { COLORS, GRID_COLS, GRID_ROWS } from '@/lib/colors';

interface ColorGridProps {
  onColorClick?: (index: number) => void;
  highlightedIndex?: number | null;
  guessedIndices?: { [key: string]: number };
  targetIndex?: number | null;
  disabled?: boolean;
  showTarget?: boolean;
}

const ColorGrid: React.FC<ColorGridProps> = ({
  onColorClick,
  highlightedIndex,
  guessedIndices = {},
  targetIndex,
  disabled = false,
  showTarget = false,
}) => {
  const [lensPosition, setLensPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const handleClick = (index: number) => {
    if (!disabled && onColorClick) {
      onColorClick(index);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gridRef.current) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setLensPosition({ x: e.clientX, y: e.clientY });
    
    // Calculate which color is being hovered
    const tileWidth = rect.width / GRID_COLS;
    const tileHeight = rect.height / GRID_ROWS;
    const col = Math.floor(x / tileWidth);
    const row = Math.floor(y / tileHeight);
    const index = row * GRID_COLS + col;
    
    if (index >= 0 && index < COLORS.length) {
      setHoveredIndex(index);
    }
  };

  const handleMouseLeave = () => {
    setLensPosition(null);
    setHoveredIndex(null);
  };

  const getCoordinate = (index: number): string => {
    const row = Math.floor(index / GRID_COLS);
    const col = index % GRID_COLS;
    const letter = String.fromCharCode(65 + row); // A, B, C, etc.
    return `${letter}-${col + 1}`;
  };

  return (
    <div className="relative inline-block">
      {/* Coordinate Tooltip */}
      {lensPosition && hoveredIndex !== null && (
        <div
          className="coordinate-tooltip"
          style={{
            left: lensPosition.x + 20,
            top: lensPosition.y - 40,
          }}
        >
          {getCoordinate(hoveredIndex)} • {COLORS[hoveredIndex]}
        </div>
      )}

      {/* Main Grid */}
      <div className="inline-block bg-[#1a1a1a] p-6 rounded-xl shadow-2xl">
        <div
          ref={gridRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="grid gap-[2px] relative"
          style={{
            gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
          }}
        >
          {COLORS.map((color, index) => {
            const isHighlighted = highlightedIndex === index;
            const isTarget = showTarget && targetIndex === index;
            const isGuessed = Object.values(guessedIndices).includes(index);
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={index}
                onClick={() => handleClick(index)}
                className={`
                  aspect-square w-10 h-10
                  transition-all duration-200
                  ${!disabled && onColorClick ? 'cursor-crosshair' : ''}
                  ${isHighlighted ? 'ring-4 ring-white scale-125 z-20 shadow-2xl' : ''}
                  ${isTarget ? 'ring-4 ring-yellow-400 scale-125 z-20 animate-pulse-glow' : ''}
                  ${isGuessed ? 'ring-2 ring-white/60' : ''}
                  ${isHovered ? 'scale-110 z-10 brightness-110' : ''}
                `}
                style={{ backgroundColor: color }}
              />
            );
          })}
        </div>
        
        {/* Grid Info */}
        <div className="mt-4 text-sm text-gray-400 text-center font-mono">
          {GRID_COLS} × {GRID_ROWS} = {COLORS.length} colors
        </div>
      </div>

      {/* Magnifying Lens Effect */}
      {lensPosition && hoveredIndex !== null && (
        <div
          className="magnifying-lens"
          style={{
            left: lensPosition.x - 100,
            top: lensPosition.y - 100,
          }}
        >
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              backgroundColor: COLORS[hoveredIndex],
              transform: 'scale(1)',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ColorGrid;
