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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-[#2a2a2a] border border-[#333] rounded-2xl max-w-2xl w-full p-10 shadow-2xl relative overflow-hidden">
        {/* Confetti/Background Effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-[#00d9ff]/10 to-transparent" />
        </div>

        <div className="relative z-10 text-center mb-10">
          <h2 className="text-6xl font-extrabold text-white mb-4 tracking-tighter drop-shadow-lg animate-scale-in">
            GAME OVER
          </h2>
          <p className="text-2xl text-[#00d9ff] font-bold animate-pulse">
            🎉 {winner} Wins! 🎉
          </p>
        </div>

        {/* Final Scoreboard */}
        <div className="mb-10">
          <h3 className="text-xl font-bold text-gray-400 mb-4 uppercase tracking-widest text-center">
            Final Standings
          </h3>
          <div className="bg-[#1e1e1e] rounded-xl p-2 border border-[#333] space-y-2">
            {finalScores.map((player, idx) => (
              <div
                key={idx}
                className={`
                  flex justify-between items-center p-4 rounded-lg transition-all
                  ${idx === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/50' : 'hover:bg-[#2a2a2a]'}
                `}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold w-10 text-center">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : <span className="text-gray-600 text-xl">{idx + 1}.</span>}
                  </span>
                  <span className={`text-xl font-bold ${idx === 0 ? 'text-yellow-400' : 'text-white'}`}>
                    {player.name}
                  </span>
                </div>
                <span className="text-2xl font-bold text-white">
                  {player.score} <span className="text-sm text-gray-500 font-normal">pts</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {onPlayAgain && (
            <button
              onClick={onPlayAgain}
              className="btn-primary w-full py-4 text-xl shadow-lg"
            >
              Play Again ↺
            </button>
          )}
          <button
            onClick={onBackToLobby}
            className="btn-secondary w-full py-4 text-lg hover:bg-white/5"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;
