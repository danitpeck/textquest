/**
 * Player system for TextQuest
 * Tracks inventory, skills, and progression
 */

export interface Player {
  id: string;
  location: string; // room ID
  inventory: string[]; // item IDs
  maxInventory: number;
  skills: {
    examine: number; // 0-5, determines what detail level player sees on items
    learn: number;
    craft: number;
  };
}

/**
 * Create a new player starting in a given location
 */
export function createPlayer(startLocationId: string): Player {
  return {
    id: 'player',
    location: startLocationId,
    inventory: [],
    maxInventory: 20,
    skills: {
      examine: 0,
      learn: 0,
      craft: 0,
    },
  };
}

/**
 * Get remaining inventory slots
 */
export function getInventorySpace(player: Player): number {
  return player.maxInventory - player.inventory.length;
}

/**
 * Check if player can add an item to inventory
 */
export function canAddToInventory(player: Player, itemCount: number = 1): boolean {
  return getInventorySpace(player) >= itemCount;
}

/**
 * Increase a player skill (max level 5)
 * Returns true if skill actually increased
 */
export function increaseSkill(player: Player, skill: keyof Player['skills'], amount: number = 1): boolean {
  const oldLevel = player.skills[skill];
  const newLevel = Math.min(5, oldLevel + amount);
  player.skills[skill] = newLevel;
  return newLevel > oldLevel;
}

/**
 * Get the description tier a player can see for an item
 * (based on examine skill: 0-5)
 */
export function getDescriptionTier(player: Player): number {
  return Math.min(player.skills.examine, 5);
}
