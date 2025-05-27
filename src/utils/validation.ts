import { PlayerData, JoinRoomData } from "../types/game.types";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validatePlayerData(data: any): PlayerData {
  if (!data || typeof data !== "object") {
    throw new ValidationError("Player data must be an object");
  }

  const { name, worldX, worldY, score, carrying } = data;

  if (
    typeof name !== "string" ||
    name.trim().length === 0 ||
    name.length > 20
  ) {
    throw new ValidationError(
      "Player name must be a non-empty string with max 20 characters"
    );
  }

  if (typeof worldX !== "number" || !isFinite(worldX)) {
    throw new ValidationError("worldX must be a finite number");
  }

  if (typeof worldY !== "number" || !isFinite(worldY)) {
    throw new ValidationError("worldY must be a finite number");
  }

  if (typeof score !== "number" || !isFinite(score) || score < 0) {
    throw new ValidationError("Score must be a non-negative finite number");
  }

  return {
    name: name.trim(),
    worldX,
    worldY,
    score,
    carrying: carrying || null,
  };
}

export function validateJoinRoomData(data: any): JoinRoomData {
  if (!data || typeof data !== "object") {
    throw new ValidationError("Join room data must be an object");
  }

  const { roomId, playerData } = data;

  if (
    typeof roomId !== "string" ||
    roomId.trim().length === 0 ||
    roomId.length > 20
  ) {
    throw new ValidationError(
      "Room ID must be a non-empty string with max 20 characters"
    );
  }

  const validatedPlayerData = validatePlayerData(playerData);

  return {
    roomId: roomId.trim(),
    playerData: validatedPlayerData,
  };
}

export function validateChatMessage(message: any): string {
  if (typeof message !== "string") {
    throw new ValidationError("Chat message must be a string");
  }

  const trimmed = message.trim();

  if (trimmed.length === 0) {
    throw new ValidationError("Chat message cannot be empty");
  }

  if (trimmed.length > 100) {
    throw new ValidationError("Chat message too long (max 100 characters)");
  }

  return trimmed;
}
