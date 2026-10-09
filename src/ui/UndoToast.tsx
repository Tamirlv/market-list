import { useEffect, useRef } from 'react';

export interface UndoToastProps {
  message: string;
  onUndo(): void;
  onExpire(): void;
  durationMs?: number;
}

export default function UndoToast({ message, onUndo, onExpire, durationMs = 4000 }: UndoToastProps) {
  const expire = useRef(onExpire);
  expire.current = onExpire;
  useEffect(() => {
    const t = setTimeout(() => expire.current(), durationMs);
    return () => clearTimeout(t);
  }, [durationMs]);
  return (
    <div role="status" className="toast undo-toast">
      <button type="button" className="undo-btn" onClick={onUndo}>{message}</button>
    </div>
  );
}
