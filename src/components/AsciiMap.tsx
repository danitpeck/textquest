import React from 'react';
import styles from './AsciiMap.module.css';
import type { Room } from '../engine/rooms';

interface AsciiMapProps {
  rooms: Room[];
  currentRoomId: string;
  openDoors: Set<string>;
  size?: number; // grid size (default 3)
  theme?: 'default' | 'amber' | 'green';
}

const AsciiMap: React.FC<AsciiMapProps> = ({ rooms, currentRoomId, openDoors, size = 3, theme = 'default' }) => {
  // Find current room's coordinates
  const current = rooms.find(r => r.id === currentRoomId);
  const center = current ? { x: current.x, y: current.y } : { x: 0, y: 0 };
  const half = Math.floor(size / 2);
  const minX = center.x - half;
  const minY = center.y - half;

  // Helper: Check if a room is behind a closed door from current room
  const isBehindClosedDoor = (roomId: string): boolean => {
    if (!current || roomId === currentRoomId) return false;
    
    // Check all exits from current room
    for (const [_direction, exit] of Object.entries(current.exits)) {
      if (exit.to === roomId) {
        // Found an exit that leads to this room
        // Hide it if it's a closed door
        if (exit.isDoor && exit.doorId && !openDoors.has(exit.doorId)) {
          return true;
        }
      }
    }
    return false;
  };

  // Build a 2D array of room objects (or null)
  const grid: (Room | null)[][] = [];
  for (let y = 0; y < size; y++) {
    const row: (Room | null)[] = [];
    for (let x = 0; x < size; x++) {
      const rx = minX + x;
      const ry = minY + y;
      const found = rooms.find(r => r.x === rx && r.y === ry);
      
      // Hide rooms behind closed doors
      if (found && isBehindClosedDoor(found.id)) {
        row.push(null);
      } else {
        row.push(found || null);
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

            // Determine symbol and color by room type and theme
            let symbol = '*';
            let color = '#3f6'; // default: green for forest
            if (cell.description.toLowerCase().includes('river')) {
              symbol = '~';
              color = '#4cf';
            } else if (cell.description.toLowerCase().includes('clearing')) {
              symbol = 'o';
              color = '#fd0';
            } else if (cell.description.toLowerCase().includes('mountain')) {
              symbol = '^';
              color = '#888';
            } else if (cell.description.toLowerCase().includes('cave')) {
              symbol = '0';
              color = '#aaa';
            } else if (cell.description.toLowerCase().includes('building')) {
              symbol = '#';
              color = '#d22';
            } else if (cell.description.toLowerCase().includes('desert')) {
              symbol = '.';
              color = '#fa9';
            } else if (cell.description.toLowerCase().includes('swamp')) {
              symbol = '%';
              color = '#5a3';
            } else if (cell.description.toLowerCase().includes('beach')) {
              symbol = '=';
              color = '#ffdd99';
            } else if (cell.description.toLowerCase().includes('ocean')) {
              symbol = '~';
              color = '#06f';
            } else if (cell.description.toLowerCase().includes('road')) {
              symbol = '+';
              color = '#b5651d';
            } else if (cell.description.toLowerCase().includes('plains')) {
              symbol = '"';
              color = '#9f6';
            } else if (cell.description.toLowerCase().includes('snow')) {
              symbol = '*';
              color = '#eef';
            } else if (cell.description.toLowerCase().includes('volcano')) {
              symbol = '^';
              color = '#f44';
            } else if (cell.description.toLowerCase().includes('ruins')) {
              symbol = '%';
              color = '#888';
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
