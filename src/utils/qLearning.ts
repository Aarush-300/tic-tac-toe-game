import type { BoardState, Player, Winner } from '../types/game';
import { checkWinner, getAvailableMoves } from './gameLogic';

const Q_TABLE_STORAGE_KEY = 'ttt_q_table_v3';
const Q_GAMES_COUNT_KEY = 'ttt_q_games_learned_v3';
const Q_TEMPERATURE_KEY = 'ttt_q_temp_v3';
const Q_VERSION_KEY = 'ttt_q_version';
const CURRENT_Q_VERSION = 'q_table_v3';

export interface QStep {
  state: string;
  action: number;
}

export interface CanonicalResult {
  canonicalState: string;
  symIndex: number;
}

export type BotMoodLabel = 'Casual' | 'Focused' | 'Locked In';

export interface BotMood {
  label: BotMoodLabel;
  colorClass: string;
}

/**
 * 8 symmetry permutations for a 3x3 board (D4 Dihedral Group):
 * 0: Identity (rot0)
 * 1: Rotate 90° clockwise
 * 2: Rotate 180° clockwise
 * 3: Rotate 270° clockwise
 * 4: Horizontal reflection (flip along vertical axis)
 * 5: Horizontal reflection + 90° rotation
 * 6: Horizontal reflection + 180° rotation (Vertical reflection)
 * 7: Horizontal reflection + 270° rotation
 */
export const FORWARD_MAP: readonly (readonly number[])[] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8],
  [2, 5, 8, 1, 4, 7, 0, 3, 6],
  [8, 7, 6, 5, 4, 3, 2, 1, 0],
  [6, 3, 0, 7, 4, 1, 8, 5, 2],
  [2, 1, 0, 5, 4, 3, 8, 7, 6],
  [8, 5, 2, 7, 4, 1, 6, 3, 0],
  [6, 7, 8, 3, 4, 5, 0, 1, 2],
  [0, 3, 6, 1, 4, 7, 2, 5, 8],
] as const;

export const INVERSE_MAP: readonly (readonly number[])[] = FORWARD_MAP.map((fwd) => {
  const inv = new Array(9);
  for (let i = 0; i < 9; i++) {
    inv[fwd[i]] = i;
  }
  return inv;
});

export class QLearningAgent {
  public qTable: Record<string, Record<number, number>> = {};
  public gamesLearned: number = 0;
  public botTemperature: number = 0.30; // Dynamic rubber-band temperature
  public isPrewarmed: boolean = false;

  private botTrajectory: QStep[] = [];
  private humanTrajectory: QStep[] = [];

  constructor() {
    this.initOrMigrateStorage();
  }

  /**
   * Normalizes the board marks relative to active player ('S' = Self, 'O' = Opponent, '.' = empty),
   * evaluates all 8 symmetry permutations, and returns the lexicographically smallest string
   * along with the symmetry index used.
   */
  public getCanonical(board: BoardState, activePlayer: Player): CanonicalResult {
    const normalized = new Array<string>(9);
    for (let i = 0; i < 9; i++) {
      const cell = board[i];
      if (cell === activePlayer) {
        normalized[i] = 'S';
      } else if (cell !== null) {
        normalized[i] = 'O';
      } else {
        normalized[i] = '.';
      }
    }

    let canonicalState = '';
    let symIndex = 0;

    for (let k = 0; k < 8; k++) {
      const inv = INVERSE_MAP[k];
      let str = '';
      for (let j = 0; j < 9; j++) {
        str += normalized[inv[j]];
      }
      if (canonicalState === '' || str < canonicalState) {
        canonicalState = str;
        symIndex = k;
      }
    }

    return { canonicalState, symIndex };
  }

  /**
   * Retrieves Q-value. Initializes unseen state-action entries with tiny uniform noise [-0.05, +0.05]
   * so early play feels organic and varied.
   */
  public getQ(stateStr: string, action: number): number {
    if (!this.qTable[stateStr]) {
      this.qTable[stateStr] = {};
    }
    if (this.qTable[stateStr][action] === undefined) {
      this.qTable[stateStr][action] = (Math.random() - 0.5) * 0.10;
    }
    return this.qTable[stateStr][action];
  }

