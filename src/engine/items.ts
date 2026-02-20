/**
 * Item system for TextQuest
 * Items have multi-tier descriptions based on examine skill
 * Items can be taken, opened, or placed in containers
 */

import itemsData from '../data/items.json';

export interface ActivityEffect {
  message: string;              // What player sees
  puzzleId?: string;            // Puzzle identifier to mark as solved
  revealExit?: string;          // Exit ID to reveal after activity
}

export interface GameItem {
  id: string;
  name: string;
  aliases: string[]; // ["copper knife", "knife", "blade"]
  descriptions: string[]; // tier 0-5; player skill determines which they see
  canOpen?: boolean;
  isOpen?: boolean;
  contents?: string[]; // item IDs inside this container
  canTake: boolean;
  weight?: number;
  // Activity effects
  turnDescription?: string;
  turnEffect?: ActivityEffect;
  pushDescription?: string;
  pushEffect?: ActivityEffect;
  pullDescription?: string;
  pullEffect?: ActivityEffect;
}

interface RawItem {
  id?: unknown;
  name?: unknown;
  aliases?: unknown;
  descriptions?: unknown;
  canOpen?: unknown;
  isOpen?: unknown;
  contents?: unknown;
  canTake?: unknown;
  weight?: unknown;
  turnDescription?: unknown;
  turnEffect?: unknown;
  pushDescription?: unknown;
  pushEffect?: unknown;
  pullDescription?: unknown;
  pullEffect?: unknown;
}

function validateItem(raw: unknown): GameItem {
  if (typeof raw !== 'object' || !raw) throw new Error('Invalid item');
  const itemObj = raw as RawItem;
  
  // Validate required fields
  const id = String(itemObj.id || '');
  if (!id) throw new Error('Item must have an id');
  
  const name = String(itemObj.name || '');
  if (!name) throw new Error('Item must have a name');
  
  if (!Array.isArray(itemObj.aliases)) throw new Error('Item must have aliases array');
  const aliases = (itemObj.aliases as unknown[]).map(String);
  
  if (!Array.isArray(itemObj.descriptions)) throw new Error('Item must have descriptions array');
  const descriptions = (itemObj.descriptions as unknown[]).map(String);
  
  const canTake = typeof itemObj.canTake === 'boolean' ? itemObj.canTake : false;
  
  return {
    id,
    name,
    aliases,
    descriptions,
    canTake,
    canOpen: typeof itemObj.canOpen === 'boolean' ? itemObj.canOpen : undefined,
    isOpen: typeof itemObj.isOpen === 'boolean' ? itemObj.isOpen : undefined,
    contents: Array.isArray(itemObj.contents) ? (itemObj.contents as unknown[]).map(String) : undefined,
    weight: typeof itemObj.weight === 'number' ? itemObj.weight : undefined,
    turnDescription: itemObj.turnDescription ? String(itemObj.turnDescription) : undefined,
    turnEffect: itemObj.turnEffect && typeof itemObj.turnEffect === 'object' ? itemObj.turnEffect as ActivityEffect : undefined,
    pushDescription: itemObj.pushDescription ? String(itemObj.pushDescription) : undefined,
    pushEffect: itemObj.pushEffect && typeof itemObj.pushEffect === 'object' ? itemObj.pushEffect as ActivityEffect : undefined,
    pullDescription: itemObj.pullDescription ? String(itemObj.pullDescription) : undefined,
    pullEffect: itemObj.pullEffect && typeof itemObj.pullEffect === 'object' ? itemObj.pullEffect as ActivityEffect : undefined,
  };
}

// Load items from JSON
const loadedItems = (itemsData as unknown[]).map(validateItem);

/**
 * Items database - all items indexed by ID, loaded from items.json
 */
