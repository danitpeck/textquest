import roomsData from '../data/rooms.json';
import testingGroundData from '../data/testingGround.json';

export interface RoomExit {
  to: string;
  exitDescription?: string;
  exitDescriptionOpen?: string;
  exitDescriptionClosed?: string;
  isDoor?: boolean;
  doorId?: string;
  aliases?: string[];
}

export interface Room {
  id: string;
  name: string;
  description: string;
  skyDescription?: string;
  x: number;
  y: number;
  exits: { [direction: string]: RoomExit };
  items: string[];
  lookDescriptions?: Record<string, string>;
  isDeathTrap?: boolean;
  deathMessage?: string;
}

interface RawRoom {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  skyDescription?: unknown;
  x?: unknown;
  y?: unknown;
  exits?: unknown;
  items?: unknown;
  lookDescriptions?: unknown;
  isDeathTrap?: unknown;
  deathMessage?: unknown;
}

function isRoomExit(obj: unknown): obj is RoomExit {
  return typeof obj === 'object' && obj !== null && typeof (obj as Record<string, unknown>).to === 'string';
}

function validateRoom(raw: unknown): Room {
  if (typeof raw !== 'object' || !raw) throw new Error('Invalid room');
  const roomObj = raw as RawRoom;
  const exits: { [direction: string]: RoomExit } = {};
  if (roomObj.exits && typeof roomObj.exits === 'object') {
    for (const dir of Object.keys(roomObj.exits)) {
      const exit = (roomObj.exits as Record<string, unknown>)[dir];
      if (isRoomExit(exit)) {
        exits[dir] = exit;
      } else if (typeof exit === 'string') {
        // Support legacy string exits
        exits[dir] = { to: exit };
      }
    }
  }
  return {
    id: String(roomObj.id),
    name: String(roomObj.name),
    description: String(roomObj.description),
    skyDescription: roomObj.skyDescription ? String(roomObj.skyDescription) : undefined,
    x: typeof roomObj.x === 'number' ? roomObj.x : 0,
    y: typeof roomObj.y === 'number' ? roomObj.y : 0,
    exits,
    items: Array.isArray(roomObj.items) ? (roomObj.items as unknown[]).map(String) : [],
    lookDescriptions: roomObj.lookDescriptions && typeof roomObj.lookDescriptions === 'object'
      ? Object.fromEntries(
          Object.entries(roomObj.lookDescriptions as Record<string, unknown>).map(([k, v]) => [k, String(v)])
        )
      : undefined,
    isDeathTrap: typeof roomObj.isDeathTrap === 'boolean' ? roomObj.isDeathTrap : undefined,
    deathMessage: roomObj.deathMessage ? String(roomObj.deathMessage) : undefined,
  };
}

export const rooms: Room[] = (roomsData as unknown[]).map(validateRoom);
export const testingGroundRooms: Room[] = (testingGroundData as unknown[]).map(validateRoom);
