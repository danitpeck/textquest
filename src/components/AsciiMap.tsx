
import React from 'react';
import './AsciiMap.css';
import type { Room } from '../engine/rooms';

interface AsciiMapProps {
  rooms: Room[];
  currentRoomId: string;
  size?: number; // grid size (default 3)
  theme?: 'default' | 'amber' | 'green';
}

const AsciiMap: React.FC<AsciiMapProps> = ({ rooms, currentRoomId, size = 3, theme = 'default' }) => {
  // Find current room's coordinates
  const current = rooms.find(r => r.id === currentRoomId);
  const center = current ? { x: current.x, y: current.y } : { x: 0, y: 0 };
  const half = Math.floor(size / 2);
  const minX = center.x - half;
  const minY = center.y - half;

  // Build a 2D array of room objects (or null)
  const grid: (Room | null)[][] = [];
  for (let y = 0; y < size; y++) {
    const row: (Room | null)[] = [];
    for (let x = 0; x < size; x++) {
      const rx = minX + x;
      const ry = minY + y;
      const found = rooms.find(r => r.x === rx && r.y === ry);
      row.push(found || null);
    }
    grid.push(row);
  }

  // Render ASCII map
  return (
    <div className="ascii-map-root">
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
            }
            // Theme overrides
            if (theme === 'amber') {
              color = '#ffb300';
            } else if (theme === 'green') {
              color = '#8f8';
            }
            const isCurrent = cell.id === currentRoomId;
            let playerColor = '#e040fb'; // Fuchsia for Retro Dark
            if (theme === 'amber') playerColor = '#ffb300';
            else if (theme === 'green') playerColor = '#8f8';
            return (
              <span
                key={x}
                style={{
                  fontWeight: isCurrent ? 'bold' : undefined,
                  color: isCurrent ? playerColor : color,
                  borderRadius: isCurrent ? 3 : undefined,
                  padding: '0 2px',
                }}
                title={cell.name}
              >
                {isCurrent ? '@' : symbol}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default AsciiMap;