  public setQ(stateStr: string, action: number, value: number): void {
    if (!this.qTable[stateStr]) {
      this.qTable[stateStr] = {};
    }
    this.qTable[stateStr][action] = value;
  }

  /**
   * Returns current mood category and UI styling based on dynamic temperature tau.
   * - Casual: tau > 0.32
   * - Focused: tau in [0.18, 0.32]
   * - Locked In: tau < 0.18
   */
  public getMood(): BotMood {
    if (this.botTemperature > 0.32) {
      return { label: 'Casual', colorClass: 'text-amber-700 bg-amber-100 border-amber-800' };
    }
    if (this.botTemperature >= 0.18) {
      return { label: 'Focused', colorClass: 'text-cobalt bg-cobalt-light border-cobalt' };
    }
    return { label: 'Locked In', colorClass: 'text-terracotta bg-terracotta-light border-terracotta' };
  }

  /**
   * Selects an action using Boltzmann Softmax sampling over the top 3 legal moves.
   * Uses dynamic temperature tau for rubber-band difficulty.
   */
  public selectAction(
    board: BoardState,
    availableMoves: number[],
    activePlayer: Player = 'O',
    temperature: number = this.botTemperature
  ): number {
    if (availableMoves.length === 0) return 0;
    if (availableMoves.length === 1) return availableMoves[0];

    const { canonicalState, symIndex } = this.getCanonical(board, activePlayer);
    const canAvailableMoves = availableMoves.map((m) => FORWARD_MAP[symIndex][m]);

    // Rank legal moves by Q-value descending
    const scoredMoves = canAvailableMoves.map((canA) => ({
      canAction: canA,
      qValue: this.getQ(canonicalState, canA),
    }));

    scoredMoves.sort((a, b) => b.qValue - a.qValue);

    // Filter to top 3 legal moves
    const topCandidates = scoredMoves.slice(0, 3);

    // Boltzmann Softmax sampling over top candidates
    const tau = Math.max(0.05, temperature);
    const maxQ = Math.max(...topCandidates.map((c) => c.qValue));
    const expScores = topCandidates.map((c) => Math.exp((c.qValue - maxQ) / tau));
    const sumExp = expScores.reduce((acc, v) => acc + v, 0);

    const rand = Math.random() * sumExp;
    let cum = 0;
    let chosenCanMove = topCandidates[0].canAction;

    for (let i = 0; i < topCandidates.length; i++) {
      cum += expScores[i];
      if (rand <= cum) {
        chosenCanMove = topCandidates[i].canAction;
        break;
      }
    }

    // Invert canonical action back to real board coordinates
    return INVERSE_MAP[symIndex][chosenCanMove];
  }

  /**
   * Returns the agent's real-time Q-value confidence and win probability estimate for the current board.
   */
  public getConfidence(board: BoardState, activePlayer: Player = 'O'): { qValue: number; winProb: number } {
    const availableMoves = getAvailableMoves(board);
    if (availableMoves.length === 0) {
      return { qValue: 0.0, winProb: 50 };
    }

    const { canonicalState, symIndex } = this.getCanonical(board, activePlayer);
    const canAvailableMoves = availableMoves.map((m) => FORWARD_MAP[symIndex][m]);

    let maxQ = -Infinity;
    for (const canA of canAvailableMoves) {
      const q = this.getQ(canonicalState, canA);
      if (q > maxQ) {
        maxQ = q;
      }
    }

    if (maxQ === -Infinity) {
      maxQ = 0.0;
    }

    const winProb = Math.min(99, Math.max(1, Math.round(100 / (1 + Math.exp(-2.5 * maxQ)))));
    return { qValue: maxQ, winProb };
  }

  /**
   * Records a step taken by the bot.
   */
  public recordBotStep(board: BoardState, realAction: number, aiPlayer: Player = 'O'): void {
    const { canonicalState, symIndex } = this.getCanonical(board, aiPlayer);
    const canAction = FORWARD_MAP[symIndex][realAction];
    this.botTrajectory.push({ state: canonicalState, action: canAction });
  }

