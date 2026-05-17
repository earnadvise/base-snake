import { create } from 'zustand';

export type GameState = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export interface Position {
  x: number;
  y: number;
}

interface GameStore {
  gameState: GameState;
  score: number;
  highScore: number;
  snake: Position[];
  food: Position;
  direction: Position;
  speed: number;
  isSoundMuted: boolean;
  
  setGameState: (state: GameState) => void;
  setScore: (score: number) => void;
  setHighScore: (highScore: number) => void;
  setSnake: (snakeUpdate: Position[] | ((prev: Position[]) => Position[])) => void;
  setFood: (food: Position) => void;
  setDirection: (direction: Position) => void;
  setSpeed: (speed: number) => void;
  toggleSound: () => void;
  resetGame: () => void;
}

const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];

const INITIAL_DIRECTION = { x: 0, y: -1 }; // UP

export const useGameStore = create<GameStore>((set) => ({
  gameState: 'IDLE',
  score: 0,
  highScore: parseInt(localStorage.getItem('basesnake_highscore') || '0', 10),
  snake: INITIAL_SNAKE,
  food: { x: 5, y: 5 },
  direction: INITIAL_DIRECTION,
  speed: 150, // Initial tick delay in ms
  isSoundMuted: localStorage.getItem('basesnake_muted') === 'true',

  setGameState: (state) => set({ gameState: state }),
  
  setScore: (score) => set((store) => {
    const newHighScore = score > store.highScore ? score : store.highScore;
    if (score > store.highScore) {
      localStorage.setItem('basesnake_highscore', score.toString());
    }
    return { score, highScore: newHighScore };
  }),
  
  setHighScore: (highScore) => set({ highScore }),
  
  setSnake: (snakeUpdate) => set((state) => ({
    snake: typeof snakeUpdate === 'function' ? snakeUpdate(state.snake) : snakeUpdate
  })),
  
  setFood: (food) => set({ food }),
  
  setDirection: (direction) => set({ direction }),
  
  setSpeed: (speed) => set({ speed }),
  
  toggleSound: () => set((state) => {
    const newMuted = !state.isSoundMuted;
    localStorage.setItem('basesnake_muted', newMuted.toString());
    return { isSoundMuted: newMuted };
  }),
  
  resetGame: () => set({
    gameState: 'IDLE',
    score: 0,
    snake: INITIAL_SNAKE,
    direction: INITIAL_DIRECTION,
    speed: 150,
  }),
}));
