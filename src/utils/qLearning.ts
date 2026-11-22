import type { BoardState, Player, Winner } from '../types/game';
import { checkWinner, getAvailableMoves, opposite } from './gameLogic';
import { isCounter, readSaved, writeSaved } from './storage';

const MEMORY_KEY = 'ttt_adaptive_v4';
type Table = Record<string, Record<number, number>>;
type Step = { state: string; action: number };
type Result = Exclude<Winner, null>;

export const FORWARD_MAP = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8], [2, 5, 8, 1, 4, 7, 0, 3, 6],
  [8, 7, 6, 5, 4, 3, 2, 1, 0], [6, 3, 0, 7, 4, 1, 8, 5, 2],
  [2, 1, 0, 5, 4, 3, 8, 7, 6], [8, 5, 2, 7, 4, 1, 6, 3, 0],
  [6, 7, 8, 3, 4, 5, 0, 1, 2], [0, 3, 6, 1, 4, 7, 2, 5, 8],
];
export const INVERSE_MAP = FORWARD_MAP.map(map => map.map((_, i) => map.indexOf(i)));

export function getBotHyperparameters(focus: number) {
  const ratio = focus / 100;
  return { tau: 0.60 - ratio * 0.56, decayRate: 0.94 + ratio * 0.055 };
}

export function getBotPersona(focus: number) {
  if (focus <= 30) return 'Daydreaming';
  if (focus <= 65) return 'Club rival';
  if (focus <= 85) return 'Tactical';
  return 'Locked in';
}

function canonical(board: BoardState, player: Player) {
  const normalized = board.map(cell => cell === null ? '.' : cell === player ? 'S' : 'O');
  const keys = INVERSE_MAP.map(map => map.map(i => normalized[i]).join(''));
  const state = keys.reduce((a, b) => a < b ? a : b);
  return { state, forward: FORWARD_MAP[keys.indexOf(state)] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validTable(value: unknown): value is Table {
  if (!isRecord(value) || Object.keys(value).length > 2000) return false;
  return Object.entries(value).every(([state, row]) =>
    /^[.SO]{9}$/.test(state) && isRecord(row) &&
    Object.entries(row).every(([action, score]) =>
      /^[0-8]$/.test(action) && state[Number(action)] === '.' &&
      typeof score === 'number' && Number.isFinite(score) && Math.abs(score) <= 1
    )
  );
}

function parseSaved(key: string): unknown {
  const raw = readSaved(key);
  if (!raw || raw.length > 512_000) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export class QLearningAgent {
  private table: Table = {};
  private beforeResult: { table: Table; games: number; focus: number } | null = null;
  gamesLearned = 0;
  focusLevel = 50;
  autoAdapt = true;

  constructor() {
    const saved = parseSaved(MEMORY_KEY);
    const data = isRecord(saved) ? saved : {
      table: parseSaved('ttt_q_table_v3'),
      games: parseSaved('ttt_q_games_learned_v3'),
      focus: parseSaved('ttt_q_focus_v3'),
      auto: parseSaved('ttt_q_autoadapt_v3'),
    };
    if (isCounter(data.games)) this.gamesLearned = data.games;
    if (isCounter(data.focus) && data.focus <= 100) this.focusLevel = data.focus;
    if (typeof data.auto === 'boolean') this.autoAdapt = data.auto;
    if (validTable(data.table)) this.table = data.table;
    else this.pretrain();
  }

  private save() {
    writeSaved(MEMORY_KEY, JSON.stringify({
      table: this.table, games: this.gamesLearned, focus: this.focusLevel, auto: this.autoAdapt,
    }));
  }

  setFocusLevel(level: number) {
    if (!Number.isFinite(level)) return;
    this.focusLevel = Math.max(0, Math.min(100, Math.round(level)));
    this.autoAdapt = false;
    this.save();
  }

  setAutoAdapt(enabled: boolean) {
    this.autoAdapt = enabled;
    this.save();
  }

  selectAction(board: BoardState, moves: number[], player: Player): number {
    const { state, forward } = canonical(board, player);
    const tau = getBotHyperparameters(this.focusLevel).tau;
    const weights = moves.map(move => Math.exp((this.table[state]?.[forward[move]] ?? 0) / tau));
    let sample = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < moves.length; i++) {
      sample -= weights[i];
      if (sample <= 0) return moves[i];
    }
    return moves[moves.length - 1];
  }

  private learn(moves: number[], winner: Result) {
    const board: BoardState = Array(9).fill(null);
    const steps: Record<Player, Step[]> = { X: [], O: [] };
    moves.forEach((move, i) => {
      const player = i % 2 === 0 ? 'X' : 'O';
      const { state, forward } = canonical(board, player);
      steps[player].push({ state, action: forward[move] });
      board[move] = player;
    });
    for (const player of ['X', 'O'] as const) {
      let reward = winner === 'Draw' ? 0.3 : player === winner ? 1 : -1;
      for (const { state, action } of steps[player].reverse()) {
        const row = this.table[state] ??= {};
        const old = row[action] ?? 0;
        row[action] = old + 0.25 * (reward - old);
        reward = -0.02 + 0.95 * reward;
      }
    }
  }

  private pretrain() {
    for (let i = 0; i < 150; i++) {
      const board: BoardState = Array(9).fill(null);
      const moves: number[] = [];
      let turn: Player = 'X';
      let result: Winner = null;
      while (!result) {
        const move = this.selectAction(board, getAvailableMoves(board), turn);
        moves.push(move);
        board[move] = turn;
        result = checkWinner(board).winner;
        turn = opposite(turn);
      }
      this.learn(moves, result);
    }
  }

  finalizeGame(moves: number[], winner: Result) {
    this.beforeResult = { table: structuredClone(this.table), games: this.gamesLearned, focus: this.focusLevel };
    this.learn(moves, winner);
    if (this.autoAdapt) {
      const adjustment = winner === 'X' ? 12 : winner === 'O' ? -15 : -5;
      this.focusLevel = Math.max(15, Math.min(95, this.focusLevel + adjustment));
    }
    const { decayRate } = getBotHyperparameters(this.focusLevel);
    for (const row of Object.values(this.table)) {
      for (const key of Object.keys(row)) row[Number(key)] *= decayRate;
    }
    this.gamesLearned++;
    this.save();
  }

  undoResult() {
    if (!this.beforeResult) return;
    this.table = this.beforeResult.table;
    this.gamesLearned = this.beforeResult.games;
    if (this.autoAdapt) this.focusLevel = this.beforeResult.focus;
    this.beforeResult = null;
    this.save();
  }

  resetMemory() {
    this.beforeResult = null;
    this.table = {};
    this.focusLevel = 50;
    this.autoAdapt = true;
    this.gamesLearned = 0;
    this.pretrain();
    this.save();
  }
}
