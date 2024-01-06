import { GameState, User } from "../types";

export class Room {
  users: Array<User>;
  maxPlayers: number;
  constructor(maxPlayers: number) {
    this.users = [];
    this.maxPlayers = maxPlayers;
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
