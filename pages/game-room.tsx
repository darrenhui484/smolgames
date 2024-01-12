import { useAtom } from "jotai";
import { socketAtom } from "../store";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Room } from "../server/models/Room";
import {
  GAME_TYPE,
  GameState,
  GameType,
  GameTypeSchema,
} from "../server/types";
import LiarsDice from "../components/LiarsDice";
import { LiarsDiceGameStateSchema } from "../server/models/LiarsDiceGameState";
import { Socket } from "socket.io-client";

type WaitingCardProps = {
  users: string[];
  onStart: (gameType: GameType) => void;
};
function WaitingCard({ users, onStart }: WaitingCardProps) {
  const [selectedGameType, setSelectedGameType] = useState<GameType>(
    GAME_TYPE.LIARS_DICE
  );

  return (
    <div>
      {users.map((user) => {
        return <div key={user}>{user}</div>;
      })}
      <label>Game Type: </label>
      <select
        defaultValue={GAME_TYPE.LIARS_DICE}
        onChange={(event) => {
          const gameType = GameTypeSchema.parse(event.target.value);
          setSelectedGameType(gameType);
        }}
        id="game-type"
      >
        <option value={GAME_TYPE.LIARS_DICE}>Liars Dice</option>
      </select>

      <button onClick={() => onStart(selectedGameType)}>Start Game</button>
    </div>
  );
}

export default function GameRoom() {
  const [socket, setSocket] = useAtom(socketAtom);
  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    const roomId = router.query.roomId;
    const username = router.query.username;

    if (typeof roomId !== "string" || typeof username !== "string") {
      throw new Error("invalid roomId or username in query params");
    }

    setUsername(username);

    socket.emit("join", roomId, username);
    socket.on("joined-room", (room: Room, gameState: GameState) => {
      setRoom(room);
      setGameState(gameState);
    });
    socket.on("updated-game-state", (gameState: GameState) => {
      console.log(gameState);
      setGameState(gameState);
    });
  }, [router.isReady]);

  if (room == null) {
    return <>Loading...</>;
  }

  if (gameState == null) {
    const users = room.users.map((user) => user.username);
    return (
      <WaitingCard
        users={users}
        onStart={(selectedGameType: GameType) => {
          socket.emit("start", room.id, selectedGameType);
        }}
      />
    );
  }

  if (username == null) {
    throw new Error("null username");
  }

  // add additional gameType renders here
  if (gameState.gameType === GAME_TYPE.LIARS_DICE) {
    return (
      <LiarsDice
        room={room}
        username={username}
        socket={socket}
        gameState={LiarsDiceGameStateSchema.parse(gameState)}
      />
    );
  } else {
    throw new Error("Invalid game type");
  }
}
