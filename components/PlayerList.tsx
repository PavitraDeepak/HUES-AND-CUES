import React from 'react';

interface Player {
  id: string;
  name: string;
  ready: boolean;
  score: number;
}

interface PlayerListProps {
  players: Player[];
  hostId: string;
  currentUserId?: string;
  isGameActive?: boolean;
  clueGiverId?: string;
}

const PlayerList: React.FC<PlayerListProps> = ({
  players,
  hostId,
  currentUserId,
  isGameActive = false,
  clueGiverId,
}) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
      <h3 className="text-lg font-bold text-white mb-3">
        Players ({players.length})
      </h3>
      <div className="space-y-2">
        {players.map((player) => {
          const isHost = player.id === hostId;
          const isYou = player.id === currentUserId;
          const isClueGiver = player.id === clueGiverId;

          return (
            <div
              key={player.id}
              className={`
                flex items-center justify-between p-3 rounded-lg
                ${isYou ? 'bg-blue-900 border-2 border-blue-500' : 'bg-gray-700'}
                ${isClueGiver ? 'ring-2 ring-yellow-400' : ''}
              `}
            >
              <div className="flex items-center gap-2 flex-1">
                <div
                  className={`w-3 h-3 rounded-full ${
                    player.ready ? 'bg-green-500' : 'bg-gray-500'
                  }`}
                />
                <span className="text-white font-medium">{player.name}</span>
                {isYou && (
                  <span className="text-xs bg-blue-600 px-2 py-1 rounded">
                    You
                  </span>
                )}
                {isHost && (
                  <span className="text-xs bg-yellow-600 px-2 py-1 rounded">
                    Host
                  </span>
                )}
                {isClueGiver && (
                  <span className="text-xs bg-purple-600 px-2 py-1 rounded">
                    Clue Giver
                  </span>
                )}
              </div>
              {isGameActive && (
                <div className="text-yellow-400 font-bold text-lg">
                  {player.score}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerList;
