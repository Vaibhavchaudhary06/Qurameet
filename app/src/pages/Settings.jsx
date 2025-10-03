import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

const SETTINGS_KEY = "qura_settings";
const defaultSettings = {
  profile: { name: "Guest", avatar: "" },
  av: {
    micId: "", camId: "", spkId: "",
    autoMute: false, autoCamOff: false,
    noiseSuppression: true, echoCancellation: true,
    videoQuality: "720p"
  },
  meeting: { confirmLeave: true, copyLinkOnCreate: true, joinSound: true },
  chat: { enabled: true, reactions: true, emojiSize: "M", autoOpenOnMention: true },
  notifications: { enabled: true, onMention: true, onChat: true, onJoin: false },
  access: { captions: false, captionLang: "en" },
  privacy: { askShare: true, recordingConsent: true, anonPublic: false },
  pwa: { lowBandwidth: false, disableHWAccel: false },
  host: { muteAllOnJoin: false, allowUnmute: true, sharePolicy: "anyone", chatPolicy: "everyone" },
  appearance: { theme: "light", accent: "sky", compact: false },
  language: { ui: "en", timeFormat: "24h", tz: "" }
};

function loadSettings() {
  try { return { ...defaultSettings, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}) }; }
  catch { return { ...defaultSettings }; }
}
function saveSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
}

const Section = ({ title, children, right }) => (
  <div className="rounded-2xl border p-4 md:p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      {right}
    </div>
    <div className="grid gap-3">{children}</div>
  </div>
);

const Row = ({ label, desc, children }) => (
  <label className="grid gap-1 md:grid-cols-3 md:items-center">
    <div className="md:col-span-1">
      <div className="font-medium">{label}</div>
      {desc && <div className="text-xs text-slate-500">{desc}</div>}
    </div>
    <div className="md:col-span-2">{children}</div>
  </label>
);

