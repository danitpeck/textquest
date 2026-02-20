import type { Player } from './player';

export interface GameState {
  currentRoomId: string;
  player: Player;
  openItems: string[];
  openDoors: string[];
  containerContents: Record<string, string[]>;
}

export interface SaveSlot {
  slotNumber: 1 | 2 | 3;
  state: GameState | null;
  lastSaved: Date | null;
}

const STORAGE_KEY_PREFIX = 'textquest_save_slot_';

export const saveSystem = {
  /**
   * Save game state to a specific slot
   */
  saveToSlot(slotNumber: 1 | 2 | 3, gameState: GameState): void {
    const slotData = {
      state: gameState,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${slotNumber}`,
      JSON.stringify(slotData)
    );
  },

  /**
   * Load game state from a specific slot
   */
  loadFromSlot(slotNumber: 1 | 2 | 3): GameState | null {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${slotNumber}`);
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      return parsed.state;
    } catch (e) {
      console.error(`Failed to parse save slot ${slotNumber}:`, e);
      return null;
    }
  },

  /**
   * Get all save slots with metadata
   */
  getAllSlots(): SaveSlot[] {
    const slots: SaveSlot[] = [
      { slotNumber: 1, state: null, lastSaved: null },
      { slotNumber: 2, state: null, lastSaved: null },
      { slotNumber: 3, state: null, lastSaved: null },
    ];

    for (let i = 1; i <= 3; i++) {
      const slotNum = i as 1 | 2 | 3;
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${slotNum}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          slots[i - 1].state = parsed.state;
          slots[i - 1].lastSaved = new Date(parsed.lastSaved);
        } catch (e) {
          console.error(`Failed to parse save slot ${slotNum}:`, e);
        }
      }
    }

    return slots;
  },

  /**
   * Delete a save slot
   */
  deleteSlot(slotNumber: 1 | 2 | 3): void {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${slotNumber}`);
  },

  /**
   * Get formatted room name from roomId (for display in save menu)
   */
  getRoomNameFromId(roomId: string): string {
    // This is a simple mapping - in production you'd import rooms
    const roomNames: Record<string, string> = {
      'corner_nw': 'NW Corner',
      'edge_west': 'West Edge',
      'forest_clearing': 'Forest Clearing',
      'corner_sw': 'SW Corner',
      'edge_south': 'South Edge',
      'corner_se': 'SE Corner',
      'deep_forest': 'Deep Forest',
      'forest_cabin': 'Forest Cabin',
      'cabin_interior': 'Cabin Interior',
      'river_bank': 'River Bank',
    };
    return roomNames[roomId] || roomId;
  },

  /**
   * Format a slot for display
   */
  formatSlotDisplay(slot: SaveSlot): string {
    if (!slot.state || !slot.lastSaved) {
      return `Slot ${slot.slotNumber}: (empty)`;
    }
    const roomName = this.getRoomNameFromId(slot.state.currentRoomId);
    const time = slot.lastSaved.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `Slot ${slot.slotNumber}: ${roomName} • ${time}`;
  },
};
