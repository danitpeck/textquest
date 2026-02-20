import React from 'react';
import styles from './Compass.module.css';

export type CompassDirection = 'n' | 's' | 'e' | 'w' | 'u' | 'd';

// Map long direction names to short keys for compass
const DIR_MAP: Record<string, CompassDirection> = {
  n: 'n', north: 'n',
  s: 's', south: 's',
  e: 'e', east: 'e',
  w: 'w', west: 'w',
  u: 'u', up: 'u',
  d: 'd', down: 'd',
};

interface CompassProps {
  exits: string[]; // Accept raw exit keys
}

/**
 * Renders a retro ASCII compass.
 * Highlights available exits.
 */
const Compass: React.FC<CompassProps> = ({ exits }) => {

  // ASCII template for the compass
  const template = [
    '  N U',
    'W @ E',
    'D S  ',
  ];

  // Map of direction letters to their positions in the template
  const dirMap: Record<string, { row: number, col: number }> = {
    n: { row: 0, col: 2 },
    s: { row: 2, col: 2 },
    w: { row: 1, col: 0 },
    e: { row: 1, col: 4 },
    u: { row: 0, col: 4 },
    d: { row: 2, col: 0 },
  };

  // Set of available exits (normalized)
  const available = new Set(exits.map(e => DIR_MAP[e]));

  // Render the compass, highlighting only the direction letters if present
  const renderRow = (row: string, rowIdx: number) =>
    row.split('').map((ch, colIdx) => {
      // Is this a direction letter?
      const dir = Object.entries(dirMap).find(([, pos]) => pos.row === rowIdx && pos.col === colIdx);
      if (dir) {
        const [key] = dir;
        const active = available.has(key as CompassDirection);
        return (
          <span
            key={colIdx}
            className={
              active
                ? `${styles.compassDir} ${styles.compassDirActive}`
                : `${styles.compassDir} ${styles.compassDirHidden}`
            }
          >
            {ch}
          </span>
        );
      }
      // Center marker @ always highlighted
      if (ch === '@') {
        return (
          <span
            key={colIdx}
            className={styles.compassCenter}
          >
            {ch}
          </span>
        );
      }
      // Other characters (dashes, parens, etc)
      return <span key={colIdx} className={styles.compassChar}>{ch}</span>;
    });

  return (
    <div className={styles.compassRoot}>
      <pre className={styles.compassPre}>
        {template.map((row, i) => (
          <React.Fragment key={i}>
            {renderRow(row, i)}
            {'\n'}
          </React.Fragment>
        ))}
      </pre>
    </div>
  );
};

export default Compass;
