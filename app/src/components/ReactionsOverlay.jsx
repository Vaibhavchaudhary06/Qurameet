// src/components/ReactionsOverlay.jsx
import { useEffect, useMemo, useState } from 'react'

export default function ReactionsOverlay({ onSub, onUnsub }) {
  const [items, setItems] = useState([])

  const subscribe = useMemo(() => onSub ?? (() => {}), [onSub])
  const unsubscribe = useMemo(() => onUnsub ?? (() => {}), [onUnsub])

  useEffect(() => {
    const handler = ({ emoji }) => {
      const id = Math.random().toString(36).slice(2, 9)
      setItems((arr) => [...arr, { id, emoji }])
      setTimeout(() => setItems((arr) => arr.filter((it) => it.id !== id)), 1500)
    }
    subscribe(handler)
    return () => unsubscribe(handler)
  }, [subscribe, unsubscribe])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] flex items-end justify-center gap-2 z-40">
      {items.map((it) => (
        <div key={it.id} className="animate-bounce text-3xl opacity-90">{it.emoji}</div>
      ))}
    </div>
  )
}
