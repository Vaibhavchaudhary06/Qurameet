import { io } from "socket.io-client";

const SIGNALING_URL =
  import.meta.env.VITE_SIGNALING_URL || "http://localhost:5174";

export const socket = io(SIGNALING_URL, {
  transports: ["websocket"],
});

// helper functions
export function joinRoom(roomId, user) {
  socket.emit("join", { roomId, user });
}

export function sendSignal(to, data) {
  socket.emit("signal", { to, data });
}
