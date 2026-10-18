import type { BoardState, Player, Winner } from '../types/game';
import { checkWinner, getAvailableMoves } from './gameLogic';

const Q_TABLE_STORAGE_KEY = 'ttt_q_table_v2';
const Q_GAMES_COUNT_KEY = 'ttt_q_games_learned_v2';
const Q_VERSION_KEY = 'ttt_q_version';
const CURRENT_Q_VERSION = 'q_table_v2';

export interface QStep {
  state: string;
  action: number;
}

export interface CanonicalResult {
  canonicalState: string;
  symIndex: number;
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

  public getQ(stateStr: string, action: number): number {
    return this.qTable[stateStr]?.[action] ?? 0.0;
  }

  public setQ(stateStr: string, action: number, value: number): void {
    if (!this.qTable[stateStr]) {
      this.qTable[stateStr] = {};
    }
    this.qTable[stateStr][action] = value;
  }

  /**
   * Selects an action using canonical state mapping and greedy / epsilon-greedy policy.
   */
  public selectAction(
    board: BoardState,
    availableMoves: number[],
    activePlayer: Player = 'O',
    epsilon: number = 0.0
  ): number {
    if (availableMoves.length === 0) return 0;
    if (availableMoves.length === 1) return availableMoves[0];

    // Exploration
    if (epsilon > 0 && Math.random() < epsilon) {
      const randomIndex = Math.floor(Math.random() * availableMoves.length);
      return availableMoves[randomIndex];
    }

    // Exploitation over canonical state
    const { canonicalState, symIndex } = this.getCanonical(board, activePlayer);
    const canAvailableMoves = availableMoves.map((m) => FORWARD_MAP[symIndex][m]);

    let maxQ = -Infinity;
    let candidateCanMoves: number[] = [];

    for (const canA of canAvailableMoves) {
      const q = this.getQ(canonicalState, canA);
      if (q > maxQ) {
        maxQ = q;
        candidateCanMoves = [canA];
      } else if (Math.abs(q - maxQ) < 1e-5) {
        candidateCanMoves.push(canA);
      }
    }

    // Tie-breaker with small tau Softmax
    let chosenCanMove: number;
    if (candidateCanMoves.length === 1) {
      chosenCanMove = candidateCanMoves[0];
    } else {
      const tau = 0.05;
      const expScores = candidateCanMoves.map((m) =>
        Math.exp((this.getQ(canonicalState, m) - maxQ) / tau)
      );
      const total = expScores.reduce((acc, v) => acc + v, 0);
      const rand = Math.random() * total;
      let cum = 0;
      chosenCanMove = candidateCanMoves[0];
      for (let i = 0; i < candidateCanMoves.length; i++) {
        cum += expScores[i];
        if (rand <= cum) {
          chosenCanMove = candidateCanMoves[i];
          break;
        }
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

    // Sigmoid probability scaling
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
   * Updates the Q-table when a game against the human concludes.
   * Performs backward propagation (TD/Monte Carlo return with step penalty)
   * and Counterfactual Imitation Learning on loss.
   */
  public finalizeGame(winner: Winner, aiPlayer: Player = 'O'): number {
    if (this.botTrajectory.length === 0 && this.humanTrajectory.length === 0) {
      return this.gamesLearned;
    }

    const alpha = 0.5;
    const gamma = 0.95;
    const stepPenalty = -0.02;

    // 1. Bot Trajectory Update
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

    // 2. Counterfactual Imitation Learning on Loss
    // If the human won, reinforce the human's winning trajectory into the normalized policy
    if (winner !== null && winner !== aiPlayer && winner !== 'Draw') {
      let G_human = 1.0;
      for (let i = this.humanTrajectory.length - 1; i >= 0; i--) {
        const { state, action } = this.humanTrajectory[i];
        const curQ = this.getQ(state, action);
        this.setQ(state, action, curQ + alpha * (G_human - curQ));
        G_human = stepPenalty + gamma * G_human;
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
   * Pre-trains the agent with 15,000 episodes of self-play and heuristic opponents.
   */
  public preWarmPolicy(episodes: number = 15000): void {
    const alpha = 0.3;
    const gamma = 0.95;
    const stepPenalty = -0.02;

    for (let ep = 0; ep < episodes; ep++) {
      const epsilon = 1.0 - (ep / episodes) * 0.9;
      const isHeuristicOpponent = ep % 2 === 0;
      const heuristicPlayer: Player = ep % 4 === 0 ? 'X' : 'O';

      const board: BoardState = Array(9).fill(null);
      let turn: Player = 'X';
      const trajX: QStep[] = [];
      const trajO: QStep[] = [];

      let winner: Winner = null;
      while (winner === null) {
        const available = getAvailableMoves(board);
        if (available.length === 0) break;

        const { canonicalState, symIndex } = this.getCanonical(board, turn);

        let chosenReal: number;
        if (isHeuristicOpponent && turn === heuristicPlayer) {
          // Heuristic opponent logic
          let hMove: number | null = null;
          // Check immediate win
          for (const m of available) {
            board[m] = turn;
            if (checkWinner(board).winner === turn) {
              hMove = m;
              board[m] = null;
              break;
            }
            board[m] = null;
          }
          // Check immediate block
          if (hMove === null) {
            const opp: Player = turn === 'X' ? 'O' : 'X';
            for (const m of available) {
              board[m] = opp;
              if (checkWinner(board).winner === opp) {
                hMove = m;
                board[m] = null;
                break;
              }
              board[m] = null;
            }
          }
          // Center preference (70%)
          if (hMove === null && available.includes(4) && Math.random() < 0.7) {
            hMove = 4;
          }
          // Corner preference (60%)
          if (hMove === null) {
            const corners = available.filter((c) => c === 0 || c === 2 || c === 6 || c === 8);
            if (corners.length > 0 && Math.random() < 0.6) {
              hMove = corners[Math.floor(Math.random() * corners.length)];
            }
          }
          chosenReal = hMove !== null ? hMove : available[Math.floor(Math.random() * available.length)];
        } else {
          // Q-policy with decayed epsilon
          if (Math.random() < epsilon) {
            chosenReal = available[Math.floor(Math.random() * available.length)];
          } else {
            const canAvail = available.map((m) => FORWARD_MAP[symIndex][m]);
            let maxQ = -Infinity;
            let bestCan = canAvail[0];
            for (const canA of canAvail) {
              const q = this.getQ(canonicalState, canA);
              if (q > maxQ) {
                maxQ = q;
                bestCan = canA;
              }
            }
            chosenReal = INVERSE_MAP[symIndex][bestCan];
          }
        }

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

  public resetMemory(): void {
    this.qTable = {};
    this.gamesLearned = 0;
    this.botTrajectory = [];
    this.humanTrajectory = [];
    this.preWarmPolicy(15000);
    this.saveToStorage();
  }

  private initOrMigrateStorage(): void {
    if (typeof window === 'undefined') {
      this.preWarmPolicy(15000);
      return;
    }

    try {
      const storedVersion = localStorage.getItem(Q_VERSION_KEY);
      if (storedVersion !== CURRENT_Q_VERSION) {
        // Purge old under-trained table and run 15k pre-training
        localStorage.removeItem(Q_TABLE_STORAGE_KEY);
        localStorage.removeItem(Q_GAMES_COUNT_KEY);
        localStorage.setItem(Q_VERSION_KEY, CURRENT_Q_VERSION);
        this.preWarmPolicy(15000);
        this.saveToStorage();
        return;
      }

      const savedCount = localStorage.getItem(Q_GAMES_COUNT_KEY);
      if (savedCount !== null) {
        this.gamesLearned = parseInt(savedCount, 10) || 0;
      }

      const savedTable = localStorage.getItem(Q_TABLE_STORAGE_KEY);
      if (savedTable) {
        this.qTable = JSON.parse(savedTable);
        this.isPrewarmed = true;
      } else {
        this.preWarmPolicy(15000);
        this.saveToStorage();
      }
    } catch {
      this.qTable = {};
      this.gamesLearned = 0;
      this.preWarmPolicy(15000);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(Q_VERSION_KEY, CURRENT_Q_VERSION);
      localStorage.setItem(Q_TABLE_STORAGE_KEY, JSON.stringify(this.qTable));
      localStorage.setItem(Q_GAMES_COUNT_KEY, String(this.gamesLearned));
    } catch {
      // Ignore storage quota or privacy mode error
    }
  }
}

export const qLearningAgent = new QLearningAgent();
