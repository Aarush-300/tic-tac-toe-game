import { describe, expect, it } from 'vitest';
import type { BoardState, Player } from '../types/game';
import {
  checkWinner,
  getAvailableMoves,
  getBestMove,
  getRandomMove,
  WINNING_LINES,
} from './gameLogic';

describe('Tic-Tac-Toe Game Logic', () => {
  describe('Win and Draw Detection', () => {
    it('should correctly detect all 8 winning lines for player X', () => {
      WINNING_LINES.forEach(([a, b, c], index) => {
        const board: BoardState = Array(9).fill(null);
        board[a] = 'X';
        board[b] = 'X';
        board[c] = 'X';

        const result = checkWinner(board);
        expect(result.winner, `Line ${index} [${a}, ${b}, ${c}] should win for X`).toBe('X');
        expect(result.winningLine).toEqual([a, b, c]);
      });
    });

    it('should correctly detect all 8 winning lines for player O', () => {
      WINNING_LINES.forEach(([a, b, c], index) => {
        const board: BoardState = Array(9).fill(null);
        board[a] = 'O';
        board[b] = 'O';
        board[c] = 'O';

        const result = checkWinner(board);
        expect(result.winner, `Line ${index} [${a}, ${b}, ${c}] should win for O`).toBe('O');
        expect(result.winningLine).toEqual([a, b, c]);
      });
    });

    it('should detect a Draw when board is full and there is no winner', () => {
      // X O X
      // X X O
      // O X O
      const board: BoardState = [
        'X', 'O', 'X',
        'X', 'X', 'O',
        'O', 'X', 'O',
      ];
      const result = checkWinner(board);
      expect(result.winner).toBe('Draw');
      expect(result.winningLine).toBeNull();
    });

    it('should return null winner and null winningLine for an ongoing game', () => {
      const board: BoardState = [
        'X', null, 'O',
        null, 'X', null,
        null, null, null,
      ];
      const result = checkWinner(board);
      expect(result.winner).toBeNull();
      expect(result.winningLine).toBeNull();
    });

    it('should return null winner and null winningLine for an empty board', () => {
      const board: BoardState = Array(9).fill(null);
      const result = checkWinner(board);
      expect(result.winner).toBeNull();
      expect(result.winningLine).toBeNull();
    });
  });

  describe('Move Helpers', () => {
    it('should return all unoccupied square indices', () => {
      const board: BoardState = [
        'X', null, 'O',
        null, 'X', null,
        'O', null, null,
      ];
      expect(getAvailableMoves(board)).toEqual([1, 3, 5, 7, 8]);
    });

    it('should return an empty array if the board is full', () => {
      const board: BoardState = Array(9).fill('X');
      expect(getAvailableMoves(board)).toEqual([]);
    });

    it('getRandomMove should select a valid open square or null if full', () => {
      const board: BoardState = [
        'X', 'O', 'X',
        'O', 'X', 'O',
        'X', 'O', null,
      ];
      expect(getRandomMove(board)).toBe(8);

      const fullBoard: BoardState = Array(9).fill('X');
      expect(getRandomMove(fullBoard)).toBeNull();
    });
  });

  describe('Minimax AI (Unbeatable)', () => {
    it('should immediately take the winning move when available', () => {
      // AI is O
      // O O _
      // X X _
      // _ _ _
      const board: BoardState = [
        'O', 'O', null,
        'X', 'X', null,
        null, null, null,
      ];
      const move = getBestMove(board, 'O');
      expect(move).toBe(2);
    });

    it('should block the opponent from winning immediately', () => {
      // AI is O, Human is X
      // X X _
      // O _ _
      // _ _ _
      const board: BoardState = [
        'X', 'X', null,
        'O', null, null,
        null, null, null,
      ];
      const move = getBestMove(board, 'O');
      expect(move).toBe(2);
    });

    it('should block a diagonal win', () => {
      // X _ _
      // _ X _
      // _ _ _
      const board: BoardState = [
        'X', null, null,
        null, 'X', null,
        null, null, null,
      ];
      const move = getBestMove(board, 'O');
      expect(move).toBe(8);
    });

    it('should block a column win', () => {
      // X O _
      // X _ _
      // _ _ _
      const board: BoardState = [
        'X', 'O', null,
        'X', null, null,
        null, null, null,
      ];
      const move = getBestMove(board, 'O');
      expect(move).toBe(6);
    });

    it('Minimax vs Minimax always results in a Draw', () => {
      const board: BoardState = Array(9).fill(null);
      let currentTurn: Player = 'X';

      while (checkWinner(board).winner === null) {
        const move = getBestMove(board, currentTurn);
        expect(move).not.toBeNull();
        if (move === null) break;
        board[move] = currentTurn;
        currentTurn = currentTurn === 'X' ? 'O' : 'X';
      }

      const outcome = checkWinner(board);
      expect(outcome.winner).toBe('Draw');
    });

    it('Minimax as O never loses against 100 random games by X', () => {
      for (let i = 0; i < 100; i++) {
        const board: BoardState = Array(9).fill(null);
        let turn: Player = 'X';

        while (checkWinner(board).winner === null) {
          if (turn === 'X') {
            const randomMove = getRandomMove(board);
            if (randomMove === null) break;
            board[randomMove] = 'X';
            turn = 'O';
          } else {
            const bestMove = getBestMove(board, 'O');
            expect(bestMove).not.toBeNull();
            if (bestMove === null) break;
            board[bestMove] = 'O';
            turn = 'X';
          }
        }

        const outcome = checkWinner(board);
        expect(['O', 'Draw']).toContain(outcome.winner);
      }
    });

    it('Minimax as X never loses against 100 random games by O', () => {
      for (let i = 0; i < 100; i++) {
        const board: BoardState = Array(9).fill(null);
        let turn: Player = 'X';

        while (checkWinner(board).winner === null) {
          if (turn === 'X') {
            const bestMove = getBestMove(board, 'X');
            expect(bestMove).not.toBeNull();
            if (bestMove === null) break;
            board[bestMove] = 'X';
            turn = 'O';
          } else {
            const randomMove = getRandomMove(board);
            if (randomMove === null) break;
            board[randomMove] = 'O';
            turn = 'X';
          }
        }

        const outcome = checkWinner(board);
        expect(['X', 'Draw']).toContain(outcome.winner);
      }
    });
  });
});
