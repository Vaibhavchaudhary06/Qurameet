const apps = [
  {
    name: "Qura Search",
    url: "https://qura-search.example.com", // replace with real URL
    icon: "/icons/Qura-Search.png",
  },
  {
    name: "Qura Meet",
    url: "/",
    icon: "/icons/meet.png",
  },
  {
    name: "Qura Docs",
    url: "https://qura-docs.example.com",
    icon: "/icons/Qura-docs.png",
  },
  {
    name: "Qura Sheets",
    url: "https://qura-sheets.example.com",
    icon: "/icons/Qura-sheet.png",
  },
  {
    name: "Qura Slides",
    url: "https://qura-slides.example.com",
    icon: "/icons/Qura-slides.png",
  },
  {
    name: "Qura Calendar",
    url: "https://qura-calendar.example.com",
    icon: "/icons/qura-calendar.png",
  },
  {
    name: "Qura Browser",
    url: "https://qura-calendar.example.com",
    icon: "/icons/Qura-browser.png",
  },

]

export default function QuickAccess() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <span className="text-2xl font-bold mb-6 text-sky-700">Quick</span>{" "}
      <span className="text-2xl font-bold mb-6 text-slate-900">Access</span>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {apps.map(app => (
          <a
            key={app.name}
            href={app.url}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center p-4 rounded-lg border hover:shadow-md hover:bg-slate-50 transition"
          >
            <img
              src={app.icon}
              alt={app.name}
              className="h-15 w-15 mb-2"
            />
            <span className="text-sm font-medium text-slate-800">{app.name}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
