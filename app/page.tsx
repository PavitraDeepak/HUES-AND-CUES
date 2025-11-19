'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/lib/useSocket';
import HowToPlayModal from '@/components/HowToPlayModal';

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
  const [mode, setMode] = useState<'create' | 'join'>('join');
  const [showHowToPlay, setShowHowToPlay] = useState(false);

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
          localStorage.setItem('justCreated', 'true');
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
    <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#00d9ff]/5 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#00d9ff]/5 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-md w-full relative z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-6xl font-extrabold text-white mb-2 tracking-tighter">
            HUES <span className="text-[#00d9ff]">&</span> CUES
          </h1>
          <p className="text-gray-400 text-lg">
            The ultimate color guessing game
          </p>
          
          <div className="mt-4 flex justify-center items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#10b981]' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500 uppercase tracking-widest">
              {isConnected ? 'Server Online' : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-[#2a2a2a] border border-[#333] rounded-2xl p-8 shadow-2xl">
          {/* Name Input */}
          <div className="mb-8">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
              Your Nickname
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter nickname..."
              className="input-field w-full text-center text-xl py-4 font-bold"
              maxLength={12}
            />
          </div>

          {/* Tabs */}
          <div className="bg-[#1e1e1e] p-1 rounded-xl flex mb-8 border border-[#333]">
            <button
              onClick={() => setMode('join')}
              className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${
                mode === 'join' 
                  ? 'bg-[#2a2a2a] text-white shadow-lg border border-[#333]' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Join Room
            </button>
            <button
              onClick={() => setMode('create')}
              className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${
                mode === 'create' 
                  ? 'bg-[#2a2a2a] text-white shadow-lg border border-[#333]' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Create Room
            </button>
          </div>

          {/* Join Mode */}
          {mode === 'join' && (
            <div className="space-y-6 animate-slide-up">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                  Room Code
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="ABCD"
                  className="input-field w-full text-center text-2xl font-mono tracking-[0.5em] uppercase py-4"
                  maxLength={6}
                />
              </div>
              <button
                onClick={handleJoinRoom}
                disabled={!isConnected || loading || !name || !roomCode}
                className="btn-primary w-full py-4 text-lg shadow-[0_0_20px_rgba(0,217,255,0.2)]"
              >
                {loading ? 'Joining...' : 'Join Game'}
              </button>
            </div>
          )}

          {/* Create Mode */}
          {mode === 'create' && (
            <div className="space-y-6 animate-slide-up">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Max Players</label>
                    <span className="text-[#00d9ff] font-bold">{maxPlayers}</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    className="w-full accent-[#00d9ff]"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rounds</label>
                    <span className="text-[#00d9ff] font-bold">{rounds}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={rounds}
                    onChange={(e) => setRounds(Number(e.target.value))}
                    className="w-full accent-[#00d9ff]"
                  />
                </div>
              </div>
              <button
                onClick={handleCreateRoom}
                disabled={!isConnected || loading || !name}
                className="btn-primary w-full py-4 text-lg shadow-[0_0_20px_rgba(0,217,255,0.2)]"
              >
                {loading ? 'Creating...' : 'Create New Room'}
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center animate-shake">
              {error}
            </div>
          )}
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <button 
            onClick={() => setShowHowToPlay(true)}
            className="text-gray-500 hover:text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <span>📖</span> How to Play
          </button>
        </div>
      </div>

      {/* How to Play Modal */}
      <HowToPlayModal 
        isOpen={showHowToPlay} 
        onClose={() => setShowHowToPlay(false)} 
      />
    </div>
  );
}
