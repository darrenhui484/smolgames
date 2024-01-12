import { Socket } from "socket.io-client";
import {
  ACTIONS,
  Bet,
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
    setCurrentBet(getNextValidBet(gameState.currentBet, gameState));
  }, [gameState]);

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

      <pre>{JSON.stringify(gameState, null, 2)}</pre>

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
