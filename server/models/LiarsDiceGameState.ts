import { GameState } from "../types";
import { z } from "zod";

const NUMBER_OF_DICE = 5;
const INITIAL_BET = { dieValue: 2, count: 0 } as const;

class GamePlayer {
  username: string;
  dice: Array<number>;
  constructor(username: string, numberOfDice: number) {
    this.username = username;
    this.dice = new Array(numberOfDice).fill(0);
  }
}

const BetSchema = z.object({
  dieValue: z.number(),
  count: z.number(),
});
type Bet = z.infer<typeof BetSchema>;

const BetActionPayloadSchema = z.object({
  bet: BetSchema,
});

const LiarsDiceActionTypeSchema = z.union([
  z.literal("CHALLENGE"),
  z.literal("BET"),
]);

const LiarsDiceActionSchema = z.object({
  type: LiarsDiceActionTypeSchema,
  payload: BetActionPayloadSchema.optional(),
});

export class LiarsDiceGameState implements GameState {
  turn: number; // index into player array
  roundTurnCount: number;
  players: Array<GamePlayer>;
  currentBet: Bet;
  numberOfDice: number;
  constructor(users: Array<string>, numberOfDice = NUMBER_OF_DICE) {
    this.turn = 0;
    this.roundTurnCount = 0;
    this.currentBet = { ...INITIAL_BET };
    this.numberOfDice = numberOfDice;
    this.players = users.map((user) => new GamePlayer(user, numberOfDice));
  }

  gameCycle(action: unknown) {
    const parsedAction = LiarsDiceActionSchema.parse(action);
    switch (parsedAction.type) {
      case "CHALLENGE":
        this.challenge();
        this.nextRound();
        if (this.isGameOver()) {
          return false;
        }
        break;
      case "BET":
        const payload = BetActionPayloadSchema.parse(parsedAction.payload);
        this.bet(payload.bet);
        this.nextTurn();
        break;
      default:
        throw new Error("invalid action type");
    }
    return true;
  }

  getPreviousPlayerIndex() {
    if (this.turn === 0) {
      return this.players.length - 1;
    }
    return this.turn - 1;
  }

  getPreviousPlayer() {
    return this.players[this.getPreviousPlayerIndex()];
  }

  getCurrentPlayer() {
    return this.players[this.turn];
  }

  bet(newBet: Bet) {
    const currentBet = this.currentBet;
    const isSmallerDieValue = newBet.dieValue < currentBet.dieValue;
    const sameDieValueAndLTECount =
      newBet.dieValue === currentBet.dieValue &&
      newBet.count <= currentBet.count;
    if (isSmallerDieValue || sameDieValueAndLTECount) {
      throw new Error("illegal bet");
    }
    this.currentBet = newBet;
  }

  isSuccessfulChallenge() {
    let currentCount = 0;
    this.players.forEach((player) => {
      player.dice.forEach((dieValue) => {
        if (dieValue === 1 || dieValue === this.currentBet.dieValue) {
          currentCount += 1;
          if (currentCount >= this.currentBet.count) {
            return false;
          }
        }
      });
    });
    return true;
  }

  challenge() {
    let losingPlayer = null;
    if (this.isSuccessfulChallenge()) {
      losingPlayer = this.getPreviousPlayer();
    } else {
      losingPlayer = this.getCurrentPlayer();
    }
    losingPlayer.dice.pop();
  }

  nextRound() {
    // remove dead players and reset turn
    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i];
      if (player.dice.length <= 0) {
        this.players.splice(i, 1);
        if (this.turn === i) {
          this.turn = this.turn % this.players.length;
        } else {
          this.nextTurn();
        }
        break;
      }
    }

    this.players.forEach((player) => {
      this.rollDice(player.dice);
    });

    // reset bet
    this.currentBet = { ...INITIAL_BET };
  }

  isGameOver() {
    return this.players.length === 1;
  }

  rollDice(dice: number[], numberOfSides = 6) {
    for (let i = 0; i < dice.length; i++) {
      dice[i] = Math.floor(Math.random() * numberOfSides) + 1;
    }
  }

  nextTurn() {
    this.turn = (this.turn + 1) % this.players.length;
  }
}
