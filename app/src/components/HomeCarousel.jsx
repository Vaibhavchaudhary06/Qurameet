// app/src/components/HomeCarousel.jsx
import { useState, useEffect, useRef } from "react";

const slides = [
  {
    title: "Stay Secure",
    text: "Your meetings are encrypted and fully protected.",
    img: "/Secure-plateform.svg",
  },
  {
    title: "Instant Translator",
    text: "Real-time subtitles and voice translation for everyone.",
    img: "/Business-meet.svg",
  },
  {
    title: "Easy Sharing",
    text: "Share your meeting link in just one click.",
    img: "/Secure-meeting.svg",
  },
//   {
//     title: "One Click to Join",
//     text: "Join meetings instantly without extra steps.",
//     img: "/Secure-plateform.png",
//   },
];

export default function HomeCarousel() {
  const [i, setI] = useState(0);
  const len = slides.length;
  const timer = useRef(null);
  const containerRef = useRef(null);

  const start = () => {
    stop(); // avoid multiple intervals
    timer.current = setInterval(() => setI((p) => (p + 1) % len), 6000);
  };
  const stop = () => timer.current && clearInterval(timer.current);

  useEffect(() => {
    // auto-advance
    start();

    // pause when tab hidden
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);

    // keyboard nav
    const onKey = (e) => {
      if (e.key === "ArrowLeft") setI((p) => (p - 1 + len) % len);
      if (e.key === "ArrowRight") setI((p) => (p + 1) % len);
    };
    window.addEventListener("keydown", onKey);

    // simple preloading
    slides.forEach((s) => {
      if (s.img) {
        const im = new Image();
        im.src = s.img;
      }
    });

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goto = (n) => setI((n + len) % len);

  return (
    <div
      ref={containerRef}
      className="mt-10 flex flex-col items-center"
      onMouseEnter={stop}
      onMouseLeave={start}
    >
      {/* Illustration + arrows */}
      <div className="relative w-full max-w-[720px]">
        {/* Prev */}
        <button
          aria-label="Previous slide"
          onClick={() => goto(i - 1)}
          className="absolute left-0 -translate-x-2 top-1/2 -translate-y-1/2 h-12 w-12 grid place-items-center text-slate-600 hover:text-slate-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Image (full, no crop) */}
        <div className="mx-auto w-[300px] sm:w-[520px]">
          {slides[i].img ? (
            <img
              src={slides[i].img}
              alt={slides[i].title}
              className="w-full h-auto object-contain select-none"
              draggable="false"
            />
          ) : (
            <div className="h-[220px] grid place-items-center text-6xl">🎥</div>
          )}
        </div>

        {/* Next */}
        <button
          aria-label="Next slide"
          onClick={() => goto(i + 1)}
          className="absolute right-0 translate-x-2 top-1/2 -translate-y-1/2 h-12 w-12 grid place-items-center text-slate-600 hover:text-slate-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Caption */}
      <div className="mt-8 max-w-xl text-center">
        <h3 className="text-2xl font-semibold text-slate-900">{slides[i].title}</h3>
        <p className="mt-2 text-slate-600">{slides[i].text}</p>
      </div>

      {/* Dots */}
      <div className="mt-4 flex items-center gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            aria-label={`Go to slide ${idx + 1}`}
            onClick={() => goto(idx)}
            className={`h-2.5 w-2.5 rounded-full transition ${
              idx === i ? "bg-sky-600" : "bg-slate-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
