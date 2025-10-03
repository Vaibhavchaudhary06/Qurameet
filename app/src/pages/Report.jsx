import { useState } from 'react'

export default function Report() {
  const [msg, setMsg] = useState('')
  const [email, setEmail] = useState('')

  const submit = (e) => {
    e.preventDefault()
    alert('Thanks! We have recorded your issue.')
    setMsg(''); setEmail('')
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
     <span className="text-2xl font-bold mb-6 text-sky-700">Report a </span>{" "}
      <span className="text-2xl font-bold mb-6 text-slate-900">Problem</span>
      <form onSubmit={submit} className="space-y-3">
        <input
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          type="email"
          placeholder="Your email (optional)"
          className="w-full border rounded px-3 py-2"
        />
        <textarea
          value={msg}
          onChange={(e)=>setMsg(e.target.value)}
          placeholder="Describe the issue…"
          rows={6}
          className="w-full border rounded px-3 py-2"
        />
        <button className="border rounded px-4 py-2 bg-sky-600 text-white">Submit</button>
      </form>
    </div>
  )
}
