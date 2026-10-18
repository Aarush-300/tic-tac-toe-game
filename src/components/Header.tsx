import React from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';

interface HeaderProps {
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isMuted, onToggleMute }) => {
  return (
    <header className="w-full flex items-center justify-between pb-3 border-b border-slate-800/80 mb-5">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-rose-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Sparkles className="w-5 h-5 text-white animate-spin-slow" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-rose-400">
            TIC-TAC-TOE
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
            Next-Gen Tactical Grid
          </p>
        </div>
      </div>

      <button
        onClick={onToggleMute}
        type="button"
        className="p-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        aria-label={isMuted ? 'Unmute game sounds' : 'Mute game sounds'}
        title={isMuted ? 'Unmute game sounds' : 'Mute game sounds'}
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4 text-rose-400" />
        ) : (
          <Volume2 className="w-4 h-4 text-cyan-400" />
        )}
      </button>
    </header>
  );
};
