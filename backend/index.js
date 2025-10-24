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
});

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  // --- Create Room ---
  socket.on("createRoom", (playerData) => {
    const roomId = randomUUID().slice(0, 6).toUpperCase();
    socket.join(roomId);
    socket.emit("roomCreated", { roomId });
    console.log(`Room ${roomId} created by ${socket.id}`);
  });

  // --- Join Room ---
  socket.on("joinRoom", ({ roomId, playerData }) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    if (room) {
      socket.join(roomId);
      io.to(roomId).emit("matchFound", {
        roomId,
        players: [{ id: socket.id, stats: playerData.stats }],
      });
      console.log(`${socket.id} joined room ${roomId}`);
    } else {
      socket.emit("errorMsg", "Room not found.");
    }
  });

  // --- Relay Attacks between players ---
  socket.on("attack", (data) => {
    io.to(data.roomId).emit("attackEvent", data);
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running with sockets on port ${PORT}`));