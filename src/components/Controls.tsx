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
    <div className="w-full max-w-[360px] sm:max-w-[400px] mx-auto flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs tracking-wider transition-all duration-200 border ${
            canUndo
              ? 'bg-slate-850 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700 active:scale-95 cursor-pointer shadow-md'
              : 'bg-slate-900/50 text-slate-600 border-slate-800/60 cursor-not-allowed opacity-50'
          }`}
          title="Undo your last move (Shortcut: U)"
        >
          <Undo2 className="w-4 h-4 text-cyan-400" />
          <span>UNDO MOVE</span>
        </button>

        <button
          type="button"
          onClick={onNewRound}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20 active:scale-95 transition-all duration-200 cursor-pointer"
          title="Start a new round (Shortcut: N)"
        >
          <RotateCcw className="w-4 h-4 text-slate-950" />
          <span>NEW ROUND</span>
        </button>
      </div>

      <button
        type="button"
        onClick={onResetScores}
        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-900/50 transition-colors border border-transparent hover:border-slate-800/80"
        title="Reset all scores to zero (Shortcut: R)"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Reset Scores</span>
      </button>
    </div>
  );
};
