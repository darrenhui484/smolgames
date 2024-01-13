import { Socket } from "socket.io-client";
import {
  ACTIONS,
  Bet,
  GamePlayer,
  LiarsDiceAction,
  LiarsDiceGameStateType,
  getCurrentPlayer,
  getNextValidBet,
  getRemainingDiceCount,
  isValidBet,
} from "../server/models/LiarsDiceGameState";
import { useEffect, useState } from "react";
import { Room } from "../server/models/Room";

type LiarsDiceProps = {
  room: Room;
  gameState: LiarsDiceGameStateType;
  socket: Socket;
  username: string;
};

export default function LiarsDice({
  room,
  username,
  socket,
  gameState,
}: LiarsDiceProps) {
  const [currentBet, setCurrentBet] = useState<Bet | null>(null);
  const currentPlayer = getCurrentPlayer(gameState).username;

  useEffect(() => {
    const nextBet = getNextValidBet(gameState.currentBet, gameState);
    setCurrentBet(nextBet);
  }, [gameState.currentBet]);

  console.log(currentBet);

  function renderBet() {
    if (currentBet === null) {
      return <></>;
    }
    return (
      <div>
        <label>Die Value</label>
        <select
          id="bet-die-value"
          onChange={(event) => {
            setCurrentBet((prev) => {
              if (prev == null) {
                return null;
              }
              return {
                ...prev,
                dieValue: Number(event.target.value),
              };
            });
          }}
          value={currentBet.dieValue}
        >
          {getAvailableDieValueOptions(gameState).map((dieValue) => {
            return (
              <option key={dieValue} value={dieValue}>
                {dieValue}
              </option>
            );
          })}
        </select>
        <label>Dice Count</label>
        <select
          id="bet-dice-count"
          onChange={(event) => {
            setCurrentBet((prev) => {
              if (prev == null) {
                return null;
              }
              return {
                ...prev,
                count: Number(event.target.value),
              };
            });
          }}
          value={currentBet.count}
        >
          {getAvailableDiceCountOptions(gameState, currentBet.dieValue).map(
            (diceCountOption) => {
              return (
                <option key={diceCountOption} value={diceCountOption}>
                  {diceCountOption}
                </option>
              );
            }
          )}
        </select>
        <button
          disabled={!isValidBet(currentBet, gameState.currentBet)}
          onClick={() => {
            const action: LiarsDiceAction = {
              type: ACTIONS.BET,
              payload: { bet: currentBet },
            };
            socket.emit("player-action", room.id, action);
          }}
        >
          Bet
        </button>
      </div>
    );
  }

  return (
    <div>
      <div>{username}</div>
      <div>{socket.id}</div>

      {/* <pre>{JSON.stringify(gameState, null, 2)}</pre> */}
      <Board
        gameState={gameState}
        username={username}
        isHidingOtherHands={true}
      />

      <div hidden={currentPlayer === username}>
        Waiting for {currentPlayer}...
      </div>

      <div id="actions" hidden={currentPlayer !== username}>
        <button
          disabled={gameState.roundTurnCount === 0}
          onClick={() => {
            socket.emit("player-action", room.id, { type: ACTIONS.CHALLENGE });
          }}
        >
          Challenge
        </button>
        {renderBet()}
      </div>
    </div>
  );
}

type HandProps = { player: GamePlayer };
function Hand({ player }: HandProps) {
  return (
    <div>
      <div>{player.username}</div>
      <div>
        {player.dice.map((die) => (
          <div>{die}</div>
        ))}
      </div>
    </div>
  );
}

type BoardProps = {
  gameState: LiarsDiceGameStateType;
  isHidingOtherHands: boolean;
  username: string;
};
function Board({ gameState, isHidingOtherHands, username }: BoardProps) {
  if (isHidingOtherHands) {
    const player = gameState.players.find(
      (player) => player.username === username
    );
    if (player == null) {
      throw new Error(`nonexistent player: ${username}`);
    }
    return <Hand player={player} />;
  }

  return (
    <div>
      {gameState.players.map((player) => (
        <Hand player={player} />
      ))}
    </div>
  );
}

function getAvailableDieValueOptions(gameState: LiarsDiceGameStateType) {
  const dieValueOptions = [];
  for (
    let i = gameState.currentBet.dieValue;
    i <= gameState.numberOfSides;
    i++
  ) {
    dieValueOptions.push(i);
  }
  return dieValueOptions;
}

function getAvailableDiceCountOptions(
  gameState: LiarsDiceGameStateType,
  selectedDieValue: number
) {
  const diceCountOptions = [];
  let minCount = gameState.currentBet.count + 1;

  const maxCount = getRemainingDiceCount(gameState);
  if (gameState.currentBet.dieValue !== selectedDieValue) {
    minCount = 1;
  }

  for (let i = minCount; i <= maxCount; i++) {
    diceCountOptions.push(i);
  }
  return diceCountOptions;
}
