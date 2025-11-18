import React from 'react';

interface GameOverModalProps {
  isOpen: boolean;
  winner: string;
  finalScores: { name: string; score: number }[];
  onPlayAgain?: () => void;
  onBackToLobby: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  winner,
  finalScores,
  onPlayAgain,
  onBackToLobby,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-lg max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          <h2 className="text-5xl font-bold text-yellow-400 mb-4">
            🎉 Game Over! 🎉
          </h2>
          <p className="text-3xl text-white font-bold">
            {winner} wins!
          </p>
        </div>

        {/* Final Scoreboard */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-4 text-center">
            Final Scores
          </h3>
          <div className="bg-gray-800 rounded-lg p-6 space-y-3">
            {finalScores.map((player, idx) => (
              <div
                key={idx}
                className={`
                  flex justify-between items-center p-4 rounded-lg
                  ${idx === 0 ? 'bg-yellow-600' : 'bg-gray-700'}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                  </span>
                  <span className="text-xl font-bold text-white">
                    {player.name}
                  </span>
                </div>
                <span className="text-2xl font-bold text-yellow-400">
                  {player.score}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onBackToLobby}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-4 rounded-lg font-bold text-lg transition-colors"
          >
            Back to Lobby
          </button>
          {onPlayAgain && (
            <button
              onClick={onPlayAgain}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg font-bold text-lg transition-colors"
            >
              Play Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;
