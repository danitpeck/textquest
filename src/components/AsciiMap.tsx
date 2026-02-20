import React from 'react';
import styles from './AsciiMap.module.css';
import type { Room } from '../engine/rooms';

interface AsciiMapProps {
  rooms: Room[];
  currentRoomId: string;
  openDoors: Set<string>;
  puzzleState: Record<string, Record<string, boolean>>;
  size?: number; // grid size (default 3)
  theme?: 'default' | 'amber' | 'green';
}

const AsciiMap: React.FC<AsciiMapProps> = ({ rooms, currentRoomId, openDoors, puzzleState, size = 3, theme = 'default' }) => {
  // Find current room's coordinates
  const current = rooms.find(r => r.id === currentRoomId);
  const center = current ? { x: current.x, y: current.y } : { x: 0, y: 0 };
  const half = Math.floor(size / 2);
  const minX = center.x - half;
  const minY = center.y - half;

  // Helper: Check if an exit should be visible based on puzzle state
  const isExitVisible = (exit: any, roomId: string): boolean => {
    if (!exit.revealedBy) {
      return true;
    }
    const roomPuzzles = puzzleState[roomId] || {};
    return roomPuzzles[exit.revealedBy] === true;
  };

  // Helper: Check if a room is reachable from current room through open doors and revealed exits only
  const getReachableRooms = (startRoomId: string): Set<string> => {
    const reachable = new Set<string>();
    const queue = [startRoomId];
    reachable.add(startRoomId);
    
    while (queue.length > 0) {
      const roomId = queue.shift();
      const room = rooms.find(r => r.id === roomId);
      if (!room) continue;
      
      // Check all exits from this room
      for (const [direction, exit] of Object.entries(room.exits)) {
        if (reachable.has(exit.to)) continue; // Already visited
        
        // Check if this exit is hidden by an unrevealed puzzle
        if (roomId && !isExitVisible(exit, roomId)) {
          continue;
        }
        
        // Check if this exit is blocked by a closed door
        let isBlocked = false;
        if (exit.isDoor) {
          const stateKey = exit.doorId ? `door:${exit.doorId}` : `${roomId}-${direction}`;
          if (!openDoors.has(stateKey)) {
            isBlocked = true;
          }
        }
        
        if (!isBlocked) {
          reachable.add(exit.to);
          queue.push(exit.to);
        }
      }
    }
    
    return reachable;
  };

  // Get all reachable rooms from current position
  const reachableRooms = getReachableRooms(currentRoomId);

  // Build a 2D array of room objects (or null)
  const grid: (Room | null)[][] = [];
  for (let y = 0; y < size; y++) {
    const row: (Room | null)[] = [];
    for (let x = 0; x < size; x++) {
      const rx = minX + x;
      const ry = minY + y;
      const found = rooms.find(r => r.x === rx && r.y === ry);
      
      // Only show rooms that are reachable through open doors
      if (found && reachableRooms.has(found.id)) {
        row.push(found);
      } else {
        row.push(null);
      }
    }
    grid.push(row);
  }

  // Render ASCII map
  return (
    <div className={styles.asciiMapRoot}>
      {grid.map((row, y) => (
        <div key={y}>
          {row.map((cell, x) => {
            if (!cell) return <span key={x}>&nbsp;&nbsp;</span>;

            // Determine symbol and color by room type
            let symbol = '■';
            let color = '#888'; // default: gray for generic dungeon room
            
            const desc = cell.description.toLowerCase();
            const name = cell.name.toLowerCase();
            
            // Death traps
            if (cell.isDeathTrap) {
              symbol = 'X';
              color = '#f44';
            }
            // Dungeon-specific rooms
            else if (name.includes('hallway') || name.includes('corridor')) {
              symbol = '=';
              color = '#ca8';
            } else if (name.includes('library')) {
              symbol = 'L';
              color = '#9cf';
            } else if (name.includes('chamber') && name.includes('secret')) {
              symbol = '?';
              color = '#f8f';
            } else if (name.includes('chamber') || name.includes('room')) {
              symbol = '□';
              color = '#aaa';
            } else if (name.includes('dining') || name.includes('hall')) {
              symbol = 'H';
              color = '#da9';
            } else if (name.includes('garden') || desc.includes('garden')) {
              symbol = '&';
              color = '#5d5';
            } else if (name.includes('pottery')) {
              symbol = 'P';
              color = '#ca8';
            }
            // Outdoor/terrain (kept for compatibility)
            else if (desc.includes('river')) {
              symbol = '~';
              color = '#4cf';
            } else if (desc.includes('clearing')) {
              symbol = 'o';
              color = '#fd0';
            } else if (desc.includes('mountain')) {
              symbol = '^';
              color = '#888';
            } else if (desc.includes('cave')) {
              symbol = '0';
              color = '#aaa';
            } else if (desc.includes('building')) {
              symbol = '#';
              color = '#d22';
            } else if (desc.includes('desert')) {
              symbol = '.';
              color = '#fa9';
            } else if (desc.includes('swamp')) {
              symbol = '%';
              color = '#5a3';
            } else if (desc.includes('beach')) {
              symbol = '=';
              color = '#ffdd99';
            } else if (desc.includes('ocean')) {
              symbol = '~';
              color = '#06f';
            } else if (desc.includes('road')) {
              symbol = '+';
              color = '#b5651d';
            } else if (desc.includes('plains')) {
              symbol = '"';
              color = '#9f6';
            } else if (desc.includes('snow')) {
              symbol = '*';
              color = '#eef';
            } else if (desc.includes('volcano')) {
              symbol = '^';
              color = '#f44';
            } else if (desc.includes('ruins')) {
              symbol = '%';
              color = '#888';
            } else if (desc.includes('forest')) {
              symbol = '*';
              color = '#3f6';
            }

            // Theme overrides
            if (theme === 'amber') {
              color = '#ffb300';
            } else if (theme === 'green') {
              color = '#8f8';
            }

            // Highlight current room
            let playerColor = '#e040fb'; // Fuchsia for Retro Dark
            let playerSymbol = '@';
            if (theme === 'amber') playerColor = '#ffb300';
            else if (theme === 'green') playerColor = '#8f8';

            const isCurrent = cell.id === currentRoomId;
            return (
              <span
                key={x}
                className={
                  isCurrent
                    ? `${styles.asciiMapRoom} ${styles.asciiMapRoomCurrent}`
                    : styles.asciiMapRoom
                }
                style={isCurrent ? { color: playerColor } : { color }}
              >
                {isCurrent ? playerSymbol : symbol}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default AsciiMap;
