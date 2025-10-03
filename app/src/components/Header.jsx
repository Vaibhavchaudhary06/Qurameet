import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Header() {
  const [open, setOpen] = useState(false)        // mobile drawer
  const [supOpen, setSupOpen] = useState(false)  // support dropdown
  const navRef = useRef(null)
  const navigate = useNavigate()
  const { user } = useAuth() || {}

  const avatar = user?.avatar?.trim()
  const initial = user?.name?.[0]?.toUpperCase() || 'U'

  // close support dropdown on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (!navRef.current) return
      if (!navRef.current.contains(e.target)) setSupOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="mx-auto w-full max-w-6xl h-14 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo + wordmark */}
        <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="Qura Meet home">
          <img src="/qura-meet.svg" alt="Qura Logo" className="h-8 w-8" />
          <div className="text-lg font-semibold tracking-tight">
            <span className="text-sky-700">Qura</span>{' '}
            <span className="text-slate-900">Meet</span>
          </div>
        </Link>

        {/* Desktop nav + Support dropdown */}
        <nav ref={navRef} className="hidden md:flex items-center gap-2 text-sm relative z-40">
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setSupOpen(v => !v) }}
              className="px-3 py-2 rounded-md hover:bg-slate-50"
            >
              Support ▾
            </button>
            {supOpen && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white border rounded-lg shadow z-40"
              >
                <Link to="/help" onClick={() => setSupOpen(false)} className="block px-4 py-2 hover:bg-slate-50">
                  Help
                </Link>
                <a href="/terms.pdf" target="_blank" rel="noreferrer" className="block px-4 py-2 hover:bg-slate-50">Terms of Service (PDF)</a>
                <a href="/privacy.pdf" target="_blank" rel="noreferrer" className="block px-4 py-2 hover:bg-slate-50">Privacy Policy (PDF)</a>
                <a href="/terms-summary.pdf" target="_blank" rel="noreferrer" className="block px-4 py-2 hover:bg-slate-50">Terms Summary (PDF)</a>
              </div>
            )}
          </div>

          <Link to="/settings" className="px-3 py-2 rounded-md hover:bg-slate-50">
            Settings
          </Link>
          <Link to="/report" className="px-3 py-2 rounded-md hover:bg-slate-50">
            Report a problem
          </Link>
          <Link to="/quick-access" className="px-3 py-2 rounded-md hover:bg-slate-50">
            Quick Access
          </Link>
        </nav>

        {/* Right: mobile menu + avatar (put on top of dropdown) */}
        <div className="flex items-center gap-2 relative z-50">
          {/* mobile menu button */}
          <button
            onClick={() => setOpen(v => !v)}
            className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-md border border-slate-300 hover:bg-slate-50"
            aria-label="Open menu"
            aria-expanded={open}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {/* profile avatar (click -> settings) */}
          <button
            className="hidden md:inline-flex items-center justify-center h-9 w-9 rounded-full bg-sky-100 text-sky-700 font-semibold border border-sky-200 overflow-hidden"
            title={user?.name || "Your profile"}
            onClick={() => { setSupOpen(false); navigate('/settings') }}
          >
            {avatar ? (
              <img src={avatar} alt={user?.name || "User"} className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t bg-white">
          <div className="mx-auto max-w-6xl px-4 py-2 grid">
            <details className="px-1">
              <summary className="px-2 py-2 rounded-md hover:bg-slate-50 cursor-pointer">Support</summary>
              <div className="ml-3 my-1 flex flex-col">
                <Link to="/help" onClick={()=>setOpen(false)} className="px-2 py-2 rounded-md hover:bg-slate-50">Help</Link>
                <a href="/terms.pdf" target="_blank" rel="noreferrer" className="px-2 py-2 rounded-md hover:bg-slate-50">Terms of Service (PDF)</a>
                <a href="/privacy.pdf" target="_blank" rel="noreferrer" className="px-2 py-2 rounded-md hover:bg-slate-50">Privacy Policy (PDF)</a>
                <a href="/terms-summary.pdf" target="_blank" rel="noreferrer" className="px-2 py-2 rounded-md hover:bg-slate-50">Terms Summary (PDF)</a>
              </div>
            </details>

            <Link to="/settings" onClick={()=>setOpen(false)} className="text-left px-3 py-2 rounded-md hover:bg-slate-50">Settings</Link>
            <Link to="/report" onClick={()=>setOpen(false)} className="text-left px-3 py-2 rounded-md hover:bg-slate-50">Report a problem</Link>
            <Link to="/quick-access" onClick={()=>setOpen(false)} className="text-left px-3 py-2 rounded-md hover:bg-slate-50">Quick Access</Link>
          </div>
        </div>
      )}
    </header>
  )
}
