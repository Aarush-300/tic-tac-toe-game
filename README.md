# 🎮 Neon Tic-Tac-Toe (Unbeatable Minimax AI)

A production-ready, accessible, and high-performance Tic-Tac-Toe browser game engineered with **Vite**, **React 19**, **TypeScript**, and **Tailwind CSS**.

---

## ✨ Features

- **3 Dynamic Game Modes**:
  1. **Player vs. Player (Local)**: Alternating turns with local player controls.
  2. **Player vs. AI (Easy)**: Casual randomized moves with a simulated natural 300ms reaction delay.
  3. **Player vs. AI (Unbeatable Master)**: Optimal moves calculated using the **Minimax algorithm with alpha-beta pruning** — mathematically impossible to beat.
- **Move History & Undo**:
  - Full history stack allowing undo.
  - In AI mode, automatically rolls back both the AI's response and the player's move so the player can rethink their turn.
- **Score Tracking & Persistence**:
  - Live scoreboard tracking wins for X, O, and Ties/Draws.
  - Automatic persistence to `localStorage` for scores and selected game mode.
  - "Reset Scores" and "New Round" controls.
- **Cyberpunk Dark-Mode Aesthetic**:
  - Dark-mode first (`slate-950` / `slate-900`) with high-contrast neon cyan (`#06b6d4`) for X and neon rose (`#f43f5e`) for O.
  - Pulsing emerald glow keyframe animation highlights the winning 3-square combination.
- **Web Audio Effects**:
  - Synthesized retro audio using the native **Web Audio API** (zero external assets or audio latency).
  - Quick mute/unmute toggle.
- **Accessibility & Keyboard Navigation (WCAG Compliant)**:
  - All cells are `<button>` elements with real-time `aria-label` updates (e.g. `"Row 1, Column 2, marked X"`).
  - Arrow keys (`↑`, `↓`, `←`, `→`) navigate focus across the 3x3 grid.
  - `Enter` / `Space` places marks.
  - Hotkeys: `U` (Undo), `N` (New Round), `R` (Reset Scores).

---

## 🏗️ Architecture & Project Structure

```text
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages CI/CD workflow
├── public/
│   └── favicon.svg             # Neon themed SVG favicon
├── src/
│   ├── components/
│   │   ├── Board.tsx           # Accessible 3x3 interactive grid
│   │   ├── Controls.tsx        # Undo, New Round, and Reset controls
│   │   ├── Footer.tsx          # Keyboard shortcut hints
│   │   ├── GameModeSelector.tsx# PvP, Easy AI, Unbeatable AI switchers
│   │   ├── Header.tsx          # Branding and sound toggle
│   │   ├── Scoreboard.tsx      # X / Ties / O live stats & active turn
│   │   ├── Square.tsx          # Grid button with hover & winning glow
│   │   └── StatusBanner.tsx    # Turn indicator & outcome announcements
│   ├── hooks/
│   │   └── useTicTacToe.ts     # Centralized state management & game engine
│   ├── types/
│   │   └── game.ts             # TypeScript definitions & interfaces
│   ├── utils/
│   │   ├── gameLogic.ts        # Win detection, Minimax & alpha-beta pruning
│   │   ├── gameLogic.test.ts   # Formal verification test suite
│   │   └── sound.ts            # Web Audio API sound synthesizer
│   ├── App.tsx                 # Root application component
│   ├── App.test.tsx            # Component & UI integration tests
│   ├── index.css               # Tailwind CSS directives & neon glow styles
│   └── main.tsx                # React root entry point
├── firebase.json               # Firebase Hosting SPA configuration
├── netlify.toml                # Netlify SPA routing configuration
├── vercel.json                 # Vercel SPA routing configuration
├── tailwind.config.js          # Tailwind CSS theme extension
└── vite.config.ts              # Vite & Vitest configuration
```

---

## 🚀 Quick Start & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Run Formal Verification Unit Tests
```bash
npm test
```

### 4. TypeScript Strict Type-Check
```bash
npx tsc -b
```

### 5. Production Build
```bash
npm run build
```

### 6. Preview Production Build Locally
```bash
npm run preview
```

---

## 🚢 Single-Command Production Deployments

### Option A: Local Preview
Preview the production `dist/` bundle locally:
```bash
npm run preview
```

### Option B: Vercel
Deploy directly to Vercel production:
```bash
npx vercel --prod
```

### Option C: Netlify
Deploy directly to Netlify production:
```bash
npx netlify deploy --prod --dir=dist
```

### Option D: Firebase Hosting
Deploy directly to Firebase Hosting:
```bash
npx firebase-tools deploy --only hosting
```

### Option E: GitHub Pages
Push to the `main` branch to trigger the automated GitHub Actions pipeline (`.github/workflows/deploy.yml`), or deploy manually using:
```bash
npx gh-pages -d dist
```

---

## 🧪 Formal Verification Results

- **15 Game Logic Tests**:
  - All 8 winning lines validated for both `X` and `O`.
  - Stalemate / Draw detection with no remaining squares.
  - Minimax AI never loses across 100 randomized games as Player 1 (`X`).
  - Minimax AI never loses across 100 randomized games as Player 2 (`O`).
  - Minimax vs. Minimax always concludes in a draw.
  - Immediate winning and immediate blocking behavior verified.
- **5 UI Integration Tests**:
  - Board rendering with 9 accessible buttons.
  - Dynamic `aria-label` updates on move.
  - Round reset and undo mechanisms verified.
- **TypeScript**:
  - Strict mode enabled (`tsc -b`), 0 type errors.
