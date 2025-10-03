// app/src/services/signaling.js
import { io } from "socket.io-client";

// ❗ MUST be https on Vercel/production
// Vercel env: VITE_SIGNALING_URL=https://qura-meet.onrender.com
const RAW = import.meta.env.VITE_SIGNALING_URL || "";
const BASE = RAW.replace(/\/+$/, ""); // drop trailing slash

if (!BASE) {
  console.error("[SIGNALING] Missing VITE_SIGNALING_URL env!");
}

// Build WS url (wss for https, ws for http)
function toWs(url) {
  try {
    const u = new URL(url);
    if (u.protocol === "https:") u.protocol = "wss:";
    if (u.protocol === "http:") u.protocol = "ws:";
    return u.toString();
  } catch {
    return url;
  }
}

export const socket = io(BASE || "http://localhost:5174", {
  transports: ["websocket"],     // force websocket (no long polling)
  withCredentials: false,
  path: "/socket.io",            // explicit (default hi hai, but keep it)
});

// Helpful logs for debugging
socket.on("connect", () => console.log("[socket] connected:", socket.id));
socket.on("connect_error", (e) => console.error("[socket] connect_error:", e?.message || e));
socket.on("disconnect", (r) => console.warn("[socket] disconnected:", r));

// Helper functions
export function joinRoom(roomId, user) {
  console.log("[socket] join", roomId, user);
  socket.emit("join", { roomId, user });
}

export function sendSignal(to, data) {
  socket.emit("signal", { to, data });
}