export const itemsDatabase: Record<string, GameItem> = {
  // Forest clearing items
  'mossy_stone': {
    id: 'mossy_stone',
    name: 'mossy stone',
    aliases: ['mossy stone', 'stone', 'moss stone'],
    descriptions: [
      'A smooth stone covered in soft moss.',
      'A gray stone worn smooth by water, covered in a thick layer of bright green moss.',
      'An ancient stone, likely rounded by a river long ago. The moss is vibrant and damp, home to tiny insects.',
    ],
    canTake: true,
    weight: 2.0,
  },
  'wildflower': {
    id: 'wildflower',
    name: 'wildflower',
    aliases: ['wildflower', 'flower', 'petal', 'petals'],
    descriptions: [
      'A delicate flower with vibrant petals.',
      'A wildflower with deep purple petals and a bright yellow center. It smells faintly sweet.',
      'A rare wildflower, possibly a moonflower variant. The petals are unusually soft, and dried moonflower petals are a prized alchemical ingredient.',
    ],
    canTake: true,
    weight: 0.02,
  },
  // River bank items
  'smooth_pebble': {
    id: 'smooth_pebble',
    name: 'smooth pebble',
    aliases: ['smooth pebble', 'pebble', 'stone'],
    descriptions: [
      'A smooth pebble, polished by the river.',
      'A perfectly smooth pebble, small enough to fit in your palm. It\'s warm to the touch and feels pleasant.',
      'An unusually smooth pebble with an almost glass-like quality. Upon closer inspection, you notice faint striations of crystal within.',
    ],
    canTake: true,
    weight: 0.1,
  },
  'reeds': {
    id: 'reeds',
    name: 'reeds',
    aliases: ['reeds', 'reed', 'grass', 'green grass'],
    descriptions: [
      'Tall green reeds growing at the water\'s edge.',
      'A bundle of tall green reeds with long, sword-like leaves. They sway gracefully in the breeze.',
      'Pearl-green reeds, commonly used in traditional basket weaving and thatching. The sap has mild medicinal properties.',
    ],
    canTake: true,
    weight: 0.5,
  },

  // Tier 1 - Basic items for learning (our sample items)
  'copper_knife': {
    id: 'copper_knife',
    name: 'copper knife',
    aliases: ['copper knife', 'knife', 'blade', 'copper blade'],
    descriptions: [
      'A simple copper knife, dulled with age.',
      'The blade is made of copper, surprisingly well-preserved. It has a leather-wrapped handle.',
      'An old copper knife. The blade shows signs of oxidation, forming a thin green patina. The handle is wrapped in deteriorating leather.',
    ],
    canTake: true,
    weight: 0.5,
  },
  'glass_vial': {
    id: 'glass_vial',
    name: 'glass vial',
    aliases: ['glass vial', 'vial', 'bottle'],
    descriptions: [
      'A small glass vial, empty.',
      'A delicate glass vial, cork-stoppered. Empty, but well-made.',
      'A finely crafted glass vial with a cork stopper. No cracks or flaws visible.',
    ],
    canTake: true,
    canOpen: true,
    isOpen: false,
    contents: [],
    weight: 0.1,
  },
  'wooden_chest': {
    id: 'wooden_chest',
    name: 'wooden chest',
    aliases: ['wooden chest', 'chest', 'box', 'wooden box'],
    descriptions: [
      'A sturdy wooden chest.',
      'A well-crafted wooden chest with a hinged lid. Metal bands reinforce the corners.',
      'A wooden chest made of oak, reinforced with iron bands. The hinges are well-oiled. Strange markings are carved into the top.',
    ],
    canTake: false,
    canOpen: true,
    isOpen: false,
    contents: ['copper_knife'],
  },
  'parchment_scroll': {
    id: 'parchment_scroll',
    name: 'parchment scroll',
    aliases: ['parchment scroll', 'scroll', 'parchment'],
    descriptions: [
      'A rolled parchment scroll, faded with age.',
      'An aged parchment scroll with a recipe written on it. You can make out some ingredients but not all.',
      'An alchemical recipe scroll for "Potion of Growth". The ingredients list: moonflower petals, dragon scale dust, silver sap, and a pinch of ground crystal.',
    ],
    canTake: true,
    weight: 0.05,
  },
  
  // Items loaded from items.json
  ...Object.fromEntries(loadedItems.map(item => [item.id, item])),
};

/**
 * Get an item from the database
 */
export function getItemById(id: string): GameItem | undefined {
  return itemsDatabase[id];
}

/**
 * Find an item by name or alias
 */
export function findItemByName(query: string): GameItem | undefined {
  const normalized = query.toLowerCase();
  return Object.values(itemsDatabase).find(item =>
    item.name.toLowerCase() === normalized ||
    item.aliases.some(alias => alias.toLowerCase() === normalized)
  );
}

/**
 * Get items by a list of IDs
 */
export function getItemsByIds(ids: string[]): GameItem[] {
  return ids
    .map(id => getItemById(id))
    .filter((item): item is GameItem => item !== undefined);
}

/**
 * Clone an item (for inventory management)
 */
export function cloneItem(id: string): GameItem | undefined {
  const original = getItemById(id);
  if (!original) return undefined;
  return { ...original, contents: original.contents ? [...original.contents] : [] };
}

/**
 * Format items for room description
 */
export function formatItemsInRoom(itemIds: string[]): string | null {
  if (itemIds.length === 0) return null;
  const items = getItemsByIds(itemIds);
  if (items.length === 0) return null;
  const itemNames = items.map(i => i.name).join(', ');
  return `You see ${itemNames} here.`;
}
