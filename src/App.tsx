import styles from './App.module.css';

import { useState, useEffect } from 'react';
import GameWindow from './components/GameWindow';
import CommandInput from './components/CommandInput';
import Compass from './components/Compass';
import AsciiMap from './components/AsciiMap';
import PlayerStats from './components/PlayerStats';

import { rooms, testingGroundRooms } from './engine/rooms';
import type { Room, RoomExit } from './engine/rooms';
import { parseMovement, parseLook, parseExamine, parseGet, parseDrop, parseOpen, parseClose, parsePut, parseSave, parseLoad, parseClear, parseDebug, parseTurn, parsePush, parsePull, directionSynonyms } from './engine/parser';
import { createPlayer, getDescriptionTier, canAddToInventory } from './engine/player';
import type { Player } from './engine/player';
import { getItemsByIds, formatItemsInRoom } from './engine/items';
import { getNPCById, formatNPCsInRoom, findNPCByNameOrPrefix } from './engine/npcs';
import { saveSystem, type GameState } from './engine/save';

// Helper: fuzzy match item by name, alias, or prefix
const findItemByNameOrPrefix = (itemIds: string[], searchTerm: string) => {
  const items = getItemsByIds(itemIds);
  const lowered = searchTerm.toLowerCase();

  // Exact match on name or alias
  let item = items.find(i =>
    i.name.toLowerCase() === lowered ||
    i.aliases.some(a => a.toLowerCase() === lowered)
  );
  if (item) return item;

  // Prefix match on name
  item = items.find(i => i.name.toLowerCase().startsWith(lowered));
  if (item) return item;

  // Prefix match on any alias
  item = items.find(i => i.aliases.some(a => a.toLowerCase().startsWith(lowered)));
  if (item) return item;

  return null;
};

// Helper: find exit by direction, abbreviation, or alias (with partial matching)
const findExitByTarget = (exits: { [direction: string]: RoomExit }, target: string): [string, RoomExit] | null => {
  const loweredTarget = target.toLowerCase();
  
  // Try exact direction match
  if (exits[loweredTarget]) {
    return [loweredTarget, exits[loweredTarget]];
  }
  
  // Try direction abbreviation (n/s/e/w/u/d)
  const expandedDir = directionSynonyms[loweredTarget];
  if (expandedDir && exits[expandedDir]) {
    return [expandedDir, exits[expandedDir]];
  }
  
  // Try alias match (exact first, then partial)
  const userWords = loweredTarget.split(/\s+/);
  
  for (const [dir, exit] of Object.entries(exits)) {
    if (!exit.aliases) continue;
    
    for (const alias of exit.aliases) {
      const aliasLower = alias.toLowerCase();
      
      // Exact alias match
      if (aliasLower === loweredTarget) {
        return [dir, exit];
      }
      
      // Skip partial matching for single-letter inputs to avoid conflicts with direction abbreviations
      if (loweredTarget.length === 1) {
        continue;
      }
      
      // Partial alias match with word/partial-word support
      const aliasWords = aliasLower.split(/\s+/);
      
      // Check if user input matches a prefix of the alias
      let matches = true;
      for (let i = 0; i < userWords.length; i++) {
        if (i >= aliasWords.length) {
          // User input has more words than alias
          matches = false;
          break;
        }
        
        // For all words except the last, require exact match
        if (i < userWords.length - 1) {
          if (aliasWords[i] !== userWords[i]) {
            matches = false;
            break;
          }
        } else {
          // For the last word, allow partial match (prefix)
          if (!aliasWords[i].startsWith(userWords[i])) {
            matches = false;
            break;
          }
        }
      }
      
      if (matches && userWords.length > 0) {
        return [dir, exit];
      }
    }
  }
  
  return null;
};

// Helper: get a nice name for an exit (for messages)
const getExitName = (_direction: string, exit: RoomExit): string => {
  // If there's an alias that looks like a noun (window, gate, hatch), use it
  if (exit.aliases && exit.aliases.length > 0) {
    const nounAlias = exit.aliases.find(a => !directionSynonyms[a.toLowerCase()]);
    if (nounAlias) return nounAlias;
  }
  // Otherwise use "door" as default
  return 'door';
};

// Helper: find a room by ID in either main rooms or testing ground
const findRoomById = (roomId: string): Room | undefined => {
  return rooms.find(r => r.id === roomId) || testingGroundRooms.find(r => r.id === roomId);
};

// Helper: check if an exit should be visible based on puzzle state
const isExitVisible = (exit: RoomExit, roomId: string, puzzleState: Record<string, Record<string, boolean>>): boolean => {
  // If the exit doesn't require a puzzle to be solved, it's visible
  if (!exit.revealedBy) {
    return true;
  }
  
  // Check if the required puzzle is solved in this room
  const roomPuzzles = puzzleState[roomId] || {};
  return roomPuzzles[exit.revealedBy] === true;
};

// Helper: format exits with door state
const formatExits = (exits: { [direction: string]: RoomExit }, roomId: string, openDoors: Set<string>, puzzleState: Record<string, Record<string, boolean>>): string => {
  const visibleExits = Object.entries(exits)
    .filter(([_dir, exit]) => isExitVisible(exit, roomId, puzzleState))
    .map(([dir, exit]) => {
      const displayName = dir.charAt(0).toUpperCase() + dir.slice(1);
      if (exit.isDoor) {
        const stateKey = exit.doorId ? `door:${exit.doorId}` : `${roomId}-${dir}`;
        const isOpen = openDoors.has(stateKey);
        return `${displayName} (${isOpen ? 'Open' : 'Closed'})`;
      }
      return displayName;
    });
  
  if (visibleExits.length === 0) return 'No visible exits';
  return `Exits: ${visibleExits.join(', ')}`;
};

