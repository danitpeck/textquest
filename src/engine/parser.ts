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
    // look in <container> syntax
    if (words[1] === 'in') {
      const containerName = words.slice(2).join(' ');
      return containerName ? { type: 'look', target: `in ${containerName}` } : { type: 'look' };
    }
    // look <direction>
    const dir = directionSynonyms[words[1]] || words[1];
    return { type: 'look', target: dir };
  }
  return null;
}

// ============ EXAMINE COMMAND ============
export const examineSynonyms = ['examine', 'study', 'inspect', 'investigate', 'ex', 'exa', 'exam', 'exami'];

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
    let startIdx = words[0] === 'pick' && words[1] === 'up' ? 2 : 1;
    
    // Check for "from container" syntax and extract just the item part
    const fromIndex = words.findIndex((w, i) => i >= startIdx && (w === 'from' || w === 'out of'));
    let target = '';
    if (fromIndex !== -1) {
      // "get knife from chest" → target = "knife"
      target = words.slice(startIdx, fromIndex).join(' ');
    } else {
      // Regular "get knife" → target = "knife"
      target = words.slice(startIdx).join(' ');
    }
    return target ? { type: 'get', target } : null;
  }
  return null;
}

// ============ DROP COMMAND ============
export const dropSynonyms = ['drop', 'leave', 'set', 'place', 'throw'];

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

// ============ PUT/PLACE IN CONTAINER COMMAND ============
export const putSynonyms = ['put', 'place', 'set', 'stow', 'store'];

export function parsePut(command: string): { type: 'put', item: string, container: string } | null {
  const words = command.trim().toLowerCase().split(/\s+/);
  if (putSynonyms.includes(words[0])) {
    if (words.length < 2) return null;
    
    // Find 'in' or 'inside' in the command
    const inIndex = words.findIndex(w => w === 'in' || w === 'inside');
    if (inIndex === -1 || inIndex === 0) return null;
    
    const item = words.slice(1, inIndex).join(' ');
    const container = words.slice(inIndex + 1).join(' ');
    
    return item && container ? { type: 'put', item, container } : null;
  }
  return null;
}


// ============ SAVE/LOAD COMMANDS ============
export function parseSave(command: string): { type: 'save'; slotNumber?: 1 | 2 | 3 } | null {
  const words = command.trim().toLowerCase().split(/\s+/);
  if (words[0] === 'save' || (words[0] === 'save' && words[1] === 'game')) {
    const slotStr = words[words.length - 1];
    const slotNum = parseInt(slotStr, 10);
    if (slotNum >= 1 && slotNum <= 3) {
      return { type: 'save', slotNumber: slotNum as 1 | 2 | 3 };
    }
    return { type: 'save' };
  }
  return null;
}

export function parseLoad(command: string): { type: 'load'; slotNumber?: 1 | 2 | 3 } | null {
  const words = command.trim().toLowerCase().split(/\s+/);
  if (words[0] === 'load' || (words[0] === 'load' && words[1] === 'game')) {
    const slotStr = words[words.length - 1];
    const slotNum = parseInt(slotStr, 10);
    if (slotNum >= 1 && slotNum <= 3) {
      return { type: 'load', slotNumber: slotNum as 1 | 2 | 3 };
    }
    return { type: 'load' };
  }
  return null;
}

// ============ CLEAR COMMAND ============
export function parseClear(command: string): { type: 'clear'; slotNumber?: 1 | 2 | 3 } | null {
  const words = command.trim().toLowerCase().split(/\s+/);
  if (words[0] === 'clear') {
    // "clear slot 1", "clear 1", or just "clear" for current slot
    const lastWord = words[words.length - 1];
    const slotNum = parseInt(lastWord, 10);
    if (slotNum >= 1 && slotNum <= 3) {
      return { type: 'clear', slotNumber: slotNum as 1 | 2 | 3 };
    }
    return { type: 'clear' };
  }
  return null;
}

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
