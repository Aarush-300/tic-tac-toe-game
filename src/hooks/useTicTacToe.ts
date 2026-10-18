import { useCallback, useEffect, useRef, useState } from 'react';
import type { BoardState, GameMode, Player, ScoreState, Winner, WinningLine } from '../types/game';
import { checkWinner, getAvailableMoves, getBestMove, getRandomMove } from '../utils/gameLogic';
import { sound } from '../utils/sound';

interface HistoryStep {
  board: BoardState;
  turn: Player;
  winner: Winner;
  winningLine: WinningLine;
}

const STORAGE_KEY_SCORES = 'ttt_scores_v1';
const STORAGE_KEY_MODE = 'ttt_gamemode_v1';

const INITIAL_BOARD: BoardState = Array(9).fill(null);
const INITIAL_SCORES: ScoreState = { x: 0, o: 0, ties: 0 };

function getInitialScores(): ScoreState {
  if (typeof window === 'undefined') return INITIAL_SCORES;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SCORES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        typeof parsed.x === 'number' &&
        typeof parsed.o === 'number' &&
        typeof parsed.ties === 'number'
      ) {
        return parsed;
      }
    }
  } catch {
    // Ignore corrupted json
  }
  return INITIAL_SCORES;
}

function getInitialMode(): GameMode {
  if (typeof window === 'undefined') return 'pvp';
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MODE);
    if (saved === 'pvp' || saved === 'ai-easy' || saved === 'ai-unbeatable') {
      return saved;
    }
  } catch {
    // Ignore error
  }
  return 'pvp';
}

