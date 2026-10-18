import { useEffect } from 'react';
import { useTicTacToe } from './hooks/useTicTacToe';
import { Header } from './components/Header';
import { GameModeSelector } from './components/GameModeSelector';
import { Scoreboard } from './components/Scoreboard';
import { StatusBanner } from './components/StatusBanner';
import { Board } from './components/Board';
import { Controls } from './components/Controls';
import { Footer } from './components/Footer';

export default function App() {
  const {
    board,
    turn,
    gameMode,
    winner,
    winningLine,
    scores,
    isAiThinking,
    isMuted,
    qGeneration,
    qConfidence,
    botTemperature,
    botMood,
    canUndo,
    handleSquareClick,
    handleUndo,
    handleNewRound,
    handleResetScores,
    handleSelectMode,
    handleToggleMute,
    handleResetQMemory,
  } = useTicTacToe();

  // Global hotkeys (U = undo, N = new round, R = reset scores)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'u' || e.key === 'U') {
        if (canUndo) {
          handleUndo();
        }
      } else if (e.key === 'n' || e.key === 'N') {
        handleNewRound();
      } else if (e.key === 'r' || e.key === 'R') {
        handleResetScores();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canUndo, handleUndo, handleNewRound, handleResetScores]);

  return (
    <main className="min-h-screen flex flex-col justify-between items-center px-4 py-6 sm:py-8">
      <div className="w-full max-w-md mx-auto flex flex-col items-center">
        <Header isMuted={isMuted} onToggleMute={handleToggleMute} />

        <GameModeSelector
          currentMode={gameMode}
          onSelectMode={handleSelectMode}
          qGeneration={qGeneration}
          qConfidence={qConfidence}
          botMood={botMood}
          botTemperature={botTemperature}
          onResetQMemory={handleResetQMemory}
          disabled={isAiThinking}
        />

        <Scoreboard
          scores={scores}
          turn={turn}
          gameMode={gameMode}
          winner={winner}
        />

        <StatusBanner
          winner={winner}
          turn={turn}
          isAiThinking={isAiThinking}
          gameMode={gameMode}
        />

        <Board
          board={board}
          winningLine={winningLine}
          isGameOver={winner !== null}
          isAiThinking={isAiThinking}
          currentTurn={turn}
          onSquareClick={handleSquareClick}
        />

        <Controls
          canUndo={canUndo}
          onUndo={handleUndo}
          onNewRound={handleNewRound}
          onResetScores={handleResetScores}
        />
      </div>

      <div className="w-full max-w-md mx-auto">
        <Footer />
      </div>
    </main>
  );
}
