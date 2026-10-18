import React from 'react';
import { Undo2, RotateCcw, Trash2 } from 'lucide-react';

interface ControlsProps {
  canUndo: boolean;
  onUndo: () => void;
  onNewRound: () => void;
  onResetScores: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  canUndo,
  onUndo,
  onNewRound,
  onResetScores,
}) => {
  return (
    <div className="w-full max-w-[340px] sm:max-w-[380px] mx-auto flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 border-2 border-ink font-mono font-bold text-xs tracking-wider transition-all duration-100 ${
            canUndo
              ? 'bg-paper-surface text-ink shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer'
              : 'bg-paper-muted text-ink-muted border-ink/40 cursor-not-allowed opacity-50 shadow-none'
          }`}
          title="Undo your last move (Shortcut: U)"
        >
          <Undo2 className="w-4 h-4 text-ink" />
          <span>UNDO MOVE</span>
        </button>

        <button
          type="button"
          onClick={onNewRound}
          className="flex items-center justify-center gap-2 py-2.5 px-3 border-2 border-ink bg-ink text-paper-surface font-mono font-bold text-xs tracking-wider shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 cursor-pointer"
          title="Start a new round (Shortcut: N)"
        >
          <RotateCcw className="w-4 h-4 text-paper-surface" />
          <span>NEW ROUND</span>
        </button>
      </div>

      <button
        type="button"
        onClick={onResetScores}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 text-[11px] font-mono text-ink-muted hover:text-terracotta transition-colors underline cursor-pointer"
        title="Reset all scores to zero (Shortcut: R)"
      >
        <Trash2 className="w-3 h-3" />
        <span>Reset Score Counters</span>
      </button>
    </div>
  );
};
