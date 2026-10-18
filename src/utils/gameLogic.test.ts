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
import { QLearningAgent, INVERSE_MAP } from './qLearning';

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

  describe('Adaptive Bot (Rubber-Banding & Tabular Q-Learning)', () => {
    it('verifies that all 8 rotated and reflected board states resolve to the exact same canonical key', () => {
      const agent = new QLearningAgent();
      const baseBoard: BoardState = [
        'X', null, null,
        null, 'O', null,
        null, 'X', null,
      ];

      const canonicalKeys = new Set<string>();

      for (let k = 0; k < 8; k++) {
        const inv = INVERSE_MAP[k];
        const transformedBoard: BoardState = new Array(9);
        for (let j = 0; j < 9; j++) {
          transformedBoard[j] = baseBoard[inv[j]];
        }

        const { canonicalState } = agent.getCanonical(transformedBoard, 'O');
        canonicalKeys.add(canonicalState);
      }

      expect(canonicalKeys.size).toBe(1);
    });

    it('dynamic rubber-banding decreases temperature on human win and increases on bot win/draw', () => {
      const agent = new QLearningAgent();
      agent.botTemperature = 0.30;
      expect(agent.getMood().label).toBe('Focused');

      // Human wins: bot tightens focus
      agent.finalizeGame('X', 'O');
      expect(agent.botTemperature).toBeCloseTo(0.24, 2);
      expect(agent.getMood().label).toBe('Focused');

      // Human wins twice more -> Locked In (< 0.18)
      agent.finalizeGame('X', 'O');
      agent.finalizeGame('X', 'O');
      expect(agent.botTemperature).toBeCloseTo(0.12, 2);
      expect(agent.getMood().label).toBe('Locked In');

      // Clamps at minimum 0.10
      agent.finalizeGame('X', 'O');
      expect(agent.botTemperature).toBe(0.10);

      // Bot wins: bot relaxes (+0.08)
      agent.finalizeGame('O', 'O');
      expect(agent.botTemperature).toBeCloseTo(0.18, 2);

      // Draw: bot gently loosens (+0.03)
      agent.finalizeGame('Draw', 'O');
      expect(agent.botTemperature).toBeCloseTo(0.21, 2);

      // Winning streak relaxes bot up to maximum 0.50 (Casual)
      for (let i = 0; i < 6; i++) {
        agent.finalizeGame('O', 'O');
      }
      expect(agent.botTemperature).toBe(0.50);
      expect(agent.getMood().label).toBe('Casual');
    });

    it('decays Q-table entries by 0.97 forgetting factor on game finalization', () => {
      const agent = new QLearningAgent();
      const testState = '.........';
      agent.setQ(testState, 0, 1.0);

      const beforeQ = agent.getQ(testState, 0);
      expect(beforeQ).toBe(1.0);

      agent.finalizeGame('Draw', 'O');
      const afterQ = agent.getQ(testState, 0);
      expect(afterQ).toBeCloseTo(0.97, 4);
    });

    it('selects legal moves from open squares using Softmax over top 3 moves', () => {
      const agent = new QLearningAgent();
      const board: BoardState = [
        'X', 'O', 'X',
        null, null, 'O',
        'O', 'X', null,
      ];
      const available = getAvailableMoves(board);
      const action = agent.selectAction(board, available, 'O', agent.botTemperature);
      expect(available).toContain(action);
    });

    it('1-ply reflex filter executes immediate win ~85% of the time in getAdaptiveBotMove', () => {
      const board: BoardState = [
        'O', 'O', null,
        'X', 'X', null,
        null, null, null,
      ];
      let winCount = 0;
      for (let i = 0; i < 50; i++) {
        if (getAdaptiveBotMove(board, 'O') === 2) {
          winCount++;
        }
      }
      // ~85% conversion rate: out of 50, expect >= 32
      expect(winCount).toBeGreaterThanOrEqual(32);
      expect(winCount).toBeLessThanOrEqual(50);
    });

    it('provides valid real-time Q-confidence and win probability telemetry', () => {
      const agent = new QLearningAgent();
      const board: BoardState = Array(9).fill(null);
      const { qValue, winProb } = agent.getConfidence(board, 'O');
      expect(typeof qValue).toBe('number');
      expect(winProb).toBeGreaterThanOrEqual(1);
      expect(winProb).toBeLessThanOrEqual(99);
    });

    it('resetMemory clears learned games count, restores 0.30 temperature, and re-seeds baseline', () => {
      const agent = new QLearningAgent();
      agent.gamesLearned = 14;
      agent.botTemperature = 0.12;
      agent.resetMemory();

      expect(agent.gamesLearned).toBe(0);
      expect(agent.botTemperature).toBe(0.30);
      expect(agent.getMood().label).toBe('Focused');
      expect(Object.keys(agent.qTable).length).toBeGreaterThanOrEqual(20);
    });
  });
});
