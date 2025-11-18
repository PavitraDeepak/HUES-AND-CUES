'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/lib/useSocket';

export default function Home() {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [rounds, setRounds] = useState(3);
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load saved name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      setName(savedName);
    }
  }, []);

  const handleCreateRoom = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!socket) {
      setError('Not connected to server');
      return;
    }

    setLoading(true);
    setError('');

    localStorage.setItem('playerName', name.trim());

    socket.emit(
      'create_room',
      {
        name: name.trim(),
        settings: { maxPlayers, rounds, isPrivate },
      },
      (response: any) => {
        setLoading(false);
        if (response.success) {
          localStorage.setItem('userId', response.userId);
          router.push(`/room/${response.code}`);
        } else {
          setError(response.error || 'Failed to create room');
        }
      }
    );
  };

  const handleJoinRoom = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }
    if (!socket) {
      setError('Not connected to server');
      return;
    }

    setLoading(true);
    setError('');

    localStorage.setItem('playerName', name.trim());
    const userId = localStorage.getItem('userId') || undefined;

    socket.emit(
      'join_room',
      {
        code: roomCode.toUpperCase(),
        name: name.trim(),
        userId,
      },
      (response: any) => {
        setLoading(false);
        if (response.success) {
          localStorage.setItem('userId', response.userId);
          router.push(`/room/${roomCode.toUpperCase()}`);
        } else {
          setError(response.error || 'Failed to join room');
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4">
            🎨 Hues & Cues
          </h1>
          <p className="text-xl text-gray-300">
            Multiplayer color guessing game - Play with friends!
          </p>
          <div className="mt-4 flex justify-center items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-gray-300">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Create Room */}
          <div className="bg-gray-800 rounded-lg p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-6">Create Room</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Players: {maxPlayers}
                </label>
                <input
                  type="range"
                  min="2"
                  max="12"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Number of Rounds: {rounds}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={rounds}
                  onChange={(e) => setRounds(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="private"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="private"
                  className="ml-2 text-sm text-gray-300"
                >
                  Private Room (invite only)
                </label>
              </div>

              <button
                onClick={handleCreateRoom}
                disabled={!isConnected || loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-bold text-lg transition-all shadow-lg"
              >
                {loading ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </div>

          {/* Join Room */}
          <div className="bg-gray-800 rounded-lg p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-6">Join Room</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Room Code
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code"
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 uppercase font-mono text-lg"
                  maxLength={6}
                />
              </div>

              <button
                onClick={handleJoinRoom}
                disabled={!isConnected || loading}
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-bold text-lg transition-all shadow-lg"
              >
                {loading ? 'Joining...' : 'Join Room'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-900 border-2 border-red-500 text-white px-6 py-4 rounded-lg text-center">
            {error}
          </div>
        )}

        {/* How to Play */}
        <div className="mt-12 bg-gray-800 rounded-lg p-8 shadow-2xl">
          <h3 className="text-2xl font-bold text-white mb-4">How to Play</h3>
          <div className="space-y-2 text-gray-300">
            <p>
              <strong className="text-white">1.</strong> One player is the{' '}
              <strong className="text-yellow-400">Clue Giver</strong> each round
            </p>
            <p>
              <strong className="text-white">2.</strong> The Clue Giver sees 4 colors and picks one as the target
            </p>
            <p>
              <strong className="text-white">3.</strong> Round 1: Give a{' '}
              <strong className="text-blue-400">ONE-word</strong> clue
            </p>
            <p>
              <strong className="text-white">4.</strong> All players guess by clicking a color on the 480-color grid
            </p>
            <p>
              <strong className="text-white">5.</strong> Round 2: Give a{' '}
              <strong className="text-purple-400">TWO-word</strong> clue
            </p>
            <p>
              <strong className="text-white">6.</strong> Closer guesses = more points!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
