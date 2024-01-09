import express from "express";
import next from "next";
import { createServer } from "http";
import { instrument } from "@socket.io/admin-ui";
import { RoomsManager } from "./models/RoomsManager";
import { GamesManager } from "./models/GamesManager";
import { websocketSetup } from "./websocket";

const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const expressApp = express();
const httpServer = createServer(expressApp);

const MAX_PLAYERS = 10;
const roomsManager = new RoomsManager(MAX_PLAYERS);
const gamesManager = new GamesManager();

websocketSetup(httpServer, roomsManager, gamesManager);

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

  // let nextjs manage routes in pages/api
  expressApp.all("*", (req, res) => {
    return handle(req, res);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
