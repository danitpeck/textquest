import styles from './App.module.css';

import { useState, useEffect } from 'react';
import GameWindow from './components/GameWindow';
import CommandInput from './components/CommandInput';
import Compass from './components/Compass';
import AsciiMap from './components/AsciiMap';
import PlayerStats from './components/PlayerStats';

import { rooms } from './engine/rooms';
import type { Room } from './engine/rooms';
import { parseMovement, parseLook, parseExamine, parseGet, parseDrop, parseOpen, parseClose } from './engine/parser';
import { createPlayer, getDescriptionTier, canAddToInventory } from './engine/player';
import type { Player } from './engine/player';
import { getItemsByIds, formatItemsInRoom } from './engine/items';

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

const App: React.FC = () => {
  // Start in the first room from the data
  const [currentRoom, setCurrentRoom] = useState<Room>(rooms[0]);
  const [player, setPlayer] = useState<Player>(createPlayer(rooms[0].id));
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [openDoors, setOpenDoors] = useState<Set<string>>(new Set());
  const [output, setOutput] = useState<string[]>(() => {
    const lines = [currentRoom.description];
    const itemsLine = formatItemsInRoom(currentRoom.items);
    if (itemsLine) lines.push(itemsLine);
    const exitList = Object.entries(currentRoom.exits)
      .map(([dir]) => dir.charAt(0).toUpperCase() + dir.slice(1))
      .join(', ');
    lines.push(exitList ? `(Exits: ${exitList})` : '(No visible exits)');
    return lines;
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
        const outputLines = [currentRoom.description];
        const itemsLine = formatItemsInRoom(currentRoom.items);
        if (itemsLine) outputLines.push(itemsLine);
        const exitList = Object.entries(currentRoom.exits)
          .map(([dir]) => dir.charAt(0).toUpperCase() + dir.slice(1))
          .join(', ');
        outputLines.push(exitList ? `(Exits: ${exitList})` : '(No visible exits)');
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
      // look <thing> (custom look descriptions)
      if (currentRoom.lookDescriptions && currentRoom.lookDescriptions[look.target]) {
        const desc = currentRoom.lookDescriptions[look.target];
        setOutput(prev => [...prev, desc ?? "You see nothing special."]);
        return;
      }
      // look <direction>
      const dir = look.target;
      const exit = currentRoom.exits[dir];
      if (exit && exit.exitDescription) {
        setOutput(prev => [...prev, exit.exitDescription ?? "You see nothing special that way."]);
        return;
      } else if (exit) {
        setOutput(prev => [...prev, "You see nothing special that way."]);
        return;
      }
      // fallback
      setOutput(prev => [...prev, "You see nothing special."]);
      return;
    }

    // Open/Close parser (check before movement so "open north" doesn't trigger movement)
    const open = parseOpen(cmd);
    if (open) {
      // Check for doors first
      const doorMatch = Object.entries(currentRoom.exits).find(([dir, exit]) => {
        const isDoor = exit.isDoor === true;
        const dirName = dir.toLowerCase();
        return isDoor && (dirName === open.target || open.target === 'door' || open.target === `${open.target} door`);
      });

      if (doorMatch) {
        const [dir, exit] = doorMatch;
        // Use doorId if available, otherwise use roomId-exitName
        const stateKey = exit.doorId ? `door:${exit.doorId}` : `${currentRoom.id}-${dir}`;
        if (openDoors.has(stateKey)) {
          setOutput(prev => [...prev, "That's already open."]);
          return;
        }
        setOpenDoors(prev => new Set([...prev, stateKey]));
        setOutput(prev => [...prev, `You open the door.`]);
        return;
      }

      // Check if they're trying to open a direction without it being marked as a door
      if (Object.keys(currentRoom.exits).includes(open.target)) {
        setOutput(prev => [...prev, "That's not something you can open."]);
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
        if (roomItem.contents && roomItem.contents.length > 0) {
          const items = getItemsByIds(roomItem.contents);
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
        if (invItem.contents && invItem.contents.length > 0) {
          const items = getItemsByIds(invItem.contents);
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
      // Check for doors first
      const doorMatch = Object.entries(currentRoom.exits).find(([dir, exit]) => {
        const isDoor = exit.isDoor === true;
        const dirName = dir.toLowerCase();
        return isDoor && (dirName === close.target || close.target === 'door' || close.target === `${close.target} door`);
      });

      if (doorMatch) {
        const [dir, exit] = doorMatch;
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
        setOutput(prev => [...prev, `You close the door.`]);
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
    
    // If not found via parseMovement, check if any word in the command matches an exit name directly
    if (!exit) {
      const words = cmd.trim().toLowerCase().split(/\s+/);
      for (const word of words) {
        if (currentRoom.exits[word]) {
          exit = currentRoom.exits[word];
          break;
        }
      }
    }
    
    if (exit) {
      // Check if this exit is a closed door
      if (exit.isDoor === true) {
        const stateKey = exit.doorId ? `door:${exit.doorId}` : `${currentRoom.id}-${Object.keys(currentRoom.exits).find(k => currentRoom.exits[k] === exit)}`;
        if (!openDoors.has(stateKey)) {
          setOutput(prev => [...prev, "The door is closed."]);
          return;
        }
      }
      
      const nextRoom = rooms.find(r => r.id === exit.to);
      if (nextRoom) {
        setCurrentRoom(nextRoom);
        setPlayer(prev => ({ ...prev, location: nextRoom.id }));
        const exitList = Object.entries(nextRoom.exits)
          .map(([dir]) => dir.charAt(0).toUpperCase() + dir.slice(1))
          .join(', ');
        const outputLines = [nextRoom.description];
        const itemsLine = formatItemsInRoom(nextRoom.items);
        if (itemsLine) outputLines.push(itemsLine);
        outputLines.push(exitList ? `(Exits: ${exitList})` : '(No visible exits)');
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

      setOutput(prev => [...prev, "You don't see that here."]);
      return;
    }

    // Get/Take parser
    const get = parseGet(cmd);
    if (get) {
      const item = findItemByNameOrPrefix(currentRoom.items, get.target);

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

      // Remove from room, add to inventory
      setCurrentRoom(prev => ({
        ...prev,
        items: prev.items.filter(id => id !== item.id)
      }));
      setPlayer(prev => ({
        ...prev,
        inventory: [...prev.inventory, item.id]
      }));
      setOutput(prev => [...prev, `You take the ${item.name}.`]);
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

    if (cmd.length > 0) {
      setOutput(prev => [...prev, "I don't understand that command."]);
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
              rooms={rooms}
              currentRoomId={currentRoom.id}
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
