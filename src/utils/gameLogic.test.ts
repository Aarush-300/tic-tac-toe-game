import { describe, expect, it, vi } from 'vitest';
import type { BoardState, Player } from '../types/game';
import { boardFromMoves, checkWinner, getOptimalMoves } from './gameLogic';
import { getTacticianMove, getAdaptiveBotMove, getClubPlayerMove } from './aiEngine';
import { QLearningAgent, FORWARD_MAP } from './qLearning';

// Independent oracle. The production solver uses arrays and line triples.
// Here X and O are separate nine-bit masks, and evaluations are from X's view.
const lines = [7, 56, 448, 73, 146, 292, 273, 84];
function outcome(x: number, o: number) {
  if (lines.some(mask => (x & mask) === mask)) return 1;
  if (lines.some(mask => (o & mask) === mask)) return -1;
  if ((x | o) === 511) return 0;
  return null;
}

function movesFrom(x: number, o: number) {
  return Array.from({ length: 9 }, (_, i) => i).filter(i => !((x | o) & (1 << i)));
}

const values = new Map<number, number>();
function value(x: number, o: number, player: Player): number {
  const end = outcome(x, o);
  if (end !== null) return end;
  const key = x * 512 + o;
  if (values.has(key)) return values.get(key)!;
  const children = movesFrom(x, o).map(i => player === 'X'
    ? value(x | (1 << i), o, 'O') : value(x, o | (1 << i), 'X'));
  const result = player === 'X' ? Math.max(...children) : Math.min(...children);
  values.set(key, result);
  return result;
}

describe('Tic Tac Toe opponents', () => {
  it('matches the independent optimal outcome on all 5,478 reachable positions, including every possible adaptive choice', () => {
    const seen = new Set<number>();
    function visit(x: number, o: number, player: Player) {
      const key = x * 512 + o;
      if (seen.has(key)) return;
      seen.add(key);
      const board: BoardState = Array.from({ length: 9 }, (_, i) =>
        x & (1 << i) ? 'X' : o & (1 << i) ? 'O' : null);
      Object.freeze(board);
      const end = outcome(x, o);
      const terminal = end === null ? null : end === 0 ? 'Draw' : end > 0 ? 'X' : 'O';
      expect(checkWinner(board).winner).toBe(terminal);
      const candidates = getOptimalMoves(board, player);
      const tactician = getTacticianMove(board, player);
      if (end !== null) {
        expect(candidates).toEqual([]);
        expect(tactician).toBeNull();
        expect(getClubPlayerMove(board, player)).toBeNull();
        return;
      }
      expect(candidates).toContain(tactician);
      for (const i of candidates) {
        expect(board[i]).toBeNull();
        const next = player === 'X' ? value(x | (1 << i), o, 'O') : value(x, o | (1 << i), 'X');
        expect(next).toBe(value(x, o, player));
      }
      for (const i of movesFrom(x, o)) {
        if (player === 'X') visit(x | (1 << i), o, 'O');
        else visit(x, o | (1 << i), 'X');
      }
    }
    visit(0, 0, 'X');
    expect(value(0, 0, 'X')).toBe(0);
    expect(seen.size).toBe(5478);
  });

  it('takes a win before a block and never skips an immediate defense', () => {
    const agent = new QLearningAgent();
    for (const pick of [getClubPlayerMove, getTacticianMove, (b: BoardState) => getAdaptiveBotMove(b, 'O', agent)]) {
      expect(pick(boardFromMoves([3, 0, 4, 1, 8]))).toBe(2);
      expect(pick(boardFromMoves([0, 4, 1]))).toBe(2);
    }
  });

  it('keeps the adaptive learner inside the safe move set at every focus setting', () => {
    const agent = new QLearningAgent();
    const board = boardFromMoves([0, 4, 8]);
    const select = vi.spyOn(agent, 'selectAction');
    for (const level of [0, 50, 100]) {
      agent.setFocusLevel(level);
      for (let i = 0; i < 20; i++) {
        expect([1, 3, 5, 7]).toContain(getAdaptiveBotMove(board, 'O', agent));
        expect(select.mock.lastCall?.[1]).toEqual([1, 3, 5, 7]);
      }
    }
    expect(getAdaptiveBotMove(boardFromMoves([0, 1, 3, 2, 6]), 'O', agent)).toBeNull();
  });
});

describe('adaptive memory', () => {
  it('shares learned entries across rotations and reflections', () => {
    localStorage.clear();
    const base = [0, 3, 1, 4, 2];
    const memories = FORWARD_MAP.map(map => {
      localStorage.setItem('ttt_adaptive_v4', JSON.stringify({ table: {} }));
      const agent = new QLearningAgent();
      agent.finalizeGame(base.map(i => map[i]), 'X');
      return JSON.parse(localStorage.getItem('ttt_adaptive_v4')!).table;
    });
    // Symmetric openings have multiple valid canonical orientations. Compare
    // the learned board keys; later asymmetric positions also share actions.
    for (const table of memories) {
      expect(Object.keys(table).sort()).toEqual(Object.keys(memories[0]).sort());
      const final = Object.keys(table).find(key => key.split('.').length === 6)!;
      expect(table[final]).toEqual(memories[0][final]);
    }
  });

  it('restores legacy settings and undoes learning and automatic focus after a replay', () => {
    localStorage.clear();
    localStorage.setItem('ttt_q_table_v3', '{}');
    localStorage.setItem('ttt_q_games_learned_v3', '7');
    localStorage.setItem('ttt_q_focus_v3', '50');
    const bot = new QLearningAgent();
    bot.finalizeGame([0, 4, 1, 3, 8, 5], 'O');
    expect([bot.gamesLearned, bot.focusLevel]).toEqual([8, 35]);
    bot.undoResult();
    expect([bot.gamesLearned, bot.focusLevel]).toEqual([7, 50]);
    expect(JSON.parse(localStorage.getItem('ttt_adaptive_v4')!).table).toEqual({});
    bot.setFocusLevel(88);
    expect(new QLearningAgent().autoAdapt).toBe(false);
    expect(new QLearningAgent().focusLevel).toBe(88);
    bot.resetMemory();
    expect([new QLearningAgent().gamesLearned, bot.focusLevel, bot.autoAdapt]).toEqual([0, 50, true]);
  });

  it('recovers from malformed table entries and counters', () => {
    localStorage.clear();
    localStorage.setItem('ttt_adaptive_v4', '{"table":{".........":null},"games":-10,"focus":200}');
    const bot = new QLearningAgent();
    expect([bot.gamesLearned, bot.focusLevel]).toEqual([0, 50]);
    expect(getAdaptiveBotMove(boardFromMoves([0]), 'O', bot)).toBe(4);
  });
});
