export type Player = "red" | "black";
export type PieceKind = "man" | "king";
export type GameMode = "classic" | "chaos";
export type GameStatus = "active" | "red_won" | "black_won" | "draw";
export type AiPersonality = "aggressive" | "defensive" | "tactical" | "chaos";

export type Position = {
  row: number;
  col: number;
};

export type Piece = {
  id: string;
  player: Player;
  kind: PieceKind;
  position: Position;
};

export type Move = {
  id: string;
  pieceId: string;
  player: Player;
  path: Position[];
  captures: Position[];
  promoted?: boolean;
  score?: number;
  tags?: string[];
};

export type ChaosEventType =
  | "swap_sides"
  | "swap_random_pieces"
  | "flip_perspective"
  | "tempo_surge";

export type ChaosEvent = {
  id: string;
  type: ChaosEventType;
  turn: number;
  label: string;
  description: string;
};

export type GameState = {
  id: string;
  mode: GameMode;
  boardSize: 8;
  pieces: Piece[];
  currentPlayer: Player;
  winner: Player | null;
  status: GameStatus;
  selectedPieceId?: string;
  forcedPieceId?: string;
  perspective: Player;
  turn: number;
  moves: Move[];
  chaosLog: ChaosEvent[];
};

export type MoveAnalysis = {
  move: Move;
  missedCapture: boolean;
  danger: number;
  materialDelta: number;
};
