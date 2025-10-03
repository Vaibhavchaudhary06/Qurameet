// server/index.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.get("/", (_req, res) => res.send("Qura Meet Signaling Server running ✅"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// room state: { peers:Set<string>, hostId:string|null, users: Map<socketId, {name, avatar}> }
const rooms = new Map();

io.on("connection", (socket) => {
  let currentRoom = null;

  const cleanupRoom = (roomId) => {
    const state = rooms.get(roomId);
    if (!state) return;
    if (state.peers.size === 0) rooms.delete(roomId);
  };

  // --- JOIN ---
  socket.on("join", (payload) => {
    const isObj = payload && typeof payload === "object";
    const roomId = isObj ? payload.roomId : String(payload || "").trim();
    const user = isObj ? payload.user || { name: "Guest" } : { name: "Guest" };
    if (!roomId) return;

    currentRoom = roomId;
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { peers: new Set(), hostId: null, users: new Map() });
    }

    const state = rooms.get(roomId);
    state.peers.add(socket.id);
    state.users.set(socket.id, user);
    if (!state.hostId) state.hostId = socket.id; // first joiner = host

    // send existing peers to the new peer
    const peers = [...state.peers].filter((id) => id !== socket.id);
    socket.emit("peers", peers);

    // send presence snapshot
    socket.emit("presence:init", {
      hostId: state.hostId,
      users: Object.fromEntries(state.users),
    });

    socket.join(roomId);

    // notify others about the new peer
    socket.to(roomId).emit("peer:joined", { id: socket.id, user });
    io.to(roomId).emit("presence:update", { type: "join", id: socket.id, user });

    console.log(`[JOIN] ${user.name} (${socket.id}) joined room ${roomId}`);
  });

  // --- SIGNAL (offer/answer/candidate) ---
  socket.on("signal", ({ to, data }) => {
    if (!to || !data) return;
    const state = currentRoom ? rooms.get(currentRoom) : null;
    if (!state || !state.peers.has(to)) return;
    io.to(to).emit("signal", { from: socket.id, data });
    console.log(`[SIGNAL] from ${socket.id} -> ${to} (${data.type || "candidate"})`);
  });

  // --- CHAT ---
  let lastChatAt = 0;
  socket.on("chat:message", ({ roomId, text }) => {
    const r = roomId || currentRoom;
    if (!r || !text || !String(text).trim()) return;

    const now = Date.now();
    if (now - lastChatAt < 250) return; // prevent spam (4 msgs/sec)
    lastChatAt = now;

    const name = rooms.get(r)?.users.get(socket.id)?.name || "Guest";
    io.to(r).emit("chat:message", {
      from: socket.id,
      user: name,
      text: String(text),
      ts: now,
    });
    console.log(`[CHAT] ${name}: ${text}`);
  });

  // --- REACTIONS ---
  socket.on("reaction", ({ roomId, emoji }) => {
    const r = roomId || currentRoom;
    if (!r || !emoji) return;
    io.to(r).emit("reaction", { from: socket.id, emoji });
  });

  // --- HAND RAISE/LOWER ---
  socket.on("hand:raise", ({ roomId }) => {
    const r = roomId || currentRoom;
    if (!r) return;
    io.to(r).emit("hand:update", { user: socket.id, up: true });
  });
  socket.on("hand:lower", ({ roomId }) => {
    const r = roomId || currentRoom;
    if (!r) return;
    io.to(r).emit("hand:update", { user: socket.id, up: false });
  });

  // --- HOST: MUTE ALL ---
  socket.on("host:muteall", ({ roomId }) => {
    const r = roomId || currentRoom;
    if (!r) return;
    const state = rooms.get(r);
    if (state?.hostId !== socket.id) return; // only host can do this
    io.to(r).emit("host:muteall");
  });

  // --- LEAVE ---
  socket.on("leave", () => {
    if (!currentRoom) return;
    const state = rooms.get(currentRoom);
    state?.peers.delete(socket.id);
    state?.users.delete(socket.id);

    socket.to(currentRoom).emit("peer:left", { id: socket.id });
    io.to(currentRoom).emit("presence:update", { type: "leave", id: socket.id });

    if (state && state.hostId === socket.id) {
      state.hostId = [...state.peers][0] || null;
      io.to(currentRoom).emit("presence:host", { hostId: state.hostId });
    }

    socket.leave(currentRoom);
    cleanupRoom(currentRoom);
    console.log(`[LEAVE] ${socket.id} left room ${currentRoom}`);
    currentRoom = null;
  });

  // --- DISCONNECT ---
  socket.on("disconnect", () => {
    if (!currentRoom) return;
    const state = rooms.get(currentRoom);
    state?.peers.delete(socket.id);
    state?.users.delete(socket.id);

    socket.to(currentRoom).emit("peer:left", { id: socket.id });
    io.to(currentRoom).emit("presence:update", { type: "leave", id: socket.id });

    if (state && state.hostId === socket.id) {
      state.hostId = [...state.peers][0] || null;
      io.to(currentRoom).emit("presence:host", { hostId: state.hostId });
    }

    cleanupRoom(currentRoom);
    console.log(`[DISCONNECT] ${socket.id} disconnected from room ${currentRoom}`);
  });
});

// --- START SERVER ---
const PORT = process.env.PORT || 5174;
server.listen(PORT, () => console.log("🚀 Signaling Server running on port", PORT));
