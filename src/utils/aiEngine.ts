import type { BoardState, Player } from '../types/game';
import { checkWinner, getAvailableMoves, getBestMove, getOptimalMoves, opposite } from './gameLogic';
import type { QLearningAgent } from './qLearning';

export function findImmediateWin(board: BoardState, player: Player): number | null {
  if (checkWinner(board).winner) return null;
  const scratch = [...board];
  for (const move of getAvailableMoves(board)) {
    scratch[move] = player;
    if (checkWinner(scratch).winner === player) return move;
    scratch[move] = null;
  }
  return null;
}

export function getClubPlayerMove(board: BoardState, player: Player = 'O'): number | null {
  if (checkWinner(board).winner) return null;
  const forced = findImmediateWin(board, player) ?? findImmediateWin(board, opposite(player));
  if (forced !== null) return forced;

  // Weighted openings keep the casual opponent varied and susceptible to forks.
  const tickets = getAvailableMoves(board).flatMap(move =>
    Array<number>(move === 4 ? 4 : move % 2 === 0 ? 2 : 1).fill(move)
  );
  return tickets[Math.floor(Math.random() * tickets.length)];
}

export const getTacticianMove = getBestMove;

export function getAdaptiveBotMove(board: BoardState, player: Player, agent: QLearningAgent): number | null {
  const safe = getOptimalMoves(board, player);
  return safe.length ? agent.selectAction(board, safe, player) : null;
}