  /**
   * Records a step taken by the human opponent.
   */
  public recordHumanStep(board: BoardState, realAction: number, humanPlayer: Player = 'X'): void {
    const { canonicalState, symIndex } = this.getCanonical(board, humanPlayer);
    const canAction = FORWARD_MAP[symIndex][realAction];
    this.humanTrajectory.push({ state: canonicalState, action: canAction });
  }

  /**
   * Updates the Q-table when a game against the human concludes:
   * 1. Dynamic Softmax Rubber-Banding adjustments:
   *    - Human Wins: tau -= 0.06 (clamps at 0.10) -> Bot focuses up.
   *    - Bot Wins: tau += 0.08 (clamps at 0.50) -> Bot relaxes.
   *    - Draw: tau += 0.03 (clamps at 0.50) -> Stalemate streaks open up.
   * 2. Softer learning rate (alpha = 0.25).
   * 3. Counterfactual Imitation Learning on loss (+0.5 reward).
   * 4. Memory Decay (forgetting factor 0.97).
   */
  public finalizeGame(winner: Winner, aiPlayer: Player = 'O'): number {
    // 1. Dynamic Softmax Rubber-Banding Adjustment
    if (winner !== null && winner !== aiPlayer && winner !== 'Draw') {
      // Human won: tighten bot focus
      this.botTemperature = Math.max(0.10, this.botTemperature - 0.06);
    } else if (winner === aiPlayer) {
      // Bot won: relax bot difficulty
      this.botTemperature = Math.min(0.50, this.botTemperature + 0.08);
    } else if (winner === 'Draw') {
      // Stalemate: gently loosen up to allow decisive games
      this.botTemperature = Math.min(0.50, this.botTemperature + 0.03);
    }

    const alpha = 0.25; // Softer live learning rate
    const gamma = 0.95;
    const stepPenalty = -0.02;

    // 2. Bot Trajectory Update
    if (this.botTrajectory.length > 0) {
      let botReward = 0.0;
      if (winner === aiPlayer) {
        botReward = 1.0;
      } else if (winner === 'Draw') {
        botReward = 0.3;
      } else if (winner !== null) {
        botReward = -1.0;
      }

      let G_bot = botReward;
      for (let i = this.botTrajectory.length - 1; i >= 0; i--) {
        const { state, action } = this.botTrajectory[i];
        const curQ = this.getQ(state, action);
        this.setQ(state, action, curQ + alpha * (G_bot - curQ));
        G_bot = stepPenalty + gamma * G_bot;
      }
    }

    // 3. Counterfactual Imitation Learning on Loss
    // Human won: learn human's winning strategy with a softer +0.5 reward
    if (winner !== null && winner !== aiPlayer && winner !== 'Draw' && this.humanTrajectory.length > 0) {
      let G_human = 0.5;
      for (let i = this.humanTrajectory.length - 1; i >= 0; i--) {
        const { state, action } = this.humanTrajectory[i];
        const curQ = this.getQ(state, action);
        this.setQ(state, action, curQ + alpha * (G_human - curQ));
        G_human = stepPenalty + gamma * G_human;
      }
    }

    // 4. Memory Decay (forgetting factor of 0.97)
    // Ensures old lessons slowly fade over 10-15 games
    for (const state of Object.keys(this.qTable)) {
      for (const action of Object.keys(this.qTable[state])) {
        const actNum = Number(action);
        this.qTable[state][actNum] *= 0.97;
      }
    }

    this.botTrajectory = [];
    this.humanTrajectory = [];
    this.gamesLearned += 1;
    this.saveToStorage();

    return this.gamesLearned;
  }

  public resetCurrentEpisode(): void {
    this.botTrajectory = [];
    this.humanTrajectory = [];
  }

