import styles from './App.module.css';

import { useState, useEffect } from 'react';
import GameWindow from './components/GameWindow';
import CommandInput from './components/CommandInput';
import Compass from './components/Compass';
import AsciiMap from './components/AsciiMap';
import PlayerStats from './components/PlayerStats';

import { rooms } from './engine/rooms';
import type { Room } from './engine/rooms';
import { parseMovement, parseLook, parseExamine, parseGet, parseDrop, parseOpen, parseClose, parsePut, parseSave, parseLoad, parseClear } from './engine/parser';
import { createPlayer, getDescriptionTier, canAddToInventory } from './engine/player';
import type { Player } from './engine/player';
import { getItemsByIds, formatItemsInRoom } from './engine/items';
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
  const [currentSaveSlot, setCurrentSaveSlot] = useState<1 | 2 | 3>(1);
  const [showLoadMenu, setShowLoadMenu] = useState(false);
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
      // look <thing> (custom look descriptions) - but also show container contents if open
      const lookingAt = findItemByNameOrPrefix(currentRoom.items, look.target);
      if (currentRoom.lookDescriptions && currentRoom.lookDescriptions[look.target]) {
        const desc = currentRoom.lookDescriptions[look.target];
        setOutput(prev => [...prev, desc ?? "You see nothing special."]);
        // If it's an open container, also show contents
        if (lookingAt && lookingAt.canOpen && openItems.has(lookingAt.id)) {
          const contents = containerContents[lookingAt.id] || lookingAt.contents || [];
          if (contents.length > 0) {
            const itemList = getItemsByIds(contents).map(i => i.name).join(', ');
            setOutput(prev => [...prev, `Inside: ${itemList}`]);
          }
        }
        return;
      }
      // If looking at an open container without custom description, show contents
      if (lookingAt && lookingAt.canOpen && openItems.has(lookingAt.id)) {
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
        const targetRoom = rooms.find(r => r.id === state.currentRoomId);
        if (targetRoom) {
          setCurrentRoom(targetRoom);
          setPlayer(state.player);
          setOpenItems(new Set(state.openItems));
          setOpenDoors(new Set(state.openDoors));
          setContainerContents(state.containerContents);
          setCurrentSaveSlot(load.slotNumber);
          setOutput(prev => [...prev, `Game loaded from Slot ${load.slotNumber}.`, targetRoom.description]);
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
                        const targetRoom = rooms.find(r => r.id === state.currentRoomId);
                        if (targetRoom) {
                          setCurrentRoom(targetRoom);
                          setPlayer(state.player);
                          setOpenItems(new Set(state.openItems));
                          setOpenDoors(new Set(state.openDoors));
                          setContainerContents(state.containerContents);
                          setCurrentSaveSlot(slot.slotNumber);
                          setOutput(prev => [...prev, `Game loaded from Slot ${slot.slotNumber}.`, targetRoom.description]);
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
                        setCurrentSaveSlot(slot.slotNumber);
                        const outputLines = [startRoom.description];
                        const itemsLine = formatItemsInRoom(startRoom.items);
                        if (itemsLine) outputLines.push(itemsLine);
                        const exitList = Object.entries(startRoom.exits)
                          .map(([dir]) => dir.charAt(0).toUpperCase() + dir.slice(1))
                          .join(', ');
                        outputLines.push(exitList ? `(Exits: ${exitList})` : '(No visible exits)');
                        setOutput(prev => [...prev, `New game started in Slot ${slot.slotNumber}.`, ...outputLines]);
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