// Helper: format room description with all details
const formatRoomDescription = (room: Room, openDoors: Set<string>, puzzleState: Record<string, Record<string, boolean>>, npcState: Record<string, boolean>): string[] => {
  const descLines = room.description.split('\n');
  const itemsLine = formatItemsInRoom(room.items);
  const npcLine = room.npcs ? formatNPCsInRoom(room.npcs, npcState) : null;
  const exitDisplay = formatExits(room.exits, room.id, openDoors, puzzleState);
  
  return [
    ...descLines,
    ...(itemsLine ? [itemsLine] : []),
    ...(npcLine ? [npcLine] : []),
    exitDisplay
  ];
};

const App: React.FC = () => {
  // Start in the first room from the data
  const [currentRoom, setCurrentRoom] = useState<Room>(rooms[0]);
  const [player, setPlayer] = useState<Player>(createPlayer(rooms[0].id));
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [openDoors, setOpenDoors] = useState<Set<string>>(new Set());
  const [containerContents, setContainerContents] = useState<Record<string, string[]>>({
    // Initialize with base contents from items.ts
    'wooden_chest': ['copper_knife']
  });
  const [puzzleState, setPuzzleState] = useState<Record<string, Record<string, boolean>>>({});
  const [npcState, setNpcState] = useState<Record<string, boolean>>({});  // Track NPC visibility
  const [currentSaveSlot, setCurrentSaveSlot] = useState<1 | 2 | 3>(1);
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [output, setOutput] = useState<string[]>(() => {
    return formatRoomDescription(rooms[0], new Set(), {}, {});
  });
  const [theme, setTheme] = useState<'default' | 'amber' | 'green'>('default');
  // Compass state
  const [showCompass, setShowCompass] = useState(false);
  // ASCII map toggle state
  const [showMap, setShowMap] = useState(true);

  const handleCommand = (command: string) => {
    setOutput(prev => [...prev, `> ${command}`]);
    const cmd = command.trim().toLowerCase();

    // Look parser first, so 'look north' doesn't trigger movement
    const look = parseLook(cmd);
    if (look) {
      if (!look.target) {
        const outputLines = formatRoomDescription(currentRoom, openDoors, puzzleState, npcState);
        setOutput(prev => [...prev, ...outputLines]);
        return;
      }
      // look <sky> (always handle first)
      if (look.target === 'sky') {
        if (currentRoom.skyDescription) {
          setOutput(prev => [...prev, currentRoom.skyDescription ?? "You can't see the sky from here."]);
        } else {
          setOutput(prev => [...prev, "You can't see the sky from here."]);
        }
        return;
      }
      // look in <container> - show contents
      if (look.target.startsWith('in ')) {
        const containerName = look.target.slice(3);
        const container = findItemByNameOrPrefix(currentRoom.items, containerName);
        if (container && container.canOpen) {
          if (openItems.has(container.id)) {
            const contents = containerContents[container.id] || container.contents || [];
            if (contents.length === 0) {
              setOutput(prev => [...prev, `The ${container.name} is open but empty.`]);
            } else {
              const itemList = getItemsByIds(contents).map(i => i.name).join(', ');
              setOutput(prev => [...prev, `Inside the ${container.name}: ${itemList}`]);
            }
          } else {
            setOutput(prev => [...prev, `The ${container.name} is closed.`]);
          }
        } else {
          setOutput(prev => [...prev, "You don't see that here."]);
        }
        return;
      }
      // look <thing> (custom look descriptions) - check these first, including exit alias names
      // This allows lookDescriptions to shadow exits
      if (currentRoom.lookDescriptions) {
        // First try exact match on user input
        if (currentRoom.lookDescriptions[look.target]) {
          const desc = currentRoom.lookDescriptions[look.target];
          setOutput(prev => [...prev, desc ?? "You see nothing special."]);
          return;
        }
        
        // Then try exact match on exit aliases (before partial matching)
        let foundExactExitAlias = false;
        for (const [_dir, exit] of Object.entries(currentRoom.exits)) {
          if (exit.aliases) {
            for (const alias of exit.aliases) {
              if (alias.toLowerCase() === look.target) {
                foundExactExitAlias = true;
                // Exact alias match - check if there's a lookDescription for it
                if (currentRoom.lookDescriptions[alias]) {
                  const desc = currentRoom.lookDescriptions[alias];
                  setOutput(prev => [...prev, desc ?? "You see nothing special."]);
                  return;
                }
                // If no lookDescription for this exact alias, will handle as exit later
                break;
              }
            }
            if (foundExactExitAlias) break;
          }
        }
        
        // When user input partially matches an exit alias, check if the exit's individual words
        // appear in lookDescriptions. This allows 'look yellow' to find 'rune' from 'yellow rune door'
        // But skip this if we already found an exact exit alias match (those should show the exit, not word matches)
        if (!foundExactExitAlias) {
          for (const [_dir, exit] of Object.entries(currentRoom.exits)) {
            if (exit.aliases) {
              for (const alias of exit.aliases) {
                if (alias.toLowerCase().startsWith(look.target)) {
                  // Partial exit alias match - extract words and check lookDescriptions
                  const aliasWords = alias.toLowerCase().split(/\s+/);
                  for (const word of aliasWords) {
                    if (currentRoom.lookDescriptions[word]) {
                      const desc = currentRoom.lookDescriptions[word];
                      setOutput(prev => [...prev, desc ?? "You see nothing special."]);
                      return;
                    }
                  }
                }
              }
            }
          }
        }
        
        // Try partial match on lookDescription keys (user input is prefix of key)
        for (const [key, desc] of Object.entries(currentRoom.lookDescriptions)) {
          if (key.toLowerCase().startsWith(look.target)) {
            setOutput(prev => [...prev, desc ?? "You see nothing special."]);
            return;
          }
        }
        
        // Try partial match on exit alias names that have lookDescriptions
        for (const [_dir, exit] of Object.entries(currentRoom.exits)) {
          if (exit.aliases) {
            for (const alias of exit.aliases) {
              if (alias.toLowerCase().startsWith(look.target)) {
                if (currentRoom.lookDescriptions[alias]) {
                  const desc = currentRoom.lookDescriptions[alias];
                  setOutput(prev => [...prev, desc ?? "You see nothing special."]);
                  return;
                }
              }
            }
          }
        }
      }
      
      // Check for items in the room with custom descriptions
      const lookingAt = findItemByNameOrPrefix(currentRoom.items, look.target);
      if (lookingAt) {
        // Check if there's a custom item description in lookDescriptions
        if (currentRoom.lookDescriptions && currentRoom.lookDescriptions[look.target]) {
          const desc = currentRoom.lookDescriptions[look.target];
          setOutput(prev => [...prev, desc ?? "You see nothing special."]);
          // If it's an open container, also show contents
          if (lookingAt.canOpen && openItems.has(lookingAt.id)) {
            const contents = containerContents[lookingAt.id] || lookingAt.contents || [];
            if (contents.length > 0) {
              const itemList = getItemsByIds(contents).map(i => i.name).join(', ');
              setOutput(prev => [...prev, `Inside: ${itemList}`]);
            }
          }
          return;
        }
        // If looking at an open container without custom description, show contents
        if (lookingAt.canOpen && openItems.has(lookingAt.id)) {
          const desc = lookingAt.descriptions[0] || lookingAt.name;
          const contents = containerContents[lookingAt.id] || lookingAt.contents || [];
          if (contents.length === 0) {
            setOutput(prev => [...prev, `${desc} It's open but empty.`]);
          } else {
            const itemList = getItemsByIds(contents).map(i => i.name).join(', ');
            setOutput(prev => [...prev, `${desc} Inside: ${itemList}`]);
          }
          return;
        }
        // If we found an item but no custom description, show the item's base description
        const itemDesc = lookingAt.descriptions[0] || lookingAt.name;
        setOutput(prev => [...prev, itemDesc]);
        return;
      }

      // Check for NPCs in the room
      if (currentRoom.npcs && currentRoom.npcs.length > 0) {
        const npc = findNPCByNameOrPrefix(currentRoom.npcs, look.target, npcState);
        if (npc) {
          setOutput(prev => [...prev, npc.description]);
          return;
        }
      }

      // look <direction> or look <alias> - check if shadowed by lookDescription
      const dir = look.target;
      let exit = currentRoom.exits[dir];
      let matchedDirection = dir;
      
      // If not found by direction name, check if it's an alias
      if (!exit) {
        const found = findExitByTarget(currentRoom.exits, dir);
        if (found) {
          const [foundDirection, foundExit] = found;
          exit = foundExit;
          matchedDirection = foundDirection;
        }
      }
      
      if (exit) {
        // Check if exit is visible (puzzle might need to be solved)
        if (!isExitVisible(exit, currentRoom.id, puzzleState)) {
          setOutput(prev => [...prev, "You see nothing special."]);
          return;
        }
        
        // Check if there's a lookDescription that shadows this exit
        // Try exact match on target first, then try matching exit aliases
        let shadowedDescription = null;
        if (currentRoom.lookDescriptions) {
          // Try exact match on the user's input
          if (currentRoom.lookDescriptions[look.target]) {
            shadowedDescription = currentRoom.lookDescriptions[look.target];
          }
          // Try matching against exit aliases
          if (!shadowedDescription && exit.aliases) {
            for (const alias of exit.aliases) {
              if (currentRoom.lookDescriptions[alias]) {
                shadowedDescription = currentRoom.lookDescriptions[alias];
                break;
              }
            }
          }
        }
        
        // If shadowed by a custom look description, show that instead
        if (shadowedDescription) {
          setOutput(prev => [...prev, shadowedDescription]);
          return;
        }
        
        // Otherwise show the exit description
        // Check if it's a door and show appropriate description based on state
        if (exit.isDoor) {
          const stateKey = exit.doorId ? `door:${exit.doorId}` : `${currentRoom.id}-${matchedDirection}`;
          const isOpen = openDoors.has(stateKey);
          
          // Use state-specific descriptions if available, otherwise fall back to generic exitDescription
          let description = "You see nothing special that way.";
          if (isOpen && exit.exitDescriptionOpen) {
            description = exit.exitDescriptionOpen;
          } else if (!isOpen && exit.exitDescriptionClosed) {
            description = exit.exitDescriptionClosed;
          } else if (exit.exitDescription) {
            description = exit.exitDescription;
          }
          
          setOutput(prev => [...prev, description]);
          return;
        } else if (exit.exitDescription) {
          const desc = exit.exitDescription;
          setOutput(prev => [...prev, desc]);
          return;
        } else {
          setOutput(prev => [...prev, "You see nothing special that way."]);
          return;
        }
      }
      // fallback
      setOutput(prev => [...prev, "You see nothing special."]);
      return;
    }

    // Open/Close parser (check before movement so "open north" doesn't trigger movement)
    const open = parseOpen(cmd);
    if (open) {
      // Check for doors first (using direction, abbreviation, or alias)
      const exitMatch = findExitByTarget(currentRoom.exits, open.target);
      
      if (exitMatch) {
        const [dir, exit] = exitMatch;
        
        // Check if exit is visible (puzzle might need to be solved)
        if (!isExitVisible(exit, currentRoom.id, puzzleState)) {
          setOutput(prev => [...prev, "You don't see that here."]);
          return;
        }
        
        // Check if this exit is actually a door
        if (exit.isDoor !== true) {
          setOutput(prev => [...prev, "That's not something you can open."]);
          return;
        }
        
        // Use doorId if available, otherwise use roomId-exitName
        const stateKey = exit.doorId ? `door:${exit.doorId}` : `${currentRoom.id}-${dir}`;
        if (openDoors.has(stateKey)) {
          setOutput(prev => [...prev, "That's already open."]);
          return;
        }
        setOpenDoors(prev => new Set([...prev, stateKey]));
        const exitName = getExitName(dir, exit);
        setOutput(prev => [...prev, `You open the ${exitName}.`]);
        
        // Check for NPC triggers on door open
        if (exit.doorId) {
          // Check all NPCs in current room for onDoorOpened trigger
          if (currentRoom.npcs) {
            for (const npcId of currentRoom.npcs) {
              const npc = getNPCById(npcId);
              if (npc && npc.triggers?.onDoorOpened === exit.doorId) {
                // Make NPC invisible
                setNpcState(prev => ({ ...prev, [npcId]: false }));
                const message = npc.disappearMessage || `The ${npc.name} vanishes from sight.`;
                setOutput(prev => [...prev, '', message]);
              }
            }
          }
        }
        return;
      }

      // Check items in the room
      let roomItem = findItemByNameOrPrefix(currentRoom.items, open.target);

      if (roomItem) {
        if (!roomItem.canOpen) {
          setOutput(prev => [...prev, "Doesn't seem like that can be opened."]);
          return;
        }
        const isOpen = openItems.has(roomItem.id);
        if (isOpen) {
          setOutput(prev => [...prev, "That's already open."]);
          return;
        }
        // Mark item as open in state
        setOpenItems(prev => new Set([...prev, roomItem.id]));
        setOutput(prev => [...prev, `You open the ${roomItem.name}.`]);
        const contents = containerContents[roomItem.id] || roomItem.contents || [];
        if (contents.length > 0) {
          const items = getItemsByIds(contents);
          const itemNames = items.map(i => i.name).join(', ');
          setOutput(prev => [...prev, `Inside you find: ${itemNames}.`]);
        }
        return;
      }

      // Check inventory
      let invItem = findItemByNameOrPrefix(player.inventory, open.target);

      if (invItem) {
        if (!invItem.canOpen) {
          setOutput(prev => [...prev, "Doesn't seem like that can be opened."]);
          return;
        }
        const isOpen = openItems.has(invItem.id);
        if (isOpen) {
          setOutput(prev => [...prev, "That's already open."]);
          return;
        }
        // Mark item as open in state
        setOpenItems(prev => new Set([...prev, invItem.id]));
        setOutput(prev => [...prev, `You open the ${invItem.name}.`]);
        const contents = containerContents[invItem.id] || invItem.contents || [];
        if (contents.length > 0) {
          const items = getItemsByIds(contents);
          const itemNames = items.map(i => i.name).join(', ');
          setOutput(prev => [...prev, `Inside you find: ${itemNames}.`]);
        }
        return;
      }

      setOutput(prev => [...prev, "You don't see that here."]);
      return;
    }

    const close = parseClose(cmd);
    if (close) {
      // Check for doors first (using direction, abbreviation, or alias)
      const exitMatch = findExitByTarget(currentRoom.exits, close.target);
      
      if (exitMatch) {
        const [dir, exit] = exitMatch;
        
        // Check if exit is visible (puzzle might need to be solved)
        if (!isExitVisible(exit, currentRoom.id, puzzleState)) {
          setOutput(prev => [...prev, "You don't see that here."]);
          return;
        }
        
        // Check if this exit is actually a door
        if (exit.isDoor !== true) {
          setOutput(prev => [...prev, "That's not something you can close."]);
          return;
        }
        
        // Use doorId if available, otherwise use roomId-exitName
        const stateKey = exit.doorId ? `door:${exit.doorId}` : `${currentRoom.id}-${dir}`;
        if (!openDoors.has(stateKey)) {
          setOutput(prev => [...prev, "That's not open."]);
          return;
        }
        setOpenDoors(prev => {
          const updated = new Set(prev);
          updated.delete(stateKey);
          return updated;
        });
        const exitName = getExitName(dir, exit);
        setOutput(prev => [...prev, `You close the ${exitName}.`]);
        
        // Check for NPC triggers on door close
        if (exit.doorId) {
          // Check all NPCs in current room for onDoorClosed trigger
          if (currentRoom.npcs) {
            for (const npcId of currentRoom.npcs) {
              const npc = getNPCById(npcId);
              if (npc && npc.triggers?.onDoorClosed === exit.doorId) {
                // Make NPC visible
                setNpcState(prev => ({ ...prev, [npcId]: true }));
                const message = npc.appearMessage || npc.description;
                setOutput(prev => [...prev, '', message]);
              }
            }
          }
        }
        return;
      }

      // Check room items
      let roomItem = findItemByNameOrPrefix(currentRoom.items, close.target);

      if (roomItem && openItems.has(roomItem.id)) {
        setOpenItems(prev => {
          const updated = new Set(prev);
          updated.delete(roomItem.id);
          return updated;
        });
        setOutput(prev => [...prev, `You close the ${roomItem.name}.`]);
        return;
      }

      // Check inventory items
      let invItem = findItemByNameOrPrefix(player.inventory, close.target);

      if (invItem && openItems.has(invItem.id)) {
        setOpenItems(prev => {
          const updated = new Set(prev);
          updated.delete(invItem.id);
          return updated;
        });
        setOutput(prev => [...prev, `You close the ${invItem.name}.`]);
        return;
      }

      setOutput(prev => [...prev, "That doesn't appear to be open."]);
      return;
    }

    // Movement parser - check cardinal directions or arbitrary exit names
    const dir = parseMovement(cmd);
    let exit = dir ? currentRoom.exits[dir] : null;
    let matchedDirection = dir || '';
    
    // If parseMovement detected a direction but no exit exists, don't fall through to alias matching
    if (dir && !exit) {
      setOutput(prev => [...prev, "You can't go that way."]);
      return;
    }
    
    // If not found via parseMovement, check if any word in the command matches an exit name directly or via alias
    if (!exit) {
      const words = cmd.trim().toLowerCase().split(/\s+/);
      for (const word of words) {
        // Try direct exit name match first
        if (currentRoom.exits[word]) {
          exit = currentRoom.exits[word];
          matchedDirection = word;
          break;
        }
        // Try alias match
        const found = findExitByTarget(currentRoom.exits, word);
        if (found) {
          const [foundDirection, foundExit] = found;
          exit = foundExit;
          matchedDirection = foundDirection;
          break;
        }
      }
    }
    
    if (exit) {
      // Check if this exit is visible (puzzle might need to be solved)
      if (!isExitVisible(exit, currentRoom.id, puzzleState)) {
        setOutput(prev => [...prev, "You can't go that way."]);
        return;
      }
      
      // Check if this exit is a closed door
      if (exit.isDoor === true) {
        const stateKey = exit.doorId ? `door:${exit.doorId}` : `${currentRoom.id}-${matchedDirection}`;
        if (!openDoors.has(stateKey)) {
          const exitName = getExitName(matchedDirection, exit);
          setOutput(prev => [...prev, `The ${exitName} is closed.`]);
          return;
        }
      }
      
      const nextRoom = findRoomById(exit.to);
      if (nextRoom) {
        setCurrentRoom(nextRoom);
        setPlayer(prev => ({ ...prev, location: nextRoom.id }));
        
        // Check if this room is a death trap
        if (nextRoom.isDeathTrap) {
          const deathMsg = nextRoom.deathMessage || "You have died.";
          setOutput(prev => [...prev, nextRoom.description, '', deathMsg, '', "Type 'load' to restore a saved game."]);
          return;
        }
        
        const outputLines = formatRoomDescription(nextRoom, openDoors, puzzleState, npcState);
        setOutput(prev => [...prev, ...outputLines]);
      } else {
        setOutput(prev => [...prev, "You can't go that way."]);
      }
      return;
    }

    // Examine parser
    const examine = parseExamine(cmd);
    if (examine) {
      const tier = getDescriptionTier(player);
      
      // Check items in the room first
      let item = findItemByNameOrPrefix(currentRoom.items, examine.target);

      if (item) {
        const desc = item.descriptions[Math.min(tier, item.descriptions.length - 1)];
        
        // Calculate if skill will increase  (before updating state)
        const newSkillLevel = Math.min(5, player.skills.examine + 1);
        const skillIncreased = newSkillLevel > player.skills.examine;
        
        // Build complete output message
        const outputLines = [desc];
        
        // Show contents if this is an open container
        if (item.canOpen && openItems.has(item.id)) {
          const contents = containerContents[item.id] || item.contents || [];
          if (contents.length > 0) {
            const contentItems = getItemsByIds(contents);
            const itemNames = contentItems.map(i => i.name).join(', ');
            outputLines.push(`Inside: ${itemNames}`);
          }
        }
        
        if (skillIncreased) {
          outputLines.push(`[Your examine skill has improved to level ${newSkillLevel}!]`);
        }
        
        // Update output and player state
        setOutput(prev => [...prev, ...outputLines]);
        setPlayer(prev => ({
          ...prev,
          skills: {
            ...prev.skills,
            examine: Math.min(5, prev.skills.examine + 1)
          }
        }));
        return;
      }

      // Check inventory
      item = findItemByNameOrPrefix(player.inventory, examine.target);

      if (item) {
        const desc = item.descriptions[Math.min(tier, item.descriptions.length - 1)];
        
        // Calculate if skill will increase (before updating state)
        const newSkillLevel = Math.min(5, player.skills.examine + 1);
        const skillIncreased = newSkillLevel > player.skills.examine;
        
        // Build complete output message
        const outputLines = [desc];
        
        // Show contents if this is an open container
        if (item.canOpen && openItems.has(item.id)) {
          const contents = containerContents[item.id] || item.contents || [];
          if (contents.length > 0) {
            const contentItems = getItemsByIds(contents);
            const itemNames = contentItems.map(i => i.name).join(', ');
            outputLines.push(`Inside: ${itemNames}`);
          }
        }
        
        if (skillIncreased) {
          outputLines.push(`[Your examine skill has improved to level ${newSkillLevel}!]`);
        }
        
        // Update output and player state
        setOutput(prev => [...prev, ...outputLines]);
        setPlayer(prev => ({
          ...prev,
          skills: {
            ...prev.skills,
            examine: Math.min(5, prev.skills.examine + 1)
          }
        }));
        return;
      }

      // Check for NPCs in the room
      if (currentRoom.npcs && currentRoom.npcs.length > 0) {
        const npc = findNPCByNameOrPrefix(currentRoom.npcs, examine.target, npcState);
        if (npc) {
          setOutput(prev => [...prev, npc.description]);
          return;
        }
      }

      setOutput(prev => [...prev, "You don't see that here."]);
      return;
    }

    // Get/Take parser
    const get = parseGet(cmd);
    if (get) {
      // First try room items directly
      let item = findItemByNameOrPrefix(currentRoom.items, get.target);
      let fromContainer: typeof item | null = null;

      // If not found, search open containers in the room
      if (!item) {
        const roomItems = getItemsByIds(currentRoom.items);
        for (const roomItem of roomItems) {
          if (roomItem.canOpen && openItems.has(roomItem.id)) {
            const contents = containerContents[roomItem.id] || roomItem.contents || [];
            const containerItem = findItemByNameOrPrefix(contents, get.target);
            if (containerItem) {
              item = containerItem;
              fromContainer = roomItem;
              break;
            }
          }
        }
      }

      if (!item) {
        setOutput(prev => [...prev, "You can't get that."]);
        return;
      }

      if (!item.canTake) {
        setOutput(prev => [...prev, "Doesn't seem like you can take that."]);
        return;
      }

      if (!canAddToInventory(player)) {
        setOutput(prev => [...prev, "Your inventory is full."]);
        return;
      }

      // Remove from room or container, add to inventory
      if (fromContainer) {
        // Taking from open container
        setContainerContents(prev => ({
          ...prev,
          [fromContainer.id]: (prev[fromContainer.id] || fromContainer.contents || []).filter(id => id !== item.id)
        }));
        setPlayer(prev => ({
          ...prev,
          inventory: [...prev.inventory, item.id]
        }));
        setOutput(prev => [...prev, `You take the ${item.name} from the ${fromContainer.name}.`]);
      } else {
        // Taking from room directly
        setCurrentRoom(prev => ({
          ...prev,
          items: prev.items.filter(id => id !== item.id)
        }));
        setPlayer(prev => ({
          ...prev,
          inventory: [...prev.inventory, item.id]
        }));
        setOutput(prev => [...prev, `You take the ${item.name}.`]);
      }
      return;
    }

    // Drop parser
    const drop = parseDrop(cmd);
    if (drop) {
      const item = findItemByNameOrPrefix(player.inventory, drop.target);

      if (!item) {
        setOutput(prev => [...prev, "You don't have that."]);
        return;
      }

      // Remove from inventory, add to room
      setPlayer(prev => ({
        ...prev,
        inventory: prev.inventory.filter(id => id !== item.id)
      }));
      setCurrentRoom(prev => ({
        ...prev,
        items: [...prev.items, item.id]
      }));
      setOutput(prev => [...prev, `You drop the ${item.name}.`]);
      return;
    }

    // Put in container parser
    const put = parsePut(cmd);
    if (put) {
      // Find item in inventory
      const item = findItemByNameOrPrefix(player.inventory, put.item);
      if (!item) {
        setOutput(prev => [...prev, "You don't have that."]);
        return;
      }

      // Can't put containers in containers
      if (item.canOpen) {
        setOutput(prev => [...prev, "You can't put containers in containers."]);
        return;
      }

      // Find container in room
      let container = findItemByNameOrPrefix(currentRoom.items, put.container);
      if (!container) {
        setOutput(prev => [...prev, "That container isn't here."]);
        return;
      }

      // Check if it's a valid container
      if (!container.canOpen) {
        setOutput(prev => [...prev, "That's not a container."]);
        return;
      }

      // Check if container is open
      if (!openItems.has(container.id)) {
        setOutput(prev => [...prev, "That container is closed."]);
        return;
      }

      // Remove from inventory, add to container
      setPlayer(prev => ({
        ...prev,
        inventory: prev.inventory.filter(id => id !== item.id)
      }));
      setContainerContents(prev => ({
        ...prev,
        [container.id]: [...(prev[container.id] || container.contents || []), item.id]
      }));
      setOutput(prev => [...prev, `You put the ${item.name} in the ${container.name}.`]);
      return;
    }

    // Turn parser
    const turn = parseTurn(cmd);
    if (turn) {
      // Find item in room first, then inventory
      let item = findItemByNameOrPrefix(currentRoom.items, turn.target);
      if (!item) {
        item = findItemByNameOrPrefix(player.inventory, turn.target);
      }

      if (!item) {
        setOutput(prev => [...prev, "You don't see that here."]);
        return;
      }

      if (!item.turnEffect) {
        setOutput(prev => [...prev, "You can't turn that."]);
        return;
      }

      // Check if puzzle is already solved
      const puzzleId = item.turnEffect.puzzleId;
      const alreadySolved = puzzleId && puzzleState[currentRoom.id]?.[puzzleId];

      if (alreadySolved) {
        setOutput(prev => [...prev, "They refuse to budge further. The mechanism has already been activated."]);
        return;
      }

      // Display the activity description
      const outputLines = [item.turnDescription || `You turn the ${item.name}.`];

      // Update puzzle state if this effect has a puzzleId
      if (puzzleId) {
        setPuzzleState(prev => ({
          ...prev,
          [currentRoom.id]: {
            ...(prev[currentRoom.id] || {}),
            [puzzleId]: true
          }
        }));
      }

      // Display the effect message
      if (item.turnEffect.message) {
        outputLines.push(item.turnEffect.message);
      }

      setOutput(prev => [...prev, ...outputLines]);
      return;
    }

    // Push parser
    const push = parsePush(cmd);
    if (push) {
      // Find item in room first, then inventory
      let item = findItemByNameOrPrefix(currentRoom.items, push.target);
      if (!item) {
        item = findItemByNameOrPrefix(player.inventory, push.target);
      }

      if (!item) {
        setOutput(prev => [...prev, "You don't see that here."]);
        return;
      }

      if (!item.pushEffect) {
        setOutput(prev => [...prev, "You can't push that."]);
        return;
      }

      // Check if puzzle is already solved
      const pushPuzzleId = item.pushEffect.puzzleId;
      const pushAlreadySolved = pushPuzzleId && puzzleState[currentRoom.id]?.[pushPuzzleId];

      if (pushAlreadySolved) {
        setOutput(prev => [...prev, "It won't budge. It's as if it's stuck in place."]);
        return;
      }

      // Display the activity description
      const outputLines = [item.pushDescription || `You push the ${item.name}.`];

      // Update puzzle state if this effect has a puzzleId
      if (pushPuzzleId) {
        setPuzzleState(prev => ({
          ...prev,
          [currentRoom.id]: {
            ...(prev[currentRoom.id] || {}),
            [pushPuzzleId]: true
          }
        }));
      }

      // Display the effect message
      if (item.pushEffect.message) {
        outputLines.push(item.pushEffect.message);
      }

      setOutput(prev => [...prev, ...outputLines]);
      return;
    }

    // Pull parser
    const pull = parsePull(cmd);
    if (pull) {
      // Find item in room first, then inventory
      let item = findItemByNameOrPrefix(currentRoom.items, pull.target);
      if (!item) {
        item = findItemByNameOrPrefix(player.inventory, pull.target);
      }

      if (!item) {
        setOutput(prev => [...prev, "You don't see that here."]);
        return;
      }

      if (!item.pullEffect) {
        setOutput(prev => [...prev, "You can't pull that."]);
        return;
      }

      // Check if puzzle is already solved
      const pullPuzzleId = item.pullEffect.puzzleId;
      const pullAlreadySolved = pullPuzzleId && puzzleState[currentRoom.id]?.[pullPuzzleId];

      if (pullAlreadySolved) {
        setOutput(prev => [...prev, "You've already activated this. It won't respond."]);
        return;
      }

      // Display the activity description
      const outputLines = [item.pullDescription || `You pull the ${item.name}.`];

      // Update puzzle state if this effect has a puzzleId
      if (pullPuzzleId) {
        setPuzzleState(prev => ({
          ...prev,
          [currentRoom.id]: {
            ...(prev[currentRoom.id] || {}),
            [pullPuzzleId]: true
          }
        }));
      }

      // Display the effect message
      if (item.pullEffect.message) {
        outputLines.push(item.pullEffect.message);
      }

      setOutput(prev => [...prev, ...outputLines]);
      return;
    }

    // Inventory command
    if (cmd === 'i' || cmd === 'inventory') {
      if (player.inventory.length === 0) {
        setOutput(prev => [...prev, "Your inventory is empty."]);
        return;
      }
      const items = getItemsByIds(player.inventory);
      const itemList = items.map(i => i.name).join(', ');
      setOutput(prev => [...prev, `Inventory (${player.inventory.length}/${player.maxInventory}): ${itemList}`]);
      return;
    }

    // Save game parser
    const save = parseSave(cmd);
    if (save) {
      const targetSlot = save.slotNumber || currentSaveSlot;
      const gameState: GameState = {
        currentRoomId: currentRoom.id,
        player,
        openItems: Array.from(openItems),
        openDoors: Array.from(openDoors),
        containerContents,
        puzzleState,
        npcState,
      };
      saveSystem.saveToSlot(targetSlot, gameState);
      setCurrentSaveSlot(targetSlot);
      const roomName = saveSystem.getRoomNameFromId(currentRoom.id);
      setOutput(prev => [...prev, `Game saved to Slot ${targetSlot} (${roomName}).`]);
      return;
    }

    // Load game parser
    const load = parseLoad(cmd);
    if (load) {
      if (load.slotNumber) {
        // Direct load: "load 1" or "load slot 1"
        const state = saveSystem.loadFromSlot(load.slotNumber);
        if (!state) {
          setOutput(prev => [...prev, `Slot ${load.slotNumber} is empty.`]);
          return;
        }
        // Restore state
        const targetRoom = findRoomById(state.currentRoomId);
        if (targetRoom) {
          const loadedPuzzleState = state.puzzleState || {};
          const loadedNpcState = state.npcState || {};
          const loadedOpenDoors = new Set(state.openDoors);
          setCurrentRoom(targetRoom);
          setPlayer(state.player);
          setOpenItems(new Set(state.openItems));
          setOpenDoors(loadedOpenDoors);
          setContainerContents(state.containerContents);
          setPuzzleState(loadedPuzzleState);
          setNpcState(loadedNpcState);
          setCurrentSaveSlot(load.slotNumber);
          
          const roomLines = formatRoomDescription(targetRoom, loadedOpenDoors, loadedPuzzleState, loadedNpcState);
          setOutput(prev => [...prev, `Game loaded from Slot ${load.slotNumber}.`, ...roomLines]);
        }
      } else {
        // Show load menu
        setShowLoadMenu(true);
      }
      return;
    }

    // Clear save slot parser
    const clear = parseClear(cmd);
    if (clear) {
      const targetSlot = clear.slotNumber || currentSaveSlot;
      saveSystem.deleteSlot(targetSlot);
      setOutput(prev => [...prev, `Slot ${targetSlot} has been cleared.`]);
      return;
    }

    // Debug commands (development only)
    const debug = parseDebug(cmd);
    if (debug) {
      switch (debug.subcommand) {
        case 'teleport': {
          if (testingGroundRooms.length > 0) {
            const testRoom = testingGroundRooms[0];
            setCurrentRoom(testRoom);
            const roomLines = formatRoomDescription(testRoom, openDoors, puzzleState, npcState);
            setOutput(prev => [...prev, `[DEBUG] Teleported to ${testRoom.name}`, ...roomLines]);
          } else {
            setOutput(prev => [...prev, '[DEBUG] Testing ground not available.']);
          }
          break;
        }
        default:
          setOutput(prev => [...prev, `[DEBUG] Unknown debug command: ${debug.subcommand}`]);
      }
      return;
    }

    if (cmd.length > 0) {
      setOutput(prev => [...prev, "Well, that just doesn't make sense. Sorry."]);
    }
  };

  // Set theme class on root
  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    root.classList.remove('themeAmber', 'themeGreen');
    if (theme === 'amber') root.classList.add('themeAmber');
    if (theme === 'green') root.classList.add('themeGreen');
  }, [theme]);

  return (
    <div className={styles.gameContainer}>
      {/* Load Menu Modal */}
      {showLoadMenu && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Load Game</h2>
            <div className={styles.saveSlots}>
              {saveSystem.getAllSlots().map(slot => (
                <div key={slot.slotNumber} className={styles.slotRow}>
                  <button
                    className={styles.saveSlotButton}
                    onClick={() => {
                      const state = saveSystem.loadFromSlot(slot.slotNumber);
                      if (state) {
                        // Load existing save
                        const targetRoom = findRoomById(state.currentRoomId);
                        if (targetRoom) {
                          const loadedPuzzleState = state.puzzleState || {};
                          const loadedNpcState = state.npcState || {};
                          const loadedOpenDoors = new Set(state.openDoors);
                          setCurrentRoom(targetRoom);
                          setPlayer(state.player);
                          setOpenItems(new Set(state.openItems));
                          setOpenDoors(loadedOpenDoors);
                          setContainerContents(state.containerContents);
                          setPuzzleState(loadedPuzzleState);
                          setNpcState(loadedNpcState);
                          setCurrentSaveSlot(slot.slotNumber);
                          
                          const roomLines = formatRoomDescription(targetRoom, loadedOpenDoors, loadedPuzzleState, loadedNpcState);
                          setOutput(prev => [...prev, `Game loaded from Slot ${slot.slotNumber}.`, ...roomLines]);
                          setShowLoadMenu(false);
                        }
                      } else {
                        // Empty slot - start new game
                        const startRoom = rooms[0];
                        const newPlayer = createPlayer(startRoom.id);
                        setCurrentRoom(startRoom);
                        setPlayer(newPlayer);
                        setOpenItems(new Set());
                        setOpenDoors(new Set());
                        setContainerContents({ 'wooden_chest': ['copper_knife'] });
                        setPuzzleState({});
                        setNpcState({});
                        setCurrentSaveSlot(slot.slotNumber);
                        const roomLines = formatRoomDescription(startRoom, new Set(), {}, {});
                        setOutput(prev => [...prev, `New game started in Slot ${slot.slotNumber}.`, ...roomLines]);
                        setShowLoadMenu(false);
                      }
                    }}
                  >
                    {saveSystem.formatSlotDisplay(slot)}
                  </button>
                  <button
                    className={styles.deleteSlotButton}
                    onClick={() => {
                      saveSystem.deleteSlot(slot.slotNumber);
                      setShowLoadMenu(false);
                      setOutput(prev => [...prev, `Slot ${slot.slotNumber} has been cleared.`]);
                    }}
                    title="Delete this save"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
            <button
              className={styles.themeButton}
              onClick={() => setShowLoadMenu(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Theme Switcher */}
      <div className={styles.themeSwitcher}>
        <button
          className={`${styles.themeButton} ${theme === 'default' ? styles.selected : ''}`}
          onClick={() => setTheme('default')}
        >
          Retro Dark
        </button>
        <button
          className={`${styles.themeButton} ${theme === 'amber' ? styles.selected : ''}`}
          onClick={() => setTheme('amber')}
        >
          Amber Terminal
        </button>
        <button
          className={`${styles.themeButton} ${theme === 'green' ? styles.selected : ''}`}
          onClick={() => setTheme('green')}
        >
          Apple II Green
        </button>
        
        {/* Save/Load Buttons */}
        <div className={styles.saveLoadButtons}>
          <button
            className={`${styles.themeButton} ${styles.saveLoadButton}`}
            onClick={() => {
              const gameState: GameState = {
                currentRoomId: currentRoom.id,
                player,
                openItems: Array.from(openItems),
                openDoors: Array.from(openDoors),
                containerContents,
                puzzleState,
                npcState,
              };
              saveSystem.saveToSlot(currentSaveSlot, gameState);
              const roomName = saveSystem.getRoomNameFromId(currentRoom.id);
              setOutput(prev => [...prev, `Game saved to Slot ${currentSaveSlot} (${roomName}).`]);
            }}
            title={`Save to Slot ${currentSaveSlot}`}
          >
            Save
          </button>
          <button
            className={`${styles.themeButton} ${styles.saveLoadButton}`}
            onClick={() => setShowLoadMenu(true)}
            title="Load a saved game"
          >
            Load
          </button>
        </div>
      </div>

      {/* App Title */}
      <h1 className={styles.appTitle}>TextQuest</h1>

      {/* Game Window and Command Input */}
      <div className={styles.gameLayoutRow}>
        <div className={styles.gameMainColumn}>
          <GameWindow output={output} />
          <CommandInput onCommand={handleCommand} />
        </div>
        {/* Mini map and compass docked right, stacked if both visible */}
        <div className={styles.gameSidebarDock}>
          {showMap && (
            <AsciiMap
              rooms={[...rooms, ...testingGroundRooms]}
              currentRoomId={currentRoom.id}
              openDoors={openDoors}
              puzzleState={puzzleState}
              size={3}
              theme={theme}
            />
          )}
          {showCompass && (
            <div className={showMap ? `${styles.compassSlot} ${styles.compassSlotWithMap}` : styles.compassSlot}>
              <Compass exits={Object.keys(currentRoom.exits)} />
            </div>
          )}
          <PlayerStats player={player} />
        </div>
      </div>
      
      {/* Player Options Bar */}
      <div className={styles.playerOptionsBar}>
        <button
          className={`${styles.themeButton} ${styles.themeButtonWide} ${showCompass ? styles.selected : ''}`}
          onClick={() => setShowCompass(v => !v)}
          aria-pressed={showCompass}
        >
          {showCompass ? 'Hide Compass' : 'Show Compass'}
        </button>
        <button
          className={`${styles.themeButton} ${styles.themeButtonWide} ${showMap ? styles.selected : ''}`}
          onClick={() => setShowMap(v => !v)}
          aria-pressed={showMap}
        >
          {showMap ? 'Hide Map' : 'Show Map'}
        </button>
        {/* Add more player config buttons here in the future */}
      </div>
    </div>
  );
}

export default App;
