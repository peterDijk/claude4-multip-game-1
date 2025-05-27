import { Router, Request, Response } from "express";
import { RoomManager } from "../managers/RoomManager";
import { RoomInfo, GameState } from "../types/game.types";

export function createApiRouter(roomManager: RoomManager): Router {
  const router = Router();

  // Get all rooms
  router.get("/rooms", (req: Request, res: Response<RoomInfo[]>) => {
    const roomData = roomManager.getAllRoomsInfo();
    res.json(roomData);
  });

  // Get specific room
  router.get(
    "/rooms/:roomId",
    (
      req: Request<{ roomId: string }>,
      res: Response<GameState | { error: string }>
    ) => {
      const { roomId } = req.params;
      const room = roomManager.getRoom(roomId);

      if (room) {
        res.json(room.getGameState());
      } else {
        res.status(404).json({ error: "Room not found" });
      }
    }
  );

  // Get server stats
  router.get("/stats", (req: Request, res: Response) => {
    res.json({
      totalRooms: roomManager.getRoomCount(),
      totalPlayers: roomManager.getTotalPlayerCount(),
      timestamp: Date.now(),
    });
  });

  return router;
}