export function useTicTacToe() {
  const [board, setBoard] = useState<BoardState>(INITIAL_BOARD);
  const [turn, setTurn] = useState<Player>('X');
  const [gameMode, setGameMode] = useState<GameMode>(getInitialMode);
  const [winner, setWinner] = useState<Winner>(null);
  const [winningLine, setWinningLine] = useState<WinningLine>(null);
  const [scores, setScores] = useState<ScoreState>(getInitialScores);
  const [history, setHistory] = useState<HistoryStep[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.isMuted);

  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync scores to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(scores));
    } catch {
      // Ignore storage errors
    }
  }, [scores]);

  // Sync mode to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MODE, gameMode);
    } catch {
      // Ignore storage errors
    }
  }, [gameMode]);

  // Clean up pending AI timer on unmount
  useEffect(() => {
    return () => {
      if (aiTimerRef.current) {
        clearTimeout(aiTimerRef.current);
      }
    };
  }, []);

  const handleToggleMute = useCallback(() => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  }, []);

  // Handle game end sound & score update
  const handleGameEnd = useCallback((winningPlayer: Winner) => {
    if (winningPlayer === 'X') {
      sound.playWin();
      setScores((prev) => ({ ...prev, x: prev.x + 1 }));
    } else if (winningPlayer === 'O') {
      sound.playWin();
      setScores((prev) => ({ ...prev, o: prev.o + 1 }));
    } else if (winningPlayer === 'Draw') {
      sound.playDraw();
      setScores((prev) => ({ ...prev, ties: prev.ties + 1 }));
    }
  }, []);

  // AI Move Execution
  useEffect(() => {
    if (gameMode === 'pvp' || turn !== 'O' || winner !== null) {
      return;
    }

    const availableMoves = getAvailableMoves(board);
    if (availableMoves.length === 0) return;

    aiTimerRef.current = setTimeout(() => {
      let move: number | null = null;
      if (gameMode === 'ai-easy') {
        move = getRandomMove(board);
      } else if (gameMode === 'ai-unbeatable') {
        move = getBestMove(board, 'O');
      }

      if (move !== null && board[move] === null) {
        // Record history before AI plays
        setHistory((prev) => [
          ...prev,
          {
            board: [...board],
            turn: 'O',
            winner: null,
            winningLine: null,
          },
        ]);

        const nextBoard = [...board];
        nextBoard[move] = 'O';
        sound.playMove('O');
        setBoard(nextBoard);

        const outcome = checkWinner(nextBoard);
        if (outcome.winner) {
          setWinner(outcome.winner);
          setWinningLine(outcome.winningLine);
          handleGameEnd(outcome.winner);
        } else {
          setTurn('X');
        }
      }

      setIsAiThinking(false);
    }, 300);

    return () => {
      if (aiTimerRef.current) {
        clearTimeout(aiTimerRef.current);
      }
    };
  }, [board, turn, gameMode, winner, handleGameEnd]);

  // Player clicks a square
  const handleSquareClick = useCallback(
    (index: number) => {
      if (board[index] !== null || winner !== null || isAiThinking) {
        return;
      }

      // In AI mode, player only plays as 'X'
      if (gameMode !== 'pvp' && turn !== 'X') {
        return;
      }

      // Record current state in history before moving
      setHistory((prev) => [
        ...prev,
        {
          board: [...board],
          turn,
          winner,
          winningLine,
        },
      ]);

      const nextBoard = [...board];
      nextBoard[index] = turn;
      sound.playMove(turn);
      setBoard(nextBoard);

      const outcome = checkWinner(nextBoard);
      if (outcome.winner) {
        setWinner(outcome.winner);
        setWinningLine(outcome.winningLine);
        handleGameEnd(outcome.winner);
      } else {
        setTurn((prevTurn) => (prevTurn === 'X' ? 'O' : 'X'));
        if (gameMode !== 'pvp') {
          setIsAiThinking(true);
        }
      }
    },
    [board, winner, isAiThinking, gameMode, turn, winningLine, handleGameEnd]
  );

  // Undo Move logic
  const handleUndo = useCallback(() => {
    if (isAiThinking || history.length === 0) return;

    sound.playClick();

    // If game ended, undo score change
    if (winner !== null) {
      setScores((prev) => {
        if (winner === 'X') return { ...prev, x: Math.max(0, prev.x - 1) };
        if (winner === 'O') return { ...prev, o: Math.max(0, prev.o - 1) };
        if (winner === 'Draw') return { ...prev, ties: Math.max(0, prev.ties - 1) };
        return prev;
      });
    }

    if (gameMode === 'pvp') {
      // Undo single move in PvP
      const prevStep = history[history.length - 1];
      setBoard(prevStep.board);
      setTurn(prevStep.turn);
      setWinner(prevStep.winner);
      setWinningLine(prevStep.winningLine);
      setHistory((prev) => prev.slice(0, -1));
    } else {
      // In AI mode:
      // If the game ended on Player X's move, we only need to undo 1 move (Player X's move)
      // Otherwise (AI made move O or game ended on AI's move), we undo both AI and player's move (2 steps)
      const stepsToUndo = winner === 'X' ? 1 : Math.min(2, history.length);
      const targetIndex = history.length - stepsToUndo;

      if (targetIndex >= 0) {
        const targetStep = history[targetIndex];
        setBoard(targetStep.board);
        setTurn('X');
        setWinner(null);
        setWinningLine(null);
        setHistory((prev) => prev.slice(0, targetIndex));
      } else {
        // Revert to initial empty board
        setBoard(INITIAL_BOARD);
        setTurn('X');
        setWinner(null);
        setWinningLine(null);
        setHistory([]);
      }
    }
  }, [isAiThinking, history, winner, gameMode]);

  // Start new round
  const handleNewRound = useCallback(() => {
    if (aiTimerRef.current) {
      clearTimeout(aiTimerRef.current);
    }
    sound.playClick();
    setBoard(INITIAL_BOARD);
    setTurn('X');
    setWinner(null);
    setWinningLine(null);
    setHistory([]);
    setIsAiThinking(false);
  }, []);

  // Reset all scores
  const handleResetScores = useCallback(() => {
    sound.playClick();
    setScores(INITIAL_SCORES);
  }, []);

  // Select game mode
  const handleSelectMode = useCallback((newMode: GameMode) => {
    if (aiTimerRef.current) {
      clearTimeout(aiTimerRef.current);
    }
    sound.playClick();
    setGameMode(newMode);
    setBoard(INITIAL_BOARD);
    setTurn('X');
    setWinner(null);
    setWinningLine(null);
    setHistory([]);
    setIsAiThinking(false);
  }, []);

  return {
    board,
    turn,
    gameMode,
    winner,
    winningLine,
    scores,
    history,
    isAiThinking,
    isMuted,
    canUndo: history.length > 0 && !isAiThinking,
    handleSquareClick,
    handleUndo,
    handleNewRound,
    handleResetScores,
    handleSelectMode,
    handleToggleMute,
  };
}
