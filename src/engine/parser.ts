// Look command helpers
export const lookSynonyms = ['look', 'l', 'lo', 'loo'];

export function parseLook(command: string): { type: 'look', target?: string } | null {
  const words = command.trim().toLowerCase().split(/\s+/);
  if (lookSynonyms.includes(words[0])) {
    if (words.length === 1) return { type: 'look' };
    if (words[1] === 'sky') return { type: 'look', target: 'sky' };
    // look <direction>
    const dir = directionSynonyms[words[1]] || words[1];
    return { type: 'look', target: dir };
  }
  return null;
}

// Movement command helpers
const directionSynonyms: Record<string, string> = {
  n: 'north', north: 'north',
  s: 'south', south: 'south',
  e: 'east', east: 'east',
  w: 'west', west: 'west',
  u: 'up', up: 'up',
  d: 'down', down: 'down',
};

// Common movement verbs
const movementVerbs = [
  'go', 'walk', 'move', 'head', 'run', 'travel', 'proceed', 'step', 'enter', 'leave'
];

export function parseMovement(command: string): string | null {
  const words = command.trim().toLowerCase().split(/\s+/);
  // Try to find a direction in the command
  for (const word of words) {
    if (directionSynonyms[word]) {
      return directionSynonyms[word];
    }
  }
  // Try to find a movement verb + direction
  for (let i = 0; i < words.length; i++) {
    if (movementVerbs.includes(words[i])) {
      // Look for a direction after the verb
      for (let j = i + 1; j < words.length; j++) {
        if (directionSynonyms[words[j]]) {
          return directionSynonyms[words[j]];
        }
      }
    }
  }
  return null;
}
