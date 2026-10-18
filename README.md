# 🖋️ Tic-Tac-Toe // Paper Edition

A tactile, accessible, neo-brutalist indie browser game built with **Vite**, **React 19**, **TypeScript**, and **Tailwind CSS**. Features human-like probabilistic AI opponents and an in-browser tabular **Q-Learning** reinforcement agent.

---

## ✨ Features & Architecture

### 1. Tactile Neo-Brutalist Paper Aesthetic
- **Warm Paper Canvas**: `#F4F1EA` paper background with an authentic ink dot-grid pattern.
- **Solid Charcoal Ink Borders**: `#18181B` 2px borders with hard offset brutalist shadows (`shadow-[4px_4px_0px_0px_#18181B]`).
- **Accent Inks**: Terracotta / International Orange (`#E04F33`) for Player X, Cobalt Blue (`#2563EB`) for Player O.
- **Typography**: Google Fonts **Space Grotesk** for clean editorial headings and **JetBrains Mono** for scores, stats, and badges.
- **Physical Micro-Interactions**: Mechanical button keys with hover elevation and active physical displacement (`active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`).
- **Animated Ink Strokes**: Marks animate via SVG `stroke-dasharray` and `stroke-dashoffset` as if hand-drawn on paper.
- **Tactile Sound**: Web Audio API synthesizing organic woodblock / key clicks with a zero-latency mute toggle.

### 2. Upgraded AI Opponents (`src/utils/aiEngine.ts` & `src/utils/qLearning.ts`)
1. **Club Player (Casual - Human-like & Beatable):**
   - 1-step lookahead only (never computes deep forks).
   - Takes immediate wins ~90% of the time; blocks immediate threats ~75% of the time.
   - Selects opening moves using weighted positional heuristics (Center 30%, Corners 50%, Edges 20%) with Softmax temperature noise for organic variety.
2. **Tactician (Challenging - Vulnerable to Double Forks):**
   - Always executes immediate winning moves (100%) and blocks immediate threats (100%).
   - Uses depth-limited Minimax ($D=2$) with Softmax sampling ($\text{temperature} = 0.8$) over the top 2 candidate moves. Plays sharp tactical moves while remaining susceptible to clever fork traps.
3. **Adaptive Bot (Canonical 8-Way Symmetry Q-Learning Agent):**
   - **8-Way Board Symmetry Reduction ($D_4$ Group)**: Normalizes marks relative to active player (`SELF` vs `OPPONENT`) and maps all 8 rotations and reflections (0°, 90°, 180°, 270° and horizontal flips) to a single lexicographically minimal canonical state. Learns $8\times$ faster across all corners and edges.
   - **15,000-Episode Pre-Warming**: Pre-trained in memory (<100ms) with decayed exploration ($\epsilon: 1.0 \to 0.1$) against heuristic opponents, learning center control and punishing aggressive corner openings.
   - **1-Ply Tactical Reflex Filter**: Takes immediate winning moves 100% of the time, and blocks immediate opponent threats 90% of the time.
   - **Backward Episode Replay & Counterfactual Imitation Learning**: Applies TD-return updates with step penalty ($-0.02$). On a loss, penalizes the bot's blunder and replays the human's winning trajectory into the bot's own policy with $+1.0$ reward, copying the human's winning strategy immediately.
   - **Live Telemetry**: Real-time Q-confidence and win probability telemetry displayed in `JetBrains Mono` next to the generation badge.
4. **Local PvP**:
   - Turn-based play for two human players on the same device.

### 3. Controls & Accessibility
- Full keyboard arrow-key navigation (`↑`, `↓`, `←`, `→`, `Home`, `End`).
- `Enter` or `Space` to place marks.
- Global Hotkeys: `U` (Undo), `N` (New Round), `R` (Reset Scores).
- Multi-step undo rolls back both player and AI turns.
- Full WCAG accessibility with dynamic `aria-label` updates on all grid cells.

---

## 🏗️ Project Structure

```text
├── .github/
│   └── workflows/
│       └── deploy.yml          # Automated GitHub Pages CI/CD workflow
├── public/
│   └── favicon.svg             # Neo-brutalist paper favicon
├── src/
│   ├── components/
│   │   ├── Board.tsx           # Accessible 3x3 mechanical grid
│   │   ├── Controls.tsx        # Undo, New Round, and Reset controls
│   │   ├── Footer.tsx          # Keyboard shortcut hints
│   │   ├── GameModeSelector.tsx# PvP, Club, Tactician, Adaptive Bot tabs
│   │   ├── Header.tsx          # Typographic header & tactile sound toggle
│   │   ├── Scoreboard.tsx      # Terracotta / Cobalt score tracker
│   │   ├── Square.tsx          # Mechanical cell with animated SVG ink marks
│   │   └── StatusBanner.tsx    # Turn indicator & outcome announcements
│   ├── hooks/
│   │   └── useTicTacToe.ts     # Game state, turn transitions & Q-learning integration
│   ├── types/
│   │   └── game.ts             # TypeScript definitions & interfaces
│   ├── utils/
│   │   ├── aiEngine.ts         # Club Player, Tactician, and Softmax sampler
│   │   ├── gameLogic.ts        # Win/Draw detection & move validators
│   │   ├── gameLogic.test.ts   # Formal verification test suite
│   │   ├── qLearning.ts        # Tabular Q-learning agent with localStorage
│   │   └── sound.ts            # Web Audio API tactile sound generator
│   ├── App.tsx                 # Root application component
│   ├── App.test.tsx            # UI & interaction integration tests
│   ├── index.css               # Dot-grid pattern & SVG drawing keyframes
│   └── main.tsx                # Entry point
├── firebase.json               # Firebase Hosting configuration
├── netlify.toml                # Netlify SPA redirect rules
├── vercel.json                 # Vercel SPA rewrites
├── tailwind.config.js          # Neo-brutalist theme & brutal shadows
└── vite.config.ts              # Vite & Vitest configuration
```

---

## 🚀 Local Development & Verification

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Dev Server
```bash
npm run dev
```

### 3. Run Automated Tests
```bash
npm test
```

### 4. Strict Type-Check
```bash
npx tsc -b
```

### 5. Production Build
```bash
npm run build
```

### 6. Local Preview
```bash
npm run preview
```

---

## 🚢 Single-Command Deployments

- **Local Preview**: `npm run preview`
- **Vercel**: `npx vercel --prod`
- **Netlify**: `npx netlify deploy --prod --dir=dist`
- **Firebase Hosting**: `npx firebase-tools deploy --only hosting`
- **GitHub Pages**: Push to `main` (automated via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml))
