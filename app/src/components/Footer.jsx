export default function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-4 text-xs opacity-70 flex items-center justify-between">
        <span>© {new Date().getFullYear()} 
             <span className="text-sky-700">Qura</span>{" "}
             <span className="text-slate-900">Meet</span>
             </span>
        <span>Built with React • WebRTC • PWA</span>
      </div>
    </footer>
  )
}
