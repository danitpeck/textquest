/**
 * NPC system for TextQuest
 * NPCs can appear/disappear based on triggers (door closed/opened, items dropped, etc.)
 */

export interface NPC {
  id: string;                    // e.g., "crow_spirit"
  name: string;                  // "Crow Spirit"
  description: string;           // Multi-line description visible in room
  aliases: string[];             // ["crow", "spirit", "bird"]
  visibleByDefault: boolean;     // Initially shown/hidden
  appearMessage?: string;        // Message shown when NPC appears
  disappearMessage?: string;     // Message shown when NPC disappears
  triggers?: {
    onDoorClosed?: string;       // doorId that triggers appearance
    onDoorOpened?: string;       // doorId that triggers disappearance
    onItemDropped?: string;      // itemId that triggers appearance
    onRoomEnter?: boolean;       // Appears when player enters
  };
}

/**
 * NPCs database - all NPCs indexed by ID
 */
export const npcsDatabase: Record<string, NPC> = {
  'crow_spirit': {
    id: 'crow_spirit',
    name: 'Crow Spirit',
    description: 'The crow spirit is here, clacking its beak. It looks interested to help you.',
    aliases: ['crow', 'spirit', 'bird', 'crow spirit', 'spectral crow'],
    visibleByDefault: false,
    appearMessage: 'The crow spirit is here, clacking its beak. It looks interested to help you.',
    disappearMessage: 'The crow spirit vanishes from sight, once again invisible to the eye under the light of day.',
    triggers: {
      onDoorClosed: 'black_door',  // Appears when black door is closed
      onDoorOpened: 'black_door',  // Disappears when black door is opened
    },
  },
};

/**
 * Get an NPC from the database
 */
export function getNPCById(id: string): NPC | undefined {
  return npcsDatabase[id];
}

/**
 * Get NPCs by a list of IDs
 */
export function getNPCsByIds(ids: string[]): NPC[] {
  return ids
    .map(id => getNPCById(id))
    .filter((npc): npc is NPC => npc !== undefined);
}

/**
 * Find NPC by name, alias, or prefix (similar to findItemByNameOrPrefix)
 */
export function findNPCByNameOrPrefix(npcIds: string[], searchTerm: string, npcState: Record<string, boolean>): NPC | null {
  const npcs = getNPCsByIds(npcIds);
  const lowered = searchTerm.toLowerCase();

  // Only check visible NPCs
  const visibleNPCs = npcs.filter(npc => {
    const isVisible = npcState[npc.id] !== undefined ? npcState[npc.id] : npc.visibleByDefault;
    return isVisible;
  });

  // Exact match on name or alias
  let npc = visibleNPCs.find(n =>
    n.name.toLowerCase() === lowered ||
    n.aliases.some(a => a.toLowerCase() === lowered)
  );
  if (npc) return npc;

  // Prefix match on name
  npc = visibleNPCs.find(n => n.name.toLowerCase().startsWith(lowered));
  if (npc) return npc;

  // Prefix match on any alias
  npc = visibleNPCs.find(n => n.aliases.some(a => a.toLowerCase().startsWith(lowered)));
  if (npc) return npc;

  return null;
}

/**
 * Format NPCs for room description
 */
export function formatNPCsInRoom(npcIds: string[], npcState: Record<string, boolean>): string | null {
  const npcs = getNPCsByIds(npcIds);
  const visibleNPCs = npcs.filter(npc => {
    // Check if NPC is visible based on state (defaults to visibleByDefault if not in state)
    const isVisible = npcState[npc.id] !== undefined ? npcState[npc.id] : npc.visibleByDefault;
    return isVisible;
  });

  if (visibleNPCs.length === 0) return null;

  // Return each NPC's description as separate lines
  return visibleNPCs.map(npc => npc.description).join('\n\n');
}
