import { describe, it, expect } from 'vitest';
import {
  getItemById,
  findItemByName,
  getItemsByIds,
  cloneItem,
  formatItemsInRoom,
  itemsDatabase,
  type GameItem,
} from './items';

describe('Items System', () => {
  describe('itemsDatabase', () => {
    it('contains expected hardcoded items', () => {
      expect(itemsDatabase['copper_knife']).toBeDefined();
      expect(itemsDatabase['glass_vial']).toBeDefined();
      expect(itemsDatabase['wooden_chest']).toBeDefined();
      expect(itemsDatabase['parchment_scroll']).toBeDefined();
      expect(itemsDatabase['mossy_stone']).toBeDefined();
      expect(itemsDatabase['wildflower']).toBeDefined();
      expect(itemsDatabase['smooth_pebble']).toBeDefined();
      expect(itemsDatabase['reeds']).toBeDefined();
    });

    it('contains items loaded from items.json', () => {
      expect(itemsDatabase['massive_clay_pots']).toBeDefined();
      if (itemsDatabase['massive_clay_pots']) {
        expect(itemsDatabase['massive_clay_pots'].name).toBe('massive clay pots');
      }
    });

    it('all items have required fields', () => {
      Object.values(itemsDatabase).forEach(item => {
        expect(item.id).toBeDefined();
        expect(item.name).toBeDefined();
        expect(item.aliases).toBeDefined();
        expect(Array.isArray(item.aliases)).toBe(true);
        expect(item.descriptions).toBeDefined();
        expect(Array.isArray(item.descriptions)).toBe(true);
        expect(typeof item.canTake).toBe('boolean');
      });
    });

    it('all items have at least one description', () => {
      Object.values(itemsDatabase).forEach(item => {
        expect(item.descriptions.length).toBeGreaterThan(0);
      });
    });

    it('items with canOpen also have isOpen and contents fields', () => {
      Object.values(itemsDatabase).forEach(item => {
        if (item.canOpen) {
          expect(item.isOpen).toBeDefined();
          expect(item.contents).toBeDefined();
        }
      });
    });

    it('massive_clay_pots has activity effects', () => {
      const pots = itemsDatabase['massive_clay_pots'];
      if (pots) {
        expect(pots.turnDescription).toBeDefined();
        expect(pots.turnEffect).toBeDefined();
        expect(pots.turnEffect?.puzzleId).toBe('potsPuzzle');
        expect(pots.turnEffect?.revealExit).toBe('north');
      }
    });
  });

  describe('getItemById', () => {
    it('retrieves item by exact ID', () => {
      const knife = getItemById('copper_knife');
      expect(knife).toBeDefined();
      expect(knife?.id).toBe('copper_knife');
      expect(knife?.name).toBe('copper knife');
    });

    it('retrieves different items correctly', () => {
      const vial = getItemById('glass_vial');
      const chest = getItemById('wooden_chest');

      expect(vial?.name).toBe('glass vial');
      expect(chest?.name).toBe('wooden chest');
    });

    it('returns undefined for non-existent item', () => {
      const item = getItemById('nonexistent_item');
      expect(item).toBeUndefined();
    });

    it('returns undefined for empty ID', () => {
      const item = getItemById('');
      expect(item).toBeUndefined();
    });

    it('retrieves items loaded from JSON', () => {
      const pots = getItemById('massive_clay_pots');
      expect(pots).toBeDefined();
      expect(pots?.canTake).toBe(false);
    });
  });

  describe('findItemByName', () => {
    it('finds item by exact name match', () => {
      const knife = findItemByName('copper knife');
      expect(knife?.id).toBe('copper_knife');
    });

    it('finds items by exact alias match', () => {
      const byAlias1 = findItemByName('vial');
      const byAlias2 = findItemByName('chest');
      const byAlias3 = findItemByName('bottle');

      expect(byAlias1?.id).toBe('glass_vial');
      expect(byAlias2?.id).toBe('wooden_chest');
      expect(byAlias3?.id).toBe('glass_vial');
    });

    it('is case-insensitive', () => {
      const lower = findItemByName('copper knife');
      const upper = findItemByName('COPPER KNIFE');
      const mixed = findItemByName('CoPpEr KnIfE');

      expect(lower?.id).toBe('copper_knife');
      expect(upper?.id).toBe('copper_knife');
      expect(mixed?.id).toBe('copper_knife');
    });

    it('handles multi-word names and aliases', () => {
      const fullName = findItemByName('wooden chest');
      const multiWordAlias = findItemByName('copper knife');

      expect(fullName?.id).toBe('wooden_chest');
      expect(multiWordAlias?.id).toBe('copper_knife');
    });

    it('returns undefined for non-existent item', () => {
      const item = findItemByName('nonexistent item');
      expect(item).toBeUndefined();
    });

    it('returns undefined for partial name match', () => {
      // Should not match "copper" alone to "copper knife"
      const item = findItemByName('copp');
      expect(item).toBeUndefined();
    });

    it('finds items with common aliases', () => {
      const stone = findItemByName('stone');
      const flower = findItemByName('flower');
      const pebble = findItemByName('pebble');

      // Should find one of the items with "stone" alias
      expect(stone).toBeDefined();
      expect(flower?.id).toBe('wildflower');
      expect(pebble?.id).toBe('smooth_pebble');
    });
  });

  describe('getItemsByIds', () => {
    it('retrieves multiple items by IDs', () => {
      const items = getItemsByIds(['copper_knife', 'glass_vial', 'wooden_chest']);

      expect(items.length).toBe(3);
      expect(items[0].id).toBe('copper_knife');
      expect(items[1].id).toBe('glass_vial');
      expect(items[2].id).toBe('wooden_chest');
    });

    it('returns empty array for empty ID list', () => {
      const items = getItemsByIds([]);
      expect(items).toEqual([]);
    });

    it('filters out non-existent items', () => {
      const items = getItemsByIds([
        'copper_knife',
        'nonexistent_item',
        'glass_vial',
        'another_fake_item',
      ]);

      expect(items.length).toBe(2);
      expect(items[0].id).toBe('copper_knife');
      expect(items[1].id).toBe('glass_vial');
    });

    it('preserves order of items', () => {
      const ids = ['wooden_chest', 'copper_knife', 'glass_vial'];
      const items = getItemsByIds(ids);

      expect(items.map(i => i.id)).toEqual(ids);
    });

    it('handles duplicate IDs', () => {
      const items = getItemsByIds([
        'copper_knife',
        'copper_knife',
        'glass_vial',
      ]);

      // Should include duplicates as they appear in the input
      expect(items.length).toBe(3);
      expect(items[0].id).toBe('copper_knife');
      expect(items[1].id).toBe('copper_knife');
      expect(items[2].id).toBe('glass_vial');
    });

    it('retrieves mixed hardcoded and JSON-loaded items', () => {
      const items = getItemsByIds(['copper_knife', 'massive_clay_pots']);

      expect(items.length).toBe(2);
      const knife = items.find(i => i.id === 'copper_knife');
      const pots = items.find(i => i.id === 'massive_clay_pots');

      expect(knife).toBeDefined();
      expect(pots).toBeDefined();
    });
  });

  describe('cloneItem', () => {
    it('clones an item by ID', () => {
      const original = getItemById('copper_knife')!;
      const cloned = cloneItem('copper_knife')!;

      // Cloned items always have a contents array (even if original doesn't)
      expect(cloned.id).toBe(original.id);
      expect(cloned.name).toBe(original.name);
      expect(cloned.aliases).toEqual(original.aliases);
      expect(cloned).not.toBe(original); // Different object references
    });

    it('clones items with empty contents', () => {
      const cloned = cloneItem('glass_vial') as GameItem;

      expect(cloned.contents).toBeDefined();
      expect(cloned.contents).toEqual([]);
      expect(cloned.contents).not.toBe(getItemById('glass_vial')?.contents); // Different array reference
    });

    it('clones items with contents as new array', () => {
      const original = getItemById('wooden_chest')!;
      const cloned = cloneItem('wooden_chest') as GameItem;

      expect(cloned.contents).toEqual(original.contents);
      expect(cloned.contents).not.toBe(original.contents); // Different array reference
    });

    it('cloning does not affect original item', () => {
      const cloned = cloneItem('wooden_chest') as GameItem;
      const original = getItemById('wooden_chest')!;

      // Modify cloned contents
      cloned.contents?.push('new_item');

      // Original should be unchanged
      expect(original.contents).not.toContain('new_item');
    });

    it('returns undefined for non-existent item', () => {
      const cloned = cloneItem('nonexistent_item');
      expect(cloned).toBeUndefined();
    });

    it('preserves all item properties in clone', () => {
      const original = getItemById('glass_vial')!;
      const cloned = cloneItem('glass_vial')!;

      expect(cloned.id).toBe(original.id);
      expect(cloned.name).toBe(original.name);
      expect(cloned.aliases).toEqual(original.aliases);
      expect(cloned.descriptions).toEqual(original.descriptions);
      expect(cloned.canTake).toBe(original.canTake);
      expect(cloned.canOpen).toBe(original.canOpen);
      expect(cloned.isOpen).toBe(original.isOpen);
      expect(cloned.weight).toBe(original.weight);
    });

    it('clones items with activity effects', () => {
      const cloned = cloneItem('massive_clay_pots');
      const original = getItemById('massive_clay_pots');

      if (original && cloned) {
        expect(cloned.turnDescription).toBe(original.turnDescription);
        expect(cloned.turnEffect).toEqual(original.turnEffect);
      }
    });
  });

  describe('formatItemsInRoom', () => {
    it('formats single item', () => {
      const formatted = formatItemsInRoom(['copper_knife']);
      expect(formatted).toBe('You see copper knife here.');
    });

    it('formats multiple items', () => {
      const formatted = formatItemsInRoom(['copper_knife', 'glass_vial']);
      expect(formatted).toBe('You see copper knife, glass vial here.');
    });

    it('formats many items', () => {
      const formatted = formatItemsInRoom([
        'copper_knife',
        'glass_vial',
        'wooden_chest',
        'parchment_scroll',
      ]);
      expect(formatted).toBe(
        'You see copper knife, glass vial, wooden chest, parchment scroll here.'
      );
    });

    it('returns null for empty item list', () => {
      const formatted = formatItemsInRoom([]);
      expect(formatted).toBeNull();
    });

    it('returns null if all items are non-existent', () => {
      const formatted = formatItemsInRoom([
        'nonexistent1',
        'nonexistent2',
      ]);
      expect(formatted).toBeNull();
    });

    it('filters out non-existent items and formats rest', () => {
      const formatted = formatItemsInRoom([
        'copper_knife',
        'nonexistent_item',
        'glass_vial',
      ]);
      expect(formatted).toBe('You see copper knife, glass vial here.');
    });

    it('includes items loaded from JSON', () => {
      const formatted = formatItemsInRoom(['copper_knife', 'massive_clay_pots']);
      expect(formatted).toContain('copper knife');
      expect(formatted).toContain('massive clay pots');
    });

    it('uses item names not IDs', () => {
      const formatted = formatItemsInRoom(['copper_knife']);
      expect(formatted).toContain('copper knife');
      expect(formatted).not.toContain('copper_knife');
    });

    it('formats with proper grammar', () => {
      const single = formatItemsInRoom(['glass_vial']);
      const multiple = formatItemsInRoom(['glass_vial', 'copper_knife']);

      expect(single).toBe('You see glass vial here.');
      expect(multiple).toMatch(/You see .* here\./);
    });
  });
});
