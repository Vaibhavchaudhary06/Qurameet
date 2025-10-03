// app/src/hooks/useWebRTC.js
import { useEffect, useRef, useState, useCallback } from "react";
import { socket, joinRoom, sendSignal } from "../services/signaling";

/**
 * ENV (frontend):
 *  VITE_SIGNALING_URL=https://qura-meet.onrender.com
 *  VITE_STUN_URL=stun:stun.l.google.com:19302
 *  VITE_TURN_URLS=turn:global.xirsys.net:80?transport=udp,turn:global.xirsys.net:3478?transport=udp,turns:global.xirsys.net:443?transport=tcp,turns:global.xirsys.net:5349?transport=tcp
 *  VITE_TURN_USERNAME=...
 *  VITE_TURN_CREDENTIAL=...
 */

export default function useWebRTC(roomId) {
  // ---- PeerConnection ----
  const pcRef = useRef(null);
  const remoteId = useRef(null);

  // ---- Local tracks ----
  const localStreamRef = useRef(new MediaStream());
  const cameraTrackRef = useRef(null);
  const micTrackRef = useRef(null);
  const screenTrackRef = useRef(null);

  // ---- UI state ----
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  // Chat (optional)
  const [messages, setMessages] = useState([]); // [{from,user,text,ts}]

  // Presence / host
  const [isHost, setIsHost] = useState(false);
  const [peersMeta] = useState({});

  // Raise hand
  const [handsUp, setHandsUp] = useState({});
  const [myHandUp, setMyHandUp] = useState(false);

  // ---- ICE servers (Xirsys ready) ----
  const buildIceServers = () => {
    const stun = import.meta.env.VITE_STUN_URL || "stun:stun.l.google.com:19302";
    const turnUrls = (import.meta.env.VITE_TURN_URLS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const username = import.meta.env.VITE_TURN_USERNAME || "";
    const credential = import.meta.env.VITE_TURN_CREDENTIAL || "";

    const servers = [{ urls: [stun] }];
    if (turnUrls.length && username && credential) {
      servers.push({ urls: turnUrls, username, credential });
    }
    return servers;
  };

  // ---- ensure RTCPeerConnection ----
  const ensurePC = useCallback(() => {
    if (pcRef.current && pcRef.current.signalingState !== "closed") {
      return pcRef.current;
    }

    const pc = new RTCPeerConnection({
      iceServers: buildIceServers(),
      // test only: force relay
      // iceTransportPolicy: "relay",
    });

    // Pre-create m-lines so negotiation doesn’t stall when tracks are off
    try {
      pc.addTransceiver("audio", { direction: "sendrecv" });
      pc.addTransceiver("video", { direction: "sendrecv" });
    } catch {}

    pc.onicecandidate = (e) => {
      if (e.candidate && remoteId.current) {
        sendSignal(remoteId.current, { type: "candidate", candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      if (!remoteStream || e.streams[0] !== remoteStream) {
        setRemoteStream(e.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("[PC] state:", pc.connectionState);
    };
    pc.oniceconnectionstatechange = () => {
      console.log("[PC] ICE:", pc.iceConnectionState);
    };

    pcRef.current = pc;
    return pc;
  }, [remoteStream]);

  // ---- helpers for tracks ----
  const stopTrack = (ref) => {
    try {
      ref.current?.stop();
    } catch {}
    ref.current = null;
  };

  const replaceSenderTrack = (kind, track) => {
    const pc = ensurePC();
    const sender = pc.getSenders().find((s) => s.track && s.track.kind === kind);
    if (sender) {
      sender.replaceTrack(track || null);
    } else if (track) {
      pc.addTrack(track, new MediaStream([track]));
    }
  };

  const refreshLocalPreview = () => {
    const ms = new MediaStream();
    if (micTrackRef.current) ms.addTrack(micTrackRef.current);
    if (isSharing && screenTrackRef.current) ms.addTrack(screenTrackRef.current);
    else if (camOn && cameraTrackRef.current) ms.addTrack(cameraTrackRef.current);
    localStreamRef.current = ms;
    setLocalStream(ms);
  };

  // ---- chat send helper ----
  const sendMessage = (text) => {
    const t = String(text || "").trim();
    if (!t) return;
    socket.emit("chat:message", { roomId, text: t });
  };

  // ---- media control ----
  const startMic = useCallback(async () => {
    if (micTrackRef.current) return;
    const s = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    const t = s.getAudioTracks()[0];
    micTrackRef.current = t;
    replaceSenderTrack("audio", t);
    setMicOn(true);
    refreshLocalPreview();
  }, []);

  const stopMic = useCallback(() => {
    stopTrack(micTrackRef);
    replaceSenderTrack("audio", null);
    setMicOn(false);
    refreshLocalPreview();
  }, []);

  const startCamera = useCallback(async () => {
    if (cameraTrackRef.current) return;
    const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    const t = s.getVideoTracks()[0];
    cameraTrackRef.current = t;
    if (!isSharing) replaceSenderTrack("video", t);
    setCamOn(true);
    refreshLocalPreview();
  }, [isSharing]);

  const stopCamera = useCallback(() => {
    stopTrack(cameraTrackRef);
    if (!isSharing) replaceSenderTrack("video", null);
    setCamOn(false);
    refreshLocalPreview();
  }, [isSharing]);

  const toggleMic = () => (micOn ? stopMic() : startMic());
  const toggleCam = () => (camOn ? stopCamera() : startCamera());

  // ---- screen share ----
  const startScreenShare = async () => {
    try {
      const ds = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const track = ds.getVideoTracks()[0];
      if (!track) return;
      track.onended = () => stopScreenShare();
      screenTrackRef.current = track;
      setIsSharing(true);

      const pc = ensurePC();
      const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
      if (sender) await sender.replaceTrack(track);
      else pc.addTrack(track, new MediaStream([track]));
      refreshLocalPreview();
    } catch (e) {
      console.warn("DisplayMedia failed/cancelled", e);
    }
  };

  const stopScreenShare = () => {
    if (!screenTrackRef.current) return;
    stopTrack(screenTrackRef);
    setIsSharing(false);
    if (cameraTrackRef.current) replaceSenderTrack("video", cameraTrackRef.current);
    else replaceSenderTrack("video", null);
    refreshLocalPreview();
  };

  // ---- lifecycle ----
  const leave = useCallback(() => {
    try {
      socket.emit("leave");
    } catch {}
    stopTrack(screenTrackRef);
    stopTrack(cameraTrackRef);
    stopTrack(micTrackRef);
    setMicOn(false);
    setCamOn(false);
    setIsSharing(false);
    setLocalStream(null);
    setRemoteStream(null);
    try {
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;
    remoteId.current = null;
    setIsHost(false);
  }, []);

  // Join room + start media
  useEffect(() => {
    ensurePC();
    startMic().catch(console.error);
    startCamera().catch(console.error);
    joinRoom(roomId);

    return () => leave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // ---- signaling + socket events ----
  useEffect(() => {
    const onPeers = async (peers) => {
      // First joiner becomes host (room empty before you)
      setIsHost(peers.length === 0);

      // Caller path (we already have tracks ready)
      if (peers.length > 0) {
        remoteId.current = peers[0];
        try {
          const pc = ensurePC();
          if (pc.signalingState === "stable") {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendSignal(remoteId.current, { type: "offer", sdp: offer });
            console.log("[SIGNAL] sent offer (onPeers) to", remoteId.current);
          }
        } catch (e) {
          console.warn("Offer (onPeers) failed", e);
        }
      }
    };

    // 👈 FIX: make an offer as soon as someone joins you (host side)
    const onPeerJoined = async (id) => {
      remoteId.current = id;
      try {
        const pc = ensurePC();
        if (pc.signalingState === "stable" && !remoteStream) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendSignal(id, { type: "offer", sdp: offer });
          console.log("[SIGNAL] sent offer (onPeerJoined) to", id);
        }
      } catch (e) {
        console.warn("onPeerJoined offer failed", e);
      }
    };

    const onSignal = async ({ from, data }) => {
      if (!remoteId.current) remoteId.current = from;
      const pc = ensurePC();
      try {
        if (data.type === "offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal(from, { type: "answer", sdp: answer });
          console.log("[SIGNAL] answer sent to", from);
        } else if (data.type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          console.log("[SIGNAL] answer applied from", from);
        } else if (data.type === "candidate") {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (err) {
            console.warn("ICE add fail", err);
          }
        }
      } catch (e) {
        console.warn("Signal handling failed", e);
      }
    };

    const onPeerLeft = () => {
      setRemoteStream(null);
      remoteId.current = null;
    };

    // ✋ hands / 🔇 mute
    const onHandUpdate = ({ user, up }) => {
      setHandsUp((prev) => ({ ...prev, [user]: up }));
    };

    const onHostMuteAll = () => {
      try {
        micTrackRef.current?.stop();
        micTrackRef.current = null;
      } catch {}
      replaceSenderTrack("audio", null);
      setMicOn(false);
      refreshLocalPreview();
    };

    // 💬 chat
    const onChatMessage = ({ from, user, text, ts }) => {
      setMessages((prev) => [...prev, { from, user, text, ts }]);
    };

    socket.on("peers", onPeers);
    socket.on("peer:joined", onPeerJoined);
    socket.on("signal", onSignal);
    socket.on("peer:left", onPeerLeft);
    socket.on("hand:update", onHandUpdate);
    socket.on("host:muteall", onHostMuteAll);
    socket.on("chat:message", onChatMessage);

    return () => {
      socket.off("peers", onPeers);
      socket.off("peer:joined", onPeerJoined);
      socket.off("signal", onSignal);
      socket.off("peer:left", onPeerLeft);
      socket.off("hand:update", onHandUpdate);
      socket.off("host:muteall", onHostMuteAll);
      socket.off("chat:message", onChatMessage);
    };
  }, [roomId, ensurePC, remoteStream]);

  // ---- reactions (socket) ----
  const sendReaction = (emoji) => socket.emit("reaction", { roomId, emoji });
  const onReaction = (cb) => socket.on("reaction", cb);
  const offReaction = (cb) => socket.off("reaction", cb);

  // ---- raise hand / mute all ----
  const raiseHand = () => {
    const next = !myHandUp;
    setMyHandUp(next);
    socket.emit(next ? "hand:raise" : "hand:lower", { roomId });
  };

  const muteAll = () => socket.emit("host:muteall", { roomId });

  // tab close safety
  useEffect(() => {
    const handleUnload = () => {
      try {
        socket.emit("leave");
      } catch {}
      leave();
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [leave]);

  // (optional) subscribe helpers for ChatPanel
  const onChat = (cb) => socket.on("chat:message", cb);
  const offChat = (cb) => socket.off("chat:message", cb);

  return {
    // media
    localStream,
    remoteStream,
    micOn,
    camOn,
    isSharing,
    toggleMic,
    toggleCam,
    startScreenShare,
    stopScreenShare,
    leave,

    // reactions
    sendReaction,
    onReaction,
    offReaction,

    // presence / host
    isHost,
    peersMeta,

    // host/hand
    raiseHand,
    muteAll,
    myHandUp,
    handsUp,

    // chat
    messages,
    sendMessage,
    onChat,
    offChat,
  };
}
