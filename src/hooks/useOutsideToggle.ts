import { useEffect, useRef, useState } from "react"

export function useOutsideToggle(initial = false) {
  const [open, setOpen] = useState(initial)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const menuEl = menuRef.current
      const btnEl = triggerRef.current
      const target = e.target as Node | null
      if (!menuEl || !target) return
      if (menuEl.contains(target)) return
      if (btnEl && btnEl.contains(target)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return { open, setOpen, menuRef, triggerRef }
}

