import { useRef, useState, type KeyboardEvent } from 'react';
import type { BoardState, Player, WinningLine } from '../types/game';

interface BoardProps {
  board: BoardState;
  winningLine: WinningLine;
  turn: Player;
  locked: boolean;
  play: (index: number) => void;
  undo: () => void;
  newRound: () => void;
}

export function Board({ board, winningLine, turn, locked, play, undo, newRound }: BoardProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);

  function onKey(event: KeyboardEvent, index: number) {
    if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;
    let next = index;
    switch (event.key) {
      case 'ArrowRight': if (index % 3 < 2) next++; break;
      case 'ArrowLeft': if (index % 3 > 0) next--; break;
      case 'ArrowUp': next = Math.max(index % 3, index - 3); break;
      case 'ArrowDown': next = Math.min(6 + index % 3, index + 3); break;
      case 'Home': next = 0; break;
      case 'End': next = 8; break;
      case 'u': if (!event.repeat) undo(); break;
      case 'n': if (!event.repeat) newRound(); break;
      default: return;
    }
    event.preventDefault();
    refs.current[next]?.focus();
  }

  return (
    <div className="felt">
      <div className="play-grid" role="grid" aria-label="Tic Tac Toe board">
        {[0, 1, 2].map(row => (
          <div role="row" key={row} className="board-row">
            {[0, 1, 2].map(col => {
              const i = row * 3 + col;
              const value = board[i];
              const winning = winningLine?.includes(i);
              return (
                <div role="gridcell" className={'cell' + (winning ? ' winning' : '')} key={col}>
                  <button type="button" ref={el => { refs.current[i] = el; }}
                    aria-label={`Row ${row + 1}, column ${col + 1}, ${value ?? 'empty'}${winning ? ', winning square' : ''}`}
                    aria-disabled={locked || !!value} tabIndex={active === i ? 0 : -1}
                    onFocus={() => setActive(i)} onKeyDown={e => onKey(e, i)}
                    onClick={() => { if (!locked && !value) play(i); }}>
                    {value ? <span className={'mark mark-' + value} aria-hidden="true"/>
                      : <><span className="pip" aria-hidden="true"/>{!locked && <span className={'preview-mark mark-' + turn} aria-hidden="true"/>}</>}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
