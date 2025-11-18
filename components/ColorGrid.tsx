import React from 'react';
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
  const handleClick = (index: number) => {
    if (!disabled && onColorClick) {
      onColorClick(index);
    }
  };

  return (
    <div className="inline-block bg-gray-800 p-4 rounded-lg shadow-2xl">
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
        }}
      >
        {COLORS.map((color, index) => {
          const isHighlighted = highlightedIndex === index;
          const isTarget = showTarget && targetIndex === index;
          const isGuessed = Object.values(guessedIndices).includes(index);

          return (
            <div
              key={index}
              onClick={() => handleClick(index)}
              className={`
                aspect-square w-16 h-16
                transition-all duration-200
                rounded-sm
                ${!disabled && onColorClick ? 'cursor-pointer hover:scale-110 hover:z-10 hover:shadow-lg' : ''}
                ${isHighlighted ? 'ring-4 ring-blue-500 scale-110 z-20' : ''}
                ${isTarget ? 'ring-4 ring-yellow-400 scale-110 z-20' : ''}
                ${isGuessed ? 'ring-2 ring-white opacity-80' : ''}
              `}
              style={{ backgroundColor: color }}
              title={`${color} (${index})`}
            />
          );
        })}
      </div>
      <div className="mt-3 text-sm text-gray-400 text-center">
        {GRID_COLS} × {GRID_ROWS} = {COLORS.length} colors
      </div>
    </div>
  );
};

export default ColorGrid;
