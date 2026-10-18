import React from 'react';
import { Keyboard } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full mt-6 pt-4 border-t border-slate-800/80 text-center text-slate-500 text-xs">
      <div className="flex flex-wrap items-center justify-center gap-2 mb-2 text-[11px]">
        <div className="flex items-center gap-1 text-slate-400">
          <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-medium text-slate-300">Shortcuts:</span>
        </div>
        <span className="bg-slate-850 px-1.5 py-0.5 rounded border border-slate-800 text-slate-350">
          Arrows
        </span>
        <span>to navigate</span>
        <span className="text-slate-600">•</span>
        <span className="bg-slate-850 px-1.5 py-0.5 rounded border border-slate-800 text-slate-350">
          Enter
        </span>
        <span>to mark</span>
        <span className="text-slate-600">•</span>
        <span className="bg-slate-850 px-1.5 py-0.5 rounded border border-slate-800 text-slate-350">
          U
        </span>
        <span>undo</span>
        <span className="text-slate-600">•</span>
        <span className="bg-slate-850 px-1.5 py-0.5 rounded border border-slate-800 text-slate-350">
          N
        </span>
        <span>new</span>
      </div>
      <p className="text-[10px] text-slate-600">
        Tic-Tac-Toe • Powered by Minimax & Vite React
      </p>
    </footer>
  );
};