  /**
   * Pre-trains the agent with 150 episodes of pure self-play.
   * (No heuristic teacher; leaves realistic, human-exploitable blind spots).
   */
  public preWarmPolicy(episodes: number = 150): void {
    const alpha = 0.25;
    const gamma = 0.95;
    const stepPenalty = -0.02;

    for (let ep = 0; ep < episodes; ep++) {
      const board: BoardState = Array(9).fill(null);
      let turn: Player = 'X';
      const trajX: QStep[] = [];
      const trajO: QStep[] = [];

      let winner: Winner = null;
      while (winner === null) {
        const available = getAvailableMoves(board);
        if (available.length === 0) break;

        const { canonicalState, symIndex } = this.getCanonical(board, turn);

        // Self-play with Softmax selection at balanced temperature 0.30
        const chosenReal = this.selectAction(board, available, turn, 0.30);
        const canAction = FORWARD_MAP[symIndex][chosenReal];

        if (turn === 'X') {
          trajX.push({ state: canonicalState, action: canAction });
        } else {
          trajO.push({ state: canonicalState, action: canAction });
        }

        board[chosenReal] = turn;
        winner = checkWinner(board).winner;
        turn = turn === 'X' ? 'O' : 'X';
      }

      const rewardX = winner === 'X' ? 1.0 : winner === 'Draw' ? 0.3 : -1.0;
      const rewardO = winner === 'O' ? 1.0 : winner === 'Draw' ? 0.3 : -1.0;

      const replayTraj = (traj: QStep[], finalReward: number) => {
        let G = finalReward;
        for (let i = traj.length - 1; i >= 0; i--) {
          const { state, action } = traj[i];
          const curQ = this.getQ(state, action);
          this.setQ(state, action, curQ + alpha * (G - curQ));
          G = stepPenalty + gamma * G;
        }
      };

      replayTraj(trajX, rewardX);
      replayTraj(trajO, rewardO);
    }

    this.isPrewarmed = true;
  }

  /**
   * Resets memory, purges table, restores baseline 0.30 temperature, and runs 150 self-play episodes.
   */
  public resetMemory(): void {
    this.qTable = {};
    this.gamesLearned = 0;
    this.botTemperature = 0.30;
    this.botTrajectory = [];
    this.humanTrajectory = [];
    this.preWarmPolicy(150);
    this.saveToStorage();
  }

  private initOrMigrateStorage(): void {
    if (typeof window === 'undefined') {
      this.preWarmPolicy(150);
      return;
    }

    try {
      const storedVersion = localStorage.getItem(Q_VERSION_KEY);
      if (storedVersion !== CURRENT_Q_VERSION) {
        // Purge over-trained table and initialize v3
        localStorage.removeItem(Q_TABLE_STORAGE_KEY);
        localStorage.removeItem(Q_GAMES_COUNT_KEY);
        localStorage.removeItem(Q_TEMPERATURE_KEY);
        localStorage.setItem(Q_VERSION_KEY, CURRENT_Q_VERSION);
        this.botTemperature = 0.30;
        this.preWarmPolicy(150);
        this.saveToStorage();
        return;
      }

      const savedCount = localStorage.getItem(Q_GAMES_COUNT_KEY);
      if (savedCount !== null) {
        this.gamesLearned = parseInt(savedCount, 10) || 0;
      }

      const savedTemp = localStorage.getItem(Q_TEMPERATURE_KEY);
      if (savedTemp !== null) {
        const parsed = parseFloat(savedTemp);
        if (!isNaN(parsed) && parsed >= 0.10 && parsed <= 0.50) {
          this.botTemperature = parsed;
        }
      }

      const savedTable = localStorage.getItem(Q_TABLE_STORAGE_KEY);
      if (savedTable) {
        this.qTable = JSON.parse(savedTable);
        this.isPrewarmed = true;
      } else {
        this.preWarmPolicy(150);
        this.saveToStorage();
      }
    } catch {
      this.qTable = {};
      this.gamesLearned = 0;
      this.botTemperature = 0.30;
      this.preWarmPolicy(150);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(Q_VERSION_KEY, CURRENT_Q_VERSION);
      localStorage.setItem(Q_TABLE_STORAGE_KEY, JSON.stringify(this.qTable));
      localStorage.setItem(Q_GAMES_COUNT_KEY, String(this.gamesLearned));
      localStorage.setItem(Q_TEMPERATURE_KEY, this.botTemperature.toFixed(2));
    } catch {
      // Ignore storage errors
    }
  }
}

export const qLearningAgent = new QLearningAgent();
