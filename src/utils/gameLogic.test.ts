import { describe, expect, it } from 'vitest';
import type { BoardState } from '../types/game';
import { checkWinner, getAvailableMoves, WINNING_LINES } from './gameLogic';
import {
  findImmediateWin,
  getClubPlayerMove,
  getTacticianMove,
  getAdaptiveBotMove,
  softmaxSample,
} from './aiEngine';
import { QLearningAgent, INVERSE_MAP, FORWARD_MAP } from './qLearning';

describe('Tic-Tac-Toe Game Logic & AI Engine', () => {
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
  });

  describe('Move Helpers & Softmax', () => {
    it('should return all unoccupied square indices', () => {
      const board: BoardState = [
        'X', null, 'O',
        null, 'X', null,
        'O', null, null,
      ];
      expect(getAvailableMoves(board)).toEqual([1, 3, 5, 7, 8]);
    });

    it('softmaxSample should return candidates based on relative weights', () => {
      const candidates = [
        { item: 'A', score: 100 },
        { item: 'B', score: 0 },
      ];
      const selected = softmaxSample(candidates, 0.1);
      expect(selected).toBe('A');
    });

    it('findImmediateWin finds direct win on open square', () => {
      const board: BoardState = [
        'O', 'O', null,
        'X', 'X', null,
        null, null, null,
      ];
      expect(findImmediateWin(board, 'O')).toBe(2);
      expect(findImmediateWin(board, 'X')).toBe(5);
    });
  });

  describe('Club Player AI (Casual)', () => {
    it('takes immediate win the vast majority of the time (~90%)', () => {
      const board: BoardState = [
        'O', 'O', null,
        'X', null, null,
        null, null, null,
      ];
      let winTakenCount = 0;
      for (let i = 0; i < 50; i++) {
        if (getClubPlayerMove(board, 'O') === 2) {
          winTakenCount++;
        }
      }
      expect(winTakenCount).toBeGreaterThanOrEqual(35);
    });

    it('blocks immediate threat the vast majority of the time (~75%)', () => {
      const board: BoardState = [
        'X', 'X', null,
        'O', null, null,
        null, null, null,
      ];
      let blockedCount = 0;
      for (let i = 0; i < 50; i++) {
        if (getClubPlayerMove(board, 'O') === 2) {
          blockedCount++;
        }
      }
      expect(blockedCount).toBeGreaterThanOrEqual(25);
    });

    it('always selects a legal available move', () => {
      const board: BoardState = [
        'X', 'O', 'X',
        'O', null, null,
        null, 'X', 'O',
      ];
      const available = getAvailableMoves(board);
      for (let i = 0; i < 20; i++) {
        const move = getClubPlayerMove(board, 'O');
        expect(available).toContain(move);
      }
    });
  });

  describe('Tactician AI (Depth-2 Minimax + Softmax)', () => {
    it('always takes an immediate win (100%)', () => {
      const board: BoardState = [
        'O', 'O', null,
        'X', 'X', null,
        null, null, null,
      ];
      for (let i = 0; i < 20; i++) {
        expect(getTacticianMove(board, 'O')).toBe(2);
      }
    });

    it('always blocks an immediate threat (100%)', () => {
      const board: BoardState = [
        'X', 'X', null,
        'O', null, null,
        null, null, null,
      ];
      for (let i = 0; i < 20; i++) {
        expect(getTacticianMove(board, 'O')).toBe(2);
      }
    });

    it('always chooses legal moves from available squares', () => {
      const board: BoardState = [
        'X', null, null,
        null, 'O', null,
        null, null, 'X',
      ];
      const available = getAvailableMoves(board);
      for (let i = 0; i < 20; i++) {
        const move = getTacticianMove(board, 'O');
        expect(available).toContain(move);
      }
    });
  });

  describe('Adaptive Bot (8-Way Symmetry & Tabular Q-Learning)', () => {
    it('verifies that all 8 rotated and reflected board states resolve to the exact same canonical key', () => {
      const agent = new QLearningAgent();
      // Asymmetric board: X at (0, 7), O at 4
      const baseBoard: BoardState = [
        'X', null, null,
        null, 'O', null,
        null, 'X', null,
      ];

      const canonicalKeys = new Set<string>();

      // Generate all 8 transformed board variations
      for (let k = 0; k < 8; k++) {
        const inv = INVERSE_MAP[k];
        const transformedBoard: BoardState = new Array(9);
        for (let j = 0; j < 9; j++) {
          transformedBoard[j] = baseBoard[inv[j]];
        }

        const { canonicalState } = agent.getCanonical(transformedBoard, 'O');
        canonicalKeys.add(canonicalState);
      }

      // All 8 symmetry transformations MUST reduce to the identical canonical key
      expect(canonicalKeys.size).toBe(1);
    });

    it('selects legal moves from open squares', () => {
      const agent = new QLearningAgent();
      const board: BoardState = [
        'X', 'O', 'X',
        null, null, 'O',
        'O', 'X', null,
      ];
      const available = getAvailableMoves(board);
      const action = agent.selectAction(board, available, 'O', 0.0);
      expect(available).toContain(action);
    });

    it('immediately drops Q-value for a losing move and selects an alternative defensive move in Game 2 (including rotated states)', () => {
      const agent = new QLearningAgent();

      // Board state: X in corners 0 and 8, O in center 4
      // Human plays diagonal opening:
      // X . .
      // . O .
      // . . X
      const board: BoardState = [
        'X', null, null,
        null, 'O', null,
        null, null, 'X',
      ];

      const { canonicalState, symIndex } = agent.getCanonical(board, 'O');

      // Say the losing move is corner 2 (which falls into human fork trap)
      const losingRealMove = 2;
      const losingCanMove = FORWARD_MAP[symIndex][losingRealMove];

      // Safe defensive move is edge 1
      const safeRealMove = 1;
      const safeCanMove = FORWARD_MAP[symIndex][safeRealMove];

      // Artificially set initial Q values so losing move was preferred
      agent.setQ(canonicalState, losingCanMove, 0.5);
      agent.setQ(canonicalState, safeCanMove, 0.2);

      const qBefore = agent.getQ(canonicalState, losingCanMove);
      expect(qBefore).toBe(0.5);

      // Simulate Game 1 loss: bot played losingMove, human won
      agent.recordBotStep(board, losingRealMove, 'O');
      agent.recordHumanStep(board, 6, 'X'); // Human sets up winning fork
      agent.finalizeGame('X', 'O'); // Bot loses (-1.0 reward)

      // Q-value for losing move must drop significantly
      const qAfter = agent.getQ(canonicalState, losingCanMove);
      expect(qAfter).toBeLessThan(0.0);
      expect(qAfter).toBeLessThan(agent.getQ(canonicalState, safeCanMove));

      // Game 2 on same board: bot must NOT pick the losing move
      const availableMoves = getAvailableMoves(board);
      const nextMove = agent.selectAction(board, availableMoves, 'O', 0.0);
      expect(nextMove).not.toBe(losingRealMove);

      // Game 2 on 90° ROTATED board:
      // . . X
      // . O .
      // X . .
      const rotatedBoard: BoardState = [
        null, null, 'X',
        null, 'O', null,
        'X', null, null,
      ];
      // On this rotated board, the equivalent losing corner is 8 (or 0)
      const rotatedLosingMove = FORWARD_MAP[1][losingRealMove]; // 90° rotation of move 2 is 8
      const rotatedAvailable = getAvailableMoves(rotatedBoard);
      const rotatedNextMove = agent.selectAction(rotatedBoard, rotatedAvailable, 'O', 0.0);
      expect(rotatedNextMove).not.toBe(rotatedLosingMove);
    });

    it('1-ply reflex filter executes immediate win 100% of the time in getAdaptiveBotMove', () => {
      const board: BoardState = [
        'O', 'O', null,
        'X', 'X', null,
        null, null, null,
      ];
      for (let i = 0; i < 20; i++) {
        expect(getAdaptiveBotMove(board, 'O')).toBe(2);
      }
    });

    it('1-ply reflex filter blocks immediate human threat ~90% of the time in getAdaptiveBotMove', () => {
      const board: BoardState = [
        'X', 'X', null,
        'O', null, null,
        null, null, null,
      ];
      let blockCount = 0;
      for (let i = 0; i < 40; i++) {
        if (getAdaptiveBotMove(board, 'O') === 2) {
          blockCount++;
        }
      }
      expect(blockCount).toBeGreaterThanOrEqual(30);
    });

    it('provides valid real-time Q-confidence and win probability telemetry', () => {
      const agent = new QLearningAgent();
      const board: BoardState = Array(9).fill(null);
      const { qValue, winProb } = agent.getConfidence(board, 'O');
      expect(typeof qValue).toBe('number');
      expect(winProb).toBeGreaterThanOrEqual(1);
      expect(winProb).toBeLessThanOrEqual(99);
    });

    it('resetMemory clears learned games count and re-seeds 15k baseline', () => {
      const agent = new QLearningAgent();
      agent.gamesLearned = 14;
      agent.resetMemory();
      expect(agent.gamesLearned).toBe(0);
      expect(Object.keys(agent.qTable).length).toBeGreaterThanOrEqual(500);
    });
  });
});
