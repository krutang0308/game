export enum GameState {
  MENU = 'MENU',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface QuizQuestion {
  question: string;
  answers: string[]; // List of possible falling answers
  correctAnswerIndex: number;
}

export interface FallingItem {
  id: string;
  text: string;
  isCorrect: boolean;
  x: number;
  y: number;
  speed: number;
  width: number;
  height: number;
}

export interface PlayerState {
  x: number; // 0 to 100 percentage of screen width
  score: number;
  lives: number;
}
