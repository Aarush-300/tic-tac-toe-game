import React from 'react';
import { Keyboard } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full mt-6 pt-3 border-t-2 border-ink text-center text-ink-muted text-xs font-mono">
      <div className="flex flex-wrap items-center justify-center gap-2 mb-1.5 text-[11px]">
        <div className="flex items-center gap-1 text-ink font-bold">
          <Keyboard className="w-3.5 h-3.5 text-ink" />
          <span>KEYBOARD:</span>
        </div>
        <kbd className="bg-paper-surface px-1 py-0.5 border border-ink text-ink font-bold">
          Arrows
        </kbd>
        <span>Nav</span>
        <span>•</span>
        <kbd className="bg-paper-surface px-1 py-0.5 border border-ink text-ink font-bold">
          Enter
        </kbd>
        <span>Mark</span>
        <span>•</span>
        <kbd className="bg-paper-surface px-1 py-0.5 border border-ink text-ink font-bold">
          U
        </kbd>
        <span>Undo</span>
        <span>•</span>
        <kbd className="bg-paper-surface px-1 py-0.5 border border-ink text-ink font-bold">
          N
        </kbd>
        <span>New</span>
      </div>
      <p className="text-[10px] text-ink-muted uppercase tracking-wider">
        Tactile Paper Engine • In-Browser Q-Learning & Heuristics
      </p>
    </footer>
  );
};
