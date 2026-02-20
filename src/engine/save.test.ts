import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { saveSystem, type GameState } from './save';

// Mock game state for testing
const createMockGameState = (roomId: string = 'red_stone_chamber'): GameState => ({
  currentRoomId: roomId,
  player: {
    id: 'player',
    location: roomId,
    inventory: ['copper_knife', 'glass_vial'],
    maxInventory: 20,
    skills: {
      examine: 1,
      learn: 0,
      craft: 0,
    },
  },
  openItems: ['glass_vial'],
  openDoors: ['black_door'],
  containerContents: {
    'wooden_chest': ['parchment_scroll'],
  },
  puzzleState: {
    'pottery_chamber': {
      'potsPuzzle': true,
    },
  },
  npcState: {
    'crow_spirit': true,
  },
});

describe('Save System', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('saveToSlot', () => {
    it('saves game state to slot 1', () => {
      const gameState = createMockGameState();
      saveSystem.saveToSlot(1, gameState);
      
      const stored = localStorage.getItem('textquest_save_slot_1');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.state).toEqual(gameState);
      expect(parsed.lastSaved).toBeTruthy();
    });

    it('saves game state to slot 2 and 3', () => {
      const gameState = createMockGameState();
      saveSystem.saveToSlot(2, gameState);
      saveSystem.saveToSlot(3, gameState);
      
      expect(localStorage.getItem('textquest_save_slot_2')).toBeTruthy();
      expect(localStorage.getItem('textquest_save_slot_3')).toBeTruthy();
    });

    it('overwrites existing save in slot', () => {
      const state1 = createMockGameState('red_stone_chamber');
      const state2 = createMockGameState('chamber_of_runes');
      
      saveSystem.saveToSlot(1, state1);
      saveSystem.saveToSlot(1, state2);
      
      const loaded = saveSystem.loadFromSlot(1);
      expect(loaded?.currentRoomId).toBe('chamber_of_runes');
    });

    it('preserves all game state properties', () => {
      const gameState = createMockGameState();
      gameState.puzzleState = {
        'pottery_chamber': { 'potsPuzzle': true },
        'chamber_of_runes': { 'runesPuzzle': false },
      };
      gameState.npcState = {
        'crow_spirit': true,
        'merchant': false,
      };
      
      saveSystem.saveToSlot(1, gameState);
      const loaded = saveSystem.loadFromSlot(1)!;
      
      expect(loaded.currentRoomId).toBe(gameState.currentRoomId);
      expect(loaded.player.inventory).toEqual(gameState.player.inventory);
      expect(loaded.openDoors).toEqual(gameState.openDoors);
      expect(loaded.containerContents).toEqual(gameState.containerContents);
      expect(loaded.puzzleState).toEqual(gameState.puzzleState);
      expect(loaded.npcState).toEqual(gameState.npcState);
    });
  });

  describe('loadFromSlot', () => {
    it('loads game state from slot', () => {
      const gameState = createMockGameState();
      saveSystem.saveToSlot(1, gameState);
      
      const loaded = saveSystem.loadFromSlot(1);
      expect(loaded).toEqual(gameState);
    });

    it('returns null for empty slot', () => {
      const loaded = saveSystem.loadFromSlot(1);
      expect(loaded).toBeNull();
    });

    it('handles corrupted save data gracefully', () => {
      localStorage.setItem('textquest_save_slot_1', 'corrupted json {');
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const loaded = saveSystem.loadFromSlot(1);
      
      expect(loaded).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('loads saves with missing optional fields (backward compatibility)', () => {
      const basicState = {
        currentRoomId: 'red_stone_chamber',
        player: {
          id: 'player',
          location: 'red_stone_chamber',
          inventory: [],
          maxInventory: 20,
          skills: { examine: 0, learn: 0, craft: 0 },
        },
        openItems: [],
        openDoors: [],
        containerContents: {},
        // Note: puzzleState and npcState are missing
      };
      
      const slotData = {
        state: basicState,
        lastSaved: new Date().toISOString(),
      };
      
      localStorage.setItem('textquest_save_slot_1', JSON.stringify(slotData));
      
      const loaded = saveSystem.loadFromSlot(1);
      expect(loaded).toEqual(basicState);
      expect(loaded?.puzzleState).toBeUndefined();
      expect(loaded?.npcState).toBeUndefined();
    });
  });

  describe('getAllSlots', () => {
    it('returns all 3 slots with empty state', () => {
      const slots = saveSystem.getAllSlots();
      
      expect(slots.length).toBe(3);
      expect(slots[0].slotNumber).toBe(1);
      expect(slots[1].slotNumber).toBe(2);
      expect(slots[2].slotNumber).toBe(3);
      expect(slots.every(s => s.state === null && s.lastSaved === null)).toBe(true);
    });

    it('returns mixed empty and filled slots', () => {
      const gameState1 = createMockGameState('red_stone_chamber');
      const gameState3 = createMockGameState('chamber_of_runes');
      
      saveSystem.saveToSlot(1, gameState1);
      saveSystem.saveToSlot(3, gameState3);
      
      const slots = saveSystem.getAllSlots();
      
      expect(slots[0].state).toEqual(gameState1);
      expect(slots[0].lastSaved).toBeTruthy();
      
      expect(slots[1].state).toBeNull();
      expect(slots[1].lastSaved).toBeNull();
      
      expect(slots[2].state).toEqual(gameState3);
      expect(slots[2].lastSaved).toBeTruthy();
    });

    it('returns lastSaved as Date object', () => {
      const gameState = createMockGameState();
      saveSystem.saveToSlot(1, gameState);
      
      const slots = saveSystem.getAllSlots();
      expect(slots[0].lastSaved).toBeInstanceOf(Date);
    });

    it('handles corrupted slot in getAllSlots', () => {
      const gameState = createMockGameState();
      saveSystem.saveToSlot(1, gameState);
      localStorage.setItem('textquest_save_slot_2', 'corrupted');
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const slots = saveSystem.getAllSlots();
      
      expect(slots[0].state).toEqual(gameState);
      expect(slots[1].state).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('deleteSlot', () => {
    it('deletes a save slot', () => {
      const gameState = createMockGameState();
      saveSystem.saveToSlot(1, gameState);
      expect(saveSystem.loadFromSlot(1)).toEqual(gameState);
      
      saveSystem.deleteSlot(1);
      expect(saveSystem.loadFromSlot(1)).toBeNull();
    });

    it('does not affect other slots', () => {
      const gameState1 = createMockGameState('red_stone_chamber');
      const gameState2 = createMockGameState('chamber_of_runes');
      
      saveSystem.saveToSlot(1, gameState1);
      saveSystem.saveToSlot(2, gameState2);
      
      saveSystem.deleteSlot(1);
      
      expect(saveSystem.loadFromSlot(1)).toBeNull();
      expect(saveSystem.loadFromSlot(2)).toEqual(gameState2);
    });

    it('safely deletes non-existent slot', () => {
      // Should not throw
      expect(() => saveSystem.deleteSlot(1)).not.toThrow();
    });
  });

  describe('getRoomNameFromId', () => {
    it('maps known room IDs to names', () => {
      expect(saveSystem.getRoomNameFromId('red_stone_chamber')).toBe('Red Stone Chamber');
      expect(saveSystem.getRoomNameFromId('hallway_of_torches')).toBe('Hallway of Torches');
      expect(saveSystem.getRoomNameFromId('chamber_of_runes')).toBe('Chamber of Runes');
      expect(saveSystem.getRoomNameFromId('forest_clearing')).toBe('Forest Clearing');
      expect(saveSystem.getRoomNameFromId('river_bank')).toBe('River Bank');
    });

    it('returns room ID for unknown rooms', () => {
      expect(saveSystem.getRoomNameFromId('unknown_room')).toBe('unknown_room');
      expect(saveSystem.getRoomNameFromId('custom_room_123')).toBe('custom_room_123');
    });
  });

  describe('formatSlotDisplay', () => {
    it('formats empty slot', () => {
      const slot = { slotNumber: 1 as const, state: null, lastSaved: null };
      const display = saveSystem.formatSlotDisplay(slot);
      
      expect(display).toBe('Slot 1: (empty)');
    });

    it('formats filled slot with room name and time', () => {
      const gameState = createMockGameState('red_stone_chamber');
      saveSystem.saveToSlot(1, gameState);
      
      const slots = saveSystem.getAllSlots();
      const display = saveSystem.formatSlotDisplay(slots[0]);
      
      expect(display).toContain('Slot 1:');
      expect(display).toContain('Red Stone Chamber');
      expect(display).toMatch(/\d{1,2}:\d{2}\s(AM|PM)/);
    });

    it('formats slot with unknown room ID', () => {
      const gameState = createMockGameState('mystery_chamber');
      saveSystem.saveToSlot(2, gameState);
      
      const slots = saveSystem.getAllSlots();
      const display = saveSystem.formatSlotDisplay(slots[1]);
      
      expect(display).toContain('Slot 2:');
      expect(display).toContain('mystery_chamber');
    });

    it('formats different slot numbers correctly', () => {
      const gameState = createMockGameState();
      
      saveSystem.saveToSlot(1, gameState);
      saveSystem.saveToSlot(2, gameState);
      saveSystem.saveToSlot(3, gameState);
      
      const slots = saveSystem.getAllSlots();
      
      expect(saveSystem.formatSlotDisplay(slots[0])).toContain('Slot 1:');
      expect(saveSystem.formatSlotDisplay(slots[1])).toContain('Slot 2:');
      expect(saveSystem.formatSlotDisplay(slots[2])).toContain('Slot 3:');
    });
  });
});
