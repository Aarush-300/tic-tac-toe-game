import type { Player, Winner } from '../types/game';

export function StatusBanner({ winner, turn, local, round }: { winner: Winner; turn: Player; local: boolean; round: number }) {
  let status = local ? `Player ${turn}’s move` : turn === 'X' ? 'Your move' : 'Opponent thinking…';
  if (winner === 'Draw') status = 'Round drawn';
  else if (winner) status = local ? `Player ${winner} wins!` : winner === 'X' ? 'You win!' : 'Opponent wins!';
  return (
    <div className="table-head">
      <strong role="status"><span className={'turn-light' + ((winner ?? turn) === 'O' ? ' coral' : '')}/>{status}</strong>
      <span className="round-counter">Round {String(round).padStart(2, '0')}</span>
    </div>
  );
}
