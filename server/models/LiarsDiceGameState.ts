import { GAME_TYPE, GameState, GameType, GameTypeSchema } from "../types";
import { z } from "zod";

const NUMBER_OF_DICE = 5;
const NUMBER_OF_SIDES = 6;
const INITIAL_BET = { dieValue: 2, count: 0 } as const;
export const ACTIONS = {
  BET: "bet",
  CHALLENGE: "challenge",
} as const;

const GamePlayerSchema = z.object({
  username: z.string(),
  dice: z.array(z.number()),
});
export type GamePlayer = z.infer<typeof GamePlayerSchema>;

const BetSchema = z.object({
  dieValue: z.number(),
  count: z.number(),
});
export type Bet = z.infer<typeof BetSchema>;

const BetActionPayloadSchema = z.object({
  bet: BetSchema,
});

const LiarsDiceActionTypeSchema = z.union([
  z.literal(ACTIONS.CHALLENGE),
  z.literal(ACTIONS.BET),
]);

const LiarsDiceActionSchema = z.object({
  type: LiarsDiceActionTypeSchema,
  payload: BetActionPayloadSchema.optional(),
});
export type LiarsDiceAction = z.infer<typeof LiarsDiceActionSchema>;

export const LiarsDiceGameStateSchema = z.object({
  turn: z.number(),
  roundTurnCount: z.number(),
  players: z.array(GamePlayerSchema),
  currentBet: BetSchema,
  numberOfDice: z.number(),
  numberOfSides: z.number(),
  gameType: GameTypeSchema,
});
export type LiarsDiceGameStateType = z.infer<typeof LiarsDiceGameStateSchema>;

export class LiarsDiceGameState implements GameState {
  turn: number; // index into player array
  roundTurnCount: number;
  players: Array<GamePlayer>;
  currentBet: Bet;
  numberOfDice: number;
  numberOfSides: number;
  gameType: GameType;
  constructor(
    users: Array<string>,
    numberOfDice = NUMBER_OF_DICE,
    numberOfSides = NUMBER_OF_SIDES
  ) {
    this.turn = 0;
    this.roundTurnCount = 0;
    this.currentBet = { ...INITIAL_BET };
    this.numberOfDice = numberOfDice;
    this.numberOfSides = numberOfSides;
    this.players = users.map((user) => {
      const player: GamePlayer = {
        username: user,
        dice: new Array(numberOfDice).fill(0),
      };
      rollDice(player.dice, numberOfSides);
      return player;
    });
    this.gameType = GAME_TYPE.LIARS_DICE;
  }

  gameCycle(action: unknown) {
    const parsedAction = LiarsDiceActionSchema.parse(action);
    switch (parsedAction.type) {
      case ACTIONS.CHALLENGE:
        challenge(this);
        nextRound(this);
        this.roundTurnCount = 0;
        if (isGameOver(this)) {
          return true;
        }
        break;
      case ACTIONS.BET:
        const payload = BetActionPayloadSchema.parse(parsedAction.payload);
        bet(payload.bet, this);
        nextTurn(this);
        this.roundTurnCount += 1;
        break;
      default:
        throw new Error("invalid action type");
    }
    return false;
  }
}

function getPreviousPlayerIndex(state: LiarsDiceGameStateType) {
  if (state.turn === 0) {
    return state.players.length - 1;
  }
  return state.turn - 1;
}

function getPreviousPlayer(state: LiarsDiceGameStateType) {
  return state.players[getPreviousPlayerIndex(state)];
}

export function getCurrentPlayer(state: LiarsDiceGameStateType) {
  return state.players[state.turn];
}

function bet(newBet: Bet, state: LiarsDiceGameStateType) {
  if (!isValidBet(newBet, state.currentBet)) {
    throw new Error("illegal bet");
  }
  state.currentBet = newBet;
}

export function isValidBet(newBet: Bet, existingBet: Bet) {
  if (newBet.count <= 0) {
    return false;
  }

  if (newBet.dieValue < existingBet.dieValue) {
    return false;
  }

  if (
    newBet.dieValue === existingBet.dieValue &&
    newBet.count <= existingBet.count
  ) {
    return false;
  }

  return true;
}

export function getNextValidBet(
  existingBet: Bet,
  state: LiarsDiceGameStateType
): Bet | null {
  if (existingBet.count + 1 <= getRemainingDiceCount(state)) {
    return {
      dieValue: existingBet.dieValue,
      count: existingBet.count + 1,
    };
  }

  if (existingBet.dieValue <= state.numberOfSides) {
    return {
      dieValue: existingBet.dieValue + 1,
      count: 1,
    };
  }

  return null;
}

export function getRemainingDiceCount(state: LiarsDiceGameStateType) {
  return state.players.reduce(
    (accumulator, player) => accumulator + player.dice.length,
    0
  );
}

function isSuccessfulChallenge(state: LiarsDiceGameStateType) {
  let currentCount = 0;
  state.players.forEach((player) => {
    player.dice.forEach((dieValue) => {
      if (dieValue === 1 || dieValue === state.currentBet.dieValue) {
        currentCount += 1;
        if (currentCount >= state.currentBet.count) {
          return false;
        }
      }
    });
  });
  return true;
}

function challenge(state: LiarsDiceGameStateType) {
  let losingPlayer = null;
  if (isSuccessfulChallenge(state)) {
    losingPlayer = getPreviousPlayer(state);
  } else {
    losingPlayer = getCurrentPlayer(state);
  }
  losingPlayer.dice.pop();
}

function nextRound(state: LiarsDiceGameStateType) {
  // remove dead player
  let removedPlayerIndex;
  for (let i = 0; i < state.players.length; i++) {
    const player = state.players[i];
    if (player.dice.length <= 0) {
      state.players.splice(i, 1);
      removedPlayerIndex = i;
      break;
    }
  }

  syncTurn(removedPlayerIndex, state);

  state.players.forEach((player) => {
    rollDice(player.dice, state.numberOfSides);
  });

  // reset bet
  state.currentBet = { ...INITIAL_BET };
}

function syncTurn(
  removedPlayerIndex: number | undefined,
  state: LiarsDiceGameStateType
) {
  if (removedPlayerIndex != undefined) {
    if (state.turn >= state.players.length) {
      // out of bounds, next turn by modulo
      state.turn = state.turn % state.players.length;
    } else if (removedPlayerIndex > state.turn) {
      // if removed player is after current turn index, the player removal
      // doesn't cause a desync in the turn index
      nextTurn(state);
    }
    // if removed player is before current turn index, the array automatically
    // shifts correctly
  } else {
    nextTurn(state);
  }
}

function isGameOver(state: LiarsDiceGameStateType) {
  return state.players.length === 1;
}

function rollDice(dice: number[], numberOfSides: number) {
  for (let i = 0; i < dice.length; i++) {
    dice[i] = Math.floor(Math.random() * numberOfSides) + 1;
  }
}

function nextTurn(state: LiarsDiceGameStateType) {
  state.turn = (state.turn + 1) % state.players.length;
}
