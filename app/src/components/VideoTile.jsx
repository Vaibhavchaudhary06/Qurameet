// app/src/components/VideoTile.jsx
import { useEffect, useRef } from "react";

/**
 * Props:
 * - stream: MediaStream | null
 * - muted: boolean  (local ke liye usually true)
 * - label: string   (fallback label e.g. "You" / "Guest")
 * - name: string    (display name)
 * - avatar: string  (image URL, optional)
 * - handUp: boolean (✋ badge)
 */
export default function VideoTile({
  stream,
  muted = false,
  label = "",
  name = "",
  avatar = "",
  handUp = false,
}) {
  const videoRef = useRef(null);

  // attach/detach stream to <video>
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (stream) {
      el.srcObject = stream;
      const play = () => el.play().catch(() => {});
      // try play when metadata loaded
      el.onloadedmetadata = play;
      // and immediately
      play();
    } else {
      el.srcObject = null;
    }
    return () => {
      if (el) el.srcObject = null;
    };
  }, [stream]);

  const displayName = name?.trim() || label || "Guest";

  return (
    <div className="relative rounded-2xl border bg-black overflow-hidden">
      {/* VIDEO */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`w-full h-full object-cover ${stream ? "" : "opacity-0"}`}
      />

      {/* AVATAR FALLBACK (jab video na ho) */}
      {!stream && (
        <div className="absolute inset-0 grid place-items-center bg-slate-900">
          {avatar ? (
            <img
              src={avatar}
              alt={displayName}
              className="h-24 w-24 rounded-full object-cover border border-slate-700"
            />
          ) : (
            <div className="h-24 w-24 rounded-full grid place-items-center bg-slate-800 text-white text-3xl font-semibold select-none">
              {displayName
                .split(" ")
                .map((w) => w[0]?.toUpperCase())
                .slice(0, 2)
                .join("") || "U"}
            </div>
          )}
        </div>
      )}

      {/* BOTTOM LABEL BAR */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
        <div className="px-2.5 py-1 rounded-lg bg-white/90 text-[13px] font-medium text-slate-900 shadow-sm flex items-center gap-2">
          <span className="truncate max-w-[50vw] sm:max-w-[220px]">{displayName}</span>

          {/* muted tag (optional visual) */}
          {muted && (
            <span
              className="inline-flex items-center gap-1 text-[12px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200"
              title="Muted"
            >
              {/* mic-off icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 10v2a3 3 0 0 0 5.4 1.6M15 10V7a3 3 0 1 0-6 0v1"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
                <path
                  d="M4 11a8 8 0 0 0 12.5 6M12 19v2M19 5 5 19"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
              Muted
            </span>
          )}
        </div>
      </div>

      {/* HAND BADGE (top-right) */}
      {handUp && (
        <div
          className="absolute top-2 right-2 rounded-full bg-amber-100 text-amber-800 border border-amber-200 px-2 py-1 text-xs font-semibold shadow"
          title="Hand raised"
        >
          ✋ Hand
        </div>
      )}
    </div>
  );
}
