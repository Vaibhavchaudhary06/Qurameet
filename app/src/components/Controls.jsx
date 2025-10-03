// app/src/components/Controls.jsx
export default function Controls({
  onToggleMic, onToggleCam, micOn, camOn,
  onShare, onStopShare, isSharing,
  onOpenChat, onReact, onLeave
}) {
  const btn  = "h-10 w-10 sm:h-11 sm:w-11 rounded-full grid place-items-center border hover:bg-slate-50 active:scale-95 shrink-0"
  const icon = "h-5 w-5"

  return (
    <div
      className="fixed bottom-0 left-0 right-0 border-t bg-white z-50"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)', // iOS bottom
      }}
    >
      {/* SCROLLABLE STRIP so icons never clip on small screens */}
      <div
        className="mx-auto max-w-6xl px-2 sm:px-4 py-2 sm:py-3 overflow-x-auto"
        style={{
          paddingLeft: 'calc(env(safe-area-inset-left) + 8px)',
          paddingRight: 'calc(env(safe-area-inset-right) + 8px)',
        }}
      >
        <div className="flex items-center gap-2 sm:gap-3 justify-start min-w-max">
          {/* Mic */}
          <button
            onClick={onToggleMic}
            aria-label={micOn ? 'Mute' : 'Unmute'}
            className={`${btn} ${micOn ? 'border-slate-300' : 'border-red-300 bg-red-50'}`}
            title={micOn ? 'Mute' : 'Unmute'}
          >
            {micOn ? (
              <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 1 1-6 0V6a3 3 0 0 1 3-3Z"/>
                <path d="M19 10a7 7 0 0 1-14 0"/>
                <path d="M12 17v4"/><path d="M8 21h8"/>
              </svg>
            ) : (
              <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 11V6a3 3 0 0 0-5.12-2.12M2 2l20 20"/>
                <path d="M19 10a7 7 0 0 1-7 7 7 7 0 0 1-7-7"/>
              </svg>
            )}
          </button>

          {/* Cam */}
          <button
            onClick={onToggleCam}
            aria-label={camOn ? 'Turn camera off' : 'Turn camera on'}
            className={`${btn} ${camOn ? 'border-slate-300' : 'border-red-300 bg-red-50'}`}
            title={camOn ? 'Turn camera off' : 'Turn camera on'}
          >
            {camOn ? (
              <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 10l4-3v10l-4-3"/><rect x="3" y="6" width="12" height="12" rx="2"/>
              </svg>
            ) : (
              <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 10l4-3v10l-4-3"/><rect x="3" y="6" width="12" height="12" rx="2"/><path d="M2 2l20 20"/>
              </svg>
            )}
          </button>

          {/* Present */}
          {isSharing ? (
            <button onClick={onStopShare} aria-label="Stop sharing" className={`${btn} border-slate-300`} title="Stop sharing">
              <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 22h8M2 16V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z"/>
                <path d="M2 2l20 20"/>
              </svg>
            </button>
          ) : (
            <button onClick={onShare} aria-label="Present now" className={`${btn} border-slate-300`} title="Present now">
              <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 22h8M2 16V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z"/>
                <path d="M12 14V8"/><path d="M9.5 10.5 12 8l2.5 2.5"/>
              </svg>
            </button>
          )}

          {/* Chat (enable in Step-2) */}
          <button onClick={onOpenChat} aria-label="Open chat" className={`${btn} border-slate-300`} title="Open chat">
            <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>
            </svg>
          </button>

          {/* Quick reactions */}
          {['👏','👍','❤️','😂'].map(e => (
            <button
              key={e}
              onClick={() => onReact?.(e)}
              aria-label={`React ${e}`}
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-full border border-slate-300 hover:bg-slate-50 text-base shrink-0"
              title={`React ${e}`}
            >
              {e}
            </button>
          ))}

          {/* Spacer then Leave */}
          <div className="grow" />
          <button
            onClick={onLeave}
            className="px-4 h-10 sm:h-11 rounded-full border bg-red-600 text-white hover:bg-red-700 active:scale-95 shrink-0"
            aria-label="Leave call"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  )
}
