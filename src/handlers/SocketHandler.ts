import { RoomManager } from "../managers/RoomManager";
import { TypedSocket } from "../types/socket.types";
import { JoinRoomData, PlayerData, DeliveryData } from "../types/game.types";

export class SocketHandler {
  constructor(private roomManager: RoomManager) {}

  public handleConnection(socket: TypedSocket): void {
    console.log(`Player connected: ${socket.id}`);

    socket.on("joinRoom", (data: JoinRoomData) =>
      this.handleJoinRoom(socket, data)
    );
    socket.on("playerUpdate", (playerData: PlayerData) =>
      this.handlePlayerUpdate(socket, playerData)
    );
    socket.on("collectMaterial", (materialId: number) =>
      this.handleCollectMaterial(socket, materialId)
    );
    socket.on("deliverMaterial", (data: DeliveryData) =>
      this.handleDeliverMaterial(socket, data)
    );
    socket.on("chatMessage", (message: string) =>
      this.handleChatMessage(socket, message)
    );
    socket.on("disconnect", () => this.handleDisconnect(socket));
  }

  private handleJoinRoom(socket: TypedSocket, data: JoinRoomData): void {
    const { roomId, playerData } = data;

    // Leave previous room if any
    const previousRoomId = this.roomManager.getPlayerRoom(socket.id);
    if (previousRoomId) {
      this.leaveRoom(socket, previousRoomId);
    }

    // Join new room
    const room = this.roomManager.getOrCreateRoom(roomId);
    socket.join(roomId);
    this.roomManager.setPlayerRoom(socket.id, roomId);

    // Store socket data
    socket.data.playerId = socket.id;
    socket.data.roomId = roomId;
    socket.data.playerName = playerData.name;

    room.addPlayer(socket.id, playerData);

    // Send current game state to new player
    socket.emit("gameState", room.getGameState());

    // Notify other players about new player
    socket.to(roomId).emit("playerJoined", {
      id: socket.id,
      ...playerData,
    });

    console.log(
      `Player ${socket.id} (${playerData.name}) joined room ${roomId}`
    );
  }

  private handlePlayerUpdate(
    socket: TypedSocket,
    playerData: PlayerData
  ): void {
    const roomId = this.roomManager.getPlayerRoom(socket.id);
    if (!roomId) return;

    const room = this.roomManager.getRoom(roomId);
    if (!room) return;

    const success = room.updatePlayer(socket.id, playerData);
    if (success) {
      // Broadcast to other players in the same room
      socket.to(roomId).emit("playerMoved", {
        id: socket.id,
        ...playerData,
      });
    }
  }

  private handleCollectMaterial(socket: TypedSocket, materialId: number): void {
    const roomId = this.roomManager.getPlayerRoom(socket.id);
    if (!roomId) return;

    const room = this.roomManager.getRoom(roomId);
    if (!room) return;

    const material = room.removeMaterial(materialId);
    if (material) {
      // Broadcast material collection to all players
      socket.to(roomId).emit("materialCollected", {
        playerId: socket.id,
        materialId: materialId,
      });

      // Spawn a new material to replace it
      const newMaterial = room.spawnMaterial();
      socket.to(roomId).emit("materialSpawned", newMaterial);
    }
  }

  private handleDeliverMaterial(socket: TypedSocket, data: DeliveryData): void {
    const roomId = this.roomManager.getPlayerRoom(socket.id);
    if (!roomId) return;

    // Broadcast delivery to all players for visual effects
    socket.to(roomId).emit("playerDelivered", {
      playerId: socket.id,
      points: data.points,
      combo: data.combo,
    });
  }

  private handleChatMessage(socket: TypedSocket, message: string): void {
    const roomId = this.roomManager.getPlayerRoom(socket.id);
    if (!roomId) return;

    // Validate message
    const trimmedMessage = message.trim();
    if (!trimmedMessage || trimmedMessage.length > 100) return;

    socket.to(roomId).emit("chatMessage", {
      playerId: socket.id,
      message: trimmedMessage,
      timestamp: Date.now(),
    });
  }

  private handleDisconnect(socket: TypedSocket): void {
    console.log(`Player disconnected: ${socket.id}`);

    const roomId = this.roomManager.getPlayerRoom(socket.id);
    if (roomId) {
      this.leaveRoom(socket, roomId);
      this.roomManager.removePlayerFromRoom(socket.id);
    }
  }

  private leaveRoom(socket: TypedSocket, roomId: string): void {
    const room = this.roomManager.getRoom(roomId);
    if (!room) return;

    socket.leave(roomId);
    room.removePlayer(socket.id);
    socket.to(roomId).emit("playerLeft", socket.id);

    // Clean up empty room
    if (room.playerCount === 0) {
      this.roomManager.removeRoom(roomId);
      console.log(`Removed empty room: ${roomId}`);
    }
  }
}
