import type { DeptId } from '../types';
import { DEPARTMENTS } from '../categorize/departments';

export interface DeptPickerProps {
  current: DeptId;
  onPick(d: DeptId): void;
  onClose(): void;
}

export default function DeptPicker({ current, onPick, onClose }: DeptPickerProps) {
  return (
    <div className="sheet-backdrop" data-testid="dept-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="העברה למחלקה" onClick={(e) => e.stopPropagation()}>
        <ul className="dept-options">
          {DEPARTMENTS.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                className={`dept-option${d.id === current ? ' current' : ''}`}
                aria-current={d.id === current}
                onClick={() => onPick(d.id)}
              >
                <span aria-hidden="true">{d.emoji}</span> {d.label}
                {d.id === current && <span aria-hidden="true"> ✓</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
