import { Server, Socket } from "socket.io";
import { RoomsManager } from "./models/RoomsManager";
import { GamesManager } from "./models/GamesManager";
import { GameType } from "./models/Room";
import { LiarsDiceGameState } from "./models/LiarsDiceGameState";

export function websocketSetup(
  httpServer: any,
  roomsManager: RoomsManager,
  gamesManager: GamesManager
) {
  const io = new Server(httpServer, {
    // cors: {
    //   origin: ["https://admin.socket.io"],
    //   credentials: true,
    // },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`connected: ${socket.id}`);

    socket.on("join", (roomId: string, username: string) => {
      const newUser = { socketId: socket.id, username: username };

      if (!roomsManager.hasRoom(roomId)) {
        roomsManager.createRoom(roomId);
      }
      roomsManager.addUser(roomId, newUser);
      socket.join(roomId);
    });

    socket.on("start", (roomId: string, gameType: GameType) => {
      if (gamesManager.hasStarted(roomId)) {
        return;
      }

      const room = roomsManager.getRoom(roomId);
      const usernames = room.users.map((user) => user.username);

      let gameState = null;
      if (gameType === "liars-dice") {
        gameState = new LiarsDiceGameState(usernames);
      } else {
        return;
      }

      gamesManager.startGame(roomId, gameState);
      io.to(roomId).emit("updated-game-state", gameState);
    });

    socket.on("player-action", (roomId: string, action: unknown) => {
      const room = roomsManager.getRoom(roomId);
      const gameState = gamesManager.getGameState(roomId);

      const isGameOver = gameState.gameCycle(action);
      if (isGameOver) {
        io.to(roomId).emit("game-over", gameState);
      } else {
        io.to(roomId).emit("updated-game-state", gameState);
      }
    });
  });

  io.of("/").adapter.on("leave-room", (roomId, socketId) => {
    console.log(`socket ${socketId} has left room ${roomId}`);

    if (roomsManager.hasRoom(roomId)) {
      roomsManager.removeUser(roomId, socketId);
    }
  });
}
