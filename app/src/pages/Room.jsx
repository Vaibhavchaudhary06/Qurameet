// app/src/pages/Room.jsx
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import useWebRTC from '../hooks/useWebRTC'
import VideoTile from '../components/VideoTile'
import Controls from '../components/Controls'
import ReactionsOverlay from '../components/ReactionsOverlay'
import ChatPanel from '../components/ChatPanel'   // 👈 ADD THIS

export default function Room() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const {
    localStream, remoteStream,
    micOn, camOn, isSharing,
    toggleMic, toggleCam,
    startScreenShare, stopScreenShare,
    leave,
    sendReaction, onReaction, offReaction,

    // host & presence
    isHost, peersMeta,
    raiseHand, muteAll,
    myHandUp, handsUp,

    // 👇 chat APIs must be returned by your hook
    sendChat, onChat, offChat,
  } = useWebRTC(roomId)

  const [toast, setToast] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setToast('Link copied')
  }
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 1400)
    return () => clearTimeout(t)
  }, [toast])

  const goHome = () => { leave(); navigate('/') }

  // for 1:1, pick first remote id (peersMeta may be empty, so fallback to handsUp keys)
  const firstRemoteId =
    Object.keys(peersMeta || {})[0] ||
    Object.keys(handsUp || {})[0]

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-[96px]">
      <div className="flex items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-sm">Room</span>
          <span className="font-semibold text-slate-900">/</span>
          <span className="font-semibold text-sky-700">{roomId}</span>
          {isHost && (
            <span className="ml-2 rounded bg-amber-100 text-amber-800 text-xs px-2 py-0.5">
              Host
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyLink}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          >
            Copy link
          </button>
          <button
            onClick={goHome}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 hidden sm:inline"
          >
            Home
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <VideoTile
          stream={localStream}
          muted
          label="You"
          name={user?.name}
          avatar={user?.avatar}
          handUp={!!myHandUp}
        />
        <VideoTile
          stream={remoteStream}
          label="Guest"
          name={peersMeta?.[firstRemoteId]?.name}
          avatar={peersMeta?.[firstRemoteId]?.avatar}
          handUp={!!(handsUp && firstRemoteId && handsUp[firstRemoteId])}
        />
      </div>

      {!remoteStream && (
        <p className="mt-3 text-sm text-slate-600">
          Waiting for a guest to join… Share the invite link.
        </p>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 rounded-full border bg-white shadow px-4 py-2 text-sm z-40">
          {toast}
        </div>
      )}

      <ReactionsOverlay onSub={onReaction} onUnsub={offReaction} />

      {/* Controls */}
      <Controls
        onToggleMic={toggleMic}
        onToggleCam={toggleCam}
        micOn={micOn}
        camOn={camOn}
        onShare={startScreenShare}
        onStopShare={stopScreenShare}
        isSharing={isSharing}
        onOpenChat={() => setChatOpen(true)}
        onReact={sendReaction}
        onRaiseHand={raiseHand}
        myHandUp={!!myHandUp}
        isHost={isHost}
        onMuteAll={muteAll}
        onLeave={goHome}
      />

      {/* 👇 Chat panel MOUNTED here */}
      <ChatPanel
       open={chatOpen}
       onClose={() => setChatOpen(false)}
        onSend={sendChat}
       onSub={onChat}
       onUnsub={offChat}
     />

    </div>
  )
}
