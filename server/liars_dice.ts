import { GameState } from "./types";

class GamePlayer {
  username: string;
  dice: Array<number>;
  constructor(username: string) {
    this.username = username;
    this.dice = [-1, -1, -1, -1, -1];
  }
}

type Bet = {
  dieValue: number;
  count: number;
};

export class LiarsDiceGameState implements GameState {
  turn: number;
  players: Array<GamePlayer>;
  currentBet: Bet;
  constructor(users: Array<string>) {
    this.turn = 0;
    this.currentBet = { dieValue: 2, count: 0 };
    this.players = users.map((user) => new GamePlayer(user));
  }
}