export default function Settings() {
  const { user, login, logout } = useAuth() || {};
  const [s, setS] = useState(loadSettings());

  const [mics, setMics] = useState([]);
  const [cams, setCams] = useState([]);
  const [spks, setSpks] = useState([]);

  const videoRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const camStreamRef = useRef(null);
  const [inputLevel, setInputLevel] = useState(0);

  const [meterOn, setMeterOn] = useState(false);
  const [previewOn, setPreviewOn] = useState(false);

  const qualityConstraints = useMemo(() => ({
    "360p": { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 24 } },
    "480p": { width: { ideal: 854 }, height: { ideal: 480 }, frameRate: { ideal: 24 } },
    "720p": { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
    "1080p": { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
  }), []);

  // Enumerate devices (no auto-permission)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await navigator.mediaDevices.enumerateDevices();
        if (!mounted) return;
        setMics(list.filter(d => d.kind === "audioinput"));
        setCams(list.filter(d => d.kind === "videoinput"));
        setSpks(list.filter(d => d.kind === "audiooutput"));
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  // Mic meter (opt-in)
  useEffect(() => {
    if (!meterOn) {
      try { micStreamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
      return;
    }
    let raf;
    (async () => {
      try {
        try { micStreamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
        const ms = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: s.av.micId ? { exact: s.av.micId } : undefined,
            echoCancellation: s.av.echoCancellation,
            noiseSuppression: s.av.noiseSuppression
          }
        });
        micStreamRef.current = ms;

        audioCtxRef.current = audioCtxRef.current || new (window.AudioContext || window.webkitAudioContext)();
        const source = audioCtxRef.current.createMediaStreamSource(ms);
        analyserRef.current = audioCtxRef.current.createAnalyser();
        analyserRef.current.fftSize = 512;
        source.connect(analyserRef.current);

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        const tick = () => {
          analyserRef.current.getByteTimeDomainData(dataArray);
          let peak = 0;
          for (let i = 0; i < dataArray.length; i++) {
            peak = Math.max(peak, Math.abs(dataArray[i] - 128));
          }
          setInputLevel(Math.min(100, Math.round((peak / 128) * 100)));
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {}
    })();
    return () => {
      cancelAnimationFrame(raf);
      try { micStreamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
    };
  }, [meterOn, s.av.micId, s.av.noiseSuppression, s.av.echoCancellation]);

  // Camera preview (opt-in)
  useEffect(() => {
    if (!previewOn) {
      if (videoRef.current) videoRef.current.srcObject = null;
      try { camStreamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
      return;
    }
    (async () => {
      try {
        try { camStreamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
        const ms = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: s.av.camId ? { exact: s.av.camId } : undefined,
            ...qualityConstraints[s.av.videoQuality]
          },
          audio: false
        });
        camStreamRef.current = ms;
        if (videoRef.current) videoRef.current.srcObject = ms;
      } catch {
        if (videoRef.current) videoRef.current.srcObject = null;
      }
    })();
    return () => {
      try { camStreamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
    };
  }, [previewOn, s.av.camId, s.av.videoQuality, qualityConstraints]);

  // Safety cleanup
  useEffect(() => {
    const stopAll = () => {
      try { micStreamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
      try { camStreamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
    };
    window.addEventListener('beforeunload', stopAll);
    return () => { window.removeEventListener('beforeunload', stopAll); stopAll(); };
  }, []);

  const set = (path, value) => {
    setS(prev => {
      const next = structuredClone(prev);
      const segs = path.split(".");
      let obj = next;
      for (let i = 0; i < segs.length - 1; i++) obj = obj[segs[i]];
      obj[segs.at(-1)] = value;
      return next;
    });
  };

  const saveAll = () => {
    saveSettings(s);
    login?.({ name: s.profile.name?.trim() || "Guest", avatar: s.profile.avatar?.trim() || "" });
    alert("Settings saved");
  };
  const resetDefaults = () => {
    if (!confirm("Reset all settings to defaults?")) return;
    setS(structuredClone(defaultSettings));
    saveSettings(defaultSettings);
    login?.({ name: "Guest", avatar: "" });
  };

  const playTestTone = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    gain.gain.value = 0.05; osc.connect(gain).connect(ctx.destination);
    osc.frequency.value = 440; osc.start();
    setTimeout(() => { osc.stop(); ctx.close(); }, 800);
  };

  const tabs = [
    "Profile","Audio & Video","Meeting","Chat & Reactions","Notifications",
    "Accessibility","Host Controls","Appearance","Shortcuts","Data & Storage","Advanced"
  ];
  const [tab, setTab] = useState(tabs[0]);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded-md border" onClick={resetDefaults}>Reset</button>
          <button className="px-3 py-2 rounded-md bg-sky-600 text-white" onClick={saveAll}>Save</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1">
        <select className="md:hidden rounded-lg border px-3 py-2"
          value={tab} onChange={(e)=>setTab(e.target.value)}>
          {tabs.map(t => <option key={t}>{t}</option>)}
        </select>
        <div className="hidden md:flex gap-2">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2 rounded-lg border ${tab===t?"bg-sky-50 border-sky-200 text-sky-700":"hover:bg-slate-50"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 mt-4">
        {tab === "Profile" && (
          <Section title="Profile">
            <Row label="Display name">
              <input className="rounded-lg border px-3 py-2 w-full"
                value={s.profile.name} onChange={e=>set("profile.name", e.target.value)} />
            </Row>
            <Row label="Avatar URL">
              <input className="rounded-lg border px-3 py-2 w-full"
                value={s.profile.avatar} onChange={e=>set("profile.avatar", e.target.value)} />
            </Row>
          </Section>
        )}

        {tab === "Audio & Video" && (
          <Section title="Audio & Video" right={
            <button onClick={playTestTone} className="px-3 py-2 rounded-md border">Play test tone</button>
          }>
            <Row label="Microphone">
              <select className="rounded-lg border px-3 py-2 w-full"
                value={s.av.micId} onChange={(e)=>set("av.micId", e.target.value)}>
                <option value="">Default</option>
                {mics.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label||`Mic`}</option>)}
              </select>
              <div className="mt-2 h-2 w-full rounded bg-slate-200 overflow-hidden">
                <div className="h-full bg-sky-500 transition-all" style={{width:`${inputLevel}%`}} />
              </div>
              <div className="mt-2 flex gap-2">
                <button onClick={()=>setMeterOn(v=>!v)} className="px-3 py-1.5 border rounded">
                  {meterOn?"Stop mic meter":"Start mic meter"}
                </button>
                <button
                  onClick={async()=>{
                    try{
                      const tmp=await navigator.mediaDevices.getUserMedia({audio:true,video:true});
                      tmp.getTracks().forEach(t=>t.stop());
                      const list=await navigator.mediaDevices.enumerateDevices();
                      setMics(list.filter(d=>d.kind==="audioinput"));
                      setCams(list.filter(d=>d.kind==="videoinput"));
                      setSpks(list.filter(d=>d.kind==="audiooutput"));
                      alert("Labels unlocked");
                    }catch{alert("Permission denied");}
                  }}
                  className="px-3 py-1.5 border rounded"
                >
                  Unlock device labels
                </button>
              </div>
            </Row>

            <Row label="Camera">
              <select className="rounded-lg border px-3 py-2 w-full"
                value={s.av.camId} onChange={(e)=>set("av.camId", e.target.value)}>
                <option value="">Default</option>
                {cams.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label||`Cam`}</option>)}
              </select>
              <div className="flex gap-2 my-2">
                <button onClick={()=>setPreviewOn(v=>!v)} className="px-3 py-1.5 border rounded">
                  {previewOn?"Stop preview":"Start preview"}
                </button>
              </div>
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              </div>
            </Row>

            <Row label="Audio processing">
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={s.av.noiseSuppression} onChange={e=>set("av.noiseSuppression", e.target.checked)} />
                  Noise suppression
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={s.av.echoCancellation} onChange={e=>set("av.echoCancellation", e.target.checked)} />
                  Echo cancellation
                </label>
              </div>
            </Row>

            <Row label="On join">
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2"><input type="checkbox" checked={s.av.autoMute} onChange={e=>set("av.autoMute", e.target.checked)} />Mute mic</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={s.av.autoCamOff} onChange={e=>set("av.autoCamOff", e.target.checked)} />Turn off camera</label>
              </div>
            </Row>

            <Row label="Video quality">
              <select className="rounded-lg border px-3 py-2 w-full"
                value={s.av.videoQuality} onChange={(e)=>set("av.videoQuality", e.target.value)}>
                <option>360p</option><option>480p</option><option>720p</option><option>1080p</option>
              </select>
            </Row>
          </Section>
        )}

        {tab === "Meeting" && (
          <Section title="Meeting behavior">
            <Row label="Leave confirmation">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={s.meeting.confirmLeave} onChange={e=>set("meeting.confirmLeave", e.target.checked)} />
                Ask before leaving meeting
              </label>
            </Row>
            <Row label="Copy link">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={s.meeting.copyLinkOnCreate} onChange={e=>set("meeting.copyLinkOnCreate", e.target.checked)} />
                Auto-copy link after creating room
              </label>
            </Row>
            <Row label="Sounds">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={s.meeting.joinSound} onChange={e=>set("meeting.joinSound", e.target.checked)} />
                Play join/leave sound
              </label>
            </Row>
          </Section>
        )}

        {tab === "Chat & Reactions" && (
          <Section title="Chat & Reactions">
            <Row label="Chat">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={s.chat.enabled} onChange={e=>set("chat.enabled", e.target.checked)} />
                Enable in-meeting chat
              </label>
            </Row>
            <Row label="Reactions">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={s.chat.reactions} onChange={e=>set("chat.reactions", e.target.checked)} />
                  Show reactions overlay
                </label>
                <select className="rounded-lg border px-3 py-2" value={s.chat.emojiSize} onChange={e=>set("chat.emojiSize", e.target.value)}>
                  <option value="S">Small</option>
                  <option value="M">Medium</option>
                  <option value="L">Large</option>
                </select>
              </div>
            </Row>
            <Row label="@mention">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={s.chat.autoOpenOnMention} onChange={e=>set("chat.autoOpenOnMention", e.target.checked)} />
                Auto-open chat on @mention
              </label>
            </Row>
          </Section>
        )}

        {tab === "Notifications" && (
          <Section title="Notifications" right={
            <button
              className="px-3 py-2 rounded-md border"
              onClick={async ()=>{
                try {
                  const res = await Notification.requestPermission();
                  alert("Permission: " + res);
                } catch {}
              }}
            >
              Request permission
            </button>
          }>
            <Row label="Browser notifications">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={s.notifications.enabled} onChange={e=>set("notifications.enabled", e.target.checked)} />
                Enable notifications
              </label>
            </Row>
            <Row label="Notify on">
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2"><input type="checkbox" checked={s.notifications.onMention} onChange={e=>set("notifications.onMention", e.target.checked)} />Mention</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={s.notifications.onChat} onChange={e=>set("notifications.onChat", e.target.checked)} />New chat</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={s.notifications.onJoin} onChange={e=>set("notifications.onJoin", e.target.checked)} />Participant joined</label>
              </div>
            </Row>
          </Section>
        )}

        {tab === "Accessibility" && (
          <Section title="Accessibility">
            <Row label="Live captions">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2"><input type="checkbox" checked={s.access.captions} onChange={e=>set("access.captions", e.target.checked)} />Enable captions</label>
                <select className="rounded-lg border px-3 py-2" value={s.access.captionLang} onChange={e=>set("access.captionLang", e.target.value)}>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="ja">Japanese</option>
                </select>
              </div>
            </Row>
          </Section>
        )}

        {tab === "Host Controls" && (
          <Section title="Host controls">
            <Row label="Mute all on join">
              <input type="checkbox" checked={s.host.muteAllOnJoin} onChange={e=>set("host.muteAllOnJoin", e.target.checked)} />
            </Row>
            <Row label="Allow unmute">
              <input type="checkbox" checked={s.host.allowUnmute} onChange={e=>set("host.allowUnmute", e.target.checked)} />
            </Row>
            <Row label="Screen share">
              <select className="rounded-lg border px-3 py-2" value={s.host.sharePolicy} onChange={e=>set("host.sharePolicy", e.target.value)}>
                <option value="host">Host only</option>
                <option value="anyone">Anyone</option>
                <option value="ask">Ask host</option>
              </select>
            </Row>
            <Row label="Chat">
              <select className="rounded-lg border px-3 py-2" value={s.host.chatPolicy} onChange={e=>set("host.chatPolicy", e.target.value)}>
                <option value="everyone">Everyone</option>
                <option value="host">Host only</option>
                <option value="disabled">Disabled</option>
              </select>
            </Row>
          </Section>
        )}

        {tab === "Appearance" && (
          <Section title="Appearance">
            <Row label="Theme">
              <select className="rounded-lg border px-3 py-2"
                value={s.appearance.theme}
                onChange={e=>set("appearance.theme", e.target.value)}>
                <option value="light">Light</option>
              </select>
            </Row>
            <Row label="Accent">
              <select className="rounded-lg border px-3 py-2"
                value={s.appearance.accent}
                onChange={e=>set("appearance.accent", e.target.value)}>
                <option value="sky">Sky</option>
                <option value="blue">Blue</option>
                <option value="violet">Violet</option>
                <option value="rose">Rose</option>
              </select>
            </Row>
            <Row label="Compact layout">
              <input type="checkbox" checked={s.appearance.compact} onChange={e=>set("appearance.compact", e.target.checked)} />
            </Row>
          </Section>
        )}

        {tab === "Shortcuts" && (
          <Section title="Keyboard shortcuts">
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
              <li><kbd className="px-1.5 py-0.5 border rounded">M</kbd> — Mute/unmute mic</li>
              <li><kbd className="px-1.5 py-0.5 border rounded">V</kbd> — Start/stop camera</li>
              <li><kbd className="px-1.5 py-0.5 border rounded">S</kbd> — Start/stop screen share</li>
              <li><kbd className="px-1.5 py-0.5 border rounded">C</kbd> — Open/close chat</li>
              <li><kbd className="px-1.5 py-0.5 border rounded">R</kbd> — Raise hand</li>
              <li><kbd className="px-1.5 py-0.5 border rounded">Esc</kbd> — Close panels</li>
            </ul>
          </Section>
        )}

        {tab === "Data & Storage" && (
          <Section title="Data & Storage">
            <div className="flex gap-2">
              <button
                className="px-3 py-2 rounded-md border"
                onClick={()=>{
                  if (!confirm("Clear meeting history, profile and settings?")) return;
                  try { localStorage.removeItem(SETTINGS_KEY); localStorage.removeItem("qura_user"); } catch {}
                  setS(structuredClone(defaultSettings));
                  login?.({ name: "Guest", avatar: "" });
                  alert("Cleared!");
                }}
              >
                Clear all
              </button>
              <button
                className="px-3 py-2 rounded-md border"
                onClick={()=>{
                  const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = "qura-settings.json"; a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export settings
              </button>
              <label className="px-3 py-2 rounded-md border cursor-pointer">
                Import settings
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={async(e)=>{
                    const f = e.target.files?.[0]; if (!f) return;
                    const text = await f.text();
                    try {
                      const json = JSON.parse(text);
                      setS(prev => ({ ...prev, ...json }));
                      saveSettings({ ...s, ...json });
                      alert("Imported");
                    } catch { alert("Invalid file"); }
                  }}
                />
              </label>
            </div>
          </Section>
        )}

        {tab === "Advanced" && (
          <Section title="Advanced">
            <Row label="Low bandwidth mode">
              <input type="checkbox" checked={s.pwa.lowBandwidth} onChange={e=>set("pwa.lowBandwidth", e.target.checked)} />
            </Row>
            <Row label="Disable hardware acceleration">
              <input type="checkbox" checked={s.pwa.disableHWAccel} onChange={e=>set("pwa.disableHWAccel", e.target.checked)} />
            </Row>
            <Row label="STUN server (override)">
              <input
                className="rounded-lg border px-3 py-2 w-full"
                value={localStorage.getItem("VITE_STUN_URL") || ""}
                onChange={(e)=>localStorage.setItem("VITE_STUN_URL", e.target.value)}
                placeholder="stun:stun.l.google.com:19302"
              />
              <div className="text-xs text-slate-500 mt-1">Takes effect on next join.</div>
            </Row>
          </Section>
        )}
      </div>
    </div>
  );
}
