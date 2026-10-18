import type { BoardState, GameStatus, Player, Winner } from '../types/game';

export const WINNING_LINES: readonly [number, number, number][] = [
  // Rows
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // Columns
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // Diagonals
  [0, 4, 8],
  [2, 4, 6],
] as const;

/**
 * Checks if there is a winner or a draw on the current board.
 * Returns the winner ('X', 'O', 'Draw', or null) and the indices of the winning line if any.
 */
export function checkWinner(board: BoardState): GameStatus {
  for (const [a, b, c] of WINNING_LINES) {
    const squareA = board[a];
    if (squareA && squareA === board[b] && squareA === board[c]) {
      return {
        winner: squareA,
        winningLine: [a, b, c],
      };
    }
  }

  // If no winning line and all squares are filled, it's a draw
  const isBoardFull = board.every((square) => square !== null);
  if (isBoardFull) {
    return {
      winner: 'Draw' as Winner,
      winningLine: null,
    };
  }

  return {
    winner: null,
    winningLine: null,
  };
}

/**
 * Returns all unoccupied square indices on the board.
 */
export function getAvailableMoves(board: BoardState): number[] {
  const moves: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      moves.push(i);
    }
  }
  return moves;
}

/**
 * Selects a random available move for Easy AI mode.
 */
export function getRandomMove(board: BoardState): number | null {
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * availableMoves.length);
  return availableMoves[randomIndex];
}

/**
 * Internal Minimax evaluation with alpha-beta pruning.
 */
function minimax(
  board: BoardState,
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number,
  aiPlayer: Player
): number {
  const humanPlayer: Player = aiPlayer === 'X' ? 'O' : 'X';
  const { winner } = checkWinner(board);

  if (winner === aiPlayer) {
    return 10 - depth;
  }
  if (winner === humanPlayer) {
    return depth - 10;
  }
  if (winner === 'Draw') {
    return 0;
  }

  const moves = getAvailableMoves(board);

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const move of moves) {
      board[move] = aiPlayer;
      const score = minimax(board, depth + 1, false, alpha, beta, aiPlayer);
      board[move] = null;

      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) {
        break; // Beta cut-off
      }
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const move of moves) {
      board[move] = humanPlayer;
      const score = minimax(board, depth + 1, true, alpha, beta, aiPlayer);
      board[move] = null;

      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) {
        break; // Alpha cut-off
      }
    }
    return minScore;
  }
}

/**
 * Calculates the optimal move for the AI using Minimax with alpha-beta pruning.
 * Guarantees unbeatable play (win or draw).
 */
export function getBestMove(board: BoardState, aiPlayer: Player = 'O'): number | null {
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) return null;

  // 1. Immediate Win: If AI can win on this turn, make that move immediately
  for (const move of availableMoves) {
    board[move] = aiPlayer;
    const { winner } = checkWinner(board);
    board[move] = null;
    if (winner === aiPlayer) {
      return move;
    }
  }

  // 2. Immediate Block: If opponent can win on their next turn, block immediately
  const humanPlayer: Player = aiPlayer === 'X' ? 'O' : 'X';
  for (const move of availableMoves) {
    board[move] = humanPlayer;
    const { winner } = checkWinner(board);
    board[move] = null;
    if (winner === humanPlayer) {
      return move;
    }
  }

  // 3. Opening move optimization: if center is available on first move, taking center is optimal
  if (board[4] === null && (availableMoves.length === 9 || availableMoves.length === 8)) {
    return 4;
  }

  // 4. Minimax with alpha-beta pruning for remaining states
  let bestScore = -Infinity;
  let bestMove = availableMoves[0];
  let alpha = -Infinity;
  const beta = Infinity;

  for (const move of availableMoves) {
    board[move] = aiPlayer;
    const score = minimax(board, 0, false, alpha, beta, aiPlayer);
    board[move] = null;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
    alpha = Math.max(alpha, bestScore);
  }

  return bestMove;
}
