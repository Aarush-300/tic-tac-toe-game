import type { BoardState, Player, Winner } from '../types/game';
import { checkWinner, getAvailableMoves } from './gameLogic';

const Q_TABLE_STORAGE_KEY = 'ttt_q_table_v3';
const Q_GAMES_COUNT_KEY = 'ttt_q_games_learned_v3';
const Q_FOCUS_KEY = 'ttt_q_focus_v3';
const Q_AUTOADAPT_KEY = 'ttt_q_autoadapt_v3';
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

export interface BotHyperparameters {
  tau: number;
  decayRate: number;
  blockProb: number;
}

export interface BotPersona {
  title: 'DAYDREAMING' | 'CLUB RIVAL' | 'TACTICAL' | 'LOCKED IN';
  badgeClass: string;
}

export type BotMood = BotPersona;

/**
 * Derives dynamic hyperparameters from normalized focusLevel (0 to 100):
 * - Softmax Temperature tau: 0.60 down to 0.04
 * - Memory Retention decayRate: 0.94 up to 0.995
 * - 1-Ply Reflex blockProb: 0.45 up to 0.99
 */
export function getBotHyperparameters(focusLevel: number): BotHyperparameters {
  const clamped = Math.max(0, Math.min(100, Math.round(focusLevel)));
  const tau = Number((0.60 - (clamped / 100) * 0.56).toFixed(3));
  const decayRate = Number((0.94 + (clamped / 100) * 0.055).toFixed(4));
  const blockProb = Number((0.45 + (clamped / 100) * 0.54).toFixed(2));
  return { tau, decayRate, blockProb };
}

/**
 * Computes bot persona title and badge styling based on focusLevel:
 * - 0–30%: DAYDREAMING (Amber badge)
 * - 31–65%: CLUB RIVAL (Cobalt Blue badge)
 * - 66–85%: TACTICAL (Terracotta Orange badge)
 * - 86–100%: LOCKED IN (Charcoal Black badge with white text)
 */
