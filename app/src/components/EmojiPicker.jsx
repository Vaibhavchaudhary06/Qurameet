// src/components/EmojiPicker.jsx
import { useEffect } from "react"

const EMOJIS = ['👏','👍','❤️','😂','🔥','🎉','🤝','🙌','😮','😅','🤩','🫶','💯','🤞','😎','😇']

export default function EmojiPicker({ open, onClose, onPick }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose?.()
    if (open) window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60]">
      <button onClick={onClose} className="absolute inset-0 bg-black/30" aria-label="Close emoji picker" />
      <div
        className="absolute left-0 right-0 bottom-0 rounded-t-2xl bg-white p-4 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-2xl"
        role="dialog" aria-label="Reactions"
      >
        <div className="mx-auto max-w-3xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Reactions</h3>
            <button onClick={onClose} className="text-sm px-2 py-1 rounded hover:bg-slate-100">Close</button>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => { onPick?.(e); onClose?.() }}
                className="h-12 w-12 text-xl grid place-items-center rounded-xl border hover:bg-slate-50 active:scale-95"
                aria-label={`React ${e}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
