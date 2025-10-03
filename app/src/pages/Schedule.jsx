import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Schedule() {
  const nav = useNavigate();
  const [title, setTitle] = useState("Qura Meet");
  const [room, setRoom] = useState("");
  const [start, setStart] = useState(() => {
    // default: +30 mins
    const t = new Date(Date.now() + 30*60*1000);
    t.setSeconds(0,0);
    return t.toISOString().slice(0,16);
  });
  const [duration, setDuration] = useState(60); // mins
  const [desc, setDesc] = useState("Join via Qura Meet");

  const makeRoom = () => {
    const id = Math.random().toString(36).slice(2, 10);
    setRoom(id);
  };

  const toICSDate = (local) => {
    // local "YYYY-MM-DDTHH:mm" -> UTC in ICS basic format
    const d = new Date(local);
    const pad = (n)=> String(n).padStart(2,'0');
    const y = d.getUTCFullYear();
    const m = pad(d.getUTCMonth()+1);
    const da= pad(d.getUTCDate());
    const h = pad(d.getUTCHours());
    const mi= pad(d.getUTCMinutes());
    return `${y}${m}${da}T${h}${mi}00Z`;
  };

  const downloadICS = () => {
    if (!room) return alert("Create or enter a room ID.");
    const startUtc = toICSDate(start);
    const endUtc = toICSDate(new Date(new Date(start).getTime() + duration*60000).toISOString().slice(0,16));
    const url = `${location.origin}/room/${room}`;

    const ics =
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Qura Meet//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${room}@qurameet
DTSTAMP:${toICSDate(new Date().toISOString().slice(0,16))}
DTSTART:${startUtc}
DTEND:${endUtc}
SUMMARY:${title}
DESCRIPTION:${desc}\\nJoin: ${url}
URL:${url}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href; a.download = `${title.replace(/\s+/g,'_')}.ics`; a.click();
    URL.revokeObjectURL(href);
  };

  const copyInvite = async () => {
    if (!room) return alert("Create or enter a room ID.");
    const url = `${location.origin}/room/${room}`;
    await navigator.clipboard.writeText(`${title}\n${new Date(start).toLocaleString()}\n${url}`);
    alert("Invite copied!");
  };

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8 grid gap-4">
      <h1 className="text-2xl font-semibold">Schedule a meeting</h1>

      <div className="rounded-2xl border p-4 grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm font-medium">Title</span>
          <input className="rounded-lg border px-3 py-2" value={title} onChange={e=>setTitle(e.target.value)} />
        </label>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Start time</span>
            <input type="datetime-local" className="rounded-lg border px-3 py-2" value={start} onChange={e=>setStart(e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Duration (minutes)</span>
            <input type="number" className="rounded-lg border px-3 py-2" min="15" step="15" value={duration} onChange={e=>setDuration(+e.target.value||60)} />
          </label>
        </div>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Room ID</span>
          <div className="flex gap-2">
            <input className="flex-1 rounded-lg border px-3 py-2" value={room} onChange={e=>setRoom(e.target.value)} placeholder="e.g. 8abmy197" />
            <button onClick={makeRoom} className="px-3 rounded-lg border">Generate</button>
          </div>
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Description (optional)</span>
          <textarea className="rounded-lg border px-3 py-2" rows={3} value={desc} onChange={e=>setDesc(e.target.value)} />
        </label>

        <div className="flex flex-wrap gap-2 pt-2">
          <button onClick={downloadICS} className="px-4 py-2 rounded-lg bg-sky-600 text-white">Download .ics</button>
          <button onClick={copyInvite} className="px-4 py-2 rounded-lg border">Copy invite</button>
          {room && (
            <button onClick={()=>nav(`/room/${room}`)} className="px-4 py-2 rounded-lg border">Open room</button>
          )}
        </div>
      </div>
    </div>
  );
}
