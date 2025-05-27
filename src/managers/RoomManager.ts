import { Server } from "socket.io";
import { GameRoom } from "../game/GameRoom";
import { RoomInfo } from "../types/game.types";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "../types/socket.types";

export class RoomManager {
  private gameRooms: Map<string, GameRoom> = new Map();
  private playerRooms: Map<string, string> = new Map(); // playerId -> roomId

  constructor(
    private io: Server<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >
  ) {}

  public getOrCreateRoom(roomId: string): GameRoom {
    let room = this.gameRooms.get(roomId);

    if (!room) {
      room = new GameRoom(roomId, this.io);
      this.gameRooms.set(roomId, room);
    }

    return room;
  }

  public getRoom(roomId: string): GameRoom | undefined {
    return this.gameRooms.get(roomId);
  }

  public removeRoom(roomId: string): boolean {
    return this.gameRooms.delete(roomId);
  }

  public setPlayerRoom(playerId: string, roomId: string): void {
    this.playerRooms.set(playerId, roomId);
  }

  public getPlayerRoom(playerId: string): string | undefined {
    return this.playerRooms.get(playerId);
  }

  public removePlayerFromRoom(playerId: string): void {
    this.playerRooms.delete(playerId);
  }

  public cleanupEmptyRooms(): void {
    const emptyRooms: string[] = [];

    this.gameRooms.forEach((room, roomId) => {
      if (room.playerCount === 0) {
        emptyRooms.push(roomId);
      }
    });

    emptyRooms.forEach((roomId) => {
      this.removeRoom(roomId);
      console.log(`Cleaned up empty room: ${roomId}`);
    });
  }

  public updateAllRooms(): void {
    this.gameRooms.forEach((room) => {
      room.update();
    });
  }

  public getAllRoomsInfo(): RoomInfo[] {
    return Array.from(this.gameRooms.entries()).map(([id, room]) => ({
      id,
      playerCount: room.playerCount,
      materialCount: room.materialCount,
    }));
  }

  public getRoomCount(): number {
    return this.gameRooms.size;
  }

  public getTotalPlayerCount(): number {
    return Array.from(this.gameRooms.values()).reduce(
      (total, room) => total + room.playerCount,
      0
    );
  }
}
