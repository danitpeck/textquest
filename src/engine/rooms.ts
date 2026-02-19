import roomsData from '../data/rooms.json';

export interface RoomExit {
  to: string;
  exitDescription?: string;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  skyDescription?: string;
  exits: { [direction: string]: RoomExit };
  items: string[];
  lookDescriptions?: Record<string, string>;
}

function isRoomExit(obj: any): obj is RoomExit {
  return obj && typeof obj.to === 'string';
}

function validateRoom(raw: any): Room {
  if (typeof raw !== 'object' || !raw) throw new Error('Invalid room');
  const exits: { [direction: string]: RoomExit } = {};
  if (raw.exits && typeof raw.exits === 'object') {
    for (const dir of Object.keys(raw.exits)) {
      const exit = raw.exits[dir];
      if (isRoomExit(exit)) {
        exits[dir] = exit;
      } else if (typeof exit === 'string') {
        // Support legacy string exits
        exits[dir] = { to: exit };
      }
    }
  }
  return {
    id: String(raw.id),
    name: String(raw.name),
    description: String(raw.description),
    skyDescription: raw.skyDescription ? String(raw.skyDescription) : undefined,
    exits,
    items: Array.isArray(raw.items) ? raw.items.map(String) : [],
    lookDescriptions: raw.lookDescriptions && typeof raw.lookDescriptions === 'object' ? { ...raw.lookDescriptions } : undefined,
  };
}

export const rooms: Room[] = (roomsData as any[]).map(validateRoom);
