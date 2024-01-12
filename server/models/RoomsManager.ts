import { User } from "../types";
import { Room } from "./Room";

export class RoomsManager {
  roomIdToRoom: Map<string, Room>;
  maxPlayers: number;
  constructor(maxPlayers: number) {
    this.roomIdToRoom = new Map();
    this.maxPlayers = maxPlayers;
  }

  createRoom(roomId: string) {
    this.roomIdToRoom.set(roomId, new Room(this.maxPlayers, roomId));
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
