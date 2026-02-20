import { describe, it, expect } from 'vitest';
import {
  createPlayer,
  getInventorySpace,
  canAddToInventory,
  increaseSkill,
  getDescriptionTier,
  type Player,
} from './player';

describe('Player System', () => {
  describe('createPlayer', () => {
    it('creates player with default starting values', () => {
      const player = createPlayer('red_stone_chamber');

      expect(player.id).toBe('player');
      expect(player.location).toBe('red_stone_chamber');
      expect(player.inventory).toEqual([]);
      expect(player.maxInventory).toBe(20);
    });

    it('creates player with default skill values', () => {
      const player = createPlayer('forest_clearing');

      expect(player.skills.examine).toBe(0);
      expect(player.skills.learn).toBe(0);
      expect(player.skills.craft).toBe(0);
    });

    it('accepts different starting locations', () => {
      const player1 = createPlayer('red_stone_chamber');
      const player2 = createPlayer('chamber_of_runes');

      expect(player1.location).toBe('red_stone_chamber');
      expect(player2.location).toBe('chamber_of_runes');
    });

    it('creates separate player instances', () => {
      const player1 = createPlayer('room_1');
      const player2 = createPlayer('room_2');

      player1.inventory.push('item_1');

      expect(player1.inventory).toContain('item_1');
      expect(player2.inventory).not.toContain('item_1');
    });

    it('creates player with mutable inventory', () => {
      const player = createPlayer('forest_clearing');
      player.inventory.push('copper_knife', 'glass_vial');

      expect(player.inventory.length).toBe(2);
      expect(player.inventory).toContain('copper_knife');
      expect(player.inventory).toContain('glass_vial');
    });

    it('creates player with full inventory capacity', () => {
      const player = createPlayer('forest_clearing');
      expect(player.maxInventory).toBe(20);

      // Fill inventory
      for (let i = 0; i < 20; i++) {
        player.inventory.push(`item_${i}`);
      }

      expect(player.inventory.length).toBe(20);
    });
  });

  describe('getInventorySpace', () => {
    it('returns max inventory for new player', () => {
      const player = createPlayer('forest_clearing');
      expect(getInventorySpace(player)).toBe(20);
    });

    it('returns remaining space with items', () => {
      const player = createPlayer('forest_clearing');
      player.inventory.push('item_1', 'item_2', 'item_3');

      expect(getInventorySpace(player)).toBe(17); // 20 - 3
    });

    it('returns zero for full inventory', () => {
      const player = createPlayer('forest_clearing');

      // Fill inventory
      for (let i = 0; i < 20; i++) {
        player.inventory.push(`item_${i}`);
      }

      expect(getInventorySpace(player)).toBe(0);
    });

    it('returns exact remaining space', () => {
      const player = createPlayer('forest_clearing');
      player.inventory.push('item_1');

      expect(getInventorySpace(player)).toBe(19);

      player.inventory.push('item_2');
      expect(getInventorySpace(player)).toBe(18);

      player.inventory.push('item_3');
      expect(getInventorySpace(player)).toBe(17);
    });
  });

  describe('canAddToInventory', () => {
    it('allows adding to empty inventory', () => {
      const player = createPlayer('forest_clearing');

      expect(canAddToInventory(player, 1)).toBe(true);
      expect(canAddToInventory(player, 20)).toBe(true);
    });

    it('allows adding single item (default)', () => {
      const player = createPlayer('forest_clearing');
      player.inventory.push('item_1');

      expect(canAddToInventory(player)).toBe(true);
    });

    it('allows adding multiple items if space available', () => {
      const player = createPlayer('forest_clearing');
      player.inventory.push('item_1', 'item_2');

      expect(canAddToInventory(player, 5)).toBe(true);
      expect(canAddToInventory(player, 18)).toBe(true);
    });

    it('prevents adding when inventory full', () => {
      const player = createPlayer('forest_clearing');

      // Fill inventory
      for (let i = 0; i < 20; i++) {
        player.inventory.push(`item_${i}`);
      }

      expect(canAddToInventory(player, 1)).toBe(false);
      expect(canAddToInventory(player)).toBe(false);
    });

    it('prevents adding more items than available space', () => {
      const player = createPlayer('forest_clearing');
      player.inventory.push('item_1', 'item_2', 'item_3');

      expect(canAddToInventory(player, 17)).toBe(true); // Exactly fits (20 - 3)
      expect(canAddToInventory(player, 18)).toBe(false); // Would exceed
    });

    it('handles edge case of adding zero items', () => {
      const player = createPlayer('forest_clearing');

      expect(canAddToInventory(player, 0)).toBe(true); // Can always add 0 items
    });

    it('allows adding items up to exact capacity', () => {
      const player = createPlayer('forest_clearing');

      for (let i = 0; i < 15; i++) {
        player.inventory.push(`item_${i}`);
      }

      expect(canAddToInventory(player, 5)).toBe(true); // Exactly fills
      expect(canAddToInventory(player, 6)).toBe(false); // Over capacity
    });
  });

  describe('increaseSkill', () => {
    it('increases skill from 0', () => {
      const player = createPlayer('forest_clearing');

      const increased = increaseSkill(player, 'examine', 1);

      expect(player.skills.examine).toBe(1);
      expect(increased).toBe(true);
    });

    it('increases skill by default amount (1)', () => {
      const player = createPlayer('forest_clearing');
      player.skills.examine = 2;

      const increased = increaseSkill(player, 'examine');

      expect(player.skills.examine).toBe(3);
      expect(increased).toBe(true);
    });

    it('increases skill by multiple levels', () => {
      const player = createPlayer('forest_clearing');

      increaseSkill(player, 'examine', 3);

      expect(player.skills.examine).toBe(3);
    });

    it('increases different skills independently', () => {
      const player = createPlayer('forest_clearing');

      increaseSkill(player, 'examine', 2);
      increaseSkill(player, 'learn', 1);
      increaseSkill(player, 'craft', 3);

      expect(player.skills.examine).toBe(2);
      expect(player.skills.learn).toBe(1);
      expect(player.skills.craft).toBe(3);
    });

    it('caps skill at level 5', () => {
      const player = createPlayer('forest_clearing');
      player.skills.examine = 3;

      const increased = increaseSkill(player, 'examine', 5);

      expect(player.skills.examine).toBe(5); // Capped at 5
      expect(increased).toBe(true); // Still counts as increased
    });

    it('prevents exceeding skill cap of 5', () => {
      const player = createPlayer('forest_clearing');
      player.skills.examine = 5;

      const increased = increaseSkill(player, 'examine', 1);

      expect(player.skills.examine).toBe(5); // Stays at 5
      expect(increased).toBe(false); // Did not increase
    });

    it('returns false if skill at max and attempted to increase', () => {
      const player = createPlayer('forest_clearing');

      // Max out examine skill
      increaseSkill(player, 'examine', 10);
      expect(player.skills.examine).toBe(5);

      const result = increaseSkill(player, 'examine', 1);
      expect(result).toBe(false);
    });

    it('handles progression from 0 to 5', () => {
      const player = createPlayer('forest_clearing');

      for (let i = 0; i < 6; i++) {
        const increased = increaseSkill(player, 'learn', 1);

        if (i < 5) {
          expect(increased).toBe(true);
        } else {
          expect(increased).toBe(false); // 6th increase fails (already at 5)
        }
      }

      expect(player.skills.learn).toBe(5);
    });

    it('can increase all three skills to max', () => {
      const player = createPlayer('forest_clearing');

      increaseSkill(player, 'examine', 10);
      increaseSkill(player, 'learn', 10);
      increaseSkill(player, 'craft', 10);

      expect(player.skills.examine).toBe(5);
      expect(player.skills.learn).toBe(5);
      expect(player.skills.craft).toBe(5);
    });

    it('handles zero skill increase amount', () => {
      const player = createPlayer('forest_clearing');
      player.skills.examine = 2;

      const increased = increaseSkill(player, 'examine', 0);

      expect(player.skills.examine).toBe(2); // Unchanged
      expect(increased).toBe(false); // No increase
    });

    it('handles negative skill increase amount', () => {
      const player = createPlayer('forest_clearing');
      player.skills.examine = 3;

      const increased = increaseSkill(player, 'examine', -1);

      expect(player.skills.examine).toBe(2); // Decreased (but treated as negative increase)
      expect(increased).toBe(false); // Returns false since newLevel is not > oldLevel
    });
  });

  describe('getDescriptionTier', () => {
    it('returns 0 for new player', () => {
      const player = createPlayer('forest_clearing');

      expect(getDescriptionTier(player)).toBe(0);
    });

    it('returns examine skill level', () => {
      const player = createPlayer('forest_clearing');
      player.skills.examine = 2;

      expect(getDescriptionTier(player)).toBe(2);
    });

    it('returns tier 5 for max examine skill', () => {
      const player = createPlayer('forest_clearing');
      player.skills.examine = 5;

      expect(getDescriptionTier(player)).toBe(5);
    });

    it('returns tier even with high learn/craft skills', () => {
      const player = createPlayer('forest_clearing');
      player.skills.examine = 1;
      player.skills.learn = 5;
      player.skills.craft = 5;

      expect(getDescriptionTier(player)).toBe(1); // Only examine skill matters
    });

    it('tracks all possible tiers 0-5', () => {
      const player = createPlayer('forest_clearing');

      const tiers = [];
      for (let i = 0; i <= 5; i++) {
        player.skills.examine = i;
        tiers.push(getDescriptionTier(player));
      }

      expect(tiers).toEqual([0, 1, 2, 3, 4, 5]);
    });

    it('caps at 5 even if examine skill somehow exceeds 5', () => {
      const player = createPlayer('forest_clearing');
      // Manually set beyond cap (shouldn't happen in normal play)
      player.skills.examine = 10;

      expect(getDescriptionTier(player)).toBe(5);
    });

    it('returns correct tier after skill increase', () => {
      const player = createPlayer('forest_clearing');

      expect(getDescriptionTier(player)).toBe(0);

      increaseSkill(player, 'examine', 2);
      expect(getDescriptionTier(player)).toBe(2);

      increaseSkill(player, 'examine', 3);
      expect(getDescriptionTier(player)).toBe(5);
    });
  });
});
