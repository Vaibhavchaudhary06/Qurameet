// app/src/components/ChatPanel.jsx
import { useEffect, useRef, useState } from "react";
import { socket } from "../services/signaling";

export default function ChatPanel({ open, onClose, onSend, onSub, onUnsub }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const listRef = useRef(null);

  const scrollToBottom = () => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  // subscribe to incoming messages (server echo)
  useEffect(() => {
    if (!onSub) return;
    const handler = (m) => {
      const normalized = {
        text: m.text,
        from: m.from ?? "",     // socketId of sender
        user: m.user ?? "",     // display name (if provided by server)
        ts: m.ts ?? Date.now(),
      };
      setMessages((prev) => [...prev, normalized]);
    };
    onSub(handler);
    return () => onUnsub && onUnsub(handler);
  }, [onSub, onUnsub]);

  useEffect(() => { scrollToBottom(); }, [messages, open]);

  const send = (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;
    // ❌ don't push locally; let server echo render it once
    onSend && onSend(text);
    setInput("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      {/* backdrop */}
      <button
        className="absolute inset-0 bg-black/30"
        aria-label="Close chat"
        onClick={onClose}
      />

      {/* panel */}
      <div className="absolute right-0 top-0 bottom-0 w-full md:w-[360px] md:rounded-l-2xl bg-white shadow-xl md:border-l">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between px-4 h-12 border-b">
            <div className="font-semibold">In-call messages</div>
            <button className="text-sm px-2 py-1 rounded hover:bg-slate-100" onClick={onClose}>
              Close
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-auto px-3 py-3 space-y-2">
            {messages.length === 0 && (
              <div className="text-sm text-slate-500">No messages yet</div>
            )}
            {messages.map((m, idx) => {
              const mine = m.from === socket.id;
              return (
                <div key={`${m.ts}-${idx}`} className={`max-w-[80%] ${mine ? "ml-auto" : ""}`}>
                  {!mine && m.user && (
                    <div className="text-[11px] text-slate-500 mb-0.5">{m.user}</div>
                  )}
                  <div className={`rounded-2xl px-3 py-2 text-sm border ${mine ? "bg-sky-50 border-sky-200" : "bg-white border-slate-200"}`}>
                    {m.text}
                  </div>
                  <div className={`mt-1 text-[10px] text-slate-400 ${mine ? "text-right" : ""}`}>
                    {new Date(m.ts).toLocaleTimeString()}
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={send} className="border-t p-2 flex gap-2">
            <input
              className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-sky-500"
              placeholder="Send a message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-3 py-2 rounded-xl border bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
