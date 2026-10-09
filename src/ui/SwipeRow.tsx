import { useRef, useState } from 'react';
import type { PointerEvent, ReactNode } from 'react';

export interface SwipeAction {
  label: string;
  icon: string;
  onAction(): void;
}

const THRESHOLD = 60;
const ACTION_WIDTH = 72;

/**
 * Drag the row to the LEFT to reveal the actions that sit underneath its right edge.
 * Mostly-vertical drags are ignored so the list still scrolls.
 */
export default function SwipeRow({ children, actions }: { children: ReactNode; actions: SwipeAction[] }) {
  const [open, setOpen] = useState(false);
  const [drag, setDrag] = useState<number | null>(null); // live offset (px, >= 0) while dragging
  const start = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const full = actions.length * ACTION_WIDTH;

  const onDown = (e: PointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY, moved: false };
  };
  const onMove = (e: PointerEvent) => {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.moved) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        start.current = null; // vertical scroll gesture
        return;
      }
      s.moved = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    const base = open ? full : 0;
    setDrag(Math.min(full, Math.max(0, base - dx)));
  };
  const onUp = () => {
    const s = start.current;
    start.current = null;
    if (!s?.moved) return;
    suppressClick.current = true;
    setTimeout(() => { suppressClick.current = false; }, 0); // swallow only the click that ends this drag
    const offset = drag ?? 0;
    setOpen(open ? full - offset < THRESHOLD : offset >= THRESHOLD);
    setDrag(null);
  };
  const onClickCapture = (e: React.MouseEvent) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      e.stopPropagation();
      e.preventDefault();
    } else if (open) {
      e.stopPropagation();
      e.preventDefault();
      setOpen(false);
    }
  };

  const offset = drag ?? (open ? full : 0);
  const revealed = offset > 0;
  return (
    <li className="swipe-row">
      <div className={`swipe-actions${revealed ? ' revealed' : ''}`} style={{ width: full }}>
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            className="swipe-action"
            aria-label={a.label}
            data-action={a.icon}
            onClick={() => {
              setOpen(false);
              a.onAction();
            }}
          >
            <span aria-hidden="true">{a.icon}</span>
          </button>
        ))}
      </div>
      <div
        className="swipe-content"
        data-open={open}
        style={{ transform: `translateX(${-offset}px)`, transition: drag === null ? 'transform .2s' : 'none' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onClickCapture={onClickCapture}
      >
        {children}
      </div>
    </li>
  );
}
