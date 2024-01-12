import { GameState } from "../types";

export class GamesManager {
  roomIdToGameState: Map<string, GameState>;
  constructor() {
    this.roomIdToGameState = new Map();
  }

  hasStarted(roomId: string) {
    return this.roomIdToGameState.has(roomId);
  }

  startGame(roomId: string, gameState: GameState) {
    this.roomIdToGameState.set(roomId, gameState);
  }

  addGameState(roomId: string, gameState: GameState) {
    if (this.roomIdToGameState.has(roomId)) {
      throw new Error(`game state for ${roomId} already exists`);
    }
    this.roomIdToGameState.set(roomId, gameState);
  }

  deleteGameState(roomId: string) {
    this.roomIdToGameState.delete(roomId);
  }

  hasGameState(roomId: string) {
    return this.roomIdToGameState.has(roomId);
  }

  getGameState(roomId: string) {
    const gameState = this.roomIdToGameState.get(roomId);
    if (gameState == undefined) {
      throw new Error(`nonexistent gameState for ${roomId}`);
    }
    return gameState;
  }
}
