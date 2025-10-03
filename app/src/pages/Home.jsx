// app/src/pages/Home.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import HomeCarousel from "../components/HomeCarousel";

// extract code whether user pasted full link or just the code
function extractRoomCode(input) {
  const s = (input || "").trim();
  if (!s) return "";
  // try URL first
  try {
    const u = new URL(s);
    const parts = u.pathname.split("/").filter(Boolean);
    return (parts[parts.length - 1] || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  } catch {
    // not a URL -> sanitize as code
    return s.replace(/[^a-z0-9]/gi, "").toLowerCase();
  }
}

export default function Home() {
  const [roomInput, setRoomInput] = useState("");
  const navigate = useNavigate();

  const createRoom = () => {
    const id = Math.random().toString(36).slice(2, 10);
    navigate(`/room/${id}`);
  };

  const joinRoom = (e) => {
    e.preventDefault();
    const code = extractRoomCode(roomInput);
    if (code) navigate(`/room/${code}`);
  };

  const codePreview = extractRoomCode(roomInput);
  const disabled = codePreview.length === 0;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <div className="pt-10 sm:pt-14" />

      <h1 className="text-center font-bold text-slate-900 tracking-tight text-[34px] leading-[42px] sm:text-6xl sm:leading-[64px]">
        Video calls and meetings
        <br className="hidden sm:block" /> for everyone
      </h1>

      <p className="mt-4 text-center text-slate-600 text-lg">
        Connect, collaborate and celebrate from anywhere with{" "}
        <span className="text-sky-700">Qura</span>{" "}
        <span className="text-slate-900">Meet</span>
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={createRoom}
          className="relative rounded-full px-6 py-3 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 active:scale-[.98] border-2 border-sky-700 shadow-[0_0_0_3px_rgba(59,130,246,0.25)]"
        >
          <span className="inline-flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
              <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" opacity=".6" />
            </svg>
            New meeting
          </span>
        </button>

        <Link
          to="/schedule"
          className="rounded-full px-6 py-3 text-sm font-medium border border-slate-300 text-slate-800 hover:bg-slate-50 active:scale-[.98]"
        >
          Schedule
        </Link>

        <form onSubmit={joinRoom} className="flex w-full sm:w-auto items-center gap-2">
          <div className="relative flex-1 sm:w-[360px]">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M10.5 7h-4a3.5 3.5 0 0 0 0 7h4M13.5 10h4a3.5 3.5 0 1 1 0 7h-4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <input
              className="w-full rounded-full border border-slate-300 bg-white pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 ring-sky-500 placeholder:text-slate-500"
              placeholder="Enter a code or link"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={disabled}
            className={`rounded-full px-5 py-3 text-sm font-medium border ${
              disabled
                ? "text-slate-400 border-slate-200 cursor-not-allowed"
                : "text-slate-800 border-slate-300 hover:bg-slate-50 active:scale-[.98]"
            }`}
          >
            Join
          </button>
        </form>
      </div>

      <hr className="mt-10 border-slate-200" />
      <HomeCarousel />
    </div>
  );
}
