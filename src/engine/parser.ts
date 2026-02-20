// Direction synonyms
const directionSynonyms: Record<string, string> = {
  n: 'north', north: 'north',
  s: 'south', south: 'south',
  e: 'east', east: 'east',
  w: 'west', west: 'west',
  u: 'up', up: 'up',
  d: 'down', down: 'down',
};

// ============ LOOK COMMAND ============
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

// ============ EXAMINE COMMAND ============
export const examineSynonyms = ['examine', 'study', 'inspect', 'investigate', 'ex', 'x'];

export function parseExamine(command: string): { type: 'examine', target: string } | null {
  const words = command.trim().toLowerCase().split(/\s+/);
  if (examineSynonyms.includes(words[0])) {
    if (words.length < 2) return null;
    // Join all words after the verb to get the full target name
    const target = words.slice(1).join(' ');
    return { type: 'examine', target };
  }
  return null;
}

// ============ GET/TAKE COMMAND ============
export const getSynonyms = ['get', 'take', 'grab', 'pick', 'pickup', 'pick up', 'acquire', 'obtain'];

export function parseGet(command: string): { type: 'get', target: string } | null {
  const words = command.trim().toLowerCase().split(/\s+/);
  if (getSynonyms.includes(words[0])) {
    if (words.length < 2) return null;
    // Handle "pick up" (two words)
    const startIdx = words[0] === 'pick' && words[1] === 'up' ? 2 : 1;
    const target = words.slice(startIdx).join(' ');
    return { type: 'get', target };
  }
  return null;
}

// ============ DROP COMMAND ============
export const dropSynonyms = ['drop', 'leave', 'put', 'set', 'place', 'throw'];

export function parseDrop(command: string): { type: 'drop', target: string } | null {
  const words = command.trim().toLowerCase().split(/\s+/);
  if (dropSynonyms.includes(words[0])) {
    if (words.length < 2) return null;
    let startIdx = 1;
    // Handle "down" as a filler word (e.g., "set down scroll" or "put down scroll")
    if (startIdx < words.length && words[startIdx] === 'down') {
      startIdx++;
    }
    const target = words.slice(startIdx).join(' ');
    return target ? { type: 'drop', target } : null;
  }
  return null;
}

// ============ OPEN/CLOSE COMMAND ============
export const openSynonyms = ['open'];
export const closeSynonyms = ['close', 'shut'];

export function parseOpen(command: string): { type: 'open', target: string } | null {
  const words = command.trim().toLowerCase().split(/\s+/);
  if (openSynonyms.includes(words[0])) {
    if (words.length < 2) return null;
    const target = words.slice(1).join(' ');
    return { type: 'open', target };
  }
  return null;
}

export function parseClose(command: string): { type: 'close', target: string } | null {
  const words = command.trim().toLowerCase().split(/\s+/);
  if (closeSynonyms.includes(words[0])) {
    if (words.length < 2) return null;
    const target = words.slice(1).join(' ');
    return { type: 'close', target };
  }
  return null;
}

// ============ MOVEMENT COMMAND ============
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
