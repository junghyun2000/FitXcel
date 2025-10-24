const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Import and use your auth routes
const authRoutes = require('./routes/auth'); // Make sure this file exists!
const mealsRoutes = require('./routes/meals');  // for meals
const plansRoutes = require('./routes/plans'); // for meal plans
const workoutRoutes = require('./routes/workout');
const profileRoutes = require('./routes/profile');
app.use('/auth', authRoutes);
app.use('/workout', workoutRoutes);
app.use('/meals', mealsRoutes);
app.use('/plans', plansRoutes);
app.use('/profile', profileRoutes);

// MULTIPLAYER SOCKET.IO SETUP

const http = require("http");
const { Server } = require("socket.io");
const { randomUUID } = require("crypto");

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  pingInterval: 25000,   // every 25 s
  pingTimeout: 60000,    // 1 min before considered dead
  transports: ["websocket", "polling"], // skip polling layer
});

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  // --- Create Room ---
  socket.on("createRoom", (playerData) => {
    const roomId = randomUUID().slice(0, 6).toUpperCase();
    socket.join(roomId);
    socket.playerData = playerData;
    socket.emit("roomCreated", { roomId });
    console.log(`Room ${roomId} created by ${socket.id}`);
  });

  // --- Join Room ---
  socket.on("joinRoom", ({ roomId, playerData }) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    if (room) {
        socket.join(roomId);
        socket.playerData = playerData;
        console.log(`${socket.id} joined room ${roomId}`);

        // collect all players in the room
        const players = [];
        for (const id of room) {
            const s = io.sockets.sockets.get(id);
            if (s && s.playerData) {
                players.push({ id, stats: s.playerData.stats });
            }
        }

        console.log("✅ matchReady emitted:", players.map(p => p.id));
        io.to(roomId).emit("matchReady", { roomId, players });
    } else {
        socket.emit("errorMsg", "Room not found.");
    }
  });

  socket.on("attack", ({ roomId, from, damage, isSpecial }) => {
    console.log(`⚔️ ${from} attacked in room ${roomId} for ${damage}`);
    // Send to everyone else in the room
    socket.to(roomId).emit("attackEvent", { from, damage, isSpecial });
    io.to(roomId).emit("checkVictory");
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
  });

  socket.on("forfeit", ({ roomId, from }) => {
    console.log(`🏳️ ${from} forfeited in room ${roomId}`);
    socket.to(roomId).emit("battleEnd", { winner: "enemy" });
  });
});


const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running with sockets on port ${PORT}`));