require('dotenv').config();

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');
const mongoose = require('mongoose');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3005;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Import game utilities
const { sampleFour, calculateDistance, scoreForDistance, COLORS } = require('./lib/colors.ts');

// In-memory rooms (can be persisted to MongoDB)
const rooms = {};
const chatMessages = {};

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hues-and-cues';

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

app.prepare().then(() => {
  const expressApp = express();
  const server = createServer(expressApp);
  const io = new Server(server, {
    path: '/socket.io/',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // CREATE ROOM
    socket.on('create_room', ({ name, settings }, callback) => {
      try {
        const code = generateRoomCode();
        const userId = generateUserId();

        rooms[code] = {
          code,
          hostId: socket.id,
          players: [
            {
              id: socket.id,
              userId,
              name,
              ready: true,
              score: 0,
            },
          ],
          settings: {
            maxPlayers: settings?.maxPlayers || 8,
            rounds: settings?.rounds || 3,
            isPrivate: settings?.isPrivate || false,
          },
          currentGame: null,
          createdAt: new Date(),
        };

        chatMessages[code] = [];
        socket.join(code);

        callback({ success: true, code, userId });
        io.to(code).emit('room_state', formatRoomState(rooms[code]));
        console.log(`🎮 Room created: ${code} by ${name}`);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // JOIN ROOM
    socket.on('join_room', ({ code, name, userId }, callback) => {
      try {
        const room = rooms[code];
        if (!room) {
          return callback({ success: false, error: 'Room not found' });
        }

        // Check if player is reconnecting
        const existingPlayer = room.players.find((p) => p.userId === userId);
        if (existingPlayer) {
          // Reconnecting player
          existingPlayer.socketId = socket.id;
          existingPlayer.id = socket.id;
          existingPlayer.disconnected = false;
          delete existingPlayer.disconnectedAt;
          
          socket.join(code);
          callback({ success: true, userId });
          
          io.to(code).emit('room_state', formatRoomState(room));
          io.to(code).emit('chat_message', {
            type: 'system',
            message: `${name} reconnected`,
            timestamp: new Date(),
          });
          
          // If game is active, send game state
          if (room.currentGame) {
            socket.emit('game_started', {
              gameState: formatGameState(room.currentGame),
              clueGiver: room.players[room.currentGame.turnIndex].name,
            });
            
            // If reconnecting player is the clue giver, send target info
            if (room.currentGame.turnIndex === room.players.findIndex(p => p.id === socket.id)) {
              socket.emit('target_revealed', {
                targetIndex: room.currentGame.card.targetIndex,
                targetColor: COLORS[room.currentGame.card.targetIndex],
              });
            }
            
            if (room.currentGame.currentClue) {
              socket.emit('clue_given', {
                clue: room.currentGame.currentClue,
                phase: room.currentGame.currentPhase,
                clueGiver: room.players[room.currentGame.turnIndex].name,
                deadline: room.currentGame.guessDeadline,
              });
            }
          }
          
          console.log(`🔄 ${name} reconnected to room ${code}`);
        } else {
          // New player joining
          if (room.players.length >= room.settings.maxPlayers) {
            return callback({ success: false, error: 'Room is full' });
          }

          const newUserId = userId || generateUserId();
          room.players.push({
            id: socket.id,
            userId: newUserId,
            name,
            ready: false,
            score: 0,
          });

          socket.join(code);
          callback({ success: true, userId: newUserId });
          io.to(code).emit('room_state', formatRoomState(room));
          io.to(code).emit('chat_message', {
            type: 'system',
            message: `${name} joined the room`,
            timestamp: new Date(),
          });
          console.log(`👤 ${name} joined room ${code}`);
        }
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // TOGGLE READY
    socket.on('player_ready', ({ code, ready }, callback) => {
      try {
        const room = rooms[code];
        if (!room) return callback({ success: false, error: 'Room not found' });

        const player = room.players.find((p) => p.id === socket.id);
        if (player) {
          player.ready = ready;
          io.to(code).emit('room_state', formatRoomState(room));
          callback({ success: true });
        }
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // GET ROOM STATE (for when page loads)
    socket.on('get_room_state', ({ code }, callback) => {
      try {
        const room = rooms[code];
        if (!room) return callback({ success: false, error: 'Room not found' });

        callback({ success: true, roomState: formatRoomState(room) });

        // Also send game state if active
        if (room.currentGame) {
          callback({
            success: true,
            roomState: formatRoomState(room),
            gameState: formatGameState(room.currentGame),
            clueGiver: room.players[room.currentGame.turnIndex].name,
          });
        }
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // START GAME
    socket.on('start_game', ({ code }, callback) => {
      try {
        const room = rooms[code];
        if (!room) return callback({ success: false, error: 'Room not found' });
        if (socket.id !== room.hostId) {
          return callback({ success: false, error: 'Only host can start game' });
        }

        const allReady = room.players.every((p) => p.ready || p.id === room.hostId);
        if (!allReady) {
          return callback({ success: false, error: 'Not all players are ready' });
        }

        // Initialize game state
        const card = sampleFour();
        room.currentGame = {
          roundsTotal: room.settings.rounds,
          currentRound: 1,
          currentPhase: 1, // 1 = one-word clue, 2 = two-word clue
          turnIndex: 0,
          card: {
            colors: card.colors,
            indices: card.indices,
            targetIndex: card.indices[Math.floor(Math.random() * 4)],
          },
          guesses: {},
          roundHistory: [],
          startTime: Date.now(),
        };

        // Reset scores
        room.players.forEach((p) => (p.score = 0));

        const clueGiverId = room.players[0].id;
        
        // Send game state to all players
        io.to(code).emit('game_started', {
          gameState: formatGameState(room.currentGame),
          clueGiver: room.players[0].name,
        });
        
        // Send target info ONLY to clue giver
        io.to(clueGiverId).emit('target_revealed', {
          targetIndex: room.currentGame.card.targetIndex,
          targetColor: COLORS[room.currentGame.card.targetIndex],
        });
        
        io.to(code).emit('room_state', formatRoomState(room));
        callback({ success: true });
        console.log(`🎯 Game started in room ${code}`);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // SEND CLUE
    socket.on('send_clue', ({ code, clue }, callback) => {
      try {
        const room = rooms[code];
        if (!room || !room.currentGame) {
          return callback({ success: false, error: 'No active game' });
        }

        const clueGiver = room.players[room.currentGame.turnIndex];
        if (socket.id !== clueGiver.id) {
          return callback({ success: false, error: 'Not your turn to give clue' });
        }

        // Validate clue word count
        const wordCount = clue.trim().split(/\s+/).length;
        const expectedWords = room.currentGame.currentPhase;
        if (wordCount !== expectedWords) {
          return callback({
            success: false,
            error: `Clue must be exactly ${expectedWords} word(s)`,
          });
        }

        room.currentGame.currentClue = clue;
        room.currentGame.guesses = {};
        room.currentGame.guessDeadline = Date.now() + 60000; // 60 seconds

        io.to(code).emit('clue_given', {
          clue,
          phase: room.currentGame.currentPhase,
          clueGiver: clueGiver.name,
          deadline: room.currentGame.guessDeadline,
        });

        callback({ success: true });

        // Auto-advance after timeout
        setTimeout(() => {
          if (room.currentGame && room.currentGame.currentClue === clue) {
            handleGuessTimeout(code);
          }
        }, 60000);

        console.log(`💬 Clue given in ${code}: "${clue}" by ${clueGiver.name}`);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // PLACE GUESS
    socket.on('place_guess', ({ code, guessIndex }, callback) => {
      try {
        const room = rooms[code];
        if (!room || !room.currentGame) {
          return callback({ success: false, error: 'No active game' });
        }

        const player = room.players.find((p) => p.id === socket.id);
        const clueGiver = room.players[room.currentGame.turnIndex];

        if (socket.id === clueGiver.id) {
          return callback({ success: false, error: 'Clue giver cannot guess' });
        }

        room.currentGame.guesses[socket.id] = {
          index: guessIndex,
          playerName: player.name,
          timestamp: Date.now(),
        };

        io.to(code).emit('guess_placed', {
          playerName: player.name,
          totalGuesses: Object.keys(room.currentGame.guesses).length,
          expectedGuesses: room.players.length - 1,
        });

        callback({ success: true });

        // Check if all players have guessed
        const expectedGuesses = room.players.length - 1;
        if (Object.keys(room.currentGame.guesses).length === expectedGuesses) {
          handleRoundEnd(code);
        }

        console.log(`🎯 ${player.name} placed guess at index ${guessIndex}`);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // CHAT MESSAGE
    socket.on('chat_message', ({ code, message }, callback) => {
      try {
        const room = rooms[code];
        if (!room) return callback({ success: false, error: 'Room not found' });

        const player = room.players.find((p) => p.id === socket.id);
        if (!player) return callback({ success: false, error: 'Player not found' });

        const chatMsg = {
          type: 'player',
          playerName: player.name,
          message,
          timestamp: new Date(),
        };

        if (!chatMessages[code]) chatMessages[code] = [];
        chatMessages[code].push(chatMsg);

        io.to(code).emit('chat_message', chatMsg);
        callback({ success: true });
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // NEXT ROUND
    socket.on('next_round', ({ code }, callback) => {
      try {
        const room = rooms[code];
        if (!room || !room.currentGame) {
          return callback({ success: false, error: 'No active game' });
        }

        if (socket.id !== room.hostId) {
          return callback({ success: false, error: 'Only host can advance round' });
        }

        advanceToNextRound(code);
        callback({ success: true });
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // LEAVE ROOM (explicit leave)
    socket.on('leave_room', ({ code }, callback) => {
      handlePlayerLeave(socket, code, true);
      if (callback) callback({ success: true });
    });

    // DISCONNECT (implicit leave - mark as disconnected but don't remove immediately)
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.id}`);
      
      // Mark player as disconnected but keep in room for reconnection
      for (const code in rooms) {
        const room = rooms[code];
        const player = room.players.find((p) => p.id === socket.id);
        if (player) {
          player.disconnected = true;
          player.disconnectedAt = Date.now();
          
          io.to(code).emit('chat_message', {
            type: 'system',
            message: `${player.name} disconnected`,
            timestamp: new Date(),
          });
          
          // Only remove after 60 seconds if still disconnected
          setTimeout(() => {
            const currentRoom = rooms[code];
            if (currentRoom) {
              const currentPlayer = currentRoom.players.find((p) => p.id === socket.id);
              if (currentPlayer && currentPlayer.disconnected) {
                handlePlayerLeave(socket, code, false);
              }
            }
          }, 60000);
        }
      }
    });
  });

  // Helper functions
  function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  function generateUserId() {
    return `user_${Math.random().toString(36).substring(2, 11)}`;
  }

  function formatRoomState(room) {
    return {
      code: room.code,
      hostId: room.hostId,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        ready: p.ready,
        score: p.score,
      })),
      settings: room.settings,
      hasActiveGame: !!room.currentGame,
    };
  }

  function formatGameState(game) {
    return {
      currentRound: game.currentRound,
      roundsTotal: game.roundsTotal,
      currentPhase: game.currentPhase,
      cardColors: game.card.colors,
      clue: game.currentClue,
      guessDeadline: game.guessDeadline,
    };
  }

  function handleGuessTimeout(code) {
    const room = rooms[code];
    if (!room || !room.currentGame) return;

    // Auto-guess center for players who didn't guess
    const center = Math.floor(COLORS.length / 2);
    room.players.forEach((player) => {
      const clueGiver = room.players[room.currentGame.turnIndex];
      if (player.id !== clueGiver.id && !room.currentGame.guesses[player.id]) {
        room.currentGame.guesses[player.id] = {
          index: center,
          playerName: player.name,
          timestamp: Date.now(),
          autoGuess: true,
        };
      }
    });

    handleRoundEnd(code);
  }

  function handleRoundEnd(code) {
    const room = rooms[code];
    if (!room || !room.currentGame) return;

    const game = room.currentGame;
    const targetIndex = game.card.targetIndex;
    const results = [];

    // Calculate scores for each guess
    for (const [socketId, guess] of Object.entries(game.guesses)) {
      const distance = calculateDistance(guess.index, targetIndex);
      const points = scoreForDistance(distance);

      const player = room.players.find((p) => p.id === socketId);
      if (player) {
        player.score += points;
        results.push({
          playerName: player.name,
          guessIndex: guess.index,
          distance: Math.round(distance * 10) / 10,
          points,
          autoGuess: guess.autoGuess || false,
        });
      }
    }

    // Save round history
    game.roundHistory.push({
      round: game.currentRound,
      phase: game.currentPhase,
      clue: game.currentClue,
      targetIndex,
      results,
    });

    // Emit results
    io.to(code).emit('round_results', {
      targetIndex,
      targetColor: COLORS[targetIndex],
      results,
      scoreboard: room.players.map((p) => ({ name: p.name, score: p.score })),
      phase: game.currentPhase,
      round: game.currentRound,
    });

    io.to(code).emit('room_state', formatRoomState(room));

    console.log(`📊 Round ${game.currentRound}-${game.currentPhase} ended in ${code}`);
  }

  function advanceToNextRound(code) {
    const room = rooms[code];
    if (!room || !room.currentGame) return;

    const game = room.currentGame;

    // Check if we need to move to phase 2 of current round
    if (game.currentPhase === 1) {
      game.currentPhase = 2;
      game.currentClue = null;
      game.guesses = {};

      const clueGiverId = room.players[game.turnIndex].id;

      io.to(code).emit('phase_changed', {
        round: game.currentRound,
        phase: 2,
        clueGiver: room.players[game.turnIndex].name,
      });
      
      // Send target to clue giver
      io.to(clueGiverId).emit('target_revealed', {
        targetIndex: game.card.targetIndex,
        targetColor: COLORS[game.card.targetIndex],
      });

      console.log(`➡️ Advanced to phase 2 of round ${game.currentRound} in ${code}`);
    }
    // Move to next round
    else {
      game.currentRound++;

      if (game.currentRound > game.roundsTotal) {
        // Game over
        endGame(code);
      } else {
        // New round: new card, new clue giver
        game.currentPhase = 1;
        game.turnIndex = (game.turnIndex + 1) % room.players.length;
        const card = sampleFour();
        game.card = {
          colors: card.colors,
          indices: card.indices,
          targetIndex: card.indices[Math.floor(Math.random() * 4)],
        };
        game.currentClue = null;
        game.guesses = {};

        const clueGiverId = room.players[game.turnIndex].id;

        io.to(code).emit('new_round', {
          round: game.currentRound,
          cardColors: game.card.colors,
          clueGiver: room.players[game.turnIndex].name,
        });
        
        // Send target to new clue giver
        io.to(clueGiverId).emit('target_revealed', {
          targetIndex: game.card.targetIndex,
          targetColor: COLORS[game.card.targetIndex],
        });

        console.log(`🔄 Started round ${game.currentRound} in ${code}`);
      }
    }
  }

  function endGame(code) {
    const room = rooms[code];
    if (!room || !room.currentGame) return;

    const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];

    io.to(code).emit('game_over', {
      winner: winner.name,
      finalScores: sortedPlayers.map((p) => ({ name: p.name, score: p.score })),
      roundHistory: room.currentGame.roundHistory,
    });

    // Save to database (optional - implement if needed)
    // saveGameHistory(room);

    room.currentGame = null;
    room.players.forEach((p) => {
      p.ready = false;
      p.score = 0;
    });

    io.to(code).emit('room_state', formatRoomState(room));

    console.log(`🏆 Game ended in ${code}. Winner: ${winner.name}`);
  }

  function handlePlayerLeave(socket, code, explicitLeave = false) {
    const room = rooms[code];
    if (!room) return;

    const playerIndex = room.players.findIndex((p) => p.id === socket.id);
    if (playerIndex === -1) return;

    const player = room.players[playerIndex];
    
    // Only actually remove if explicit leave or room is empty/no active game
    if (explicitLeave || !room.currentGame) {
      room.players.splice(playerIndex, 1);
      socket.leave(code);

      if (room.players.length === 0) {
        // Delete empty room
        delete rooms[code];
        delete chatMessages[code];
        console.log(`🗑️ Room ${code} deleted (empty)`);
        return;
      }

      // Reassign host if needed
      if (room.hostId === socket.id) {
        room.hostId = room.players[0].id;
        io.to(code).emit('chat_message', {
          type: 'system',
          message: `${room.players[0].name} is now the host`,
          timestamp: new Date(),
        });
      }

      io.to(code).emit('room_state', formatRoomState(room));
      io.to(code).emit('chat_message', {
        type: 'system',
        message: `${player.name} left the room`,
        timestamp: new Date(),
      });

      // If game is active and player was clue giver, skip to next
      if (room.currentGame && room.currentGame.turnIndex >= room.players.length) {
        room.currentGame.turnIndex = 0;
      }
    }
  }

  // Next.js request handling
  expressApp.use((req, res) => {
    return handle(req, res);
  });

  server.listen(port, () => {
    console.log(`🚀 Server running on http://${hostname}:${port}`);
  });
});
