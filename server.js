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
const { sampleFour, calculateDistance, scoreForDistance, COLORS } = require('./lib/colors.js');

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
            targetIndex: null, // Cuer must select
          },
          guesses: {}, // Will store { playerId: { cone1: index, cone2: index } }
          currentPhaseGuesses: {}, // Track guesses for current phase
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
          clueGiverId: room.players[0].id,
        });
        
        // Send target info ONLY to clue giver - REMOVED, Cuer must select
        /*
        io.to(clueGiverId).emit('target_revealed', {
          targetIndex: room.currentGame.card.targetIndex,
          targetColor: COLORS[room.currentGame.card.targetIndex],
        });
        */
        
        io.to(code).emit('room_state', formatRoomState(room));
        callback({ success: true });
        console.log(`🎯 Game started in room ${code}`);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // SELECT TARGET COLOR
    socket.on('select_target_color', ({ code, targetIndex }, callback) => {
      try {
        const room = rooms[code];
        if (!room || !room.currentGame) {
          return callback({ success: false, error: 'No active game' });
        }

        const game = room.currentGame;
        const player = room.players.find((p) => p.id === socket.id);
        const clueGiver = room.players[game.turnIndex];

        if (player.id !== clueGiver.id) {
          return callback({ success: false, error: 'Only clue giver can select target' });
        }

        // Validate index is one of the 4 card colors
        if (targetIndex < 0 || targetIndex > 3) {
           return callback({ success: false, error: 'Invalid color selection' });
        }

        game.card.targetIndex = game.card.indices[targetIndex];
        
        // Send confirmation to clue giver
        io.to(socket.id).emit('target_revealed', {
          targetIndex: game.card.targetIndex,
          targetColor: COLORS[game.card.targetIndex],
        });

        callback({ success: true });
        console.log(`🎯 Target selected in ${code} by ${player.name}`);
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

        const game = room.currentGame;
        // Check if target is selected
        if (game.card.targetIndex === undefined || game.card.targetIndex === null) {
             return callback({ success: false, error: 'Please select a target color first' });
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
        room.currentGame.currentPhaseGuesses = {};
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

        const phase = room.currentGame.currentPhase;
        const coneKey = phase === 1 ? 'cone1' : 'cone2';

        // Initialize player guesses if not exists
        if (!room.currentGame.guesses[socket.id]) {
          room.currentGame.guesses[socket.id] = {};
        }

        // Store the guess for this phase
        room.currentGame.guesses[socket.id][coneKey] = guessIndex;
        room.currentGame.currentPhaseGuesses[socket.id] = {
          index: guessIndex,
          playerName: player.name,
          timestamp: Date.now(),
        };

        io.to(code).emit('guess_placed', {
          playerName: player.name,
          phase,
          totalGuesses: Object.keys(room.currentGame.currentPhaseGuesses).length,
          expectedGuesses: room.players.length - 1,
        });

        callback({ success: true });

        // Check if all players have guessed
        const expectedGuesses = room.players.length - 1;
        if (Object.keys(room.currentGame.currentPhaseGuesses).length === expectedGuesses) {
          handlePhaseEnd(code);
        }

        console.log(`🎯 ${player.name} placed cone ${phase} at index ${guessIndex}`);
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
      if (player.id !== clueGiver.id && !room.currentGame.currentPhaseGuesses[player.id]) {
        const phase = room.currentGame.currentPhase;
        const coneKey = phase === 1 ? 'cone1' : 'cone2';
        
        if (!room.currentGame.guesses[player.id]) {
          room.currentGame.guesses[player.id] = {};
        }
        
        room.currentGame.guesses[player.id][coneKey] = center;
        room.currentGame.currentPhaseGuesses[player.id] = {
          index: center,
          playerName: player.name,
          timestamp: Date.now(),
          autoGuess: true,
        };
      }
    });

    handlePhaseEnd(code);
  }

  function handlePhaseEnd(code) {
    const room = rooms[code];
    if (!room || !room.currentGame) return;

    const game = room.currentGame;
    const phase = game.currentPhase;

    // Show results for this phase but don't score yet
    io.to(code).emit('phase_complete', {
      phase,
      guesses: game.currentPhaseGuesses,
    });

    // If this was phase 1, move to phase 2
    if (phase === 1) {
      setTimeout(() => {
        advanceToNextPhase(code);
      }, 3000); // 3 second pause between phases
    } else {
      // Phase 2 complete, calculate scores IMMEDIATELY
      handleRoundEnd(code);
    }
  }

  function advanceToNextPhase(code) {
    const room = rooms[code];
    if (!room || !room.currentGame) return;

    const game = room.currentGame;
    game.currentPhase = 2;
    game.currentClue = null;
    game.currentPhaseGuesses = {};

    const clueGiverId = room.players[game.turnIndex].id;

    io.to(code).emit('phase_changed', {
      round: game.currentRound,
      phase: 2,
      clueGiver: room.players[game.turnIndex].name,
      clueGiverId: room.players[game.turnIndex].id,
    });
    
    // Send target to clue giver
    io.to(clueGiverId).emit('target_revealed', {
      targetIndex: game.card.targetIndex,
      targetColor: COLORS[game.card.targetIndex],
    });

    console.log(`➡️ Advanced to phase 2 of round ${game.currentRound} in ${code}`);
  }

  function handleRoundEnd(code) {
    const room = rooms[code];
    if (!room || !room.currentGame) return;

    const game = room.currentGame;
    const targetIndex = game.card.targetIndex;
    const results = [];
    let cuerPoints = 0;

    // Calculate scores for each player's TWO cones
    for (const [socketId, cones] of Object.entries(game.guesses)) {
      const player = room.players.find((p) => p.id === socketId);
      if (!player) continue;

      let totalPoints = 0;
      const coneResults = [];

      // Score cone 1
      if (cones.cone1 !== undefined) {
        const dist1 = calculateDistance(cones.cone1, targetIndex);
        const points1 = scoreForDistance(dist1);
        totalPoints += points1;
        coneResults.push({
          cone: 1,
          index: cones.cone1,
          points: points1,
          distance: dist1,
        });
        
        // Cuer gets 1 point for each cone in the frame
        if (points1 > 0) cuerPoints++;
      }

      // Score cone 2
      if (cones.cone2 !== undefined) {
        const dist2 = calculateDistance(cones.cone2, targetIndex);
        const points2 = scoreForDistance(dist2);
        totalPoints += points2;
        coneResults.push({
          cone: 2,
          index: cones.cone2,
          points: points2,
          distance: dist2,
        });
        
        // Cuer gets 1 point for each cone in the frame
        if (points2 > 0) cuerPoints++;
      }

      player.score += totalPoints;
      results.push({
        playerName: player.name,
        cones: coneResults,
        totalPoints,
      });
    }

    // Award points to cuer
    const cuer = room.players[game.turnIndex];
    cuer.score += cuerPoints;

    // Save round history
    game.roundHistory.push({
      round: game.currentRound,
      targetIndex,
      results,
      cuerPoints,
      cuerName: cuer.name,
    });

    // Emit results
    io.to(code).emit('round_results', {
      targetIndex,
      targetColor: COLORS[targetIndex],
      results,
      cuerPoints,
      cuerName: cuer.name,
      scoreboard: room.players.map((p) => ({ name: p.name, score: p.score })),
      round: game.currentRound,
    });

    io.to(code).emit('room_state', formatRoomState(room));

    console.log(`📊 Round ${game.currentRound} ended in ${code}. Cuer earned ${cuerPoints} points`);
  }

  function advanceToNextRound(code) {
    const room = rooms[code];
    if (!room || !room.currentGame) return;

    const game = room.currentGame;
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
        targetIndex: null, // Cuer must select
      };
      game.currentClue = null;
      game.guesses = {};
      game.currentPhaseGuesses = {};

      const clueGiverId = room.players[game.turnIndex].id;

      io.to(code).emit('new_round', {
        round: game.currentRound,
        cardColors: game.card.colors,
        clueGiver: room.players[game.turnIndex].name,
        clueGiverId: room.players[game.turnIndex].id,
      });
      
      // Send target to new clue giver - REMOVED
      /*
      io.to(clueGiverId).emit('target_revealed', {
        targetIndex: game.card.targetIndex,
        targetColor: COLORS[game.card.targetIndex],
      });
      */

      console.log(`🔄 Started round ${game.currentRound} in ${code}`);
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
