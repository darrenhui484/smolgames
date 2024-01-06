import express, { Request, Response } from "express";
import next from "next";
import { Server, Socket } from "socket.io";
import { createServer } from "http";
import { instrument } from "@socket.io/admin-ui";
import { LiarsDiceGameState } from "./liars_dice";
import { Room } from "./models/Room";
import { inspect } from "util";
import { GameState, User } from "./types";

const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const expressApp = express();
const httpServer = createServer(expressApp);

const io = new Server(httpServer, {
  // cors: {
  //   origin: ["https://admin.socket.io"],
  //   credentials: true,
  // },
});

const MAX_PLAYERS = 10;

class GamesManager<T extends GameState> {
  roomIdToGameState: Map<string, T>;
  constructor() {
    this.roomIdToGameState = new Map();
  }

  hasStarted(roomId: string) {
    return this.roomIdToGameState.has(roomId);
  }

  startGame(roomId: string, gameState: T) {
    this.roomIdToGameState.set(roomId, gameState);
  }

  addGameState(roomId: string, gameState: T) {
    if (this.roomIdToGameState.has(roomId)) {
      throw new Error(`game state for ${roomId} already exists`);
    }
    this.roomIdToGameState.set(roomId, gameState);
  }

  deleteGameState(roomId: string) {
    this.roomIdToGameState.delete(roomId);
  }
}

class RoomsManager {
  roomIdToRoom: Map<string, Room>;
  constructor() {
    this.roomIdToRoom = new Map();
  }

  createRoom(roomId: string) {
    this.roomIdToRoom.set(roomId, new Room(MAX_PLAYERS));
  }

  deleteRoom(roomId: string) {
    this.roomIdToRoom.delete(roomId);
  }

  hasRoom(roomId: string) {
    return this.roomIdToRoom.has(roomId);
  }

  getRoom(roomId: string) {
    const room = this.roomIdToRoom.get(roomId);
    if (room == undefined) {
      throw new Error(`roomId ${roomId} does not exist`);
    }
    return room;
  }

  addUser(roomId: string, user: User) {
    const room = this.getRoom(roomId);
    room.addUser(user);
  }

  removeUser(roomId: string, socketId: string) {
    const room = this.getRoom(roomId);
    room.removeUser(socketId);
    if (room.isEmpty()) {
      this.deleteRoom(roomId);
    }
  }
}

const roomsManager = new RoomsManager();
const gamesManager = new GamesManager();

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

  socket.on("start", (roomId: string, gameType: string) => {
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
  });
});

io.of("/").adapter.on("leave-room", (roomId, socketId) => {
  console.log(`socket ${socketId} has left room ${roomId}`);

  if (roomsManager.hasRoom(roomId)) {
    roomsManager.removeUser(roomId, socketId);
  }
});

function replacer(key: any, value: any) {
  if (value instanceof Map) {
    return {
      dataType: "Map",
      value: Array.from(value.entries()),
    };
  } else {
    return value;
  }
}

// instrument(io, { auth: false });

nextApp.prepare().then(() => {
  // define express api routes here
  expressApp.get("/rooms", async (request, response) => {
    response.json(JSON.stringify(roomsManager, replacer));
  });

  // expressApp.get("/join-room", async (request, response) => {
  //   console.log(request.query);
  //   const params = request.query;

  //   const roomId = params.id;
  //   if (roomId == undefined) {
  //     response.status(400).send("no room id provided");
  //     return;
  //   }

  //   if (!roomIds.has(roomId)) {
  //     response.status(400).send("room already exists");
  //     return;
  //   }

  //   response.status(200).send("success");
  // });

  // let nextjs manage routes in pages/api
  expressApp.all("*", (req, res) => {
    return handle(req, res);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
