import { z } from "zod";

export interface GameState {
  gameCycle: (action: unknown) => boolean;
  gameType: GameType;
}

export type User = {
  socketId: string;
  username: string;
};

export const GAME_TYPE = {
  LIARS_DICE: "liars-dice",
} as const;

export const GameTypeSchema = z.union([
  z.literal(GAME_TYPE.LIARS_DICE),
  z.literal("PLACEHOLDER"),
]);
export type GameType = z.infer<typeof GameTypeSchema>;
