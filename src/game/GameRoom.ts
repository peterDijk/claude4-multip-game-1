import { Server } from "socket.io";
import { Material, MaterialType, Player, GameState } from "../types/game.types";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "../types/socket.types";

export class GameRoom {
  public readonly id: string;
  private players: Map<string, Player> = new Map();
  private materials: Material[] = [];
  private nextMaterialId: number = 0;
  private lastMaterialSpawn: number = Date.now();
  private readonly materialSpawnInterval: number = 2000; // 2 seconds
  private readonly maxMaterials: number = 20;

  private readonly materialTypes: MaterialType[] = [
    {
      name: "Copper",
      points: 10,
      color: "#B87333",
      glow: "#DEB887",
      rarity: 0.3,
    },
    {
      name: "Silver",
      points: 20,
      color: "#C0C0C0",
      glow: "#E6E6FA",
      rarity: 0.25,
    },
    {
      name: "Gold",
      points: 35,
      color: "#FFD700",
      glow: "#FFFF99",
      rarity: 0.2,
    },
    {
      name: "Crystal",
      points: 50,
      color: "#00FFFF",
      glow: "#E0FFFF",
      rarity: 0.15,
    },
    {
      name: "Emerald",
      points: 75,
      color: "#50C878",
      glow: "#98FB98",
      rarity: 0.08,
    },
    {
      name: "Diamond",
      points: 100,
      color: "#FF69B4",
      glow: "#FFB6C1",
      rarity: 0.02,
    },
  ];

  constructor(
    id: string,
    private io: Server<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >
  ) {
    this.id = id;
    this.spawnInitialMaterials();
  }

  public addPlayer(
    socketId: string,
    playerData: Omit<Player, "id" | "lastUpdate">
  ): void {
    const player: Player = {
      id: socketId,
      ...playerData,
      lastUpdate: Date.now(),
    };

    this.players.set(socketId, player);
  }

  public removePlayer(socketId: string): boolean {
    return this.players.delete(socketId);
  }

  public updatePlayer(
    socketId: string,
    playerData: Partial<Omit<Player, "id" | "lastUpdate">>
  ): boolean {
    const existingPlayer = this.players.get(socketId);
    if (!existingPlayer) {
      return false;
    }

    const updatedPlayer: Player = {
      ...existingPlayer,
      ...playerData,
      lastUpdate: Date.now(),
    };

    this.players.set(socketId, updatedPlayer);
    return true;
  }

  public getPlayer(socketId: string): Player | undefined {
    return this.players.get(socketId);
  }

  public get playerCount(): number {
    return this.players.size;
  }

  public get materialCount(): number {
    return this.materials.length;
  }

  public spawnMaterial(): Material {
    const selectedType = this.getRandomMaterialType();
    const { worldX, worldY } = this.generateMaterialPosition();

    const material: Material = {
      id: this.nextMaterialId++,
      worldX,
      worldY,
      type: selectedType,
      spawnTime: Date.now(),
    };

    this.materials.push(material);
    return material;
  }

  public removeMaterial(materialId: number): Material | null {
    const index = this.materials.findIndex((m) => m.id === materialId);
    if (index === -1) {
      return null;
    }

    const [removedMaterial] = this.materials.splice(index, 1);
    return removedMaterial;
  }

  public update(): void {
    const now = Date.now();

    if (this.shouldSpawnMaterial(now)) {
      const newMaterial = this.spawnMaterial();
      this.lastMaterialSpawn = now;

      // Broadcast new material to all players in room
      this.io.to(this.id).emit("materialSpawned", newMaterial);
    }
  }

  public getGameState(): GameState {
    return {
      players: Array.from(this.players.values()),
      materials: [...this.materials],
    };
  }

  private spawnInitialMaterials(): void {
    for (let i = 0; i < 15; i++) {
      this.spawnMaterial();
    }
  }

  private getRandomMaterialType(): MaterialType {
    const totalWeight = this.materialTypes.reduce(
      (sum, type) => sum + type.rarity,
      0
    );
    let random = Math.random() * totalWeight;

    for (const type of this.materialTypes) {
      random -= type.rarity;
      if (random <= 0) {
        return type;
      }
    }

    // Fallback to first material type
    return this.materialTypes[0]!;
  }

  private generateMaterialPosition(): { worldX: number; worldY: number } {
    let worldX: number;
    let worldY: number;

    do {
      const angle = Math.random() * Math.PI * 2;
      const distance = 150 + Math.random() * 600;
      worldX = Math.cos(angle) * distance;
      worldY = Math.sin(angle) * distance;
    } while (Math.sqrt(worldX * worldX + worldY * worldY) < 120);

    return { worldX, worldY };
  }

  private shouldSpawnMaterial(currentTime: number): boolean {
    return (
      currentTime - this.lastMaterialSpawn > this.materialSpawnInterval &&
      this.materials.length < this.maxMaterials
    );
  }
}