export function getBotPersona(focusLevel: number): BotPersona {
  const clamped = Math.max(0, Math.min(100, Math.round(focusLevel)));
  if (clamped <= 30) {
    return {
      title: 'DAYDREAMING',
      badgeClass: 'bg-amber-200 text-amber-950 border-ink',
    };
  }
  if (clamped <= 65) {
    return {
      title: 'CLUB RIVAL',
      badgeClass: 'bg-cobalt-light text-cobalt border-ink',
    };
  }
  if (clamped <= 85) {
    return {
      title: 'TACTICAL',
      badgeClass: 'bg-terracotta-light text-terracotta border-ink',
    };
  }
  return {
    title: 'LOCKED IN',
    badgeClass: 'bg-ink text-paper-surface border-ink',
  };
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
  public focusLevel: number = 50; // Range: 0 to 100
  public autoAdapt: boolean = true; // Auto rubber-banding flag
  public botTemperature: number = 0.32; // Derived from focusLevel
  public isPrewarmed: boolean = false;

  private botTrajectory: QStep[] = [];
  private humanTrajectory: QStep[] = [];

  constructor() {
    this.initOrMigrateStorage();
  }

  /**
   * Updates focus level. If changed manually by the user, sets autoAdapt to false.
   */
  public setFocusLevel(level: number, manual: boolean = true): void {
    this.focusLevel = Math.max(0, Math.min(100, Math.round(level)));
    if (manual) {
      this.autoAdapt = false;
    }
    this.botTemperature = getBotHyperparameters(this.focusLevel).tau;
    this.saveFocusConfig();
  }

  /**
   * Sets auto-adapt rubber-banding state.
   */
  public setAutoAdapt(enabled: boolean): void {
    this.autoAdapt = enabled;
    this.saveFocusConfig();
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
   * Returns current mood category and UI styling based on focusLevel.
   */
  public getMood(): BotPersona {
    return getBotPersona(this.focusLevel);
  }

  /**
   * Selects an action using Boltzmann Softmax sampling over the top 3 legal moves.
   * Uses dynamic temperature tau derived from focusLevel.
   */
  public selectAction(
    board: BoardState,
    availableMoves: number[],
    activePlayer: Player = 'O',
    temperature?: number
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
    const activeTau = temperature ?? getBotHyperparameters(this.focusLevel).tau;
    const tau = Math.max(0.04, activeTau);
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
   * 1. Auto-Adapt Rubber-Banding adjustments (if autoAdapt === true):
   *    - Human Wins: focusLevel = min(95, focusLevel + 12) (Bot locks in).
   *    - Bot Wins: focusLevel = max(15, focusLevel - 15) (Bot relaxes).
   *    - Draw: focusLevel = max(20, focusLevel - 5) (Stalemate streaks open up).
   * 2. Softer learning rate (alpha = 0.25).
   * 3. Counterfactual Imitation Learning on loss (+0.5 reward).
   * 4. Memory Decay / Retention rate derived from focusLevel.
   */
  public finalizeGame(winner: Winner, aiPlayer: Player = 'O'): number {
    // 1. Auto-Adapt Rubber-Banding Adjustment
    if (this.autoAdapt) {
      if (winner !== null && winner !== aiPlayer && winner !== 'Draw') {
        // Human won: tighten focus
        this.focusLevel = Math.min(95, this.focusLevel + 12);
      } else if (winner === aiPlayer) {
        // Bot won: relax focus
        this.focusLevel = Math.max(15, this.focusLevel - 15);
      } else if (winner === 'Draw') {
        // Stalemate: gently loosen up
        this.focusLevel = Math.max(20, this.focusLevel - 5);
      }
      this.botTemperature = getBotHyperparameters(this.focusLevel).tau;
      this.saveFocusConfig();
    }

    const { decayRate } = getBotHyperparameters(this.focusLevel);
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

    // 4. Memory Decay / Retention rate derived from focusLevel
    for (const state of Object.keys(this.qTable)) {
      for (const action of Object.keys(this.qTable[state])) {
        const actNum = Number(action);
        this.qTable[state][actNum] *= decayRate;
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
   * Resets memory, purges table, restores baseline focusLevel (50), autoAdapt (true),
   * and runs 150 self-play episodes.
   */
  public resetMemory(): void {
    this.qTable = {};
    this.gamesLearned = 0;
    this.focusLevel = 50;
    this.autoAdapt = true;
    this.botTemperature = getBotHyperparameters(50).tau;
    this.botTrajectory = [];
    this.humanTrajectory = [];
    this.preWarmPolicy(150);
    this.saveToStorage();
    this.saveFocusConfig();
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
        localStorage.removeItem(Q_FOCUS_KEY);
        localStorage.removeItem(Q_AUTOADAPT_KEY);
        localStorage.setItem(Q_VERSION_KEY, CURRENT_Q_VERSION);
        this.focusLevel = 50;
        this.autoAdapt = true;
        this.botTemperature = getBotHyperparameters(50).tau;
        this.preWarmPolicy(150);
        this.saveToStorage();
        this.saveFocusConfig();
        return;
      }

      const savedCount = localStorage.getItem(Q_GAMES_COUNT_KEY);
      if (savedCount !== null) {
        this.gamesLearned = parseInt(savedCount, 10) || 0;
      }

      const savedFocus = localStorage.getItem(Q_FOCUS_KEY);
      if (savedFocus !== null) {
        const parsed = parseInt(savedFocus, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
          this.focusLevel = parsed;
        }
      }

      const savedAutoAdapt = localStorage.getItem(Q_AUTOADAPT_KEY);
      if (savedAutoAdapt !== null) {
        this.autoAdapt = savedAutoAdapt === 'true';
      }

      this.botTemperature = getBotHyperparameters(this.focusLevel).tau;

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
      this.focusLevel = 50;
      this.autoAdapt = true;
      this.botTemperature = getBotHyperparameters(50).tau;
      this.preWarmPolicy(150);
    }
  }

  public saveFocusConfig(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(Q_FOCUS_KEY, String(this.focusLevel));
      localStorage.setItem(Q_AUTOADAPT_KEY, String(this.autoAdapt));
    } catch {
      // Ignore storage errors
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(Q_VERSION_KEY, CURRENT_Q_VERSION);
      localStorage.setItem(Q_TABLE_STORAGE_KEY, JSON.stringify(this.qTable));
      localStorage.setItem(Q_GAMES_COUNT_KEY, String(this.gamesLearned));
      this.saveFocusConfig();
    } catch {
      // Ignore storage errors
    }
  }
}

export const qLearningAgent = new QLearningAgent();
