export interface GameState {
  gameCycle: (action: unknown) => boolean;
}

export type User = {
  socketId: string;
  username: string;
};
