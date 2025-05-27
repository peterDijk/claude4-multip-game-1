import { Socket } from "socket.io";
import {
  JoinRoomData,
  PlayerData,
  DeliveryData,
  GameState,
  Material,
  MaterialCollectedEvent,
  PlayerDeliveredEvent,
  PlayerJoinedEvent,
  PlayerMovedEvent,
  ChatMessage,
} from "./game.types";

export interface ServerToClientEvents {
  gameState: (gameState: GameState) => void;
  playerJoined: (player: PlayerJoinedEvent) => void;
  playerLeft: (playerId: string) => void;
  playerMoved: (player: PlayerMovedEvent) => void;
  materialCollected: (data: MaterialCollectedEvent) => void;
  materialSpawned: (material: Material) => void;
  playerDelivered: (data: PlayerDeliveredEvent) => void;
  chatMessage: (data: ChatMessage) => void;
}

export interface ClientToServerEvents {
  joinRoom: (data: JoinRoomData) => void;
  playerUpdate: (playerData: PlayerData) => void;
  collectMaterial: (materialId: number) => void;
  deliverMaterial: (data: DeliveryData) => void;
  chatMessage: (message: string) => void;
}

export interface InterServerEvents {
  // Events between server instances (for scaling)
}

export interface SocketData {
  playerId?: string;
  roomId?: string;
  playerName?: string;
}

export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
