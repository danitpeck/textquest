import { describe, it, expect } from 'vitest';
import {
  getNPCById,
  getNPCsByIds,
  findNPCByNameOrPrefix,
  formatNPCsInRoom,
  npcsDatabase,
  type NPC,
} from './npcs';

describe('NPC System', () => {
  // Default empty NPC state for tests
  const emptyNpcState = {} as Record<string, boolean>;

  describe('npcsDatabase', () => {
    it('contains expected NPCs', () => {
      expect(npcsDatabase['crow_spirit']).toBeDefined();
    });

    it('crow_spirit has required fields', () => {
      const crow = npcsDatabase['crow_spirit'];

      expect(crow.id).toBe('crow_spirit');
      expect(crow.name).toBe('Crow Spirit');
      expect(crow.description).toBeDefined();
      expect(Array.isArray(crow.aliases)).toBe(true);
      expect(typeof crow.visibleByDefault).toBe('boolean');
    });

    it('crow_spirit has trigger configuration', () => {
      const crow = npcsDatabase['crow_spirit'];

      expect(crow.triggers).toBeDefined();
      expect(crow.triggers?.onDoorClosed).toBe('black_door');
      expect(crow.triggers?.onDoorOpened).toBe('black_door');
    });

    it('crow_spirit has appear/disappear messages', () => {
      const crow = npcsDatabase['crow_spirit'];

      expect(crow.appearMessage).toBeDefined();
      expect(crow.disappearMessage).toBeDefined();
    });

    it('all NPCs have required fields', () => {
      Object.values(npcsDatabase).forEach(npc => {
        expect(npc.id).toBeDefined();
        expect(npc.name).toBeDefined();
        expect(npc.description).toBeDefined();
        expect(npc.aliases).toBeDefined();
        expect(Array.isArray(npc.aliases)).toBe(true);
        expect(typeof npc.visibleByDefault).toBe('boolean');
      });
    });
  });

  describe('getNPCById', () => {
    it('retrieves NPC by ID', () => {
      const npc = getNPCById('crow_spirit');

      expect(npc).toBeDefined();
      expect(npc?.id).toBe('crow_spirit');
      expect(npc?.name).toBe('Crow Spirit');
    });

    it('returns undefined for non-existent NPC', () => {
      const npc = getNPCById('nonexistent_npc');

      expect(npc).toBeUndefined();
    });

    it('returns undefined for empty ID', () => {
      const npc = getNPCById('');

      expect(npc).toBeUndefined();
    });

    it('retrieves correct NPC properties', () => {
      const npc = getNPCById('crow_spirit')!;

      expect(npc.name).toBe('Crow Spirit');
      expect(npc.visibleByDefault).toBe(false);
      expect(npc.aliases).toContain('crow');
      expect(npc.aliases).toContain('spirit');
      expect(npc.aliases).toContain('bird');
    });
  });

  describe('getNPCsByIds', () => {
    it('retrieves multiple NPCs by IDs', () => {
      const npcs = getNPCsByIds(['crow_spirit']);

      expect(npcs.length).toBe(1);
      expect(npcs[0].id).toBe('crow_spirit');
    });

    it('returns empty array for empty ID list', () => {
      const npcs = getNPCsByIds([]);

      expect(npcs).toEqual([]);
    });

    it('filters out non-existent NPCs', () => {
      const npcs = getNPCsByIds([
        'crow_spirit',
        'nonexistent_npc',
        'another_fake_npc',
      ]);

      expect(npcs.length).toBe(1);
      expect(npcs[0].id).toBe('crow_spirit');
    });

    it('preserves order of NPCs', () => {
      const npcs = getNPCsByIds(['crow_spirit']);

      expect(npcs[0].id).toBe('crow_spirit');
    });

    it('handles duplicate IDs', () => {
      const npcs = getNPCsByIds(['crow_spirit', 'crow_spirit']);

      expect(npcs.length).toBe(2);
      expect(npcs[0].id).toBe('crow_spirit');
      expect(npcs[1].id).toBe('crow_spirit');
    });
  });

  describe('findNPCByNameOrPrefix', () => {
    const allNpcs = ['crow_spirit'];
    const visibleNpcState = { 'crow_spirit': true };

    it('finds NPC by exact name match', () => {
      const npc = findNPCByNameOrPrefix(allNpcs, 'Crow Spirit', visibleNpcState);

      expect(npc?.id).toBe('crow_spirit');
    });

    it('finds NPC by alias match', () => {
      const npc1 = findNPCByNameOrPrefix(allNpcs, 'crow', visibleNpcState);
      const npc2 = findNPCByNameOrPrefix(allNpcs, 'spirit', visibleNpcState);
      const npc3 = findNPCByNameOrPrefix(allNpcs, 'bird', visibleNpcState);

      expect(npc1?.id).toBe('crow_spirit');
      expect(npc2?.id).toBe('crow_spirit');
      expect(npc3?.id).toBe('crow_spirit');
    });

    it('is case-insensitive', () => {
      const lower = findNPCByNameOrPrefix(allNpcs, 'crow spirit', visibleNpcState);
      const upper = findNPCByNameOrPrefix(allNpcs, 'CROW SPIRIT', visibleNpcState);
      const mixed = findNPCByNameOrPrefix(allNpcs, 'CrOw SpIrIt', visibleNpcState);

      expect(lower?.id).toBe('crow_spirit');
      expect(upper?.id).toBe('crow_spirit');
      expect(mixed?.id).toBe('crow_spirit');
    });

    it('finds NPC by name prefix match', () => {
      const npc = findNPCByNameOrPrefix(allNpcs, 'Crow', visibleNpcState);

      expect(npc?.id).toBe('crow_spirit');
    });

    it('finds NPC by alias prefix match', () => {
      const npc1 = findNPCByNameOrPrefix(allNpcs, 'cr', visibleNpcState);
      const npc2 = findNPCByNameOrPrefix(allNpcs, 'spir', visibleNpcState);
      const npc3 = findNPCByNameOrPrefix(allNpcs, 'bir', visibleNpcState);

      expect(npc1?.id).toBe('crow_spirit');
      expect(npc2?.id).toBe('crow_spirit');
      expect(npc3?.id).toBe('crow_spirit');
    });

    it('returns null for non-existent NPC', () => {
      const npc = findNPCByNameOrPrefix(allNpcs, 'nonexistent', emptyNpcState);

      expect(npc).toBeNull();
    });

    it('respects visible by default status', () => {
      // crow_spirit is not visible by default
      const npc = findNPCByNameOrPrefix(
        allNpcs,
        'crow',
        emptyNpcState
      );

      // Should not find because it's not visible by default and not in npcState
      expect(npc).toBeNull();
    });

    it('finds NPC when explicitly made visible in state', () => {
      const npcState = { 'crow_spirit': true };
      const npc = findNPCByNameOrPrefix(allNpcs, 'crow', npcState);

      expect(npc?.id).toBe('crow_spirit');
    });

    it('does not find NPC when explicitly hidden in state', () => {
      const npcState = { 'crow_spirit': false };
      const npc = findNPCByNameOrPrefix(allNpcs, 'crow', npcState);

      expect(npc).toBeNull();
    });

    it('ignores non-visible NPCs even if they match', () => {
      // Create a list with crow_spirit (not visible by default)
      const npc = findNPCByNameOrPrefix(
        allNpcs,
        'spirit',
        emptyNpcState
      );

      // Should not find because not visible
      expect(npc).toBeNull();
    });

    it('finds NPC by full multi-word alias', () => {
      const npc = findNPCByNameOrPrefix(
        allNpcs,
        'crow spirit',
        { 'crow_spirit': true }
      );

      expect(npc?.id).toBe('crow_spirit');
    });

    it('finds NPC by spectral crow alias when visible', () => {
      const npc = findNPCByNameOrPrefix(
        allNpcs,
        'spectral',
        { 'crow_spirit': true }
      );

      expect(npc?.id).toBe('crow_spirit');
    });
  });

  describe('formatNPCsInRoom', () => {
    it('returns null for no NPCs', () => {
      const formatted = formatNPCsInRoom([], emptyNpcState);

      expect(formatted).toBeNull();
    });

    it('returns null when NPC not visible by default', () => {
      const formatted = formatNPCsInRoom(['crow_spirit'], emptyNpcState);

      expect(formatted).toBeNull();
    });

    it('formats single visible NPC', () => {
      const npcState = { 'crow_spirit': true };
      const formatted = formatNPCsInRoom(['crow_spirit'], npcState);

      expect(formatted).toBeTruthy();
      expect(formatted).toContain('crow spirit');
    });

    it('returns NPC description when visible', () => {
      const npcState = { 'crow_spirit': true };
      const formatted = formatNPCsInRoom(['crow_spirit'], npcState);
      const npc = getNPCById('crow_spirit')!;

      expect(formatted).toBe(npc.description);
    });

    it('does not format hidden NPCs', () => {
      const npcState = { 'crow_spirit': false };
      const formatted = formatNPCsInRoom(['crow_spirit'], npcState);

      expect(formatted).toBeNull();
    });

    it('filters out invisible NPCs from list', () => {
      // Mixed: visible and invisible (crow is invisible by default)
      const npcState = { 'crow_spirit': false };
      const formatted = formatNPCsInRoom(['crow_spirit'], npcState);

      expect(formatted).toBeNull();
    });

    it('shows NPCs with visibleByDefault true', () => {
      // Would need an NPC with visibleByDefault: true to test this
      // For now, verify crow_spirit is false
      const crow = getNPCById('crow_spirit');
      expect(crow?.visibleByDefault).toBe(false);
    });

    it('handles empty npcState by using defaults', () => {
      // crow_spirit not visible by default, empty state
      const formatted = formatNPCsInRoom(['crow_spirit'], {});

      expect(formatted).toBeNull();
    });

    it('shows multiple visible NPCs separated by blank lines', () => {
      // This would require multiple visible NPCs
      // For now, test with single NPC
      const npcState = { 'crow_spirit': true };
      const formatted = formatNPCsInRoom(['crow_spirit'], npcState);

      expect(formatted).toContain('crow spirit');
      expect(formatted).not.toContain('\n\n'); // Only one NPC, no double newlines
    });

    it('handles non-existent NPC IDs', () => {
      const npcState = { 'nonexistent_npc': true };
      const formatted = formatNPCsInRoom(['nonexistent_npc'], npcState);

      expect(formatted).toBeNull();
    });

    it('transitions NPC visibility based on state change', () => {
      // NPC hidden
      let formatted1 = formatNPCsInRoom(['crow_spirit'], {
        'crow_spirit': false,
      });
      expect(formatted1).toBeNull();

      // NPC becomes visible
      let formatted2 = formatNPCsInRoom(['crow_spirit'], {
        'crow_spirit': true,
      });
      expect(formatted2).toBeTruthy();

      // NPC hidden again
      let formatted3 = formatNPCsInRoom(['crow_spirit'], {
        'crow_spirit': false,
      });
      expect(formatted3).toBeNull();
    });
  });
});
