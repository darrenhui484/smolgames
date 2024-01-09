import { GameState, User } from "../types";

export type GameType = "liars-dice";

export class Room {
  gameType: GameType;
  users: Array<User>;
  maxPlayers: number;
  constructor(maxPlayers: number, gameType: GameType) {
    this.users = [];
    this.maxPlayers = maxPlayers;
    this.gameType = gameType;
  }

  removeUser(socketId: string) {
    this.users.forEach((userElement, index) => {
      if (userElement.socketId === socketId) {
        this.users.splice(index, 1);
        return;
      }
    });
  }

  addUser(user: User) {
    if (this.users.length >= this.maxPlayers) {
      return;
    }

    const existingUser = this.users.find(
      (userElement) => userElement.username === user.username
    );
    if (existingUser == undefined) {
      this.users.push(user);
      return;
    }

    // reconnect
    existingUser.socketId = user.socketId;
  }

  isEmpty() {
    return this.users.length <= 0;
  }
}
