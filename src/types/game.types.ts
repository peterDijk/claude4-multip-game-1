import { Socket } from "socket.io";

export interface MaterialType {
  name: string;
  points: number;
  color: string;
  glow: string;
  rarity: number;
}

export interface Material {
  id: number;
  worldX: number;
  worldY: number;
  type: MaterialType;
  spawnTime: number;
}

export interface Player {
  id: string;
  name: string;
  worldX: number;
  worldY: number;
  score: number;
  carrying: Material | null;
  lastUpdate: number;
  socket?: Socket;
}

export interface GameState {
  players: Player[];
  materials: Material[];
}

export interface RoomInfo {
  id: string;
  playerCount: number;
  materialCount: number;
}

export interface PlayerData {
  name: string;
  worldX: number;
  worldY: number;
  score: number;
  carrying: Material | null;
}

export interface JoinRoomData {
  roomId: string;
  playerData: PlayerData;
}

export interface DeliveryData {
  points: number;
  combo: number;
}

export interface ChatMessage {
  playerId: string;
  message: string;
  timestamp: number;
}

export interface MaterialCollectedEvent {
  playerId: string;
  materialId: number;
}

export interface PlayerDeliveredEvent {
  playerId: string;
  points: number;
  combo: number;
}

export interface PlayerJoinedEvent {
  id: string;
  name: string;
  worldX: number;
  worldY: number;
  score: number;
  carrying: Material | null;
}

export interface PlayerMovedEvent {
  id: string;
  name: string;
  worldX: number;
  worldY: number;
  score: number;
  carrying: Material | null;
}
