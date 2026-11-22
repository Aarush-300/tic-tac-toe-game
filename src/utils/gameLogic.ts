import type { BoardState, GameStatus, Player } from '../types/game';

export const WINNING_LINES: readonly [number, number, number][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function checkWinner(board: BoardState): GameStatus {
  for (const [a, b, c] of WINNING_LINES) {
    const mark = board[a];
    if (mark && mark === board[b] && mark === board[c]) {
      return { winner: mark, winningLine: [a, b, c] };
    }
  }
  return { winner: board.includes(null) ? null : 'Draw', winningLine: null };
}

export function getAvailableMoves(board: BoardState): number[] {
  return board.flatMap((cell, index) => cell === null ? [index] : []);
}

export function opposite(player: Player): Player {
  return player === 'X' ? 'O' : 'X';
}

export function boardFromMoves(moves: readonly number[]): BoardState {
  const board: BoardState = Array(9).fill(null);
  moves.forEach((move, i) => { board[move] = i % 2 === 0 ? 'X' : 'O'; });
  return board;
}

// Values belong to the player about to move. More empty cells at a terminal
// position mean an earlier win. A full search makes every cached score exact.
const positionScores = new Map<string, number>();

function evaluate(board: BoardState, player: Player): number {
  const { winner } = checkWinner(board);
  if (winner === 'Draw') return 0;
  if (winner) return -(1 + getAvailableMoves(board).length);

  const key = player + board.map(cell => cell ?? '.').join('');
  const cached = positionScores.get(key);
  if (cached !== undefined) return cached;

  let best = -Infinity;
  for (const move of getAvailableMoves(board)) {
    board[move] = player;
    best = Math.max(best, -evaluate(board, opposite(player)));
    board[move] = null;
  }
  positionScores.set(key, best);
  return best;
}

export function getOptimalMoves(board: BoardState, player: Player): number[] {
  if (checkWinner(board).winner) return [];
  const scratch = [...board];
  let best = -Infinity;
  let optimal: number[] = [];
  for (const move of getAvailableMoves(board)) {
    scratch[move] = player;
    const score = -evaluate(scratch, opposite(player));
    scratch[move] = null;
    if (score > best) {
      best = score;
      optimal = [move];
    } else if (score === best) {
      optimal.push(move);
    }
  }
  return optimal;
}

const POSITION_ORDER = [4, 0, 2, 6, 8, 1, 3, 5, 7];

export function getBestMove(board: BoardState, player: Player = 'O'): number | null {
  const optimal = getOptimalMoves(board, player);
  return POSITION_ORDER.find(move => optimal.includes(move)) ?? null;
}
